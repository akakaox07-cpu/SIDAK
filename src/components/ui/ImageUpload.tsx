import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string; // Current image URL
  onChange: (url: string) => void;
  onFileSelected?: (file: File) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onFileSelected, onNotify }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageAttemptIdx, setImageAttemptIdx] = useState(0);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Derive resilient preview URL variants for Google Drive links
  const previewUrlVariants = useMemo(() => {
    if (!value) return [] as string[];
    // For freshly selected files (blob:/data:) use directly
    if (value.startsWith('blob:') || value.startsWith('data:')) return [value];

    const variants: string[] = [];
    // Try to extract Drive fileId
    let fileId = '';
    try {
      const u = new URL(value, window.location.origin);
      fileId = u.searchParams.get('id') || '';
      if (!fileId) {
        const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (m) fileId = m[1];
      }
    } catch (_) {
      const m = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) fileId = m[1];
    }

    if (fileId) {
      // Prefer thumbnail endpoints (best for embedding + no CORS headaches)
      variants.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`);
      variants.push(`https://lh3.googleusercontent.com/d/${fileId}=w1600`);
      // Then try direct content variants
      variants.push(`https://drive.google.com/uc?id=${fileId}`);
      variants.push(`https://drive.google.com/uc?export=view&id=${fileId}`);
    }
    // Always include the original URL as the last fallback
    variants.push(value);
    // De-duplicate
    return Array.from(new Set(variants));
  }, [value]);

  // Reset image states when value changes
  useEffect(() => {
    setImageError(false);
    setImageAttemptIdx(0);
    setCurrentPreviewUrl(previewUrlVariants[0] || '');
  }, [previewUrlVariants]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files) as File[];
      const imageFile = files.find((file) => file.type.startsWith('image/'));

      if (imageFile) {
        await handleFile(imageFile);
      }
    },
    []
  );

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleFile(file);
    }
  }, []);

  const handleFile = async (file: File) => {
    setIsUploading(true);

    try {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);

      // Notify parent component about file selection for upload to Google Drive
      if (onFileSelected) {
        onFileSelected(file);
      }
    } catch (error) {
      console.error('Error handling file:', error);
      onNotify?.('Gagal memproses gambar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Gambar Aset
      </label>

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6
            transition-colors duration-200 ease-in-out
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            id="image-upload"
          />

          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <>
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-600">Mengupload...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold text-blue-600">Klik untuk upload</span> atau drag & drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 10MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
          <div className="aspect-video relative bg-gray-100">
            <img
              src={currentPreviewUrl || value}
              alt="Preview"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={() => {
                const nextIdx = imageAttemptIdx + 1;
                if (nextIdx < previewUrlVariants.length) {
                  setImageAttemptIdx(nextIdx);
                  setCurrentPreviewUrl(previewUrlVariants[nextIdx]);
                } else {
                  setImageError(true);
                  setCurrentPreviewUrl('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"%3E%3Crect fill=\"%23f3f4f6\" width=\"100\" height=\"100\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" fill=\"%239ca3af\" font-size=\"14\" dy=\".3em\"%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E');
                }
              }}
              onLoad={() => setImageError(false)}
            />
          </div>

          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="Hapus gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon className="w-4 h-4" />
              <span className="truncate flex-1">
                {value.startsWith('blob:') || value.startsWith('data:') 
                  ? 'Gambar baru (belum tersimpan)' 
                  : 'Gambar tersimpan'}
              </span>
              {imageError && value && (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline whitespace-nowrap"
                  title="Buka gambar di tab baru"
                >Buka</a>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Gambar akan otomatis di-upload ke Google Drive saat Anda menyimpan aset
      </p>
    </div>
  );
};
