import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (rollNumber: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Camera facing state
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleFacing, setHasMultipleFacing] = useState(false);
  const [desktopCameraIndex, setDesktopCameraIndex] = useState(0);

  // Video track for background touch controls
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);
  const [zoomVal, setZoomVal] = useState(1);

  // Pinch-to-zoom tracking ref
  const touchStartDistRef = useRef<number | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);

  // Detect mobile vs desktop and camera availability
  useEffect(() => {
    const mobileCheck = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    Html5Qrcode.getCameras()
      .then(devices => {
        // If there is more than 1 camera device, allow camera flip toggle
        if (devices && devices.length > 1) {
          setHasMultipleFacing(true);
        }
        
        // Start scanning automatically
        if (mobileCheck) {
          startScanning('environment');
        } else {
          // On desktop, grab the first default webcam
          const defaultId = devices.length > 0 ? devices[0].id : '';
          if (defaultId) {
            startScanning(defaultId);
          } else {
            setErrorMsg('No camera found.');
          }
        }
      })
      .catch(err => {
        console.error('Camera access error:', err);
        setErrorMsg('Camera permission denied.');
      });

    return () => {
      stopCameraTrack();
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const stopCameraTrack = () => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoTrack(null);
    }
  };

  const bindTrackCapabilities = (track: MediaStreamTrack) => {
    try {
      setVideoTrack(track);
      
      // Auto focus constraints
      track.applyConstraints({
        advanced: [
          { focusMode: 'continuous' } as any
        ]
      }).catch(() => {});

      const capabilities = track.getCapabilities() as any;
      if (capabilities && capabilities.zoom) {
        setZoomMin(capabilities.zoom.min || 1);
        setZoomMax(capabilities.zoom.max || 1);
        setZoomVal(track.getSettings().zoom || capabilities.zoom.min || 1);
      }
    } catch (e) {
      console.warn('Track capabilities bind issue:', e);
    }
  };

  const startScanning = (cameraSource: string | { facingMode: 'environment' | 'user' }) => {
    setErrorMsg(null);
    stopCameraTrack();

    const stopPromise = qrRef.current && qrRef.current.isScanning
      ? qrRef.current.stop()
      : Promise.resolve();

    stopPromise.then(() => {
      const scanner = new Html5Qrcode("scanner-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_39],
        verbose: false
      });
      qrRef.current = scanner;

      // Note: we omit qrbox constraints so that the scanner decodes from the entire frame
      scanner.start(
        cameraSource,
        {
          fps: 24
        },
        (decodedText) => {
          handleSuccessScan(decodedText);
        },
        () => {
          // Ignore verbose scanner framing errors
        }
      ).then(() => {
        // Query active track
        const videoElement = document.querySelector("#scanner-reader video") as HTMLVideoElement;
        if (videoElement && videoElement.srcObject instanceof MediaStream) {
          const activeTrack = videoElement.srcObject.getVideoTracks()[0];
          bindTrackCapabilities(activeTrack);
        }
      }).catch(err => {
        console.error('Scanner start failed:', err);
        setErrorMsg('Unable to detect camera feed.');
      });
    });
  };

  const handleSuccessScan = (decodedText: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    if (qrRef.current && qrRef.current.isScanning) {
      qrRef.current.stop().then(() => {
        onScanSuccess(decodedText.trim());
      }).catch(() => {
        onScanSuccess(decodedText.trim());
      });
    } else {
      onScanSuccess(decodedText.trim());
    }
  };

  // Flip Camera Action
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    
    if (isMobile) {
      startScanning({ facingMode: nextFacing });
    } else {
      // Rotate between listed cameras if desktop
      Html5Qrcode.getCameras().then(devices => {
        if (devices.length > 1) {
          const nextIndex = (desktopCameraIndex + 1) % devices.length;
          setDesktopCameraIndex(nextIndex);
          startScanning(devices[nextIndex].id);
        }
      });
    }
  };

  // Tap to focus gesture
  const handleTapToFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    videoTrack.applyConstraints({
      advanced: [
        { focusMode: 'manual', pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] } as any
      ]
    }).catch(() => {
      // Re-fallback to continuous focus
      videoTrack.applyConstraints({
        advanced: [{ focusMode: 'continuous' } as any]
      }).catch(() => {});
    });
  };

  // Pinch touch zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current && videoTrack) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchStartDistRef.current;
      touchStartDistRef.current = dist;

      // Adjust zoom constraints dynamically
      const step = (zoomMax - zoomMin) / 150;
      const newVal = Math.min(zoomMax, Math.max(zoomMin, zoomVal + delta * step));
      
      videoTrack.applyConstraints({
        advanced: [{ zoom: newVal } as any]
      }).then(() => {
        setZoomVal(newVal);
      }).catch(() => {});
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* FULL PREVIEW SCREEN */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTapToFocus}
        className="relative w-full h-full overflow-hidden flex items-center justify-center select-none"
      >
        {/* Main camera feed DOM node */}
        <div id="scanner-reader" className="w-full h-full object-cover" />

        {/* NATIVE-LIKE DOCUMENT VIEWPORT OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
          {/* Card Viewport shape with 9999px spread shadow to dim outer bounds */}
          <div className="aspect-[1.58] w-[80%] max-w-[340px] border-2 border-white/60 rounded-3xl relative flex flex-col items-center justify-center text-center shadow-[0_0_0_9999px_rgba(10,10,10,0.65)] bg-transparent">
            {/* L-shaped corner guides */}
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 rounded-tl-xl border-white" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 rounded-tr-xl border-white" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 rounded-bl-xl border-white" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 rounded-br-xl border-white" />

            {/* Viewport label constraints */}
            <div className="space-y-1 select-none text-white max-w-[240px] mx-auto filter drop-shadow">
              <p className="text-[11px] font-sans font-extrabold uppercase tracking-wider leading-tight">
                Place your Student ID here
              </p>
              <p className="text-[9px] text-white/80 font-bold tracking-wide">
                Barcode will be detected automatically
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS OVERLAY: TOP RIGHT CORNER BUTTONS */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
          {/* Flip camera switch toggle (only if multiple cameras exist) */}
          {hasMultipleFacing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFacing();
              }}
              type="button"
              className="p-3 bg-neutral-900/60 hover:bg-neutral-800 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
              title="Switch Camera"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {/* Close Scanner Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
            className="p-3 bg-neutral-900/60 hover:bg-neutral-800 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* COMPREHENSIVE ERROR FEEDBACK */}
        {errorMsg && (
          <div className="absolute bottom-10 left-6 right-6 bg-red-500/90 border border-red-500/20 p-4 rounded-2xl text-xs text-white font-bold flex items-center gap-2 z-30 animate-fadeIn backdrop-blur-sm max-w-sm mx-auto">
            <AlertCircle className="shrink-0" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple visual helper
const AlertCircle = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
