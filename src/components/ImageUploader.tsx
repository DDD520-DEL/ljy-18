import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadImages } from '@/services/upload';

interface ImageUploaderProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
}

export default function ImageUploader({ imageUrls, onChange, maxCount = 9 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxCount - imageUrls.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const urls = await uploadImages(filesToUpload);
      onChange([...imageUrls, ...urls]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  const handlePreviewLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const canvas = document.createElement('canvas');
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (aspectRatio > 1) {
        sx = (img.naturalWidth - img.naturalHeight) / 2;
        sw = img.naturalHeight;
      } else {
        sy = (img.naturalHeight - img.naturalWidth) / 2;
        sh = img.naturalWidth;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      setPreviews(prev => new Map(prev).set(url, canvas.toDataURL('image/jpeg', 0.6)));
    }
  };

  const canAddMore = imageUrls.length < maxCount;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {imageUrls.map((url, index) => (
          <div key={url} className="relative group">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-cream-100 border border-cream-200">
              {previews.has(url) ? (
                <img
                  src={previews.get(url)}
                  alt={`凭证 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={url}
                  alt={`凭证 ${index + 1}`}
                  onLoad={(e) => handlePreviewLoad(url, e)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white text-center py-0.5">凭证 {index + 1}</p>
            </div>
          </div>
        ))}

        {canAddMore && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-cream-300 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 size={20} className="text-primary-500 animate-spin" />
              ) : (
                <>
                  <ImagePlus size={20} className="text-ink-400" />
                  <span className="text-[10px] text-ink-400">相册</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-cream-300 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} className="text-ink-400" />
              <span className="text-[10px] text-ink-400">拍照</span>
            </button>
          </>
        )}
      </div>

      {imageUrls.length > 0 && (
        <p className="text-xs text-ink-400 mt-2">
          已添加 {imageUrls.length}/{maxCount} 张凭证
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
