import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import FilterCarousel from './components/FilterCarousel';
import ActionRow from './components/ActionRow';
import VaultSidebar from './components/VaultSidebar';
import AuthModal from './components/AuthModal';
import { Download, Sparkles, ArrowLeft } from 'lucide-react';
import './App.css';

// Pre-loaded high-quality polaroid pictures
const INITIAL_MOCK_PHOTOS = [
  { id: 'mock-1', url: '/polaroid_one.png', date: 'May 18, 2026', filter: 'sunset' },
  { id: 'mock-2', url: '/polaroid_two.png', date: 'May 19, 2026', filter: 'vintage' },
  { id: 'mock-3', url: '/polaroid_three.png', date: 'May 20, 2026', filter: 'cyber' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [activeFilter, setActiveFilter] = useState('normal');
  const [isUsingSimulated, setIsUsingSimulated] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [printedPhoto, setPrintedPhoto] = useState(null);

  // Post-Capture Edit State
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto login on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('snapvault_token');
    const savedUser = localStorage.getItem('snapvault_user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
      fetchPhotosFromBackend(token);
    }
  }, []);

  const fetchPhotosFromBackend = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/photos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const dbPhotos = await response.json();
        // Load user's photos and combine with initial mock photos
        setCapturedPhotos([...dbPhotos, ...INITIAL_MOCK_PHOTOS]);
      } else if (response.status === 403 || response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Could not fetch photos from backend:', err);
    }
  };

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('snapvault_token', token);
    localStorage.setItem('snapvault_user', user);
    setIsLoggedIn(true);
    setUsername(user);
    fetchPhotosFromBackend(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('snapvault_token');
    localStorage.removeItem('snapvault_user');
    setIsLoggedIn(false);
    setUsername('');
    setCapturedPhotos(prev => prev.filter(p => !p.id.startsWith('mock-')));
  };

  const syncPhotoToBackend = async (photo) => {
    const token = localStorage.getItem('snapvault_token');
    if (!token) return;

    try {
      await fetch('http://localhost:5000/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: photo.id,
          url: photo.url,
          date: photo.date,
          filter: photo.filter
        })
      });
    } catch (err) {
      console.error('Error syncing photo to database:', err);
    }
  };

  const deletePhotoFromBackend = async (photoId) => {
    const token = localStorage.getItem('snapvault_token');
    if (!token) return;

    try {
      await fetch(`http://localhost:5000/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Error deleting photo from database:', err);
    }
  };

  // Set mock photos if logged in (when backend sync isn't triggered)
  useEffect(() => {
    if (!isLoggedIn) {
      setCapturedPhotos(prev => prev.filter(p => !p.id.startsWith('mock-')));
    }
  }, [isLoggedIn]);

  // Shutter action to capture frame and trigger instant-print animation
  const handleShutterClick = () => {
    if (!isCameraOn || selectedPhotoId) return;

    // 1. Trigger visual camera flash overlay animation
    const flash = document.getElementById('camera-flash-overlay');
    if (flash) {
      flash.classList.remove('animate-flash');
      void flash.offsetWidth; // Force CSS reflow
      flash.classList.add('animate-flash');
    }

    // 2. Play retro shutter click sound synthetically via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio synthetic shutter failed", e);
    }

    // 3. Draw viewfinder stream to capture canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Reset filter to capture raw unfiltered snapshot
    ctx.filter = 'none';

    if (isUsingSimulated) {
      const simCanvas = document.querySelector('canvas:not(.hidden)');
      if (simCanvas) {
        ctx.drawImage(simCanvas, 0, 0, canvas.width, canvas.height);
      }
    } else {
      if (videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
    }

    const imageUrl = canvas.toDataURL('image/png');
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const newPhoto = {
      id: 'snap-' + Date.now(),
      url: imageUrl,
      date: dateStr,
      filter: activeFilter
    };

    setCapturedPhotos(prev => [newPhoto, ...prev]);
    setPrintedPhoto(newPhoto);

    if (isLoggedIn) {
      syncPhotoToBackend(newPhoto);
    }
  };

  // Generate Polaroid composite file with white frames and handwriting text for download
  const downloadPolaroid = (photo) => {
    const img = new Image();
    img.src = photo.url;
    img.onload = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 700;
      pCanvas.height = 860;
      const pCtx = pCanvas.getContext('2d');

      pCtx.fillStyle = '#FFFFFF';
      pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
      
      pCtx.strokeStyle = '#3A3335';
      pCtx.lineWidth = 6;
      pCtx.strokeRect(0, 0, pCanvas.width, pCanvas.height);

      const border = 40;
      const imgWidth = 620; 
      const imgHeight = 465; 

      let filterStr = 'none';
      if (photo.filter === 'mono') filterStr = 'grayscale(100%) contrast(120%) brightness(95%)';
      else if (photo.filter === 'cyber') filterStr = 'hue-rotate(130deg) saturate(180%) contrast(115%) brightness(102%)';
      else if (photo.filter === 'sunset') filterStr = 'sepia(35%) saturate(150%) hue-rotate(-12deg) contrast(108%)';
      else if (photo.filter === 'vintage') filterStr = 'sepia(55%) contrast(92%) brightness(105%) saturate(80%)';
      else if (photo.filter === 'sweet') filterStr = 'saturate(150%) hue-rotate(18deg) brightness(104%)';
      
      pCtx.save();
      pCtx.filter = filterStr;
      pCtx.fillStyle = '#FDFBF7';
      pCtx.fillRect(border, border, imgWidth, imgHeight);
      pCtx.drawImage(img, border, border, imgWidth, imgHeight);
      pCtx.restore();

      pCtx.strokeStyle = '#3A3335';
      pCtx.lineWidth = 4;
      pCtx.strokeRect(border, border, imgWidth, imgHeight);

      pCtx.fillStyle = '#3A3335';
      pCtx.font = 'bold 56px "Caveat", cursive';
      pCtx.textAlign = 'center';
      pCtx.fillText(photo.date, pCanvas.width / 2, 690);

      if (photo.filter !== 'normal') {
        pCtx.fillStyle = 'rgba(58, 51, 53, 0.4)';
        pCtx.font = 'bold 12px "Inter", sans-serif';
        pCtx.fillText(`PRESET: ${photo.filter.toUpperCase()}`, pCanvas.width / 2, 755);
      }

      const link = document.createElement('a');
      link.download = `snapvault-${photo.id}.png`;
      link.href = pCanvas.toDataURL('image/png');
      link.click();
    };
  };

  const handleFilterChange = (filterId) => {
    if (selectedPhotoId) {
      setCapturedPhotos(prev => {
        const updated = prev.map(p => (p.id === selectedPhotoId ? { ...p, filter: filterId } : p));
        if (isLoggedIn) {
          const photoToSync = updated.find(p => p.id === selectedPhotoId);
          if (photoToSync) syncPhotoToBackend(photoToSync);
        }
        return updated;
      });
      if (printedPhoto && printedPhoto.id === selectedPhotoId) {
        setPrintedPhoto(prev => ({ ...prev, filter: filterId }));
      }
    } else {
      setActiveFilter(filterId);
    }
  };

  const handleSelectPhoto = (photo) => {
    if (selectedPhotoId === photo.id) {
      setSelectedPhotoId(null);
    } else {
      setSelectedPhotoId(photo.id);
      setPrintedPhoto(null); 
    }
  };

  const handleDeletePhoto = (photoId) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
    if (printedPhoto && printedPhoto.id === photoId) {
      setPrintedPhoto(null);
    }
    if (selectedPhotoId === photoId) {
      setSelectedPhotoId(null);
    }
    if (isLoggedIn) {
      deletePhotoFromBackend(photoId);
    }
  };

  const editingPhoto = selectedPhotoId
    ? capturedPhotos.find(p => p.id === selectedPhotoId)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] antialiased overflow-hidden retro-grid-bg relative">
      
      {/* Header Floating console */}
      <Header 
        isLoggedIn={isLoggedIn} 
        username={username}
        onLogout={handleLogout}
        onLoginClick={() => setIsAuthModalOpen(true)} 
      />

      {/* Main Grid Row */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Photobooth Canvas Area */}
        <main className="flex-grow flex flex-col items-center justify-start py-6 px-4 md:px-8 overflow-y-auto no-scrollbar w-full transition-all duration-300">
          
          {/* Main workspace layout */}
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl mx-auto mt-4">
            
            {/* LEFT COLUMN: Printed Polaroid Dry Tray */}
            <div className="w-full lg:w-60 flex flex-col items-center shrink-0 order-3 lg:order-1 mt-6 lg:mt-0">
              <div className="font-display font-black text-[10px] uppercase tracking-widest text-deep-charcoal/40 bg-deep-charcoal/5 px-3 py-1 rounded-md border border-deep-charcoal/10 mb-4 select-none">
                🎞️ LATEST PRINT
              </div>

              <div className="relative min-h-[300px] w-full flex justify-center items-start">
                {printedPhoto ? (
                  <div className="w-52 bg-white border-4 border-deep-charcoal p-2.5 pb-6 shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] rounded-none animate-print-slot pointer-events-auto transition-all hover:rotate-1 hover:scale-102">
                    <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden border-2 border-deep-charcoal">
                      <img
                        src={printedPhoto.url}
                        alt="Latest Print"
                        className={`w-full h-full object-cover filter-${printedPhoto.filter}`}
                      />
                      {printedPhoto.filter !== 'normal' && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white font-mono text-[7px] uppercase tracking-wider font-bold">
                          {printedPhoto.filter}
                        </div>
                      )}
                    </div>
                    
                    <div className="font-handwriting text-center text-deep-charcoal mt-2.5 text-xl font-bold select-none leading-none tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">
                      {printedPhoto.date}
                    </div>

                    <div className="absolute inset-0 bg-white/95 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 px-4 border border-deep-charcoal">
                      <span className="font-display font-black text-[10px] uppercase tracking-widest text-deep-charcoal">
                        PRINT OUT!
                      </span>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => downloadPolaroid(printedPhoto)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blush-pink border-2 border-deep-charcoal font-black text-[9px] uppercase text-deep-charcoal hover:bg-[#F9C3BA] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          <Download className="w-3 h-3" />
                          <span>SAVE</span>
                        </button>
                        <button
                          onClick={() => setPrintedPhoto(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border-2 border-deep-charcoal font-black text-[9px] uppercase text-deep-charcoal hover:bg-stone-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        >
                          CLEAR
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-52 h-[270px] border-4 border-dashed border-deep-charcoal/15 rounded-2xl flex flex-col items-center justify-center text-center p-5 bg-white/20 select-none">
                    <span className="text-3xl opacity-20 mb-2">📸</span>
                    <span className="font-display font-black text-[9px] uppercase tracking-widest text-deep-charcoal/30 leading-tight">
                      NO PRINT YET
                    </span>
                    <span className="text-[8px] font-bold text-deep-charcoal/20 uppercase tracking-wider mt-1 max-w-[120px]">
                      Take a snapshot to dry print here
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER COLUMN: Live Camera console & Control buttons */}
            <div className="flex-grow max-w-2xl w-full flex flex-col items-center order-1 lg:order-2">
              
              {/* Sparkly Retro Banner Badge / Mode Indicators */}
              {editingPhoto ? (
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blush-pink border-3 border-deep-charcoal text-xs font-black text-deep-charcoal mb-4 shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] select-none animate-pulse">
                  <Sparkles className="w-4 h-4 text-deep-charcoal" />
                  <span>EDITING PHOTO FILTER ({editingPhoto.filter.toUpperCase()})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted-lavender border-3 border-deep-charcoal text-xs font-black text-deep-charcoal mb-4 shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] select-none">
                  <Sparkles className="w-4 h-4 text-deep-charcoal animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{isLoggedIn ? 'RETRO PHOTOBOOTH ENGINE v4.0' : 'GUEST SESSION ACTIVE'}</span>
                </div>
              )}

              {/* Viewfinder block */}
              <CameraFeed
                isCameraOn={isCameraOn}
                setIsCameraOn={setIsCameraOn}
                isLoggedIn={isLoggedIn}
                activeFilter={editingPhoto ? editingPhoto.filter : activeFilter}
                videoRef={videoRef}
                canvasRef={canvasRef}
                isUsingSimulated={isUsingSimulated}
                setIsUsingSimulated={setIsUsingSimulated}
                editingPhoto={editingPhoto}
              />

              {/* Filter carousel */}
              <FilterCarousel
                activeFilter={editingPhoto ? editingPhoto.filter : activeFilter}
                setActiveFilter={handleFilterChange}
                isCameraOn={isCameraOn}
              />

              {/* Action trigger row */}
              {editingPhoto ? (
                <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 px-6">
                  <button
                    onClick={() => downloadPolaroid(editingPhoto)}
                    className="retro-btn flex items-center gap-2 px-5 py-3.5 bg-muted-lavender text-xs font-black uppercase text-deep-charcoal rounded-xl shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] hover:bg-blush-pink cursor-pointer w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Edited Polaroid</span>
                  </button>
                  <button
                    onClick={() => setSelectedPhotoId(null)}
                    className="retro-btn flex items-center gap-2 px-5 py-3.5 bg-white text-xs font-black uppercase text-deep-charcoal rounded-xl shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] cursor-pointer w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Camera</span>
                  </button>
                </div>
              ) : (
                <ActionRow
                  onShutterClick={handleShutterClick}
                  onDownloadClick={() => printedPhoto && downloadPolaroid(printedPhoto)}
                  isCameraOn={isCameraOn}
                  latestPhoto={printedPhoto}
                />
              )}

            </div>

          </div>

        </main>

        {/* Polaroid Vault History Sidebar */}
        <VaultSidebar
          photos={capturedPhotos}
          onDeletePhoto={handleDeletePhoto}
          onDownloadPhoto={downloadPolaroid}
          onReapplyFilter={handleSelectPhoto}
          isOpen={isVaultOpen}
          setIsOpen={setIsVaultOpen}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setIsAuthModalOpen(true)}
          selectedPhotoId={selectedPhotoId}
        />
      </div>

      {/* Auth Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
