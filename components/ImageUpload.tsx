import React, { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  currentAvatar?: string;
  onUpload: (file: File) => Promise<string>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const iconSizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14'
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentAvatar,
  onUpload,
  size = 'md',
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayAvatar = preview || currentAvatar || '';

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return 'file_invalid_type';
    }

    if (file.size > maxSize) {
      return 'file_too_large';
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setPreview(null);
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch {
      setError('upload_failed');
      setPreview(null);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUpload]);

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  }, [uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [uploading, handleFileSelect]);

  const getErrorMessage = (errorKey: string): string => {
    const messages: Record<string, string> = {
      file_invalid_type: '仅支持 JPG、PNG、WebP、GIF 格式',
      file_too_large: '图片大小不能超过 2MB',
      upload_failed: '上传失败，请重试'
    };
    return messages[errorKey] || errorKey;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeMap[size]}
          rounded-full
          overflow-hidden
          cursor-pointer
          relative
          group
          transition-all
          duration-200
          ${isDragging ? 'ring-4 ring-teal-500 ring-offset-2' : ''}
          ${error ? 'ring-2 ring-red-500' : ''}
          ${uploading ? 'cursor-wait' : 'hover:opacity-90'}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt="Avatar"
            className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <Camera className={`${iconSizeMap[size]} text-slate-400`} />
          </div>
        )}

        <div
          className={`
            absolute inset-0
            bg-black/40
            flex
            items-center
            justify-center
            transition-opacity
            duration-200
            ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={`${iconSizeMap[size]} text-white animate-spin`} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Camera className={`${iconSizeMap[size]} text-white`} />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-red-500 text-xs whitespace-nowrap">
          <AlertCircle className="h-3 w-3" />
          <span>{getErrorMessage(error)}</span>
        </div>
      )}
    </div>
  );
};
