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

function drawRedEnvelope(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  const w = size;
  const h = size * 1.2;
  const centerX = x + w / 2;
  const topY = y;

  ctx.save();

  const bodyGradient = ctx.createLinearGradient(x, topY, x, topY + h);
  bodyGradient.addColorStop(0, '#E63946');
  bodyGradient.addColorStop(0.5, '#C41E3A');
  bodyGradient.addColorStop(1, '#9B1B30');

  drawRoundedRect(ctx, x, topY, w, h, w * 0.08);
  ctx.fillStyle = bodyGradient;
  ctx.fill();

  const flapHeight = h * 0.35;
  const flapGradient = ctx.createLinearGradient(x, topY, x, topY + flapHeight);
  flapGradient.addColorStop(0, '#FF6B6B');
  flapGradient.addColorStop(1, '#E63946');

  ctx.beginPath();
  ctx.moveTo(x, topY + flapHeight * 0.6);
  ctx.quadraticCurveTo(centerX, topY - flapHeight * 0.1, x + w, topY + flapHeight * 0.6);
  ctx.lineTo(x + w, topY + flapHeight * 0.8);
  ctx.quadraticCurveTo(centerX, topY + flapHeight * 0.3, x, topY + flapHeight * 0.8);
  ctx.closePath();
  ctx.fillStyle = flapGradient;
  ctx.fill();

  const sealSize = w * 0.28;
  const sealY = topY + flapHeight * 0.9;

  const sealGradient = ctx.createRadialGradient(
    centerX - sealSize * 0.2,
    sealY - sealSize * 0.2,
    sealSize * 0.1,
    centerX,
    sealY,
    sealSize
  );
  sealGradient.addColorStop(0, '#FFD700');
  sealGradient.addColorStop(0.7, '#FFA500');
  sealGradient.addColorStop(1, '#D4A853');

  ctx.beginPath();
  ctx.arc(centerX, sealY, sealSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = sealGradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const yuanSize = sealSize * 0.5;
  ctx.font = `bold ${yuanSize}px "SimHei", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = '#C41E3A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥', centerX, sealY + 2);

  const patternY = topY + h * 0.65;
  const patternSize = w * 0.06;
  const patternCount = 5;
  const gap = (w - patternSize * 2) / (patternCount - 1);

  ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
  for (let i = 0; i < patternCount; i++) {
    const px = x + patternSize + i * gap;
    ctx.beginPath();
    ctx.moveTo(px, patternY - patternSize / 2);
    ctx.lineTo(px + patternSize / 2, patternY);
    ctx.lineTo(px, patternY + patternSize / 2);
    ctx.lineTo(px - patternSize / 2, patternY);
    ctx.closePath();
    ctx.fill();
  }

  const bottomPatternY = topY + h * 0.85;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
  for (let i = 0; i < patternCount; i++) {
    const px = x + patternSize + i * gap;
    ctx.beginPath();
    ctx.arc(px, bottomPatternY, patternSize / 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(
    x + w * 0.3,
    topY + h * 0.45,
    w * 0.15,
    w * 0.08,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawDecorativePattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;

  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.3, -size * 0.3, 0, 0);
    ctx.quadraticCurveTo(-size * 0.3, -size * 0.3, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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

  const bgGradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bgGradient.addColorStop(0, '#FFF5EB');
  bgGradient.addColorStop(0.3, '#FFF9F2');
  bgGradient.addColorStop(0.7, '#FFF5E6');
  bgGradient.addColorStop(1, '#FDF2E9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = '#C41E3A';
  ctx.globalAlpha = 0.04;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH + 50, -50, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-50, CARD_HEIGHT - 100, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawDecorativePattern(ctx, 80, 100, 15, 'rgba(196, 30, 58, 0.15)');
  drawDecorativePattern(ctx, CARD_WIDTH - 80, 130, 12, 'rgba(212, 168, 83, 0.2)');
  drawDecorativePattern(ctx, 100, CARD_HEIGHT - 300, 10, 'rgba(16, 185, 129, 0.15)');
  drawDecorativePattern(ctx, CARD_WIDTH - 100, CARD_HEIGHT - 250, 14, 'rgba(196, 30, 58, 0.12)');

  const topBarGradient = ctx.createLinearGradient(60, 0, CARD_WIDTH - 60, 0);
  topBarGradient.addColorStop(0, '#C41E3A');
  topBarGradient.addColorStop(0.3, '#E63946');
  topBarGradient.addColorStop(0.5, '#D4A853');
  topBarGradient.addColorStop(0.7, '#10B981');
  topBarGradient.addColorStop(1, '#059669');
  ctx.fillStyle = topBarGradient;
  ctx.fillRect(60, 50, CARD_WIDTH - 120, 6);

  drawRoundedRect(ctx, 50, 80, CARD_WIDTH - 100, 200, 28);
  const headerGradient = ctx.createLinearGradient(50, 80, CARD_WIDTH - 50, 280);
  headerGradient.addColorStop(0, '#E63946');
  headerGradient.addColorStop(0.5, '#C41E3A');
  headerGradient.addColorStop(1, '#9B1B30');
  ctx.fillStyle = headerGradient;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.ellipse(CARD_WIDTH - 130, 120, 80, 50, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(CARD_WIDTH - 80, 200, 50, 35, -0.2, 0, Math.PI * 2);
  ctx.fill();

  drawRedEnvelope(ctx, 90, 115, 130);

  ctx.font = 'bold 42px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${data.year}年度人情账单`, 250, 130);

  ctx.font = '26px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText('记录每一份心意', 250, 190);
  ctx.fillText('珍藏每一份情谊', 250, 225);

  ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#2C2C2C';
  ctx.textAlign = 'left';
  ctx.fillText('📊 年度摘要', 70, 330);

  drawRoundedRect(ctx, 50, 360, CARD_WIDTH - 100, 210, 24);
  const summaryGradient = ctx.createLinearGradient(50, 360, 50, 570);
  summaryGradient.addColorStop(0, '#FFFFFF');
  summaryGradient.addColorStop(1, '#FFFBF5');
  ctx.fillStyle = summaryGradient;
  ctx.fill();

  ctx.strokeStyle = '#F0E6D3';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '26px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#8B7355';
  ctx.textAlign = 'center';

  const summaryY1 = 410;
  const summaryY2 = 470;
  const col1 = 195;
  const col2 = CARD_WIDTH / 2;
  const col3 = CARD_WIDTH - 195;

  ctx.fillText('年度支出', col1, summaryY1);
  ctx.fillText('年度收入', col2, summaryY1);
  ctx.fillText('年度结余', col3, summaryY1);

  ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#C41E3A';
  ctx.fillText(formatMoney(data.totalExpense), col1, summaryY2);
  ctx.fillStyle = '#10B981';
  ctx.fillText(formatMoney(data.totalIncome), col2, summaryY2);
  ctx.fillStyle = '#D4A853';
  ctx.fillText(formatMoney(data.totalIncome - data.totalExpense), col3, summaryY2);

  ctx.strokeStyle = '#F5E9D5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(col1 + 130, 390);
  ctx.lineTo(col1 + 130, 530);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(col3 - 130, 390);
  ctx.lineTo(col3 - 130, 530);
  ctx.stroke();

  drawRoundedRect(ctx, 50, 600, CARD_WIDTH - 100, 290, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#F0E6D3';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#2C2C2C';
  ctx.textAlign = 'left';
  ctx.fillText('📈 关键数据', 80, 650);

  drawRoundedRect(ctx, 80, 685, 280, 75, 16);
  const stat1Gradient = ctx.createLinearGradient(80, 685, 80, 760);
  stat1Gradient.addColorStop(0, '#EFF6FF');
  stat1Gradient.addColorStop(1, '#DBEAFE');
  ctx.fillStyle = stat1Gradient;
  ctx.fill();

  ctx.font = '24px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText('👥 往来人数', 110, 710);
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#3B82F6';
  ctx.textAlign = 'right';
  ctx.fillText(`${data.contactCount} 人`, 330, 735);

  drawRoundedRect(ctx, CARD_WIDTH - 360, 685, 280, 75, 16);
  const stat2Gradient = ctx.createLinearGradient(CARD_WIDTH - 360, 685, CARD_WIDTH - 360, 760);
  stat2Gradient.addColorStop(0, '#ECFDF5');
  stat2Gradient.addColorStop(1, '#D1FAE5');
  ctx.fillStyle = stat2Gradient;
  ctx.fill();

  ctx.font = '24px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText('💎 最高单笔', CARD_WIDTH - 330, 710);
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#10B981';
  ctx.textAlign = 'right';
  ctx.fillText(formatMoney(data.maxSingleAmount), CARD_WIDTH - 80, 735);

  const balance = data.totalIncome - data.totalExpense;
  drawRoundedRect(ctx, 80, 780, CARD_WIDTH - 160, 80, 16);
  const balanceGradient = ctx.createLinearGradient(80, 780, CARD_WIDTH - 80, 860);
  if (balance >= 0) {
    balanceGradient.addColorStop(0, '#ECFDF5');
    balanceGradient.addColorStop(1, '#D1FAE5');
  } else {
    balanceGradient.addColorStop(0, '#FEF2F2');
    balanceGradient.addColorStop(1, '#FEE2E2');
  }
  ctx.fillStyle = balanceGradient;
  ctx.fill();

  ctx.font = '24px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText('💰 收支结余', 110, 810);
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = balance >= 0 ? '#10B981' : '#C41E3A';
  ctx.textAlign = 'right';
  ctx.fillText(`${balance >= 0 ? '+' : '-'}${formatMoney(Math.abs(balance))}`, CARD_WIDTH - 110, 835);

  drawRoundedRect(ctx, 50, 920, CARD_WIDTH - 100, 150, 24);
  const quoteGradient = ctx.createLinearGradient(50, 920, CARD_WIDTH - 50, 1070);
  quoteGradient.addColorStop(0, 'rgba(196, 30, 58, 0.06)');
  quoteGradient.addColorStop(0.5, 'rgba(212, 168, 83, 0.06)');
  quoteGradient.addColorStop(1, 'rgba(16, 185, 129, 0.06)');
  ctx.fillStyle = quoteGradient;
  ctx.fill();

  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(196, 30, 58, 0.12)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('"', 80, 935);

  ctx.font = '28px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#5C4033';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('人情往来，礼尚往来', CARD_WIDTH / 2, 975);
  ctx.fillText('每一份记录都是珍贵的情谊', CARD_WIDTH / 2, 1015);

  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.textAlign = 'right';
  ctx.fillText('"', CARD_WIDTH - 80, 1005);

  ctx.fillStyle = 'rgba(196, 30, 58, 0.08)';
  for (let i = 0; i < 5; i++) {
    const cx = 120 + i * (CARD_WIDTH - 240) / 4;
    const cy = 1105;
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = j % 2 === 0 ? 12 : 5;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (j === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  drawRoundedRect(ctx, 50, 1130, CARD_WIDTH - 100, 60, 30);
  const footerGradient = ctx.createLinearGradient(50, 1130, CARD_WIDTH - 50, 1190);
  footerGradient.addColorStop(0, 'rgba(196, 30, 58, 0.05)');
  footerGradient.addColorStop(1, 'rgba(212, 168, 83, 0.05)');
  ctx.fillStyle = footerGradient;
  ctx.fill();

  const appIconSize = 36;
  const appIconX = 90;
  const appIconY = 1142;
  drawRedEnvelope(ctx, appIconX, appIconY, appIconSize);

  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#C41E3A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.appName, appIconX + appIconSize + 15, 1160);

  ctx.font = '20px "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'right';
  ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, CARD_WIDTH - 90, 1160);

  return canvas.toDataURL('image/png', 1.0);
}

interface FileSystemHandle {
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface WindowWithFilePicker extends Window {
  showSaveFilePicker(options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }): Promise<FileSystemHandle>;
}

declare const window: WindowWithFilePicker;

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function saveImageToDevice(dataUrl: string, filename: string): Promise<boolean> {
  try {
    const blob = await dataUrlToBlob(dataUrl);

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: filename.replace('.png', ''),
            text: '年度人情账单分享卡片',
            files: [file],
          });
          return true;
        } catch (shareError) {
          if ((shareError as Error).name === 'AbortError') {
            return false;
          }
        }
      }
    }

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PNG Image',
            accept: { 'image/png': ['.png'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch {
        // fallthrough
      }
    }

    downloadImage(dataUrl, filename);
    return true;
  } catch (error) {
    console.error('保存图片失败:', error);
    downloadImage(dataUrl, filename);
    return true;
  }
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function canShareImage(): boolean {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

export function getSaveTipText(): string {
  if (isIOS()) {
    return '长按图片，选择「添加到照片」保存到相册';
  }
  if (isAndroid()) {
    return '长按图片，选择「保存图片」保存到相册';
  }
  return '点击保存按钮下载图片';
}
