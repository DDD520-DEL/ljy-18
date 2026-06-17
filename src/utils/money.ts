export function formatMoney(amount: number, showCents: boolean = false): string {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })}`;
}

export function formatMoneyWithSign(amount: number, showCents: boolean = false): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}¥${Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })}`;
}

export function formatMoneyShort(amount: number, showCents: boolean = false): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })}`;
}
