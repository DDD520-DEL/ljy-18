import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS, TAG_COLORS, RECYCLE_BIN_DAYS, type GiftRecord } from '@/types';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { ArrowLeft, RotateCcw, Trash2, X, AlertTriangle, Clock, ArrowUpRight, ArrowDownLeft, ImageIcon } from 'lucide-react';

export default function RecycleBin() {
  const navigate = useNavigate();
  const recycleBinRecords = useGiftStore(state => state.recycleBinRecords);
  const refreshRecycleBin = useGiftStore(state => state.refreshRecycleBin);
  const restoreRecord = useGiftStore(state => state.restoreRecord);
  const permanentlyDeleteRecord = useGiftStore(state => state.permanentlyDeleteRecord);
  const clearAllRecycleBin = useGiftStore(state => state.clearAllRecycleBin);
  const preferences = useGiftStore(state => state.preferences);
  const showCents = preferences.showCents;

  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchText) return recycleBinRecords;
    const text = searchText.toLowerCase();
    return recycleBinRecords.filter(r => 
      r.contactName.toLowerCase().includes(text) ||
      r.eventName.toLowerCase().includes(text) ||
      r.note.toLowerCase().includes(text)
    );
  }, [recycleBinRecords, searchText]);

  const handleRestore = (id: string) => {
    restoreRecord(id);
    setConfirmRestore(null);
  };

  const handlePermanentDelete = (id: string) => {
    permanentlyDeleteRecord(id);
    setConfirmDelete(null);
  };

  const handleClearAll = () => {
    clearAllRecycleBin();
    setConfirmClearAll(false);
  };

  const getDaysRemaining = (deletedAt?: string): number => {
    if (!deletedAt) return 0;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = now.getTime() - deleted.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(0, RECYCLE_BIN_DAYS - Math.floor(diffDays));
  };

  const RecycleBinItem = ({ record }: { record: GiftRecord }) => {
    const isExpense = record.direction === 'expense';
    const tags = record.tags || [];
    const imageUrls = record.imageUrls || [];
    const hasImages = imageUrls.length > 0;
    const daysRemaining = getDaysRemaining(record.deletedAt);
    const isExpiringSoon = daysRemaining <= 7;

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        {record.deletedAt && (
          <div className={`px-4 py-2 flex items-center justify-between text-xs border-b ${
            isExpiringSoon ? 'bg-red-50 border-red-100' : 'bg-cream-50 border-cream-100'
          }`}>
            <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'text-red-600' : 'text-ink-500'}`}>
              <Clock size={12} />
              <span>删除于 {formatDate(record.deletedAt)}</span>
            </div>
            <span className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-ink-400'}`}>
              {daysRemaining > 0 ? `${daysRemaining}天后自动永久删除` : '即将永久删除'}
            </span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start gap-4">
            {hasImages ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-cream-200">
                <img
                  src={imageUrls[0]}
                  alt="凭证"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl opacity-70 ${EVENT_TYPE_COLORS[record.eventType]}`}>
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
                  {tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full opacity-70 ${TAG_COLORS[tag] || 'bg-primary-100 text-primary-600'}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-100 text-ink-500">
                      +{tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-ink-300">
                  记录日期：{formatDate(record.date)}
                </p>
                {hasImages && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-400">
                    <ImageIcon size={10} />
                    {imageUrls.length}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className={`font-bold text-lg tabular-nums flex items-center gap-1 ${isExpense ? 'text-primary-400' : 'text-emerald-400'} opacity-80`}>
                {isExpense ? (
                  <ArrowUpRight size={18} className="text-primary-300" />
                ) : (
                  <ArrowDownLeft size={18} className="text-emerald-300" />
                )}
                {isExpense ? '-' : '+'}{formatMoney(record.amount, showCents).replace('¥', '')}
              </div>
              <p className="text-xs text-ink-400 mt-1">
                {isExpense ? '随出' : '收入'}
              </p>
            </div>
          </div>

          {record.note && (
            <p className="text-xs text-ink-400 mt-3 pt-3 border-t border-cream-100 line-clamp-2">
              备注：{record.note}
            </p>
          )}
        </div>

        <div className="px-4 py-3 bg-cream-50 border-t border-cream-100 flex items-center gap-2">
          <button
            onClick={() => setConfirmRestore(record.id)}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            恢复记录
          </button>
          <button
            onClick={() => setConfirmDelete(record.id)}
            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            永久删除
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-ink-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold text-ink-800">
            回收站
          </h1>
          <p className="text-sm text-ink-400 mt-0.5">
            超过 {RECYCLE_BIN_DAYS} 天的记录将自动永久删除
          </p>
        </div>
      </div>

      {recycleBinRecords.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-ink-400">回收站记录</p>
            <p className="text-xl font-bold text-ink-800 mt-1 tabular-nums">
              {recycleBinRecords.length} 条
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm border border-amber-100">
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle size={12} />
              操作提醒
            </p>
            <p className="text-xs text-amber-700 mt-1">
              可单独恢复或永久删除，也可一键清空
            </p>
          </div>
        </div>
      )}

      {recycleBinRecords.length > 0 && (
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <ArrowLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={18} style={{ visibility: 'hidden' }} />
            <input
              type="text"
              placeholder="搜索姓名、事由..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-white border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <button
            onClick={() => setConfirmClearAll(true)}
            className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-md"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">清空回收站</span>
            <span className="sm:hidden">清空</span>
          </button>
        </div>
      )}

      <div className="space-y-3">
        {recycleBinRecords.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
              <Trash2 size={36} className="text-ink-300" />
            </div>
            <p className="text-lg font-medium text-ink-600">回收站是空的</p>
            <p className="text-sm text-ink-400 mt-2">
              删除的记录会在这里保存 {RECYCLE_BIN_DAYS} 天
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg text-ink-600">没有找到匹配的记录</p>
            <p className="text-sm text-ink-400 mt-1">试试调整搜索关键词</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <RecycleBinItem key={record.id} record={record} />
          ))
        )}
      </div>

      <div className="h-20 md:hidden" />

      {confirmRestore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <RotateCcw size={24} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-800">确认恢复</h3>
                <p className="text-sm text-ink-500">恢复后记录将重新出现在列表中</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmRestore(null)}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-800">永久删除</h3>
                <p className="text-sm text-red-500">此操作不可撤销！</p>
              </div>
            </div>
            <p className="text-sm text-ink-500">
              确定要永久删除这条记录吗？删除后将无法恢复。
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handlePermanentDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                永久删除
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-800">清空回收站</h3>
                <p className="text-sm text-red-500">此操作不可撤销！</p>
              </div>
            </div>
            <p className="text-sm text-ink-500">
              确定要永久删除回收站中的 <span className="font-bold text-red-600">{recycleBinRecords.length}</span> 条记录吗？
              <br />删除后将无法恢复。
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
