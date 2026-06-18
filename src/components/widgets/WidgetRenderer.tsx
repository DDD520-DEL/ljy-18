import MonthlyTrendWidget from './MonthlyTrendWidget';
import ContactRankingWidget from './ContactRankingWidget';
import CategoryPieWidget from './CategoryPieWidget';
import RecentRecordsWidget from './RecentRecordsWidget';
import BudgetProgressWidget from './BudgetProgressWidget';
import type { WidgetType } from '@/types';

interface WidgetRendererProps {
  type: WidgetType;
  size?: 'small' | 'medium' | 'large';
}

export default function WidgetRenderer({ type, size = 'medium' }: WidgetRendererProps) {
  switch (type) {
    case 'monthlyTrend':
      return <MonthlyTrendWidget size={size} />;
    case 'contactRanking':
      return <ContactRankingWidget size={size} />;
    case 'expenseCategory':
      return <CategoryPieWidget direction="expense" size={size} />;
    case 'incomeCategory':
      return <CategoryPieWidget direction="income" size={size} />;
    case 'recentRecords':
      return <RecentRecordsWidget size={size} />;
    case 'budgetProgress':
      return <BudgetProgressWidget size={size} />;
    default:
      return null;
  }
}
