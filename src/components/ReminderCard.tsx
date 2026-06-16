import type { ReturnGiftReminder } from '@/types';
import { Gift, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

interface ReminderCardProps {
  reminder: ReturnGiftReminder;
  onClick?: () => void;
}

const typeConfig = {
  overdue: {
    icon: AlertTriangle,
    label: '已超期',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    textColor: 'text-red-700',
  },
  upcoming: {
    icon: Clock,
    label: '即将到期',
    bgColor: 'bg-gold-50',
    borderColor: 'border-gold-200',
    iconBg: 'bg-gold-100',
    iconColor: 'text-gold-500',
    textColor: 'text-gold-700',
  },
  unbalanced: {
    icon: TrendingUp,
    label: '金额不对等',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-700',
  },
};

const urgencyDot = {
  high: 'bg-red-500 animate-pulse',
  medium: 'bg-gold-500',
  low: 'bg-ink-300',
};

export default function ReminderCard({ reminder, onClick }: ReminderCardProps) {
  const config = typeConfig[reminder.type];
  const Icon = config.icon;

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary-400 to-primary-600',
      'from-gold-400 to-gold-600',
      'from-emerald-400 to-emerald-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      onClick={onClick}
      className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarColor(reminder.contactName)} flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}>
          {reminder.contactName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-ink-800">{reminder.contactName}</span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.iconBg} ${config.textColor}`}>
              <Icon size={12} />
              {config.label}
            </span>
            <span className={`w-2 h-2 rounded-full ${urgencyDot[reminder.urgency]}`} />
          </div>

          <p className="text-sm text-ink-600 mt-1.5 line-clamp-2">
            {reminder.message}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1 text-ink-500">
              <Gift size={14} className={config.iconColor} />
              <span>上次随礼: {formatMoney(reminder.lastIncomeAmount)}</span>
            </div>
            <div className="flex items-center gap-1 text-ink-500">
              <span className={config.iconColor}>💰</span>
              <span>建议回礼: <span className={`font-medium ${config.textColor}`}>{formatMoney(reminder.suggestedAmount)}</span></span>
            </div>
          </div>

          <div className="text-xs text-ink-400 mt-2">
            {formatDate(reminder.lastIncomeDate)}
          </div>
        </div>

        <ArrowRight size={20} className="text-ink-300 flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
