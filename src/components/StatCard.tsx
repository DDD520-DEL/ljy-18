import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'red' | 'green' | 'gold' | 'blue';
}

const colorClasses = {
  red: 'from-primary-500 to-primary-600',
  green: 'from-emerald-500 to-emerald-600',
  gold: 'from-gold-500 to-gold-600',
  blue: 'from-blue-500 to-blue-600',
};

const iconBgClasses = {
  red: 'bg-white/20',
  green: 'bg-white/20',
  gold: 'bg-white/20',
  blue: 'bg-white/20',
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  color = 'red' 
}: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-5 text-white shadow-card hover:shadow-card-hover transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-2 tabular-nums">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? 'text-white' : 'text-white/70'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              {trend}
            </p>
          )}
        </div>
        <div className={`${iconBgClasses[color]} w-12 h-12 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
