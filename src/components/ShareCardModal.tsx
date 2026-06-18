import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import { generateShareCard, downloadImage, type ShareCardData } from '@/utils/shareCard';
import { cn } from '@/lib/utils';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
}

export default function ShareCardModal({ isOpen, onClose, data }: ShareCardModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateCard = useCallback(async () => {
    setIsGenerating(true);
    try {
      const url = await generateShareCard(data);
      setImageUrl(url);
    } catch (error) {
      console.error('生成分享卡片失败:', error);
      alert('生成分享卡片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      generateCard();
    } else {
      setImageUrl('');
    }
  }, [isOpen, generateCard]);

  const handleDownload = () => {
    if (!imageUrl) return;
    setIsSaving(true);
    try {
      const filename = `${data.year}年度人情账单_${new Date().toLocaleDateString('zh-CN')}.png`;
      downloadImage(imageUrl, filename);
    } catch (error) {
      console.error('保存图片失败:', error);
      alert('保存图片失败，请重试');
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${data.year}年度人情账单.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${data.year}年度人情账单`,
          text: `我的${data.year}年度人情账单：总支出 ¥${data.totalExpense.toLocaleString()}，总收入 ¥${data.totalIncome.toLocaleString()}，往来人数 ${data.contactCount} 人。`,
          files: [file],
        });
        return;
      }
      handleDownload();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-ink-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-700">
          <h2 className="text-lg font-bold text-ink-800 dark:text-ink-200 flex items-center gap-2">
            <Share2 size={20} className="text-primary-500" />
            生成分享卡片
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors text-ink-500 dark:text-ink-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="relative aspect-[5/8] w-full rounded-2xl overflow-hidden bg-cream-50 dark:bg-ink-900 border-2 border-dashed border-ink-200 dark:border-ink-600">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 size={40} className="animate-spin text-primary-500 mb-3" />
                <p className="text-sm text-ink-500 dark:text-ink-400">正在生成精美卡片...</p>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="分享卡片"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-400 dark:text-ink-500">
                <p className="text-sm">卡片生成失败</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-3">
            长按图片或点击下方按钮保存到相册
          </p>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={generateCard}
            disabled={isGenerating}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium transition-all active:scale-95",
              "bg-ink-100 hover:bg-ink-200 dark:bg-ink-700 dark:hover:bg-ink-600",
              "text-ink-700 dark:text-ink-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            重新生成
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating || !imageUrl}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
              "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md",
              "hover:from-primary-600 hover:to-primary-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Share2 size={18} />
            分享
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating || !imageUrl || isSaving}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
              "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md",
              "hover:from-emerald-600 hover:to-emerald-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
