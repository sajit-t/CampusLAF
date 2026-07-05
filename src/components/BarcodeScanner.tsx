import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle, Zap, ZapOff, ZoomIn } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (rollNumber: string) => void;
  onClose: () => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  
  // Camera Selection States
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFacing, setMobileFacing] = useState<'environment' | 'user'>('environment');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  const [isScanning, setIsScanning] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState('Searching for ID card...');
  const [scanSuccess, setScanSuccess] = useState(false);

  // Video track constraints control states
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);
  const [zoomVal, setZoomVal] = useState(1);

  // Focus Ring Indicator states
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  // Pinch-to-zoom tracking ref
  const touchStartDistRef = useRef<number | null>(null);

  const qrRef = useRef<Html5Qrcode | null>(null);

  // Boot & detect device configuration
  useEffect(() => {
    const mobileCheck = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    if (mobileCheck) {
      // For mobile devices, bypass physical cameras listing and default to Back Camera (environment facingMode)
      setIsScanning(true);
      startScanningMobile('environment');
    } else {
      // For desktop, list actual physical cameras
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length > 0) {
            const list = devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` }));
            setCameras(list);
            setSelectedCameraId(devices[0].id);
          } else {
            setErrorMsg('No camera devices found.');
          }
        })
        .catch(err => {
          console.error('Get cameras error:', err);
          setErrorMsg('Camera permission denied or camera unavailable.');
        });
    }

    return () => {
      stopCameraTrack();
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const stopCameraTrack = () => {
    if (videoTrack) {
      // Release torch state
      if (isTorchOn) {
        videoTrack.applyConstraints({ advanced: [{ torch: false } as any] }).catch(() => {});
      }
      setVideoTrack(null);
      setHasTorch(false);
      setIsTorchOn(false);
      setHasZoom(false);
    }
  };

  const bindTrackCapabilities = (track: MediaStreamTrack) => {
    try {
      setVideoTrack(track);
      
      // Attempt manual autofocus or continuous autofocus
      track.applyConstraints({
        advanced: [
          { focusMode: 'continuous' } as any
        ]
      }).catch(() => {});

      const capabilities = track.getCapabilities() as any;
      if (capabilities) {
        if (capabilities.zoom) {
          setHasZoom(true);
          setZoomMin(capabilities.zoom.min || 1);
          setZoomMax(capabilities.zoom.max || 1);
          setZoomVal(track.getSettings().zoom || capabilities.zoom.min || 1);
        } else {
          setHasZoom(false);
        }
        setHasTorch(!!capabilities.torch);
      }
    } catch (e) {
      console.warn('Error reading video track capacities:', e);
    }
  };

  const startScanningMobile = (facing: 'environment' | 'user') => {
    setErrorMsg(null);
    setIsScanning(true);
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

      scanner.start(
        { facingMode: facing },
        {
          fps: 20,
          qrbox: (width, height) => {
            // Decodes region corresponding to the ID card bounds
            const boxWidth = Math.min(width * 0.85, 340);
            const boxHeight = Math.min(boxWidth / 1.58, height * 0.75);
            return { width: boxWidth, height: boxHeight };
          }
        },
        (decodedText) => {
          handleSuccessScan(decodedText);
        },
        () => {
          // Ignore verbose scanner framing errors
        }
      ).then(() => {
        setGuidanceMessage('✓ Card Detected');
        
        // Query video tracks of the stream
        const videoElement = document.querySelector("#scanner-reader video") as HTMLVideoElement;
        if (videoElement && videoElement.srcObject instanceof MediaStream) {
          const activeTrack = videoElement.srcObject.getVideoTracks()[0];
          bindTrackCapabilities(activeTrack);
        }
      }).catch(err => {
        console.error('Start scanner error:', err);
        setErrorMsg('Failed to start camera feed. Check permissions or switch camera facing.');
        setIsScanning(false);
      });
    });
  };

  const startScanningDesktop = (cameraId: string) => {
    if (!cameraId) return;
    setErrorMsg(null);
    setIsScanning(true);
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

      scanner.start(
        cameraId,
        {
          fps: 20,
          qrbox: (width, height) => {
            const boxWidth = Math.min(width * 0.85, 340);
            const boxHeight = Math.min(boxWidth / 1.58, height * 0.75);
            return { width: boxWidth, height: boxHeight };
          }
        },
        (decodedText) => {
          handleSuccessScan(decodedText);
        },
        () => {
          // Ignore verbose scanner framing errors
        }
      ).then(() => {
        setGuidanceMessage('✓ Card Detected');

        const videoElement = document.querySelector("#scanner-reader video") as HTMLVideoElement;
        if (videoElement && videoElement.srcObject instanceof MediaStream) {
          const activeTrack = videoElement.srcObject.getVideoTracks()[0];
          bindTrackCapabilities(activeTrack);
        }
      }).catch(err => {
        console.error('Start scanner error:', err);
        setErrorMsg('Failed to start camera. Camera may be occupied by another app.');
        setIsScanning(false);
      });
    });
  };

  const handleSuccessScan = (decodedText: string) => {
    // 1. Instantly trigger visual success state
    setScanSuccess(true);
    setGuidanceMessage('✓ Barcode Recognized');

    // 2. Play vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate(120);
    }

    // 3. Pause scanning and return
    if (qrRef.current && qrRef.current.isScanning) {
      qrRef.current.stop().then(() => {
        setIsScanning(false);
        setTimeout(() => {
          onScanSuccess(decodedText.trim());
        }, 600); // Small delay for user to register the green flash feedback
      }).catch(() => {
        onScanSuccess(decodedText.trim());
      });
    } else {
      onScanSuccess(decodedText.trim());
    }
  };

  useEffect(() => {
    if (!isMobile && selectedCameraId) {
      startScanningDesktop(selectedCameraId);
    }
  }, [selectedCameraId]);

  // Torch control trigger
  const handleToggleTorch = () => {
    if (!videoTrack || !hasTorch) return;
    const nextState = !isTorchOn;
    videoTrack.applyConstraints({
      advanced: [{ torch: nextState } as any]
    }).then(() => {
      setIsTorchOn(nextState);
    }).catch(err => {
      console.error('Error toggling torch:', err);
    });
  };

  // Zoom control trigger
  const handleZoomChange = (val: number) => {
    if (!videoTrack || !hasZoom) return;
    videoTrack.applyConstraints({
      advanced: [{ zoom: val } as any]
    }).then(() => {
      setZoomVal(val);
    }).catch(err => {
      console.error('Error updating zoom:', err);
    });
  };

  // Pinch to zoom handler
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
    if (e.touches.length === 2 && touchStartDistRef.current && hasZoom && videoTrack) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchStartDistRef.current;
      touchStartDistRef.current = dist;

      // Map touch delta to zoom scale adjustment
      const step = (zoomMax - zoomMin) / 150;
      const newVal = Math.min(zoomMax, Math.max(zoomMin, zoomVal + delta * step));
      handleZoomChange(newVal);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Tap to focus trigger with indicator ring
  const handlePreviewTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusRing({ x, y, visible: true });
    
    // Trigger browser manual focus if supported
    if (videoTrack) {
      videoTrack.applyConstraints({
        advanced: [
          { focusMode: 'manual', pointsOfInterest: [{ x: x / rect.width, y: y / rect.height }] } as any
        ]
      }).catch(() => {
        // Fallback to continuous focus re-trigger
        videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as any]
        }).catch(() => {});
      });
    }

    setTimeout(() => {
      setFocusRing(prev => ({ ...prev, visible: false }));
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow- premium text-left flex flex-col space-y-5 overflow-hidden">
        
        {/* Header and Close button */}
        <div className="flex justify-between items-start z-10">
          <div className="space-y-1">
            <h4 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={14} className="text-primary animate-pulse" />
              <span>ID Barcode Scanner</span>
            </h4>
            <p className="text-[10px] text-neutral-400 font-medium">
              Position the entire Student ID card inside the scanner frame.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* CAMERAS SELECT DROPDOWN */}
        <div className="flex flex-col gap-2.5 z-10 text-xs">
          {isMobile ? (
            <div className="flex items-center gap-3">
              <span className="text-neutral-400 font-semibold shrink-0">Facing:</span>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileFacing('environment');
                    startScanningMobile('environment');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                    mobileFacing === 'environment'
                      ? 'bg-primary border-primary text-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Back Camera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileFacing('user');
                    startScanningMobile('user');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                    mobileFacing === 'user'
                      ? 'bg-primary border-primary text-white'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  Front Camera
                </button>
              </div>
            </div>
          ) : (
            cameras.length > 1 && (
              <div className="flex gap-3 items-center">
                <span className="text-neutral-400 font-semibold shrink-0">Source Camera:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>

        {/* SCANNING PREVIEW VIEWPORT WITH SCROLL OVERLAYS */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handlePreviewTap}
          className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center cursor-pointer select-none"
        >
          {/* Main camera stream frame hook */}
          <div id="scanner-reader" className="w-full h-full object-cover" />

          {/* TAP TO FOCUS INDICATOR RING */}
          {focusRing.visible && (
            <div 
              style={{ left: focusRing.x - 20, top: focusRing.y - 20 }}
              className="absolute w-10 h-10 border-2 border-dashed border-yellow-400 rounded-full animate-ping pointer-events-none z-30"
            />
          )}

          {/* HOLE-PUNCH DOCUMENT SCANNER MASK LAYER */}
          {isScanning && (
            <div className="absolute inset-0 flex flex-col pointer-events-none z-20">
              {/* Top Dark Block */}
              <div className="flex-1 bg-black/60 w-full" />
              
              {/* Center Row Viewport Block - dynamically calculated based on aspect ratio */}
              <div className="flex w-full items-stretch shrink-0">
                <div className="flex-1 bg-black/60" />
                
                {/* Viewport Card Frame (aspect-ratio 1.58:1) */}
                <div className={`aspect-[1.58] w-[82%] max-w-[320px] border-2 rounded-2xl relative flex flex-col items-center justify-center text-center transition-all duration-300 shrink-0 ${
                  scanSuccess 
                    ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] bg-emerald-500/10' 
                    : 'border-white/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] bg-transparent'
                }`}>
                  {/* Four Corner Guides */}
                  <div className={`absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scanSuccess ? 'border-emerald-500' : 'border-primary'}`} />
                  <div className={`absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scanSuccess ? 'border-emerald-500' : 'border-primary'}`} />
                  <div className={`absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scanSuccess ? 'border-emerald-500' : 'border-primary'}`} />
                  <div className={`absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scanSuccess ? 'border-emerald-500' : 'border-primary'}`} />

                  {/* Inner Viewport Text guides */}
                  <div className="space-y-1.5 select-none bg-black/55 px-4 py-3 rounded-2xl border border-white/5 max-w-[260px] mx-auto shadow-md">
                    <p className="text-[10px] font-sans font-extrabold text-white uppercase tracking-wider">
                      Place your Student ID inside the frame
                    </p>
                    <p className="text-[9px] text-neutral-300 font-semibold leading-normal">
                      The barcode will be detected automatically.
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 bg-black/60" />
              </div>

              {/* Bottom Dark Block */}
              <div className="flex-1 bg-black/60 w-full" />
            </div>
          )}

          {/* Loading video placeholder */}
          {!isScanning && !errorMsg && (
            <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center gap-2 text-white/50 z-20">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-[10px] font-semibold tracking-wider uppercase">Accessing Camera...</span>
            </div>
          )}
        </div>

        {/* GUIDANCE MESSAGE & STATUS */}
        {isScanning && (
          <div className="bg-neutral-800/40 border border-neutral-800/80 p-3.5 rounded-2xl text-center flex items-center justify-center gap-2 z-10">
            <span className={`w-2.5 h-2.5 rounded-full ${
              guidanceMessage.includes('Recognized') ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500 animate-ping'
            }`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {guidanceMessage}
            </span>
          </div>
        )}

        {/* MANUAL ZOOM & FLASH/TORCH MOBILE CONTROLS */}
        {isScanning && (hasZoom || hasTorch) && (
          <div className="bg-neutral-800/60 p-3.5 rounded-2xl flex items-center justify-between gap-4 z-10">
            {/* Zoom Slider */}
            {hasZoom && (
              <div className="flex items-center gap-2.5 flex-1">
                <ZoomIn size={14} className="text-neutral-400 shrink-0" />
                <input
                  type="range"
                  min={zoomMin}
                  max={zoomMax}
                  step={0.1}
                  value={zoomVal}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-[9px] font-mono text-neutral-400 font-bold shrink-0">{zoomVal.toFixed(1)}x</span>
              </div>
            )}

            {/* Flash/Torch Switch */}
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 font-bold text-[10px] ${
                  isTorchOn
                    ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {isTorchOn ? <ZapOff size={13} /> : <Zap size={13} />}
                <span>Flash</span>
              </button>
            )}
          </div>
        )}

        {/* COMPREHENSIVE ERROR FEEDBACK */}
        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 font-bold flex items-center gap-2 z-10 animate-fadeIn">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
