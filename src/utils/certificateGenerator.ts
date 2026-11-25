export interface CertificateRenderInput {
  certificateId: string;
  participantName: string;
  trackTitle: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  elapsedSeconds: number;
  completedAt: string;
}

export function formatExamDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatIndonesianDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function downloadCertificatePng(data: CertificateRenderInput): void {
  if (typeof document === 'undefined') return;

  const width = 1600;
  const height = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background: Deep Forest (#07170B)
  ctx.fillStyle = '#07170B';
  ctx.fillRect(0, 0, width, height);

  // Subtle geometric grid texture across canvas
  ctx.strokeStyle = 'rgba(162, 223, 32, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 80; gx < width; gx += 80) {
    ctx.beginPath();
    ctx.moveTo(gx, 48);
    ctx.lineTo(gx, height - 48);
    ctx.stroke();
  }
  for (let gy = 80; gy < height; gy += 80) {
    ctx.beginPath();
    ctx.moveTo(48, gy);
    ctx.lineTo(width - 48, gy);
    ctx.stroke();
  }

  // Outer structural frame
  ctx.strokeStyle = 'rgba(162, 223, 32, 0.35)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 44, 44, width - 88, height - 88, 28);
  ctx.stroke();

  // Inner hairline border
  ctx.strokeStyle = 'rgba(234, 242, 236, 0.14)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 64, 64, width - 128, height - 128, 20);
  ctx.stroke();

  // Top lime accent bar (centered editorial rule)
  ctx.fillStyle = '#A2DF20';
  drawRoundedRect(ctx, width / 2 - 70, 112, 140, 6, 3);
  ctx.fill();

  // Brand mark + Header label
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A2DF20';
  ctx.font = '700 26px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('GridRumus', width / 2, 166);

  ctx.fillStyle = '#EAF2EC';
  ctx.font = '800 44px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Sertifikat Uji Kompetensi Excel Kerja', width / 2, 232);

  // Divider line
  ctx.strokeStyle = 'rgba(234, 242, 236, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(240, 276);
  ctx.lineTo(width - 240, 276);
  ctx.stroke();

  // Recipient label
  ctx.fillStyle = '#8A9A8F';
  ctx.font = '500 22px "DM Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Diberikan kepada', width / 2, 344);

  // Participant Name (auto-fit font size so long names never overflow)
  const cleanName = data.participantName.trim() || 'Peserta Simulasi';
  let nameFontSize = 66;
  ctx.font = `800 ${nameFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(cleanName).width > width - 260 && nameFontSize > 34) {
    nameFontSize -= 2;
    ctx.font = `800 ${nameFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  }
  ctx.fillStyle = '#FEFEFE';
  ctx.fillText(cleanName, width / 2, 428);

  // Underline beneath name
  const nameLineWidth = Math.min(Math.max(ctx.measureText(cleanName).width + 80, 420), 960);
  ctx.strokeStyle = 'rgba(162, 223, 32, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameLineWidth / 2, 456);
  ctx.lineTo(width / 2 + nameLineWidth / 2, 456);
  ctx.stroke();

  // Track achievement description
  ctx.fillStyle = '#B5C4BA';
  ctx.font = '500 24px "DM Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Telah menyelesaikan Simulasi Tes Kerja Berwaktu pada bidang', width / 2, 518);

  ctx.fillStyle = '#A2DF20';
  ctx.font = '700 34px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText(data.trackTitle, width / 2, 572);

  // Three metric boxes row
  const boxTop = 640;
  const boxHeight = 154;
  const boxGap = 28;
  const totalRowWidth = 1140;
  const boxWidth = (totalRowWidth - boxGap * 2) / 3;
  const startX = (width - totalRowWidth) / 2;

  const metrics = [
    {
      label: 'Skor Akhir',
      value: `${data.scorePercent}% (${data.correctCount}/${data.totalCount})`,
      accent: '#A2DF20',
    },
    {
      label: 'Predikat Hasil',
      value: data.passed ? 'Kompeten / Lulus Uji' : 'Perlu Latihan Lagi',
      accent: data.passed ? '#A2DF20' : '#FBBF24',
    },
    {
      label: 'Waktu Pengerjaan',
      value: formatExamDuration(data.elapsedSeconds),
      accent: '#FEFEFE',
    },
  ];

  metrics.forEach((metric, index) => {
    const bx = startX + index * (boxWidth + boxGap);
    ctx.fillStyle = '#0B2012';
    drawRoundedRect(ctx, bx, boxTop, boxWidth, boxHeight, 18);
    ctx.fill();

    ctx.strokeStyle = 'rgba(234, 242, 236, 0.14)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, bx, boxTop, boxWidth, boxHeight, 18);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8A9A8F';
    ctx.font = '500 20px "DM Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(metric.label, bx + boxWidth / 2, boxTop + 52);

    ctx.fillStyle = metric.accent;
    ctx.font = '700 28px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(metric.value, bx + boxWidth / 2, boxTop + 106);
  });

  // Footer section
  const footerY = 928;
  ctx.strokeStyle = 'rgba(234, 242, 236, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, 868);
  ctx.lineTo(width - 140, 868);
  ctx.stroke();

  // Left: Date
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8A9A8F';
  ctx.font = '500 18px "DM Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Tanggal Penyelesaian', 140, footerY);

  ctx.fillStyle = '#FEFEFE';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText(formatIndonesianDate(data.completedAt), 140, footerY + 36);

  // Center: Certificate ID
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8A9A8F';
  ctx.font = '500 18px "DM Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Nomor Referensi Sertifikat', width / 2, footerY);

  ctx.fillStyle = '#A2DF20';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText(data.certificateId, width / 2, footerY + 36);

  // Right: Issuer verification label
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8A9A8F';
  ctx.font = '500 18px "DM Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Platform Evaluasi', width - 140, footerY);

  ctx.fillStyle = '#FEFEFE';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('GridRumus · Simulasi Kerja', width - 140, footerY + 36);

  // Trigger download
  const safeFileName = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `Sertifikat_GridRumus_${safeFileName || 'peserta'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
