import type { BudgetProgress } from '@/types';
import { formatMoney } from '@/utils/money';
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BudgetProgressCardProps {
  progress: BudgetProgress;
  compact?: boolean;
}

export default function BudgetProgressCard({ progress, compact = false }: BudgetProgressCardProps) {
  const navigate = useNavigate();
  
  if (progress.budget <= 0) {
    if (compact) return null;
    return (
      <div 
        className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/settings')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
            <Target size={20} className="text-ink-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-700">设置年度预算</p>
            <p className="text-xs text-ink-400">点击前往设置页面</p>
          </div>
        </div>
      </div>
    );
  }
  
  const getProgressColor = () => {
    if (progress.percentage >= 100) return 'from-red-400 to-red-500';
    if (progress.percentage >= 80) return 'from-gold-400 to-gold-500';
    return 'from-primary-400 to-primary-500';
  };
  
  const getTextColor = () => {
    if (progress.percentage >= 100) return 'text-red-500';
    if (progress.percentage >= 80) return 'text-gold-500';
    return 'text-primary-500';
  };
  
  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-400">预算使用</span>
          <span className={`font-medium ${getTextColor()}`}>
            {progress.percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="card p-5 cursor-pointer hover:shadow-card-hover transition-shadow"
      onClick={() => navigate('/settings')}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink-800 flex items-center gap-2">
          <span className="text-lg">🎯</span>
          {progress.year}年预算
        </h3>
        {progress.isOverBudget ? (
          <span className="flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">
            <AlertTriangle size={14} />
            已超支
          </span>
        ) : progress.percentage >= 80 ? (
          <span className="flex items-center gap-1 text-xs text-gold-600 bg-gold-50 px-2 py-1 rounded-lg">
            <AlertTriangle size={14} />
            接近上限
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <CheckCircle2 size={14} />
            状态正常
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-ink-400 mb-1">年度预算</p>
          <p className="text-lg font-bold text-ink-800 tabular-nums">{formatMoney(progress.budget)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 mb-1">已使用</p>
          <p className={`text-lg font-bold tabular-nums ${getTextColor()}`}>{formatMoney(progress.used)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 mb-1">剩余额度</p>
          <p className={`text-lg font-bold tabular-nums ${progress.remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatMoney(progress.remaining)}
          </p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-500">使用进度</span>
          <span className={`font-medium ${getTextColor()}`}>
            {progress.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
      </div>
      
      {progress.monthlyBudget > 0 && (
        <div className="mt-4 pt-4 border-t border-cream-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-ink-500">本月使用</span>
            <span className="text-ink-600 tabular-nums">
              {formatMoney(progress.currentMonthUsed)} / {formatMoney(progress.monthlyBudget)}
            </span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress.currentMonthPercentage >= 100
                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                  : progress.currentMonthPercentage >= 80
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
              style={{ width: `${Math.min(progress.currentMonthPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
