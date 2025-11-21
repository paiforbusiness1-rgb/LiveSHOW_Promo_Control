import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScanResult } from '../types';
import { db } from '../services/databaseService';

interface ScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
  operatorName: string;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onClose, operatorName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  const [zoomCap, setZoomCap] = useState<{min: number, max: number, step: number} | null>(null);

  // Pinch Gesture Refs
  const pinchStartDist = useRef<number>(0);
  const pinchStartZoom = useRef<number>(1);

  const tick = useCallback(async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR from window (loaded via CDN in index.html)
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          setIsScanning(false);
          try {
            // Pass operator name to DB service
            const result = await db.validateRegistration(code.data, operatorName);
            onScanComplete(result);
          } catch (e) {
            setError("Error de conexión con la base de datos.");
          }
          return; // Stop loop
        }
      }
    }

    requestAnimationFrame(tick);
  }, [isScanning, onScanComplete, operatorName]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Ideally we want the environment camera (back camera)
        const constraints = { 
            video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
                zoom: true // Request zoom
            } 
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Required for iOS
          videoRef.current.setAttribute("playsinline", "true"); 
          videoRef.current.play();
          
          // Get video track for zoom capabilities
          const track = stream.getVideoTracks()[0];
          trackRef.current = track;

          // Check capabilities
          const capabilities = track.getCapabilities() as any; // Cast to any to access zoom
          if (capabilities.zoom) {
              setZoomCap({
                  min: capabilities.zoom.min,
                  max: capabilities.zoom.max,
                  step: capabilities.zoom.step
              });
              
              // Some devices start at min, others at 1. Check settings.
              const settings = track.getSettings() as any;
              if (settings.zoom) {
                  setZoom(settings.zoom);
              }
          }

          requestAnimationFrame(tick);
        }
      } catch (err) {
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsScanning(false);
    };
  }, [tick]);

  // Helper to apply zoom
  const applyZoom = (value: number) => {
      if (!trackRef.current || !zoomCap) return;
      
      const newZoom = Math.min(Math.max(value, zoomCap.min), zoomCap.max);
      setZoom(newZoom);
      
      trackRef.current.applyConstraints({
          advanced: [{ zoom: newZoom }]
      } as any).catch(err => console.debug("Zoom not supported:", err));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      applyZoom(Number(e.target.value));
  };

  // Touch Handlers for Pinch
  const onTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          pinchStartDist.current = dist;
          pinchStartZoom.current = zoom;
      }
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist.current > 0 && zoomCap) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          
          // Calculate scale factor
          const scale = dist / pinchStartDist.current;
          
          const targetZoom = pinchStartZoom.current * scale;
          applyZoom(targetZoom);
      }
  };

  // Debug function for environments without camera or for quick testing
  const simulateScan = async (qrCode: string) => {
      setIsScanning(false);
      const result = await db.validateRegistration(qrCode, operatorName);
      onScanComplete(result);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col animate-fade-in">
      <div 
        className="relative flex-1 bg-black flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover opacity-80" 
          playsInline 
          muted 
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanner Overlay */}
        <div className="relative z-10 w-72 h-72 border-2 border-brand-500 rounded-3xl shadow-[0_0_100px_-10px_rgba(20,184,166,0.5)] pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg -mt-1 -ml-1"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg -mt-1 -mr-1"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg -mb-1 -ml-1"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg -mb-1 -mr-1"></div>
          
          {/* Scanning Laser Animation */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] opacity-80 animate-[scan_2s_infinite]"></div>
          
          {/* Helper Text inside overlay (optional) */}
        </div>

        {/* Zoom Slider Overlay - Only show if zoom supported */}
        {zoomCap && (
            <div className="absolute bottom-8 w-64 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-white px-1">1x</span>
                <input 
                    type="range" 
                    min={zoomCap.min} 
                    max={zoomCap.max} 
                    step={zoomCap.step} 
                    value={zoom} 
                    onChange={handleSliderChange}
                    className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <span className="text-[10px] font-bold text-white px-1">{zoomCap.max}x</span>
            </div>
        )}

        {error && (
          <div className="absolute top-20 px-6 py-3 bg-red-600/90 backdrop-blur text-white rounded-xl shadow-lg text-center max-w-xs font-medium border border-red-400 z-30">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-900 border-t border-gray-800 flex flex-col gap-4 pb-10">
        <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Operador: <span className="text-white">{operatorName}</span></p>
            {zoomCap && <p className="text-gray-500 text-[10px]">Pinch to Zoom</p>}
        </div>
        
        {/* Manual Simulation Buttons for Demo Purposes */}
        <div className="grid grid-cols-3 gap-2 mb-2">
             <button onClick={() => simulateScan('live-show-vip-001')} className="text-[10px] bg-gray-800 p-3 rounded-lg text-gray-300 border border-gray-700 hover:bg-gray-700">VIP Demo</button>
             <button onClick={() => simulateScan('live-show-promo-004')} className="text-[10px] bg-gradient-to-r from-pink-900 to-purple-900 p-3 rounded-lg text-pink-100 border border-pink-700">Promo Demo</button>
             <button onClick={() => simulateScan('live-show-gen-003')} className="text-[10px] bg-gray-800 p-3 rounded-lg text-gray-300 border border-gray-700 hover:bg-gray-700">Gral Demo</button>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-gray-800 active:bg-gray-700 text-white rounded-xl font-bold transition-colors border border-gray-700 shadow-lg"
        >
          CANCELAR
        </button>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;