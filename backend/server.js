require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');


const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'snapvault-super-secret-key-1337';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support base64 image uploads

// Database Connection
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Add a short timeout so it fails fast if PostgreSQL is not running
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);
let useMemoryDb = false;

// S3 Client Configuration (for MinIO / AWS S3 compatibility)
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // Required for MinIO
  region: 'us-east-1', // Placeholder region
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'snapvault-admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'snapvault-secure-s3-pass',
  },
};

const s3 = new S3Client(s3Config);
const S3_BUCKET = process.env.S3_BUCKET || 'snapvault-photos';


// In-Memory Database Fallbacks
const memoryUsers = [];
const memoryPhotos = [];

// Helper delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Verify database connection and create tables if connected
async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  No DATABASE_URL environment variable found. Falling back to In-Memory storage.');
    useMemoryDb = true;
    return;
  }

  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${maxRetries}...`);
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL successfully!');
      
      // Create Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        );
      `);

      // Create Photos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS photos (
          id VARCHAR(255) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          date VARCHAR(100) NOT NULL,
          filter VARCHAR(100) NOT NULL
        );
      `);

      client.release();
      console.log('🎉 Database tables initialized.');
      useMemoryDb = false;
      return; // Connection successful, exit function
    } catch (err) {
      console.warn(`⚠️  Database connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log('Waiting 2 seconds before retrying...');
        await delay(2000);
      }
    }
  }

  console.warn('⚠️  Could not connect to PostgreSQL after multiple retries. Falling back to In-Memory storage.');
  useMemoryDb = true;
}

// Verify and initialize S3/MinIO bucket
async function initS3() {
  try {
    // Check if the bucket already exists
    try {
      await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`✅ MinIO Bucket "${S3_BUCKET}" already exists.`);
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        console.log(`Creating MinIO Bucket "${S3_BUCKET}"...`);
        await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
        console.log(`🎉 MinIO Bucket "${S3_BUCKET}" created successfully.`);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(`⚠️  S3/MinIO initialization error: ${err.message}`);
  }
}


// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No session token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid.' });
    }
    req.user = user;
    next();
  });
};

// --- AUTHENTICATION ROUTES ---

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (useMemoryDb) {
      // Check if user already exists
      const existingUser = memoryUsers.find(u => u.username === username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }

      const newUser = { id: memoryUsers.length + 1, username, password: hashedPassword };
      memoryUsers.push(newUser);
      
      console.log(`[Mock DB] Registered user: ${username}`);
      return res.status(201).json({ message: 'User registered successfully!' });
    } else {
      // Postgres implementation
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }

      await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        [username, hashedPassword]
      );
      
      console.log(`[Postgres DB] Registered user: ${username}`);
      return res.status(201).json({ message: 'User registered successfully!' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    let user;

    if (useMemoryDb) {
      user = memoryUsers.find(u => u.username === username);
    } else {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h',
    });

    console.log(`[Login] User logged in: ${username}`);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// --- PHOTO RECORD ROUTES ---

// 3. Save Captured Photo Record
app.post('/api/photos', authenticateToken, async (req, res) => {
  const { id, url, date, filter } = req.body;
  const userId = req.user.id;

  if (!id || !url || !date || !filter) {
    return res.status(400).json({ error: 'Missing required photo metadata fields.' });
  }

  try {
    let imageUrl = url;

    // Check if the url is a base64 image data URL
    if (url.startsWith('data:image/')) {
      try {
        const matches = url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid base64 string format');
        }

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `${id}.${extension}`;

        // Upload to S3/MinIO
        await s3.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileName,
          Body: buffer,
          ContentType: mimeType,
        }));

        // Public facing URL to load the image
        imageUrl = `${process.env.S3_CLIENT_EXTERNAL_URL || 'http://localhost:9000'}/${S3_BUCKET}/${fileName}`;
        console.log(`[S3/MinIO] Uploaded image to: ${imageUrl}`);
      } catch (err) {
        console.error('Failed to upload image to MinIO:', err);
        return res.status(500).json({ error: 'Failed to upload photo to storage.' });
      }
    }

    if (useMemoryDb) {
      const newPhoto = { id, user_id: userId, url: imageUrl, date, filter };
      
      // Prevent duplicates if frontend resubmits
      const existingIdx = memoryPhotos.findIndex(p => p.id === id);
      if (existingIdx !== -1) {
        memoryPhotos[existingIdx] = newPhoto;
      } else {
        memoryPhotos.push(newPhoto);
      }
      
      console.log(`[Mock DB] Saved photo ${id} for user ${req.user.username}`);
      return res.status(201).json({ message: 'Photo saved to vault successfully!' });
    } else {
      // Postgres insert with upsert behavior (update if already exists)
      await pool.query(
        `INSERT INTO photos (id, user_id, url, date, filter) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET url = EXCLUDED.url, date = EXCLUDED.date, filter = EXCLUDED.filter`,
        [id, userId, imageUrl, date, filter]
      );
      
      console.log(`[Postgres DB] Saved photo ${id} for user ${req.user.username}`);
      return res.status(201).json({ message: 'Photo saved to vault successfully!' });
    }
  } catch (err) {
    console.error('Error saving photo:', err);
    res.status(500).json({ error: 'Server error while saving photo metadata.' });
  }
});

// 4. Get User's Photos
app.get('/api/photos', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    if (useMemoryDb) {
      const userPhotos = memoryPhotos.filter(p => p.user_id === userId);
      return res.json(userPhotos);
    } else {
      const result = await pool.query(
        'SELECT id, url, date, filter FROM photos WHERE user_id = $1 ORDER BY id DESC',
        [userId]
      );
      return res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Server error while fetching photo history.' });
  }
});

// 5. Delete Photo
app.delete('/api/photos/:id', authenticateToken, async (req, res) => {
  const photoId = req.params.id;
  const userId = req.user.id;

  try {
    let photo;
    if (useMemoryDb) {
      photo = memoryPhotos.find(p => p.id === photoId && p.user_id === userId);
    } else {
      const result = await pool.query(
        'SELECT url FROM photos WHERE id = $1 AND user_id = $2',
        [photoId, userId]
      );
      photo = result.rows[0];
    }

    if (photo) {
      const parts = photo.url.split('/');
      const fileName = parts[parts.length - 1];
      
      if (photo.url.includes(`/${S3_BUCKET}/`)) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileName,
          }));
          console.log(`[S3/MinIO] Deleted object: ${fileName}`);
        } catch (s3Err) {
          console.warn(`[S3/MinIO] Failed to delete file ${fileName} from bucket:`, s3Err.message);
        }
      }
    }

    if (useMemoryDb) {
      const index = memoryPhotos.findIndex(p => p.id === photoId && p.user_id === userId);
      if (index === -1) {
        return res.status(404).json({ error: 'Photo not found in vault.' });
      }
      memoryPhotos.splice(index, 1);
      console.log(`[Mock DB] Deleted photo ${photoId}`);
      return res.json({ message: 'Photo deleted from vault successfully.' });
    } else {
      const result = await pool.query(
        'DELETE FROM photos WHERE id = $1 AND user_id = $2',
        [photoId, userId]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Photo not found in vault.' });
      }
      
      console.log(`[Postgres DB] Deleted photo ${photoId}`);
      return res.json({ message: 'Photo deleted from vault successfully.' });
    }
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Server error while deleting photo.' });
  }
});

// Initialize database and object storage connection
initDb().then(() => {
  return initS3();
}).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SnapVault Backend listening on port ${PORT}`);
  });
});
