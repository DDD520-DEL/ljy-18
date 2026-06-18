import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useGiftStore } from '@/store/useGiftStore';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/hooks/useTheme';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, type EventType, type Direction } from '@/types';

interface CategoryPieWidgetProps {
  direction: Direction;
  size?: 'small' | 'medium' | 'large';
}

const TYPE_COLORS: Record<EventType, string> = {
  wedding: '#C41E3A',
  funeral: '#6B7280',
  birthday: '#EC4899',
  baby: '#F59E0B',
  housewarming: '#10B981',
  promotion: '#3B82F6',
  other: '#8B5CF6',
};

export default function CategoryPieWidget({ direction, size = 'small' }: CategoryPieWidgetProps) {
  const { isDark } = useTheme();
  const getCurrentYearStats = useGiftStore(state => state.getCurrentYearStats);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const stats = getCurrentYearStats();
  
  const chartData = useMemo(() => {
    const data = (Object.keys(EVENT_TYPE_LABELS) as EventType[])
      .map(type => ({
        type,
        name: EVENT_TYPE_LABELS[type],
        icon: EVENT_TYPE_ICONS[type],
        value: direction === 'expense' 
          ? stats.expenseByType[type] 
          : stats.incomeByType[type],
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [stats, direction]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const chartSize = size === 'large' ? 200 : size === 'medium' ? 160 : 120;
  const outerRadius = chartSize / 2 - (size === 'small' ? 5 : 10);
  const innerRadius = outerRadius * (size === 'small' ? 0.6 : 0.55);

  const legendCount = size === 'large' ? 7 : size === 'medium' ? 5 : 3;
  const displayItems = chartData.slice(0, legendCount);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-ink-300 dark:text-ink-600">
        <p className="text-3xl mb-2">{direction === 'expense' ? '🥧' : '💰'}</p>
        <p className="text-sm">暂无{direction === 'expense' ? '支出' : '收入'}数据</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: chartSize, height: chartSize }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={TYPE_COLORS[entry.type]} 
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  border: isDark ? '1px solid #404040' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatMoney(value, showCents), '金额']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${size === 'small' ? 'text-[10px]' : 'text-xs'} text-ink-400 dark:text-ink-500`}>
              {direction === 'expense' ? '总支出' : '总收入'}
            </span>
            <span className={`${
              size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'
            } font-bold text-ink-800 dark:text-ink-200 tabular-nums`}>
              {formatMoney(total, showCents)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          {displayItems.map((item) => {
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.type} className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[item.type] }}
                />
                <span className="text-xs text-ink-600 dark:text-ink-400 flex-1 truncate">
                  {item.icon} {item.name}
                </span>
                <span className="text-xs font-medium text-ink-700 dark:text-ink-300 tabular-nums flex-shrink-0">
                  {percent}%
                </span>
              </div>
            );
          })}
          {chartData.length > displayItems.length && (
            <div className="text-xs text-ink-400 dark:text-ink-500 pl-4.5">
              +{chartData.length - displayItems.length} 个类别
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
