import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share2, Loader2, Check, ImagePlus, Info } from 'lucide-react';
import { generateShareCard, saveImageToDevice, isMobile, isIOS, canShareImage, getSaveTipText, type ShareCardData } from '@/utils/shareCard';
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
  const [showSaveTip, setShowSaveTip] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mobile = isMobile();
  const canShare = canShareImage();

  const generateCard = useCallback(async () => {
    setIsGenerating(true);
    setSaveSuccess(false);
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
      setShowSaveTip(false);
      setSaveSuccess(false);
    } else {
      setImageUrl('');
    }
  }, [isOpen, generateCard]);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    setIsSaving(true);
    try {
      const filename = `${data.year}年度人情账单_${new Date().toLocaleDateString('zh-CN')}.png`;
      const success = await saveImageToDevice(imageUrl, filename);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (error) {
      console.error('保存图片失败:', error);
      alert('保存图片失败，请重试');
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  }, [imageUrl, data.year]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${data.year}年度人情账单.png`, { type: 'image/png' });

      if (canShare) {
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
  }, [imageUrl, data, canShare, handleDownload]);

  const handleLongPressTip = () => {
    setShowSaveTip(true);
    setTimeout(() => setShowSaveTip(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-ink-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-ink-700">
          <h2 className="text-lg font-bold text-ink-800 dark:text-ink-200 flex items-center gap-2">
            <Share2 size={20} className="text-primary-500" />
            分享年度账单
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors text-ink-500 dark:text-ink-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="relative aspect-[5/8] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-cream-50 to-cream-100 dark:from-ink-900 dark:to-ink-800 shadow-lg">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
                <p className="text-base font-medium text-ink-600 dark:text-ink-400">正在生成精美卡片...</p>
                <p className="text-sm text-ink-400 dark:text-ink-500 mt-1">请稍候</p>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={`${data.year}年度人情账单分享卡片`}
                className="w-full h-full object-contain select-none"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                onTouchStart={handleLongPressTip}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-400 dark:text-ink-500">
                <ImagePlus size={48} className="mb-3 opacity-50" />
                <p className="text-sm">卡片生成失败</p>
              </div>
            )}

            {saveSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex flex-col items-center bg-white dark:bg-ink-700 rounded-2xl p-6 shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                    <Check size={32} className="text-white" />
                  </div>
                  <p className="text-base font-bold text-ink-800 dark:text-ink-200">保存成功</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                    {mobile ? '图片已保存到相册' : '图片已保存到本地'}
                  </p>
                </div>
              </div>
            )}

            {showSaveTip && mobile && !saveSuccess && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
                长按图片可保存到相册
              </div>
            )}
          </div>

          {mobile && (
            <div className="mt-4 p-3 bg-cream-50 dark:bg-ink-700/50 rounded-xl">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300">
                    保存到相册
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                    {getSaveTipText()}
                  </p>
                  {!canShare && isIOS() && (
                    <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                      或点击「保存图片」按钮后选择「添加到照片」
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={generateCard}
            disabled={isGenerating}
            className={cn(
              "flex-1 py-3.5 rounded-xl font-medium transition-all active:scale-95",
              "bg-ink-100 hover:bg-ink-200 dark:bg-ink-700 dark:hover:bg-ink-600",
              "text-ink-700 dark:text-ink-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            重新生成
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              disabled={isGenerating || !imageUrl}
              className={cn(
                "flex-1 py-3.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md",
                "hover:from-primary-600 hover:to-primary-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Share2 size={18} />
              分享
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={isGenerating || !imageUrl || isSaving}
            className={cn(
              "flex-1 py-3.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2",
              "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md",
              "hover:from-emerald-600 hover:to-emerald-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mobile ? (
              <ImagePlus size={18} />
            ) : (
              <Download size={18} />
            )}
            {mobile ? '保存图片' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
