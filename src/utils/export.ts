import * as XLSX from 'xlsx';
import type { GiftRecord, YearlyStats, EventType } from '@/types';
import { EVENT_TYPE_LABELS } from '@/types';

const CHUNK_SIZE = 500;

async function processInChunks<T>(
  items: T[],
  processChunk: (chunk: T[], chunkIndex: number) => void,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = items.length;
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    processChunk(chunk, Math.floor(i / CHUNK_SIZE));
    onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename);
}

function createSummaryData(records: GiftRecord[]): Record<string, string | number>[] {
  const totalExpense = records
    .filter(r => r.direction === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = records
    .filter(r => r.direction === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const expenseCount = records.filter(r => r.direction === 'expense').length;
  const incomeCount = records.filter(r => r.direction === 'income').length;
  
  const expenseByType = {} as Record<EventType, number>;
  const incomeByType = {} as Record<EventType, number>;
  
  (Object.keys(EVENT_TYPE_LABELS) as EventType[]).forEach(type => {
    expenseByType[type] = records
      .filter(r => r.direction === 'expense' && r.eventType === type)
      .reduce((sum, r) => sum + r.amount, 0);
    incomeByType[type] = records
      .filter(r => r.direction === 'income' && r.eventType === type)
      .reduce((sum, r) => sum + r.amount, 0);
  });
  
  const data: Record<string, string | number>[] = [
    { '项目': '总支出', '金额': totalExpense, '笔数': expenseCount },
    { '项目': '总收入', '金额': totalIncome, '笔数': incomeCount },
    { '项目': '结余', '金额': totalIncome - totalExpense, '笔数': records.length },
    { '项目': '', '金额': '', '笔数': '' },
    { '项目': '—— 支出分类 ——', '金额': '', '笔数': '' },
  ];
  
  (Object.keys(EVENT_TYPE_LABELS) as EventType[]).forEach(type => {
    if (expenseByType[type] > 0) {
      data.push({
        '项目': `支出 - ${EVENT_TYPE_LABELS[type]}`,
        '金额': expenseByType[type],
        '笔数': records.filter(r => r.direction === 'expense' && r.eventType === type).length,
      });
    }
  });
  
  data.push({ '项目': '', '金额': '', '笔数': '' });
  data.push({ '项目': '—— 收入分类 ——', '金额': '', '笔数': '' });
  
  (Object.keys(EVENT_TYPE_LABELS) as EventType[]).forEach(type => {
    if (incomeByType[type] > 0) {
      data.push({
        '项目': `收入 - ${EVENT_TYPE_LABELS[type]}`,
        '金额': incomeByType[type],
        '笔数': records.filter(r => r.direction === 'income' && r.eventType === type).length,
      });
    }
  });
  
  return data;
}

function recordsToExcelData(records: GiftRecord[]): Record<string, string | number>[] {
  return records.map(record => ({
    '日期': record.date,
    '姓名': record.contactName,
    '事由类型': EVENT_TYPE_LABELS[record.eventType],
    '事由名称': record.eventName,
    '收支方向': record.direction === 'expense' ? '支出' : '收入',
    '金额': record.amount,
    '备注': record.note,
    '标签': (record.tags || []).join('、'),
  }));
}

function getColumnWidths(data: Record<string, string | number>[]): number[] {
  if (data.length === 0) return [];
  
  const headers = Object.keys(data[0]);
  const widths: number[] = [];
  
  headers.forEach((header, colIndex) => {
    let maxLen = header.length;
    
    data.forEach(row => {
      const value = String(row[header] ?? '');
      const len = value.length;
      if (len > maxLen) maxLen = len;
    });
    
    widths[colIndex] = Math.max(10, Math.min(30, maxLen + 2));
  });
  
  return widths;
}

function applySheetStyle(worksheet: XLSX.WorkSheet, data: Record<string, string | number>[]): void {
  const widths = getColumnWidths(data);
  if (widths.length > 0) {
    worksheet['!cols'] = widths.map(w => ({ wch: w }));
  }
}

export interface ExportProgress {
  current: number;
  total: number;
  phase: 'preparing' | 'processing' | 'downloading';
}

export async function exportRecordsToExcel(
  records: GiftRecord[],
  filename: string = '礼金记录.xlsx',
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  onProgress?.({ current: 0, total: records.length, phase: 'preparing' });
  
  const workbook = XLSX.utils.book_new();
  
  const summaryData = createSummaryData(records);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData, { skipHeader: false });
  applySheetStyle(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '收支汇总');
  
  onProgress?.({ current: 0, total: records.length, phase: 'processing' });
  
  const detailData: Record<string, string | number>[] = [];
  await processInChunks(
    records,
    (chunk) => {
      detailData.push(...recordsToExcelData(chunk));
    },
    (current, total) => {
      onProgress?.({ current, total, phase: 'processing' });
    }
  );
  
  const detailSheet = XLSX.utils.json_to_sheet(detailData, { skipHeader: false });
  applySheetStyle(detailSheet, detailData);
  XLSX.utils.book_append_sheet(workbook, detailSheet, '明细记录');
  
  onProgress?.({ current: records.length, total: records.length, phase: 'downloading' });
  
  downloadWorkbook(workbook, filename);
}

export async function exportStatisticsToExcel(
  records: GiftRecord[],
  yearlyStats: YearlyStats,
  filename: string = '年度统计.xlsx',
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  onProgress?.({ current: 0, total: records.length, phase: 'preparing' });
  
  const workbook = XLSX.utils.book_new();
  
  const summaryData = createSummaryData(records);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData, { skipHeader: false });
  applySheetStyle(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '收支汇总');
  
  onProgress?.({ current: 0, total: records.length, phase: 'processing' });
  
  const detailData: Record<string, string | number>[] = [];
  await processInChunks(
    records,
    (chunk) => {
      detailData.push(...recordsToExcelData(chunk));
    },
    (current, total) => {
      onProgress?.({ current, total, phase: 'processing' });
    }
  );
  
  const detailSheet = XLSX.utils.json_to_sheet(detailData, { skipHeader: false });
  applySheetStyle(detailSheet, detailData);
  XLSX.utils.book_append_sheet(workbook, detailSheet, '明细记录');
  
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    '月份': `${i + 1}月`,
    '支出': yearlyStats.monthlyExpense[i],
    '收入': yearlyStats.monthlyIncome[i],
  }));
  const monthlySheet = XLSX.utils.json_to_sheet(monthlyData, { skipHeader: false });
  applySheetStyle(monthlySheet, monthlyData);
  XLSX.utils.book_append_sheet(workbook, monthlySheet, '月度收支');
  
  const typeData: Record<string, string | number>[] = [
    { '分类': '支出分类', '金额': '', '占比': '' },
  ];
  
  const totalExpenseByType = Object.values(yearlyStats.expenseByType).reduce((sum, v) => sum + v, 0);
  
  (Object.keys(EVENT_TYPE_LABELS) as EventType[]).forEach(type => {
    const amount = yearlyStats.expenseByType[type];
    if (amount > 0) {
      typeData.push({
        '分类': EVENT_TYPE_LABELS[type],
        '金额': amount,
        '占比': totalExpenseByType > 0 ? `${((amount / totalExpenseByType) * 100).toFixed(1)}%` : '0%',
      });
    }
  });
  
  typeData.push({ '分类': '', '金额': '', '占比': '' });
  typeData.push({ '分类': '收入分类', '金额': '', '占比': '' });
  
  const totalIncomeByType = Object.values(yearlyStats.incomeByType).reduce((sum, v) => sum + v, 0);
  
  (Object.keys(EVENT_TYPE_LABELS) as EventType[]).forEach(type => {
    const amount = yearlyStats.incomeByType[type];
    if (amount > 0) {
      typeData.push({
        '分类': EVENT_TYPE_LABELS[type],
        '金额': amount,
        '占比': totalIncomeByType > 0 ? `${((amount / totalIncomeByType) * 100).toFixed(1)}%` : '0%',
      });
    }
  });
  
  const typeSheet = XLSX.utils.json_to_sheet(typeData, { skipHeader: false });
  applySheetStyle(typeSheet, typeData);
  XLSX.utils.book_append_sheet(workbook, typeSheet, '分类统计');
  
  onProgress?.({ current: records.length, total: records.length, phase: 'downloading' });
  
  downloadWorkbook(workbook, filename);
}

export function formatExportDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
