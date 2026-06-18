import { useMemo } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useGiftStore } from '@/store/useGiftStore';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/hooks/useTheme';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyTrendWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function MonthlyTrendWidget({ size = 'large' }: MonthlyTrendWidgetProps) {
  void size;
  const { isDark } = useTheme();
  const records = useGiftStore(state => state.records);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const dailyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const dailyMap = new Map<number, { expense: number; income: number }>();
    
    for (let i = 1; i <= daysInMonth; i++) {
      dailyMap.set(i, { expense: 0, income: 0 });
    }
    
    records.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        const day = recordDate.getDate();
        const existing = dailyMap.get(day) || { expense: 0, income: 0 };
        if (record.direction === 'expense') {
          existing.expense += record.amount;
        } else {
          existing.income += record.amount;
        }
        dailyMap.set(day, existing);
      }
    });
    
    return Array.from(dailyMap.entries()).map(([day, data]) => ({
      day: `${day}`,
      支出: data.expense,
      收入: data.income,
      净额: data.income - data.expense,
    }));
  }, [records]);

  const monthTotal = useMemo(() => {
    return dailyData.reduce((acc, d) => ({
      expense: acc.expense + d.支出,
      income: acc.income + d.收入,
    }), { expense: 0, income: 0 });
  }, [dailyData]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-ink-500 dark:text-ink-400">支出</span>
            <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 tabular-nums">
              {formatMoney(monthTotal.expense, showCents)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-ink-500 dark:text-ink-400">收入</span>
            <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 tabular-nums">
              {formatMoney(monthTotal.income, showCents)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {monthTotal.income - monthTotal.expense >= 0 ? (
            <TrendingDown size={16} className="text-emerald-500" />
          ) : (
            <TrendingUp size={16} className="text-red-500" />
          )}
          <span className={`text-sm font-semibold tabular-nums ${
            monthTotal.income - monthTotal.expense >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {formatMoney(Math.abs(monthTotal.income - monthTotal.expense), showCents)}
          </span>
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              tick={{ fill: isDark ? '#737373' : '#A3A3A3', fontSize: 10 }}
              axisLine={{ stroke: isDark ? '#404040' : '#E5E7EB' }}
              tickLine={false}
              interval={Math.floor(dailyData.length / 7)}
            />
            <YAxis 
              tick={{ fill: isDark ? '#737373' : '#A3A3A3', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f1f1f' : '#fff',
                border: isDark ? '1px solid #404040' : '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatMoney(value), '']}
            />
            <Area 
              type="monotone" 
              dataKey="支出" 
              stroke="#EF4444" 
              strokeWidth={2}
              fill="url(#expenseGradient)" 
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="收入" 
              stroke="#10B981" 
              strokeWidth={2}
              fill="url(#incomeGradient)" 
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
