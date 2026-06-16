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
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Calendar, Download, Loader2, Target, AlertTriangle } from 'lucide-react';
import { formatMoney, formatMoneyWithSign } from '@/utils/money';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, type EventType } from '@/types';
import { exportStatisticsToExcel, formatExportDate, type ExportProgress } from '@/utils/export';
import BudgetProgressCard from '@/components/BudgetProgressCard';
import { useNavigate } from 'react-router-dom';

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

export default function Statistics() {
  const navigate = useNavigate();
  const records = useGiftStore(state => state.records);
  const getAvailableYears = useGiftStore(state => state.getAvailableYears);
  const getYearlyStats = useGiftStore(state => state.getYearlyStats);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  
  const availableYears = getAvailableYears();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear)
  );
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  
  const stats = getYearlyStats(selectedYear);
  const budgetProgress = getBudgetProgress(selectedYear);
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-ink-800">
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
      
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={goToPrevYear}
          disabled={currentYearIndex >= availableYears.length - 1}
          className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} className="text-ink-600" />
        </button>
        
        <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-xl shadow-sm">
          <Calendar size={20} className="text-primary-500" />
          <span className="text-xl font-bold text-ink-800">{selectedYear}年</span>
        </div>
        
        <button
          onClick={goToNextYear}
          disabled={currentYearIndex <= 0}
          className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} className="text-ink-600" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-card">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-white/80 text-sm">年度支出</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{formatMoney(stats.totalExpense)}</p>
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
            <h3 className="font-semibold text-ink-800 flex items-center gap-2">
              <Target size={20} className="text-primary-500" />
              预算使用情况
            </h3>
            {budgetProgress.isOverBudget ? (
              <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                <AlertTriangle size={14} />
                已超支 {formatMoney(budgetProgress.used - budgetProgress.budget)}
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
              <p className="text-xs text-ink-400 mb-1">年度预算</p>
              <p className="text-xl font-bold text-ink-800 tabular-nums">{formatMoney(budgetProgress.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 mb-1">已使用</p>
              <p className={`text-xl font-bold tabular-nums ${
                budgetProgress.percentage >= 100 ? 'text-red-500' : 
                budgetProgress.percentage >= 80 ? 'text-gold-500' : 'text-primary-500'
              }`}>
                {formatMoney(budgetProgress.used)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400 mb-1">剩余额度</p>
              <p className={`text-xl font-bold tabular-nums ${budgetProgress.remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatMoney(budgetProgress.remaining)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ink-500">年度进度</span>
                <span className={`font-medium ${
                  budgetProgress.percentage >= 100 ? 'text-red-500' : 'text-ink-700'
                }`}>
                  {budgetProgress.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
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
                <span className="text-ink-500">本月进度</span>
                <span className={`font-medium ${
                  budgetProgress.currentMonthPercentage >= 100 ? 'text-red-500' : 'text-ink-700'
                }`}>
                  {budgetProgress.currentMonthPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
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
              <div className="flex justify-between text-xs text-ink-400 mt-1">
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
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Target size={24} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink-800">设置年度预算</p>
              <p className="text-sm text-ink-400">设定人情支出上限，追踪使用进度</p>
            </div>
            <ChevronRight size={20} className="text-ink-300" />
          </div>
        </div>
      )}
      
      <div className="card p-5">
        <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span>
          月度收支趋势
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E9D5" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={{ stroke: '#E8D5B7' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={{ stroke: '#E8D5B7' }}
                tickLine={false}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E8D5B7',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px -2px rgba(196, 30, 58, 0.1)',
                }}
                formatter={(value: number) => [formatMoney(value), '']}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Bar dataKey="支出" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
              <Bar dataKey="收入" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
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
                        backgroundColor: '#fff',
                        border: '1px solid #E8D5B7',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px -2px rgba(196, 30, 58, 0.1)',
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
                      <span className="text-sm text-ink-600 flex-1">
                        {item.icon} {item.name}
                      </span>
                      <span className="text-sm font-medium text-ink-800 tabular-nums">
                        {formatMoney(item.value)}
                      </span>
                      <span className="text-xs text-ink-400 w-12 text-right">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-ink-300">
              <p className="text-4xl mb-2">📊</p>
              <p>暂无支出数据</p>
            </div>
          )}
        </div>
        
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <span className="text-lg">📈</span>
            年度概览
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-cream-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">记录总数</span>
                <span className="text-xl font-bold text-ink-800">{stats.recordCount} 笔</span>
              </div>
            </div>
            
            <div className="p-4 bg-cream-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-500">平均每笔支出</span>
                <span className="font-bold text-primary-500 tabular-nums">
                  {stats.recordCount > 0 
                    ? formatMoney(Math.round(stats.totalExpense / stats.recordCount * 100) / 100)
                    : '¥0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">平均每笔收入</span>
                <span className="font-bold text-emerald-500 tabular-nums">
                  {stats.recordCount > 0 
                    ? formatMoney(Math.round(stats.totalIncome / stats.recordCount * 100) / 100)
                    : '¥0'
                  }
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-primary-50 to-transparent rounded-xl">
              <p className="text-sm text-ink-500 mb-2">年度收支比</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
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
                <span className="text-sm font-medium text-ink-600 whitespace-nowrap">
                  支出 / 收入
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-20 md:hidden" />
    </div>
  );
}
