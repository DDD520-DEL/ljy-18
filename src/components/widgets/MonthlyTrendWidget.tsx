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
  const { isDark } = useTheme();
  const records = useGiftStore(state => state.records);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          showDetailedSummary: false,
          showNetAmount: false,
          fontSize: 10,
          tickInterval: 4,
          showTooltip: true,
          strokeWidth: 1.5,
          margin: { top: 5, right: 5, left: -25, bottom: 0 },
          iconSize: 14 as const,
        };
      case 'medium':
        return {
          showDetailedSummary: true,
          showNetAmount: true,
          fontSize: 10,
          tickInterval: 3,
          showTooltip: true,
          strokeWidth: 2,
          margin: { top: 5, right: 5, left: -20, bottom: 0 },
          iconSize: 16 as const,
        };
      case 'large':
        return {
          showDetailedSummary: true,
          showNetAmount: true,
          fontSize: 11,
          tickInterval: 2,
          showTooltip: true,
          strokeWidth: 2.5,
          margin: { top: 10, right: 10, left: -15, bottom: 5 },
          iconSize: 18 as const,
        };
      default:
        return {
          showDetailedSummary: true,
          showNetAmount: true,
          fontSize: 10,
          tickInterval: 3,
          showTooltip: true,
          strokeWidth: 2,
          margin: { top: 5, right: 5, left: -20, bottom: 0 },
          iconSize: 16 as const,
        };
    }
  }, [size]);

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

    const interval = size === 'small' ? 2 : 1;
    if (interval === 1) {
      return Array.from(dailyMap.entries()).map(([day, data]) => ({
        day: `${day}`,
        支出: data.expense,
        收入: data.income,
        净额: data.income - data.expense,
      }));
    }

    const aggregated: Array<{ day: string; 支出: number; 收入: number; 净额: number }> = [];
    let tempExpense = 0;
    let tempIncome = 0;
    let startDay = 1;

    for (let i = 1; i <= daysInMonth; i++) {
      const data = dailyMap.get(i) || { expense: 0, income: 0 };
      tempExpense += data.expense;
      tempIncome += data.income;

      if (i % interval === 0 || i === daysInMonth) {
        aggregated.push({
          day: startDay === i ? `${startDay}` : `${startDay}-${i}`,
          支出: tempExpense,
          收入: tempIncome,
          净额: tempIncome - tempExpense,
        });
        startDay = i + 1;
        tempExpense = 0;
        tempIncome = 0;
      }
    }
    return aggregated;
  }, [records, size]);

  const monthTotal = useMemo(() => {
    return dailyData.reduce((acc, d) => ({
      expense: acc.expense + d.支出,
      income: acc.income + d.收入,
    }), { expense: 0, income: 0 });
  }, [dailyData]);

  return (
    <div className="h-full flex flex-col">
      <div className={`flex items-center ${sizeConfig.showDetailedSummary ? 'justify-between' : 'justify-start'} mb-2`}>
        <div className={`flex items-center ${size === 'small' ? 'flex-col gap-1 items-start' : 'gap-4'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className={`text-ink-500 dark:text-ink-400 ${size === 'small' ? 'text-[10px]' : 'text-xs'}`}>支出</span>
            <span className={`font-semibold text-ink-800 dark:text-ink-200 tabular-nums ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
              {formatMoney(monthTotal.expense, showCents)}
            </span>
          </div>
          {sizeConfig.showDetailedSummary && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-ink-500 dark:text-ink-400">收入</span>
              <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 tabular-nums">
                {formatMoney(monthTotal.income, showCents)}
              </span>
            </div>
          )}
        </div>
        {sizeConfig.showNetAmount && (
          <div className="flex items-center gap-1">
            {monthTotal.income - monthTotal.expense >= 0 ? (
              <TrendingDown size={sizeConfig.iconSize} className="text-emerald-500" />
            ) : (
              <TrendingUp size={sizeConfig.iconSize} className="text-red-500" />
            )}
            <span className={`font-semibold tabular-nums ${
              size === 'small' ? 'text-xs' : 'text-sm'
            } ${
              monthTotal.income - monthTotal.expense >= 0 ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {formatMoney(Math.abs(monthTotal.income - monthTotal.expense), showCents)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyData} margin={sizeConfig.margin}>
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
              tick={{ fill: isDark ? '#737373' : '#A3A3A3', fontSize: sizeConfig.fontSize }}
              axisLine={{ stroke: isDark ? '#404040' : '#E5E7EB' }}
              tickLine={false}
              interval={Math.floor(dailyData.length / sizeConfig.tickInterval)}
            />
            {size !== 'small' && (
              <YAxis 
                tick={{ fill: isDark ? '#737373' : '#A3A3A3', fontSize: sizeConfig.fontSize }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                width={40}
              />
            )}
            {sizeConfig.showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  border: isDark ? '1px solid #404040' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: size === 'small' ? '11px' : '12px',
                }}
                formatter={(value: number) => [formatMoney(value), '']}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="支出" 
              stroke="#EF4444" 
              strokeWidth={sizeConfig.strokeWidth}
              fill="url(#expenseGradient)" 
              dot={size === 'large'}
              activeDot={{ r: size === 'small' ? 3 : 4, strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="收入" 
              stroke="#10B981" 
              strokeWidth={sizeConfig.strokeWidth}
              fill="url(#incomeGradient)" 
              dot={size === 'large'}
              activeDot={{ r: size === 'small' ? 3 : 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
