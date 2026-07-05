import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  existingImages?: string[];
  onRemoveExisting?: (url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 5,
  existingImages = [],
  onRemoveExisting
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to JPEG under 1200px max dimension using HTML5 Canvas
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85); // 85% JPEG quality
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (selectedFiles: FileList) => {
    setErrorMsg(null);
    const newFiles: File[] = [];
    const totalCurrentCount = files.length + existingImages.length;

    if (totalCurrentCount + selectedFiles.length > maxFiles) {
      setErrorMsg(`Maximum of ${maxFiles} images total is allowed.`);
      return;
    }

    setCompressing(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!validTypes.includes(file.type)) {
        setErrorMsg(`Unsupported file type: ${file.name}. Only JPG, PNG, and WEBP formats are allowed.`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrorMsg(`File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      try {
        const compressed = await compressImage(file);
        newFiles.push(compressed);
      } catch (err) {
        newFiles.push(file);
      }
    }

    setCompressing(false);
    if (newFiles.length > 0) {
      onChange([...files, ...newFiles]);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-textMain uppercase tracking-wider block">
          Item Attachments / Photos ({files.length + existingImages.length}/{maxFiles})
        </label>
        {compressing && (
          <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
            <Loader2 size={12} className="animate-spin" />
            Optimizing images...
          </span>
        )}
      </div>

      {/* DRAG AND DROP ZONE */}
      <div
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
        onClick={triggerInput}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
          dragActive
            ? "border-primary bg-primary-light/10 scale-[0.99]"
            : "border-borderMain hover:border-primary/50 bg-bgMain hover:bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={onFileSelect}
        />
        
        <div className="p-3 bg-white border border-borderMain/50 rounded-xl shadow-soft mb-2.5 transition-transform group-hover:scale-105">
          <Upload className="text-primary" size={20} />
        </div>

        <p className="text-xs text-textMain font-bold">
          Drag & Drop files here, or <span className="text-primary hover:underline">Browse Files</span>
        </p>
        <p className="text-[9px] text-textMuted mt-1">
          Supports JPG, PNG, WEBP formats up to {maxSizeMB}MB each. Maximum {maxFiles} images.
        </p>
      </div>

      {/* ERROR FEEDBACK */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-700 font-bold flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* IMAGES PREVIEW GRID */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {/* Render existing uploaded images (on edit) */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-borderMain/60 group shadow-sm bg-bgMain">
              <img src={url} alt={`Existing preview ${index + 1}`} className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 text-[8px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                <CheckCircle2 size={8} /> Active
              </span>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(url)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors opacity-90 hover:opacity-100"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* Render newly chosen files (not yet saved to backend) */}
          {files.map((file, index) => {
            const objectUrl = URL.createObjectURL(file);
            return (
              <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-borderMain/60 group shadow-sm bg-bgMain">
                <img src={objectUrl} alt={`New upload preview ${index + 1}`} className="w-full h-full object-cover" />
                <span className="absolute top-1.5 left-1.5 text-[8px] bg-primary text-white font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                  Queued
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 text-white rounded-lg shadow-md transition-all hover:scale-105"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
