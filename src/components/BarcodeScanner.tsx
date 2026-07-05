import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle } from 'lucide-react';

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
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Get available cameras
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

    return () => {
      // Clean up scanner on unmount
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = (cameraId: string) => {
    if (!cameraId) return;
    
    // Stop any active scanning first
    const stopPromise = qrRef.current && qrRef.current.isScanning
      ? qrRef.current.stop()
      : Promise.resolve();

    stopPromise.then(() => {
      setErrorMsg(null);
      setIsScanning(true);
      
      const scanner = new Html5Qrcode("scanner-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_39],
        verbose: false
      });
      qrRef.current = scanner;

      scanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            // Rectangular scanning window optimized for 1D barcodes
            const boxWidth = Math.min(width * 0.85, 300);
            const boxHeight = Math.min(height * 0.35, 100);
            return { width: boxWidth, height: boxHeight };
          }
        },
        (decodedText) => {
          // Success
          scanner.stop().then(() => {
            setIsScanning(false);
            onScanSuccess(decodedText.trim());
          }).catch(console.error);
        },
        () => {
          // Ignore verbose scanner framing errors
        }
      ).catch(err => {
        console.error('Start scanner error:', err);
        setErrorMsg('Failed to start camera feed. Please try again or switch camera.');
        setIsScanning(false);
      });
    });
  };

  useEffect(() => {
    if (selectedCameraId) {
      startScanning(selectedCameraId);
    }
  }, [selectedCameraId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-borderMain rounded-3xl p-6 shadow-2xl space-y-4 text-left flex flex-col">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 border border-borderMain/50 hover:bg-bgMain text-textMuted hover:text-textMain rounded-xl transition-all"
        >
          <X size={16} />
        </button>

        <div className="space-y-1">
          <h4 className="font-sans font-extrabold text-sm text-textMain uppercase tracking-wider flex items-center gap-1.5">
            <Camera size={14} className="text-primary animate-pulse" />
            <span>ID Barcode Scanner (Code 39)</span>
          </h4>
          <p className="text-[10px] text-textMuted">
            Hold the student ID card barcode in front of the camera inside the green bracket.
          </p>
        </div>

        {/* CAMERAS LIST SELECTION */}
        {cameras.length > 1 && (
          <div className="flex gap-2 items-center text-xs">
            <span className="text-textMuted shrink-0 font-medium">Select Source:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-bgMain border border-borderMain rounded-lg focus:outline-none"
            >
              {cameras.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* SCANNING WINDOW */}
        <div className="relative aspect-video w-full bg-neutral-900 rounded-2xl overflow-hidden border border-borderMain/60 flex items-center justify-center">
          <div id="scanner-reader" className="w-full h-full" />
          
          {/* Overlay laser and target bounds */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[80%] h-[30%] border-2 border-emerald-500 rounded-lg relative flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {/* Simulated Red Laser Line */}
                <div className="absolute w-[95%] h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
            </div>
          )}

          {!isScanning && !errorMsg && (
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <Loader2 className="animate-spin text-white" size={14} /> Starting video...
            </span>
          )}
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-700 font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
