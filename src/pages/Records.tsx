import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import RecordItem from '@/components/RecordItem';
import { Search, Filter, Plus, ArrowUpDown, Trash2, Download, Loader2, Tag, X } from 'lucide-react';
import { EVENT_TYPE_LABELS, DEFAULT_TAGS, TAG_COLORS, type EventType, type Direction } from '@/types';
import { formatMoney } from '@/utils/money';
import { exportRecordsToExcel, formatExportDate, type ExportProgress } from '@/utils/export';

export default function Records() {
  const navigate = useNavigate();
  const records = useGiftStore(state => state.records);
  const deleteRecord = useGiftStore(state => state.deleteRecord);
  
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterDirection, setFilterDirection] = useState<Direction | 'all'>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showFilter, setShowFilter] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>(DEFAULT_TAGS);
    records.forEach(r => {
      (r.tags || []).forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [records]);
  
  const filteredRecords = useMemo(() => {
    let result = [...records];
    
    if (searchText) {
      const text = searchText.toLowerCase();
      result = result.filter(r => 
        r.contactName.toLowerCase().includes(text) ||
        r.eventName.toLowerCase().includes(text) ||
        r.note.toLowerCase().includes(text)
      );
    }
    
    if (filterType !== 'all') {
      result = result.filter(r => r.eventType === filterType);
    }
    
    if (filterDirection !== 'all') {
      result = result.filter(r => r.direction === filterDirection);
    }
    
    if (filterTags.length > 0) {
      result = result.filter(r => {
        const recordTags = r.tags || [];
        return filterTags.every(t => recordTags.includes(t));
      });
    }
    
    switch (sortOrder) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    return result;
  }, [records, searchText, filterType, filterDirection, filterTags, sortOrder]);
  
  const totalExpense = filteredRecords
    .filter(r => r.direction === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = filteredRecords
    .filter(r => r.direction === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const handleDelete = (id: string) => {
    deleteRecord(id);
    setDeleteConfirm(null);
  };
  
  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const clearFilterTags = () => setFilterTags([]);
  
  const handleExport = useCallback(async () => {
    if (exportProgress) return;
    
    try {
      const filename = `礼金记录_${formatExportDate()}.xlsx`;
      await exportRecordsToExcel(filteredRecords, filename, (progress) => {
        setExportProgress(progress);
      });
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setTimeout(() => setExportProgress(null), 500);
    }
  }, [filteredRecords, exportProgress]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-ink-800">
          全部记录
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={!!exportProgress || filteredRecords.length === 0}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-md transition-all active:scale-95"
          >
            {exportProgress ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {exportProgress ? '导出中...' : '导出Excel'}
          </button>
          <button
            onClick={() => navigate('/records/add')}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-md transition-all active:scale-95"
          >
            <Plus size={18} />
            添加
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-ink-400">筛选后支出</p>
          <p className="text-xl font-bold text-primary-500 tabular-nums mt-1">
            {formatMoney(totalExpense)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-ink-400">筛选后收入</p>
          <p className="text-xl font-bold text-emerald-500 tabular-nums mt-1">
            {formatMoney(totalIncome)}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={18} />
          <input
            type="text"
            placeholder="搜索姓名、事由..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={!!exportProgress || filteredRecords.length === 0}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2"
          title="导出Excel"
        >
          {exportProgress ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          <span className="hidden md:inline">{exportProgress ? '导出中...' : '导出'}</span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
            showFilter || filterType !== 'all' || filterDirection !== 'all' || filterTags.length > 0
              ? 'bg-primary-50 border-primary-200 text-primary-600'
              : 'bg-white border-cream-200 text-ink-500'
          }`}
        >
          <Filter size={18} />
          <span className="hidden md:inline">筛选</span>
          {filterTags.length > 0 && (
            <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filterTags.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            const orders: typeof sortOrder[] = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'];
            const idx = orders.indexOf(sortOrder);
            setSortOrder(orders[(idx + 1) % orders.length]);
          }}
          className="px-4 py-2.5 bg-white border border-cream-200 rounded-xl text-ink-500 hover:bg-cream-50 transition-all flex items-center gap-2"
        >
          <ArrowUpDown size={18} />
          <span className="hidden md:inline">排序</span>
        </button>
      </div>
      
      {exportProgress && exportProgress.phase !== 'downloading' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center justify-between text-sm text-emerald-700 mb-2">
            <span>正在导出 {exportProgress.total} 条记录...</span>
            <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {showFilter && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-600 mb-2 block">事由类型</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    filterType === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  全部
                </button>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key as EventType)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      filterType === key
                        ? 'bg-primary-500 text-white'
                        : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-ink-600 mb-2 block">收支方向</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterDirection('all')}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                    filterDirection === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterDirection('expense')}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                    filterDirection === 'expense'
                      ? 'bg-primary-500 text-white'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setFilterDirection('income')}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                    filterDirection === 'income'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                  }`}
                >
                  收入
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink-600 flex items-center gap-1.5">
                  <Tag size={14} />
                  标签筛选
                </label>
                {filterTags.length > 0 && (
                  <button
                    onClick={clearFilterTags}
                    className="text-xs text-ink-400 hover:text-primary-500 flex items-center gap-1"
                  >
                    <X size={12} />
                    清除
                  </button>
                )}
              </div>
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const selected = filterTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFilterTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selected
                            ? TAG_COLORS[tag] || 'bg-primary-500 text-white'
                            : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink-400">暂无可用标签</p>
              )}
              {filterTags.length > 0 && (
                <p className="text-xs text-ink-400 mt-2">已选 {filterTags.length} 个标签（同时满足）</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div key={record.id} className="relative group">
              <RecordItem
                record={record}
                onClick={() => navigate(`/records/${record.id}/edit`)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(record.id);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-ink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-ink-300">
            <p className="text-5xl mb-3">📝</p>
            <p className="text-lg">暂无记录</p>
            <p className="text-sm mt-1">试试调整筛选条件</p>
          </div>
        )}
      </div>
      
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-bounce-soft">
            <h3 className="text-lg font-semibold text-ink-800 mb-2">确认删除</h3>
            <p className="text-ink-500 text-sm mb-6">删除后无法恢复，确定要删除这条记录吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="h-20 md:hidden" />
    </div>
  );
}
