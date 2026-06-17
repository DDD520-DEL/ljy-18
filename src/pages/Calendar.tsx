import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, type GiftRecord, type Direction } from '@/types';
import { formatMoney } from '@/utils/money';
import { formatDateShort, getTodayStr } from '@/utils/date';

interface DayInfo {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  records: GiftRecord[];
}

export default function Calendar() {
  const navigate = useNavigate();
  const records = useGiftStore(state => state.records);
  const showCents = useGiftStore(state => state.preferences.showCents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = getTodayStr();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const recordsByDate = useMemo((): Map<string, GiftRecord[]> => {
    const map = new Map<string, GiftRecord[]>();
    for (const record of records) {
      const list = map.get(record.date);
      if (list) {
        list.push(record);
      } else {
        map.set(record.date, [record]);
      }
    }
    return map;
  }, [records]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const calendarDays = useMemo((): DayInfo[] => {
    const days: DayInfo[] = [];
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    const remainingDays = 42 - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: recordsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfMonth, recordsByDate, todayStr]);

  const monthStats = useMemo(() => {
    const monthRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth;
    });

    const expense = monthRecords.filter(r => r.direction === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = monthRecords.filter(r => r.direction === 'income').reduce((sum, r) => sum + r.amount, 0);

    return { expense, income, count: monthRecords.length };
  }, [records, currentYear, currentMonth]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return null;
    return records.filter(r => r.date === selectedDate).sort((a, b) => {
      if (a.direction === 'expense' && b.direction === 'income') return -1;
      if (a.direction === 'income' && b.direction === 'expense') return 1;
      return b.amount - a.amount;
    });
  }, [selectedDate, records]);

  const selectedDayStats = useMemo(() => {
    if (!selectedDayRecords) return null;
    const expense = selectedDayRecords.filter(r => r.direction === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = selectedDayRecords.filter(r => r.direction === 'income').reduce((sum, r) => sum + r.amount, 0);
    return { expense, income };
  }, [selectedDayRecords]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDotColor = (direction: Direction) => {
    return direction === 'expense' ? 'bg-primary-500' : 'bg-emerald-500';
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink-800 flex items-center gap-2">
            <CalendarIcon className="text-primary-500" size={28} />
            往来日历
          </h1>
          <p className="text-ink-400 mt-1 text-sm">
            按月查看每日人情往来记录
          </p>
        </div>
        <button
          onClick={() => navigate('/records/add')}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl hover:shadow-primary-500/30 active:scale-95"
        >
          <Plus size={20} />
          添加记录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-ink-400">本月支出</p>
          <p className="text-2xl font-bold text-primary-500 tabular-nums mt-1">
            {formatMoney(monthStats.expense)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-ink-400">本月收入</p>
          <p className="text-2xl font-bold text-emerald-500 tabular-nums mt-1">
            {formatMoney(monthStats.income, showCents)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-ink-400">本月记录</p>
          <p className="text-2xl font-bold text-ink-700 tabular-nums mt-1">
            {monthStats.count} 条
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-ink-800">
              {currentYear}年{currentMonth + 1}月
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-lg transition-colors"
            >
              今天
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors text-ink-500"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-cream-100 rounded-lg transition-colors text-ink-500"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-ink-500">支出</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-ink-500">收入</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`text-center py-2 text-sm font-medium ${
                idx === 0 || idx === 6 ? 'text-primary-400' : 'text-ink-400'
              }`}
            >
              {day}
            </div>
          ))}

          {calendarDays.map((dayInfo, idx) => {
            const hasExpense = dayInfo.records.some(r => r.direction === 'expense');
            const hasIncome = dayInfo.records.some(r => r.direction === 'income');
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <button
                key={dayInfo.date}
                onClick={() => dayInfo.records.length > 0 && setSelectedDate(dayInfo.date)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200
                  ${dayInfo.isCurrentMonth ? '' : 'opacity-40'}
                  ${dayInfo.isToday ? 'bg-primary-50 ring-2 ring-primary-500' : ''}
                  ${dayInfo.records.length > 0 ? 'cursor-pointer hover:bg-cream-100' : 'cursor-default'}
                  ${!dayInfo.isToday && isWeekend && dayInfo.isCurrentMonth ? 'text-primary-400' : 'text-ink-700'}
                  ${!dayInfo.isToday && !isWeekend ? 'text-ink-700' : ''}
                  ${selectedDate === dayInfo.date ? 'bg-primary-100' : ''}
                `}
              >
                <span className={`text-sm ${dayInfo.isToday ? 'font-bold text-primary-600' : ''}`}>
                  {dayInfo.day}
                </span>
                {dayInfo.records.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {hasExpense && (
                      <span className={`w-2 h-2 rounded-full ${getDotColor('expense')}`}></span>
                    )}
                    {hasIncome && (
                      <span className={`w-2 h-2 rounded-full ${getDotColor('income')}`}></span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedDayRecords && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-cream-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink-800">
                  {formatDateShort(selectedDate)} 记录
                </h3>
                {selectedDayStats && (
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="text-primary-500">支出 {formatMoney(selectedDayStats.expense)}</span>
                    <span className="text-emerald-500">收入 {formatMoney(selectedDayStats.income)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-cream-100 rounded-lg transition-colors text-ink-400"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {selectedDayRecords.length > 0 ? (
                selectedDayRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => {
                      setSelectedDate(null);
                      navigate(`/records/${record.id}/edit`);
                    }}
                    className="flex items-center gap-3 p-3 bg-cream-50 hover:bg-cream-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      record.direction === 'expense' ? 'bg-primary-100' : 'bg-emerald-100'
                    }`}>
                      {EVENT_TYPE_ICONS[record.eventType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-800 truncate">
                          {record.contactName}
                        </span>
                        <span className="text-xs bg-cream-200 text-ink-500 px-2 py-0.5 rounded-full flex-shrink-0">
                          {EVENT_TYPE_LABELS[record.eventType]}
                        </span>
                      </div>
                      <p className="text-sm text-ink-500 truncate mt-0.5">
                        {record.eventName}
                      </p>
                    </div>
                    <div className={`text-right font-semibold tabular-nums ${
                      record.direction === 'expense' ? 'text-primary-500' : 'text-emerald-500'
                    }`}>
                      {record.direction === 'expense' ? '-' : '+'}{formatMoney(record.amount, showCents)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-ink-300">
                  <p className="text-4xl mb-2">📅</p>
                  <p>当天暂无记录</p>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedDate(null);
                  navigate(`/records/add?date=${selectedDate}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              >
                <Plus size={18} />
                添加当天记录
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-20 md:hidden" />
    </div>
  );
}
