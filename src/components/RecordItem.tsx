import type { GiftRecord } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS, TAG_COLORS } from '@/types';
import { formatDateShort, getRelativeDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { ArrowUpRight, ArrowDownLeft, ImageIcon } from 'lucide-react';

interface RecordItemProps {
  record: GiftRecord;
  onClick?: () => void;
  showDate?: boolean;
  onImageClick?: (urls: string[], index: number) => void;
}

export default function RecordItem({ record, onClick, showDate = true, onImageClick }: RecordItemProps) {
  const isExpense = record.direction === 'expense';
  const tags = record.tags || [];
  const imageUrls = record.imageUrls || [];
  const hasImages = imageUrls.length > 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${onClick ? 'active:scale-[0.98]' : ''}`}
    >
      {hasImages ? (
        <div
          className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-cream-200"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick?.(imageUrls, 0);
          }}
        >
          <img
            src={imageUrls[0]}
            alt="凭证"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${EVENT_TYPE_COLORS[record.eventType]}`}>
          {EVENT_TYPE_ICONS[record.eventType]}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-800 truncate">{record.contactName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[record.eventType]}`}>
            {EVENT_TYPE_LABELS[record.eventType]}
          </span>
        </div>
        <p className="text-sm text-ink-400 mt-0.5 truncate">{record.eventName}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] || 'bg-primary-100 text-primary-600'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          {showDate && (
            <p className="text-xs text-ink-300">
              {formatDateShort(record.date)} · {getRelativeDate(record.date)}
            </p>
          )}
          {hasImages && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-400">
              <ImageIcon size={10} />
              {imageUrls.length}
            </span>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={`font-bold text-lg tabular-nums flex items-center gap-1 ${isExpense ? 'text-primary-500' : 'text-emerald-500'}`}>
          {isExpense ? (
            <ArrowUpRight size={18} className="text-primary-400" />
          ) : (
            <ArrowDownLeft size={18} className="text-emerald-400" />
          )}
          {isExpense ? '-' : '+'}{formatMoney(record.amount).replace('¥', '')}
        </div>
        <p className="text-xs text-ink-400 mt-1">
          {isExpense ? '随出' : '收入'}
        </p>
      </div>
    </div>
  );
}
