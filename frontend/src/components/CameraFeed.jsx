import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Info, Edit3 } from 'lucide-react';

export default function CameraFeed({
  isCameraOn,
  setIsCameraOn,
  isLoggedIn,
  activeFilter,
  videoRef,
  canvasRef,
  isUsingSimulated,
  setIsUsingSimulated,
  editingPhoto
}) {
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const simCanvasRef = useRef(null);
  const animationFrameId = useRef(null);

  // Request/release camera stream
  useEffect(() => {
    async function startCamera() {
      if (!isCameraOn || editingPhoto) return;
      setPermissionError(false);
      setIsUsingSimulated(false);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn("Switching to simulation feed.", err);
        setPermissionError(true);
        setIsUsingSimulated(true);
      }
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    if (isCameraOn && !editingPhoto) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraOn, editingPhoto]);

  // Simulation Render Loop
  useEffect(() => {
    if (!isCameraOn || !isUsingSimulated || editingPhoto) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const particles = Array.from({ length: 12 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 5 + 3,
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      color: ['#F7D6D0', '#D6E4DC', '#E2DCF0'][Math.floor(Math.random() * 3)]
    }));

    const render = () => {
      frame++;
      
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(58, 51, 53, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#3A3335';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      });

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + Math.sin(frame * 0.04) * 12);
      
      ctx.fillStyle = '#E2DCF0';
      ctx.strokeStyle = '#3A3335';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-75, -45, 150, 90, 16);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(-35, -60, 25, 15, 4);
      ctx.fillStyle = '#D6E4DC';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F7D6D0';
      ctx.fillRect(-15, -43, 8, 86);
      ctx.fillStyle = '#D6E4DC';
      ctx.fillRect(-7, -43, 8, 86);
      ctx.fillStyle = '#E2DCF0';
      ctx.fillRect(1, -43, 8, 86);

      ctx.beginPath();
      ctx.arc(20, 0, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#FDFBF7';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(20, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#3A3335';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(15, -5, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      const trackX = canvas.width / 2 + Math.cos(frame * 0.015) * 60;
      const trackY = canvas.height / 2 + Math.sin(frame * 0.02) * 40;
      const size = 110 + Math.sin(frame * 0.04) * 8;
      
      ctx.strokeStyle = '#3A3335';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.roundRect(trackX - size/2, trackY - size/2, size, size, 16);
      ctx.stroke();
      ctx.setLineDash([]); 

      ctx.strokeStyle = '#3A3335';
      ctx.lineWidth = 4;
      const len = 12;
      const offset = size / 2;
      
      ctx.beginPath();
      ctx.moveTo(trackX - offset, trackY - offset + len);
      ctx.lineTo(trackX - offset, trackY - offset);
      ctx.lineTo(trackX - offset + len, trackY - offset);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(trackX + offset, trackY + offset - len);
      ctx.lineTo(trackX + offset, trackY + offset);
      ctx.lineTo(trackX + offset - len, trackY + offset);
      ctx.stroke();

      const totalSeconds = Math.floor(frame / 60);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      const milliseconds = String(Math.floor((frame % 60) * 1.66)).padStart(2, '0');
      
      ctx.fillStyle = '#3A3335';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(`● REC ${minutes}:${seconds}:${milliseconds}`, 20, 30);
      ctx.fillText('1080P 60FPS', canvas.width - 110, 30);
      ctx.fillText('AUTO-FOCUS LENS', 20, canvas.height - 20);
      ctx.fillText('SIMULATION FEED', canvas.width - 130, canvas.height - 20);

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraOn, isUsingSimulated, editingPhoto]);

  // Translate filter selection to css classes
  const getFilterClass = () => {
    switch (activeFilter) {
      case 'mono': return 'filter-mono';
      case 'cyber': return 'filter-cyber';
      case 'sunset': return 'filter-sunset';
      case 'vintage': return 'filter-vintage';
      case 'sweet': return 'filter-sweet';
      default: return 'filter-none';
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      
      {/* Informative banners on guest session state */}
      {!isLoggedIn && !editingPhoto && (
        <div className="absolute -top-12 z-20 animate-bounce flex items-center gap-2 bg-[#FDFBF7] border-3 border-deep-charcoal rounded-xl px-4 py-2 shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] text-xs font-black text-deep-charcoal">
          <Info className="w-4 h-4 text-white bg-deep-charcoal rounded-full p-0.5" />
          <span>Guest Mode: Snapped photos are saved to your session vault!</span>
        </div>
      )}

      {/* Main physical polaroid camera housing */}
      <div className="relative w-full aspect-[4/3] bg-white border-6 border-deep-charcoal rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(58,51,53,1)] overflow-hidden transition-all duration-300">
        
        {/* Rainbow color horizontal stripe */}
        <div className="absolute top-0 left-0 right-0 h-4 border-b-4 border-deep-charcoal flex">
          <div className="flex-1 bg-blush-pink" />
          <div className="flex-1 bg-matcha-green" />
          <div className="flex-1 bg-muted-lavender" />
          <div className="flex-1 bg-blush-pink" />
        </div>

        {/* Top bar indicators */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {/* LED status light */}
          <div className="flex items-center gap-1.5 bg-deep-charcoal text-white rounded-full px-2.5 py-1 text-[9px] font-bold tracking-widest border-2 border-deep-charcoal">
            <span className={`w-2 h-2 rounded-full border border-white/20 ${editingPhoto ? 'bg-amber-400 animate-pulse' : isCameraOn ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
            <span>{editingPhoto ? 'SYS EDITING' : isCameraOn ? 'SYS READY' : 'SYS STDBY'}</span>
          </div>
        </div>

        {/* Viewport toggle button - disabled in editing mode */}
        {!editingPhoto && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className="retro-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[10px] font-black uppercase text-deep-charcoal cursor-pointer shadow-[2px_2px_0px_0px_rgba(58,51,53,1)]"
            >
              {isCameraOn ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 relative animate-pulse" />
                  <span>🎥 CAMERA ON</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>❌ CAMERA OFF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Viewfinder Lens screen */}
        <div className="w-full h-full pt-4 relative bg-muted-lavender overflow-hidden">
          {editingPhoto ? (
            /* Render Static Selected Photo inside the viewfinder chassis */
            <div className="w-full h-full relative flex items-center justify-center bg-stone-100 animate-fade-in">
              <img
                src={editingPhoto.url}
                alt="Editing Snapshot"
                className={`w-full h-full object-cover transition-all duration-200 ${getFilterClass()}`}
              />
              <div className="absolute bottom-4 left-4 bg-deep-charcoal/80 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Adjusting Filter</span>
              </div>
              {/* Glass Scanlines and Grain Overlay */}
              <div className="absolute inset-0 pointer-events-none grain-overlay opacity-80" />
              <div className="absolute inset-0 pointer-events-none scanlines-overlay opacity-30" />
            </div>
          ) : isCameraOn ? (
            <div className="w-full h-full relative">
              {/* Web Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-all duration-300 ${getFilterClass()} ${isUsingSimulated ? 'hidden' : 'block'}`}
              />

              {/* Simulation Canvas stream */}
              <canvas
                ref={simCanvasRef}
                width={640}
                height={480}
                className={`w-full h-full object-cover transition-all duration-300 ${getFilterClass()} ${isUsingSimulated ? 'block' : 'hidden'}`}
              />

              {/* Glass Scanlines and Grain Overlay */}
              <div className="absolute inset-0 pointer-events-none grain-overlay opacity-80" />
              <div className="absolute inset-0 pointer-events-none scanlines-overlay opacity-30" />

              {/* Hidden Capture Canvas */}
              <canvas ref={canvasRef} width={640} height={480} className="hidden" />
            </div>
          ) : (
            /* Suspended state display */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-muted-lavender text-deep-charcoal select-none animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-white/70 flex items-center justify-center border-4 border-deep-charcoal shadow-[3px_3px_0px_0px_rgba(58,51,53,1)] mb-4 animate-pulse">
                <CameraOff className="w-8 h-8 text-deep-charcoal" />
              </div>
              <h3 className="font-display font-black text-xl tracking-tight text-deep-charcoal">
                Your camera is resting.
              </h3>
              <p className="font-sans font-bold text-[10px] uppercase tracking-wider mt-1 text-deep-charcoal/50">
                WAKE IT UP WITH THE TOGGLE BUTTON IN THE TOP RIGHT
              </p>
            </div>
          )}

          {/* Flash animation trigger block */}
          <div id="camera-flash-overlay" className="absolute inset-0 bg-white opacity-0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
