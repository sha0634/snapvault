# Use Node.js 20 lightweight alpine image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package files first to cache dependencies installation
COPY package*.json ./

# Install only production dependencies deterministically
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose the port the server listens on
EXPOSE 5000

# Define the start command
CMD ["node", "server.js"]
