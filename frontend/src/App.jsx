import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import FilterCarousel from './components/FilterCarousel';
import ActionRow from './components/ActionRow';
import VaultSidebar from './components/VaultSidebar';
import { Download, Sparkles } from 'lucide-react';
import './App.css';

// Pre-loaded high-quality polaroid pictures
const INITIAL_MOCK_PHOTOS = [
  { id: 'mock-1', url: '/polaroid_one.png', date: 'May 18, 2026', filter: 'sunset' },
  { id: 'mock-2', url: '/polaroid_two.png', date: 'May 19, 2026', filter: 'vintage' },
  { id: 'mock-3', url: '/polaroid_three.png', date: 'May 20, 2026', filter: 'cyber' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [activeFilter, setActiveFilter] = useState('normal');
  const [isUsingSimulated, setIsUsingSimulated] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState(INITIAL_MOCK_PHOTOS);
  const [printedPhoto, setPrintedPhoto] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Auto-toggle sidebar depending on auth state
  useEffect(() => {
    if (isLoggedIn) {
      setIsVaultOpen(true);
    } else {
      setIsVaultOpen(false);
    }
  }, [isLoggedIn]);

  // Shutter action to capture frame and trigger instant-print animation
  const handleShutterClick = () => {
    if (!isCameraOn) return;

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

    // Translate our filter strings into real canvas context filters
    let filterStr = 'none';
    if (activeFilter === 'mono') filterStr = 'grayscale(100%) contrast(120%) brightness(95%)';
    else if (activeFilter === 'cyber') filterStr = 'hue-rotate(130deg) saturate(180%) contrast(115%) brightness(102%)';
    else if (activeFilter === 'sunset') filterStr = 'sepia(35%) saturate(150%) hue-rotate(-12deg) contrast(108%)';
    else if (activeFilter === 'vintage') filterStr = 'sepia(55%) contrast(92%) brightness(105%) saturate(80%)';
    else if (activeFilter === 'sweet') filterStr = 'saturate(150%) hue-rotate(18deg) brightness(104%)';
    
    ctx.filter = filterStr;

    // Capture from simulation canvas or real video element
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

    // Generate snapshot image URL
    const imageUrl = canvas.toDataURL('image/png');
    
    // Construct new Polaroid object with date metadata tag
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

    // Save to local vault if user is logged in
    if (isLoggedIn) {
      setCapturedPhotos(prev => [newPhoto, ...prev]);
    }

    // Eject Polaroid from bottom frame
    setPrintedPhoto(newPhoto);
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

      // 1. Draw polaroid card base card
      pCtx.fillStyle = '#FFFFFF';
      pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
      
      // Black border outline
      pCtx.strokeStyle = '#3A3335';
      pCtx.lineWidth = 6;
      pCtx.strokeRect(0, 0, pCanvas.width, pCanvas.height);

      // 2. Draw photo centered in top section (40px margins)
      const border = 40;
      const imgWidth = 620; 
      const imgHeight = 465; 
      
      pCtx.fillStyle = '#FDFBF7';
      pCtx.fillRect(border, border, imgWidth, imgHeight);
      pCtx.drawImage(img, border, border, imgWidth, imgHeight);

      // Inner image stroke
      pCtx.strokeStyle = '#3A3335';
      pCtx.lineWidth = 4;
      pCtx.strokeRect(border, border, imgWidth, imgHeight);

      // 3. Draw handwritten date text
      pCtx.fillStyle = '#3A3335';
      pCtx.font = 'bold 56px "Caveat", cursive';
      pCtx.textAlign = 'center';
      pCtx.fillText(photo.date, pCanvas.width / 2, 690);

      // 4. Subtle filter badge
      if (photo.filter !== 'normal') {
        pCtx.fillStyle = 'rgba(58, 51, 53, 0.4)';
        pCtx.font = 'bold 12px "Inter", sans-serif';
        pCtx.fillText(`PRESET: ${photo.filter.toUpperCase()}`, pCanvas.width / 2, 755);
      }

      // 5. Trigger download link
      const link = document.createElement('a');
      link.download = `snapvault-${photo.id}.png`;
      link.href = pCanvas.toDataURL('image/png');
      link.click();
    };
  };

  const handleReapplyFilter = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleDeletePhoto = (photoId) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
    if (printedPhoto && printedPhoto.id === photoId) {
      setPrintedPhoto(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] antialiased overflow-hidden retro-grid-bg relative">
      
      {/* Header Floating console */}
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      {/* Main Grid Row */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Photobooth Canvas Area */}
        <main className="flex-grow flex flex-col items-center justify-start py-8 px-4 md:px-8 overflow-y-auto no-scrollbar max-w-4xl mx-auto w-full transition-all duration-300">
          
          {/* Sparkly Retro Banner Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted-lavender border-3 border-deep-charcoal text-xs font-black text-deep-charcoal mb-5 shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] select-none">
            <Sparkles className="w-4 h-4 text-deep-charcoal animate-spin" style={{ animationDuration: '6s' }} />
            <span>RETRO PHOTOBOOTH ENGINE v4.0</span>
          </div>

          {/* Viewfinder block */}
          <CameraFeed
            isCameraOn={isCameraOn}
            setIsCameraOn={setIsCameraOn}
            isLoggedIn={isLoggedIn}
            activeFilter={activeFilter}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isUsingSimulated={isUsingSimulated}
            setIsUsingSimulated={setIsUsingSimulated}
          />

          {/* Ejection slot (Physical Camera hardware slit) */}
          <div className="w-64 h-5 bg-deep-charcoal border-4 border-deep-charcoal rounded-full mx-auto relative z-20 shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] -mt-2.5" />

          {/* Polaroid Instant Print Ejection Slot */}
          <div className="relative w-full max-w-2xl overflow-hidden h-[330px] flex justify-center pointer-events-none select-none z-10">
            {printedPhoto && (
              <div className="absolute top-0 w-56 bg-white border-4 border-deep-charcoal p-2.5 pb-6 shadow-[5px_5px_0px_0px_rgba(58,51,53,1)] rounded-none animate-print-slot pointer-events-auto transition-all hover:rotate-1 hover:scale-102">
                
                {/* Captured Polaroid Picture Frame */}
                <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden border-2 border-deep-charcoal">
                  <img
                    src={printedPhoto.url}
                    alt="Printed Snapshot"
                    className="w-full h-full object-cover"
                  />
                  {/* Filter tag inside printed card */}
                  {printedPhoto.filter !== 'normal' && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white font-mono text-[7px] uppercase tracking-wider font-bold">
                      {printedPhoto.filter}
                    </div>
                  )}
                </div>
                
                {/* Handwritten date */}
                <div className="font-handwriting text-center text-deep-charcoal mt-2.5 text-xl font-bold select-none leading-none tracking-wide text-ellipsis overflow-hidden whitespace-nowrap">
                  {printedPhoto.date}
                </div>

                {/* Instant Hover Overlay panel inside printed card */}
                <div className="absolute inset-0 bg-white/95 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 px-4 border border-deep-charcoal">
                  <span className="font-display font-black text-[10px] uppercase tracking-widest text-deep-charcoal">
                    PRINT COMPLETED!
                  </span>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => downloadPolaroid(printedPhoto)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blush-pink border-2 border-deep-charcoal font-black text-[10px] uppercase text-deep-charcoal hover:bg-[#F9C3BA] cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Download className="w-3 h-3" />
                      <span>SAVE</span>
                    </button>
                    <button
                      onClick={() => setPrintedPhoto(null)}
                      className="px-3 py-1.5 rounded-lg bg-white border-2 border-deep-charcoal font-black text-[10px] uppercase text-deep-charcoal hover:bg-stone-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter carousel */}
          <FilterCarousel
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            isCameraOn={isCameraOn}
          />

          {/* Action trigger row */}
          <ActionRow
            onShutterClick={handleShutterClick}
            onDownloadClick={() => printedPhoto && downloadPolaroid(printedPhoto)}
            isCameraOn={isCameraOn}
            latestPhoto={printedPhoto}
          />

        </main>

        {/* Polaroid Vault History Sidebar */}
        {isLoggedIn && (
          <VaultSidebar
            photos={capturedPhotos}
            onDeletePhoto={handleDeletePhoto}
            onDownloadPhoto={downloadPolaroid}
            onReapplyFilter={handleReapplyFilter}
            isOpen={isVaultOpen}
            setIsOpen={setIsVaultOpen}
          />
        )}
      </div>
    </div>
  );
}
