export interface ShareCardData {
  year: number;
  totalExpense: number;
  totalIncome: number;
  contactCount: number;
  maxSingleAmount: number;
  appName: string;
}

const CARD_WIDTH = 750;
const CARD_HEIGHT = 1200;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function formatMoney(amount: number): string {
  if (amount >= 10000) {
    const wan = amount / 10000;
    return `¥${wan.toFixed(wan % 1 === 0 ? 0 : 1)}万`;
  }
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export async function generateShareCard(data: ShareCardData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, '#FFF5EB');
  gradient.addColorStop(0.5, '#FFF9F2');
  gradient.addColorStop(1, '#E8F5E9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = '#C41E3A';
  ctx.globalAlpha = 0.05;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 100, 150, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(100, CARD_HEIGHT - 200, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, CARD_HEIGHT / 2, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const topDecorGradient = ctx.createLinearGradient(60, 0, CARD_WIDTH - 60, 0);
  topDecorGradient.addColorStop(0, '#C41E3A');
  topDecorGradient.addColorStop(0.5, '#D4A853');
  topDecorGradient.addColorStop(1, '#10B981');
  ctx.fillStyle = topDecorGradient;
  ctx.fillRect(60, 60, CARD_WIDTH - 120, 6);

  drawRoundedRect(ctx, 60, 100, CARD_WIDTH - 120, 180, 24);
  const headerGradient = ctx.createLinearGradient(60, 100, CARD_WIDTH - 60, 280);
  headerGradient.addColorStop(0, '#C41E3A');
  headerGradient.addColorStop(1, '#9B1B30');
  ctx.fillStyle = headerGradient;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 150, 140, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CARD_WIDTH - 80, 220, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 72px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('🧧', 100, 180);

  ctx.font = 'bold 40px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText(`${data.year}年度人情账单`, 200, 175);

  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('记录每一份心意，珍藏每一份情谊', 200, 225);

  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#C41E3A';
  ctx.textAlign = 'left';
  ctx.fillText('📊 年度摘要', 100, 340);

  drawRoundedRect(ctx, 60, 370, CARD_WIDTH - 120, 200, 20);
  const summaryGradient = ctx.createLinearGradient(60, 370, 60, 570);
  summaryGradient.addColorStop(0, '#FFFFFF');
  summaryGradient.addColorStop(1, '#FFFBF5');
  ctx.fillStyle = summaryGradient;
  ctx.fill();
  ctx.strokeStyle = '#F5E9D5';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#8B7355';

  ctx.textAlign = 'center';
  ctx.fillText('年度支出', 225, 420);
  ctx.fillText('年度收入', CARD_WIDTH / 2, 420);
  ctx.fillText('年度结余', CARD_WIDTH - 225, 420);

  ctx.font = 'bold 44px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#C41E3A';
  ctx.fillText(formatMoney(data.totalExpense), 225, 480);
  ctx.fillStyle = '#10B981';
  ctx.fillText(formatMoney(data.totalIncome), CARD_WIDTH / 2, 480);
  ctx.fillStyle = '#D4A853';
  ctx.fillText(formatMoney(data.totalIncome - data.totalExpense), CARD_WIDTH - 225, 480);

  ctx.strokeStyle = '#F0E6D3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(320, 400);
  ctx.lineTo(320, 520);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH - 320, 400);
  ctx.lineTo(CARD_WIDTH - 320, 520);
  ctx.stroke();

  drawRoundedRect(ctx, 60, 610, CARD_WIDTH - 120, 280, 20);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#F5E9D5';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#2C2C2C';
  ctx.textAlign = 'left';
  ctx.fillText('📈 关键数据', 100, 660);

  drawRoundedRect(ctx, 100, 695, 270, 70, 14);
  ctx.fillStyle = '#FFF5EB';
  ctx.fill();
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#8B7355';
  ctx.fillText('👥 往来人数', 130, 740);
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#3B82F6';
  ctx.textAlign = 'right';
  ctx.fillText(`${data.contactCount} 人`, 340, 740);

  drawRoundedRect(ctx, CARD_WIDTH - 370, 695, 270, 70, 14);
  ctx.fillStyle = '#F0FDF4';
  ctx.fill();
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#8B7355';
  ctx.textAlign = 'left';
  ctx.fillText('💎 最高单笔', 130 + (CARD_WIDTH - 470), 740);
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#10B981';
  ctx.textAlign = 'right';
  ctx.fillText(formatMoney(data.maxSingleAmount), CARD_WIDTH - 100, 740);

  drawRoundedRect(ctx, 100, 785, CARD_WIDTH - 200, 70, 14);
  const balance = data.totalIncome - data.totalExpense;
  const balanceGradient = ctx.createLinearGradient(100, 785, CARD_WIDTH - 100, 855);
  if (balance >= 0) {
    balanceGradient.addColorStop(0, '#ECFDF5');
    balanceGradient.addColorStop(1, '#D1FAE5');
  } else {
    balanceGradient.addColorStop(0, '#FEF2F2');
    balanceGradient.addColorStop(1, '#FEE2E2');
  }
  ctx.fillStyle = balanceGradient;
  ctx.fill();
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#8B7355';
  ctx.textAlign = 'left';
  ctx.fillText('💰 收支结余', 130, 830);
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = balance >= 0 ? '#10B981' : '#C41E3A';
  ctx.textAlign = 'right';
  ctx.fillText(`${balance >= 0 ? '+' : '-'}${formatMoney(Math.abs(balance))}`, CARD_WIDTH - 130, 830);

  drawRoundedRect(ctx, 60, 930, CARD_WIDTH - 120, 140, 20);
  const quoteGradient = ctx.createLinearGradient(60, 930, CARD_WIDTH - 60, 1070);
  quoteGradient.addColorStop(0, 'rgba(196, 30, 58, 0.06)');
  quoteGradient.addColorStop(1, 'rgba(212, 168, 83, 0.06)');
  ctx.fillStyle = quoteGradient;
  ctx.fill();

  ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = 'rgba(196, 30, 58, 0.15)';
  ctx.textAlign = 'left';
  ctx.fillText('"', 100, 1000);

  ctx.font = '26px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#5C4033';
  ctx.textAlign = 'center';
  const quoteLine1 = '人情往来，礼尚往来';
  const quoteLine2 = '每一份记录都是珍贵的情谊';
  ctx.fillText(quoteLine1, CARD_WIDTH / 2, 995);
  ctx.fillText(quoteLine2, CARD_WIDTH / 2, 1035);

  ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.textAlign = 'right';
  ctx.fillText('"', CARD_WIDTH - 100, 1060);

  ctx.fillStyle = 'rgba(196, 30, 58, 0.1)';
  for (let i = 0; i < 3; i++) {
    const x = 150 + i * (CARD_WIDTH - 300) / 2;
    ctx.beginPath();
    ctx.moveTo(x, 1095);
    ctx.lineTo(x + 20, 1095);
    ctx.lineTo(x + 10, 1110);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#C41E3A';
  ctx.textAlign = 'center';
  ctx.fillText(`🧧 ${data.appName}`, CARD_WIDTH / 2, 1155);

  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')} · 记录美好生活`, CARD_WIDTH / 2, 1190);

  return canvas.toDataURL('image/png', 1.0);
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
