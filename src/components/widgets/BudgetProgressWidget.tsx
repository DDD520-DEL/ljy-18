import { useMemo } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { formatMoney } from '@/utils/money';
import { useNavigate } from 'react-router-dom';
import { Target, AlertTriangle, ChevronRight } from 'lucide-react';

interface BudgetProgressWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function BudgetProgressWidget({ size = 'small' }: BudgetProgressWidgetProps) {
  void size;
  const navigate = useNavigate();
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const currentYear = new Date().getFullYear();
  const progress = useMemo(() => getBudgetProgress(currentYear), [getBudgetProgress, currentYear]);

  if (progress.budget <= 0) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center text-ink-500 dark:text-ink-400 cursor-pointer hover:bg-cream-50 dark:hover:bg-ink-800 rounded-xl transition-colors"
        onClick={() => navigate('/settings')}
      >
        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mb-3">
          <Target size={24} className="text-primary-500" />
        </div>
        <p className="text-sm font-medium">设置年度预算</p>
        <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">设定人情支出上限</p>
        <div className="flex items-center gap-1 mt-3 text-primary-500 text-xs font-medium">
          去设置 <ChevronRight size={14} />
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-red-400 to-red-500';
    if (percentage >= 80) return 'from-amber-400 to-amber-500';
    return 'from-primary-400 to-primary-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-amber-500';
    return 'text-primary-500';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            progress.isOverBudget 
              ? 'bg-red-50 dark:bg-red-900/20' 
              : 'bg-primary-50 dark:bg-primary-900/20'
          }`}>
            <Target size={16} className={progress.isOverBudget ? 'text-red-500' : 'text-primary-500'} />
          </div>
          <span className="text-sm font-medium text-ink-800 dark:text-ink-200">
            {currentYear}年度预算
          </span>
        </div>
        {progress.isOverBudget && (
          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
            <AlertTriangle size={12} />
            已超支
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-ink-500 dark:text-ink-400 text-xs">已使用</span>
            <span className={`font-semibold tabular-nums ${getTextColor(progress.percentage)}`}>
              {formatMoney(progress.used, showCents)}
            </span>
          </div>
          <div className="h-2.5 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor(progress.percentage)}`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-ink-400 dark:text-ink-500">预算总额</p>
            <p className="font-semibold text-ink-800 dark:text-ink-200 tabular-nums mt-0.5">
              {formatMoney(progress.budget, showCents)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-ink-400 dark:text-ink-500">剩余额度</p>
            <p className={`font-semibold tabular-nums mt-0.5 ${
              progress.remaining > 0 ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {formatMoney(progress.remaining, showCents)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-ink-100 dark:border-ink-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500 dark:text-ink-400">本月进度</span>
            <span className={`font-medium tabular-nums ${getTextColor(progress.currentMonthPercentage)}`}>
              {progress.currentMonthPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-cream-200 dark:bg-ink-700 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor(progress.currentMonthPercentage)}`}
              style={{ width: `${Math.min(progress.currentMonthPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/settings')}
        className="mt-auto pt-3 text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center justify-center gap-1 transition-colors"
      >
        调整预算 <ChevronRight size={12} />
      </button>
    </div>
  );
}
