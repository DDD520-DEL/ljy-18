import { useState, useMemo, useCallback } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Calendar, Download, Loader2, Target, AlertTriangle, Network, BarChart3 } from 'lucide-react';
import { formatMoney, formatMoneyWithSign } from '@/utils/money';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, TAG_CHART_COLORS, type EventType } from '@/types';
import { exportStatisticsToExcel, formatExportDate, type ExportProgress } from '@/utils/export';
import { useNavigate } from 'react-router-dom';
import RelationNetworkGraph from '@/components/RelationNetworkGraph';
import { useTheme } from '@/hooks/useTheme';

const CHART_COLORS = {
  expense: '#C41E3A',
  income: '#10B981',
};

const TYPE_COLORS: Record<EventType, string> = {
  wedding: '#C41E3A',
  funeral: '#6B7280',
  birthday: '#EC4899',
  baby: '#F59E0B',
  housewarming: '#10B981',
  promotion: '#3B82F6',
  other: '#8B5CF6',
};

const TAG_FALLBACK_COLORS = [
  '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#06B6D4', '#EC4899', '#6B7280', '#14B8A6', '#F97316',
];

const UNTAGGED_COLOR = '#9CA3AF';

type TabType = 'overview' | 'network';
type NetworkRange = 'all' | 'yearly';

export default function Statistics() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const records = useGiftStore(state => state.records);
  const showCents = useGiftStore(state => state.preferences.showCents);
  const getAvailableYears = useGiftStore(state => state.getAvailableYears);
  const getYearlyStats = useGiftStore(state => state.getYearlyStats);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const getYearlyRelationNetworkData = useGiftStore(state => state.getYearlyRelationNetworkData);
  const getAllTimeRelationNetworkData = useGiftStore(state => state.getAllTimeRelationNetworkData);
  
  const availableYears = getAvailableYears();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear)
  );
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [networkRange, setNetworkRange] = useState<NetworkRange>('all');
  
  const stats = getYearlyStats(selectedYear);
  const budgetProgress = getBudgetProgress(selectedYear);
  const networkData = useMemo(() => {
    if (networkRange === 'yearly') {
      return getYearlyRelationNetworkData(selectedYear);
    }
    return getAllTimeRelationNetworkData();
  }, [networkRange, selectedYear, getYearlyRelationNetworkData, getAllTimeRelationNetworkData]);
  
  const yearRecords = useMemo(() => {
    return records.filter(r => {
      const recordYear = new Date(r.date).getFullYear();
      return recordYear === selectedYear;
    });
  }, [records, selectedYear]);
  
  const currentYearIndex = availableYears.indexOf(selectedYear);
  
  const goToPrevYear = () => {
    if (currentYearIndex < availableYears.length - 1) {
      setSelectedYear(availableYears[currentYearIndex + 1]);
    }
  };
  
  const goToNextYear = () => {
    if (currentYearIndex > 0) {
      setSelectedYear(availableYears[currentYearIndex - 1]);
    }
  };
  
  const handleExport = useCallback(async () => {
    if (exportProgress) return;
    
    try {
      const filename = `${selectedYear}年度统计_${formatExportDate()}.xlsx`;
      await exportStatisticsToExcel(yearRecords, stats, filename, (progress) => {
        setExportProgress(progress);
      });
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setTimeout(() => setExportProgress(null), 500);
    }
  }, [yearRecords, stats, selectedYear, exportProgress]);
  
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    支出: stats.monthlyExpense[i],
    收入: stats.monthlyIncome[i],
  }));
  
  const typeData = (Object.keys(EVENT_TYPE_LABELS) as EventType[])
    .map(type => ({
      name: EVENT_TYPE_LABELS[type],
      icon: EVENT_TYPE_ICONS[type],
      value: stats.expenseByType[type],
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
  
  const totalExpenseByType = typeData.reduce((sum, item) => sum + item.value, 0);
  
  const tagData = useMemo(() => {
    const expenseRecords = yearRecords.filter(r => r.direction === 'expense');
    const tagMap = new Map<string, number>();
    let untaggedTotal = 0;
    
    expenseRecords.forEach(record => {
      const tags = record.tags || [];
      if (tags.length === 0) {
        untaggedTotal += record.amount;
      } else {
        tags.forEach(tag => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + record.amount);
        });
      }
    });
    
    const items = Array.from(tagMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    if (untaggedTotal > 0) {
      items.push({ name: '未标记', value: untaggedTotal });
    }
    
    return items;
  }, [yearRecords]);
  
  const totalExpenseByTag = tagData.reduce((sum, item) => sum + item.value, 0);
  
  const getTagChartColor = (tag: string, index: number) => {
    if (tag === '未标记') return UNTAGGED_COLOR;
    return TAG_CHART_COLORS[tag] || TAG_FALLBACK_COLORS[index % TAG_FALLBACK_COLORS.length];
  };
  
  const renderOverviewTab = () => (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-ink-800 dark:text-ink-200">
          年度统计
        </h1>
        <button
          onClick={handleExport}
          disabled={!!exportProgress || yearRecords.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-md transition-all active:scale-95"
        >
          {exportProgress ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          <span className="hidden md:inline">{exportProgress ? '导出中...' : '导出Excel'}</span>
          <span className="md:hidden">导出</span>
        </button>
      </div>
      
      {exportProgress && exportProgress.phase !== 'downloading' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400 mb-2">
            <span>正在导出 {exportProgress.total} 条记录...</span>
            <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={goToPrevYear}
          disabled={currentYearIndex >= availableYears.length - 1}
          className="p-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} className="text-ink-600 dark:text-ink-400" />
        </button>
        
        <div className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700">
          <Calendar size={20} className="text-primary-500" />
          <span className="text-xl font-bold text-ink-800 dark:text-ink-200">{selectedYear}年</span>
        </div>
        
        <button
          onClick={goToNextYear}
          disabled={currentYearIndex <= 0}
          className="p-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} className="text-ink-600 dark:text-ink-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-card">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-white/80 text-sm">年度支出</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{formatMoney(stats.totalExpense, showCents)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-card">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <TrendingDown size={20} />
          </div>
          <p className="text-white/80 text-sm">年度收入</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{formatMoney(stats.totalIncome)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl p-4 text-white shadow-card">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Wallet size={20} />
          </div>
          <p className="text-white/80 text-sm">年度结余</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {formatMoneyWithSign(stats.balance)}
          </p>
        </div>
      </div>
      
      {budgetProgress.budget > 0 ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <Target size={20} className="text-primary-500" />
              预算使用情况
            </h3>
            {budgetProgress.isOverBudget ? (
              <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                <AlertTriangle size={14} />
                已超支 {formatMoney(budgetProgress.used - budgetProgress.budget, showCents)}
              </span>
            ) : (
              <button
                onClick={() => navigate('/settings')}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
              >
                调整预算
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">年度预算</p>
              <p className="text-xl font-bold text-ink-800 dark:text-ink-200 tabular-nums">{formatMoney(budgetProgress.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">已使用</p>
              <p className={`text-xl font-bold tabular-nums ${
                budgetProgress.percentage >= 100 ? 'text-red-500' : 
                budgetProgress.percentage >= 80 ? 'text-gold-500' : 'text-primary-500'
              }`}>
                {formatMoney(budgetProgress.used)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400 dark:text-ink-500 mb-1">剩余额度</p>
              <p className={`text-xl font-bold tabular-nums ${budgetProgress.remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatMoney(budgetProgress.remaining)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ink-500 dark:text-ink-400">年度进度</span>
                <span className={`font-medium ${
                  budgetProgress.percentage >= 100 ? 'text-red-500' : 'text-ink-700 dark:text-ink-300'
                }`}>
                  {budgetProgress.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetProgress.percentage >= 100
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : budgetProgress.percentage >= 80
                      ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.percentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ink-500 dark:text-ink-400">本月进度</span>
                <span className={`font-medium ${
                  budgetProgress.currentMonthPercentage >= 100 ? 'text-red-500' : 'text-ink-700 dark:text-ink-300'
                }`}>
                  {budgetProgress.currentMonthPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetProgress.currentMonthPercentage >= 100
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : budgetProgress.currentMonthPercentage >= 80
                      ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                      : 'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.currentMonthPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-400 dark:text-ink-500 mt-1">
                <span>已用 {formatMoney(budgetProgress.currentMonthUsed)}</span>
                <span>月均预算 {formatMoney(budgetProgress.monthlyBudget)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/settings')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
              <Target size={24} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink-800 dark:text-ink-200">设置年度预算</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">设定人情支出上限，追踪使用进度</p>
            </div>
            <ChevronRight size={20} className="text-ink-300 dark:text-ink-600" />
          </div>
        </div>
      )}
      
      <div className="card p-5">
        <h3 className="font-semibold text-ink-800 dark:text-ink-200 mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span>
          月度收支趋势
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2C2C2C' : '#F5E9D5'} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: isDark ? '#A3A3A3' : '#737373', fontSize: 12 }}
                axisLine={{ stroke: isDark ? '#404040' : '#E8D5B7' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: isDark ? '#A3A3A3' : '#737373', fontSize: 12 }}
                axisLine={{ stroke: isDark ? '#404040' : '#E8D5B7' }}
                tickLine={false}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  border: isDark ? '1px solid #404040' : '1px solid #E8D5B7',
                  borderRadius: '12px',
                  boxShadow: isDark 
                    ? '0 4px 20px -2px rgba(0, 0, 0, 0.5)' 
                    : '0 4px 20px -2px rgba(196, 30, 58, 0.1)',
                  color: isDark ? '#E5E5E5' : '#2C2C2C',
                }}
                formatter={(value: number) => [formatMoney(value), '']}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px', color: isDark ? '#A3A3A3' : '#737373' }}
              />
              <Bar dataKey="支出" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
              <Bar dataKey="收入" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 dark:text-ink-200 mb-4 flex items-center gap-2">
            <span className="text-lg">🥧</span>
            支出分类
          </h3>
          {typeData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TYPE_COLORS[Object.keys(EVENT_TYPE_LABELS)[Object.values(EVENT_TYPE_LABELS).indexOf(entry.name)] as EventType] || '#9CA3AF'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f1f1f' : '#fff',
                        border: isDark ? '1px solid #404040' : '1px solid #E8D5B7',
                        borderRadius: '12px',
                        boxShadow: isDark 
                          ? '0 4px 20px -2px rgba(0, 0, 0, 0.5)' 
                          : '0 4px 20px -2px rgba(196, 30, 58, 0.1)',
                        color: isDark ? '#E5E5E5' : '#2C2C2C',
                      }}
                      formatter={(value: number) => [formatMoney(value), '金额']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {typeData.map((item, index) => {
                  const type = Object.entries(EVENT_TYPE_LABELS).find(([, label]) => label === item.name)?.[0] as EventType;
                  const percent = totalExpenseByType > 0 ? ((item.value / totalExpenseByType) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[type] || '#9CA3AF' }}
                      />
                      <span className="text-sm text-ink-600 dark:text-ink-400 flex-1">
                        {item.icon} {item.name}
                      </span>
                      <span className="text-sm font-medium text-ink-800 dark:text-ink-200 tabular-nums">
                        {formatMoney(item.value)}
                      </span>
                      <span className="text-xs text-ink-400 dark:text-ink-500 w-12 text-right">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-ink-300 dark:text-ink-600">
              <p className="text-4xl mb-2">📊</p>
              <p>暂无支出数据</p>
            </div>
          )}
        </div>
        
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 dark:text-ink-200 mb-4 flex items-center gap-2">
            <span className="text-lg">🏷️</span>
            标签支出分布
          </h3>
          {tagData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tagData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tagData.map((entry, index) => (
                        <Cell 
                          key={`tag-cell-${index}`} 
                          fill={getTagChartColor(entry.name, index)} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f1f1f' : '#fff',
                        border: isDark ? '1px solid #404040' : '1px solid #E8D5B7',
                        borderRadius: '12px',
                        boxShadow: isDark 
                          ? '0 4px 20px -2px rgba(0, 0, 0, 0.5)' 
                          : '0 4px 20px -2px rgba(196, 30, 58, 0.1)',
                        color: isDark ? '#E5E5E5' : '#2C2C2C',
                      }}
                      formatter={(value: number) => [formatMoney(value), '金额']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {tagData.map((item, index) => {
                  const percent = totalExpenseByTag > 0 ? ((item.value / totalExpenseByTag) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getTagChartColor(item.name, index) }}
                      />
                      <span className="text-sm text-ink-600 dark:text-ink-400 flex-1">
                        {item.name === '未标记' ? '⚪ 未标记' : <span className="px-1.5 py-0.5 rounded-full text-[10px] mr-1" style={{ backgroundColor: getTagChartColor(item.name, index) + '22', color: getTagChartColor(item.name, index) }}>{item.name}</span>}
                      </span>
                      <span className="text-sm font-medium text-ink-800 dark:text-ink-200 tabular-nums">
                        {formatMoney(item.value)}
                      </span>
                      <span className="text-xs text-ink-400 dark:text-ink-500 w-12 text-right">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-400 dark:text-ink-500 mt-3">
                提示：一笔记录含多个标签时，金额会分别计入各标签维度。
              </p>
            </>
          ) : (
            <div className="text-center py-12 text-ink-300 dark:text-ink-600">
              <p className="text-4xl mb-2">🏷️</p>
              <p>暂无支出数据</p>
            </div>
          )}
        </div>
        
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold text-ink-800 dark:text-ink-200 mb-4 flex items-center gap-2">
            <span className="text-lg">📈</span>
            年度概览
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-cream-50 dark:bg-ink-900 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400">记录总数</span>
                <span className="text-xl font-bold text-ink-800 dark:text-ink-200">{stats.recordCount} 笔</span>
              </div>
            </div>
            
            <div className="p-4 bg-cream-50 dark:bg-ink-900 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-500 dark:text-ink-400">平均每笔支出</span>
                <span className="font-bold text-primary-500 tabular-nums">
                  {stats.recordCount > 0 
                    ? formatMoney(Math.round(stats.totalExpense / stats.recordCount * 100) / 100, showCents)
                    : '¥0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500 dark:text-ink-400">平均每笔收入</span>
                <span className="font-bold text-emerald-500 tabular-nums">
                  {stats.recordCount > 0 
                    ? formatMoney(Math.round(stats.totalIncome / stats.recordCount * 100) / 100)
                    : '¥0'
                  }
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent rounded-xl">
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-2">年度收支比</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"
                      style={{ 
                        width: `${stats.totalIncome > 0 
                          ? Math.min((stats.totalExpense / (stats.totalExpense + stats.totalIncome)) * 100, 100)
                          : 50}%` 
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-ink-600 dark:text-ink-400 whitespace-nowrap">
                  支出 / 收入
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderNetworkTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-ink-800 dark:text-ink-200 flex items-center gap-2">
          <Network className="text-primary-500" size={28} />
          人情关系网络
        </h1>
        <div className="flex items-center gap-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none p-1 border border-ink-100 dark:border-ink-700">
          <button
            onClick={() => setNetworkRange('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              networkRange === 'all'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            全部记录
          </button>
          <button
            onClick={() => setNetworkRange('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              networkRange === 'yearly'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            {selectedYear}年度
          </button>
        </div>
      </div>

      {networkRange === 'yearly' && availableYears.length > 1 && (
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={goToPrevYear}
            disabled={currentYearIndex >= availableYears.length - 1}
            className="p-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} className="text-ink-600 dark:text-ink-400" />
          </button>
          
          <div className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700">
            <Calendar size={20} className="text-primary-500" />
            <span className="text-xl font-bold text-ink-800 dark:text-ink-200">{selectedYear}年</span>
          </div>
          
          <button
            onClick={goToNextYear}
            disabled={currentYearIndex <= 0}
            className="p-2 bg-white dark:bg-ink-800 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-ink-700 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} className="text-ink-600 dark:text-ink-400" />
          </button>
        </div>
      )}

      <div style={{ height: 'calc(100vh - 280px)', minHeight: 520 }}>
        <RelationNetworkGraph data={networkData} />
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview' as TabType, label: '年度统计', icon: BarChart3 },
    { id: 'network' as TabType, label: '关系网络', icon: Network },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-sm dark:shadow-none border border-ink-100 dark:border-ink-700 p-1.5 inline-flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                : 'text-ink-600 dark:text-ink-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-cream-50 dark:hover:bg-ink-700'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? renderOverviewTab() : renderNetworkTab()}
      
      <div className="h-20 md:hidden" />
    </div>
  );
}
