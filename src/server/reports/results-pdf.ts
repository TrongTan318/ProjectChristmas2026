import 'server-only';
import { formatDateTime } from '@/lib/format';
import type { Contest } from '../contest';
import { getResults } from '../services/results';
import { COLORS, createPdf, pdfToBuffer } from './pdf-common';

/** Biên bản kết quả bình chọn (PDF) để công bố / lưu trữ. */
export async function buildResultsPdf(contest: Contest, exportedBy: string): Promise<Buffer> {
  const r = await getResults(contest.id);
  const doc = createPdf({ info: { Title: `Biên bản kết quả — ${contest.name}` } });
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  doc.font('bold').fontSize(11).fillColor(COLORS.burgundy).text(contest.organizer.toUpperCase(), { align: 'center' });
  doc.moveDown(0.3);
  doc.font('bold').fontSize(18).fillColor(COLORS.ink).text('BIÊN BẢN KẾT QUẢ BÌNH CHỌN', { align: 'center' });
  doc.font('regular').fontSize(12).fillColor(COLORS.ink).text(contest.name, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor(COLORS.muted).text(`Xuất lúc ${formatDateTime(new Date())} bởi ${exportedBy}`, { align: 'center' });
  doc.moveDown(0.6);
  doc.moveTo(left, doc.y).lineTo(left + width, doc.y).lineWidth(1).strokeColor(COLORS.gold).stroke();
  doc.moveDown(0.8);

  doc.font('bold').fontSize(12).fillColor(COLORS.burgundy).text('I. TỔNG HỢP PHIẾU');
  doc.moveDown(0.3);
  const t = r.totals;
  const lines: [string, number][] = [
    ['Tổng số phiếu phát hành', t.issued],
    ['Số phiếu đã sử dụng', t.used],
    ['Số phiếu chưa sử dụng', t.remaining],
    ['Số phiếu bị vô hiệu', t.revoked],
    ['Số phiếu bầu hợp lệ', t.validVotes],
    ['Số phiếu bầu bị hủy', t.invalidVotes],
  ];
  doc.font('regular').fontSize(10.5).fillColor(COLORS.ink);
  for (const [label, value] of lines) {
    const y = doc.y;
    doc.text(label, left + 10, y, { width: width - 120 });
    doc.text(String(value), left + width - 100, y, { width: 100, align: 'right' });
    doc.moveDown(0.15);
  }
  doc.moveDown(0.8);

  doc.font('bold').fontSize(12).fillColor(COLORS.burgundy).text('II. BẢNG XẾP HẠNG', left);
  doc.moveDown(0.4);
  const cols = [
    { title: 'Hạng', w: 40, align: 'center' as const },
    { title: 'Sản phẩm', w: width - 40 - 130 - 60 - 60, align: 'left' as const },
    { title: 'Đội / Lớp', w: 130, align: 'left' as const },
    { title: 'Phiếu', w: 60, align: 'right' as const },
    { title: '%', w: 60, align: 'right' as const },
  ];
  const drawRow = (values: string[], bold = false, fill?: string) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) doc.addPage();
    const y = doc.y;
    const h = 20;
    if (fill) doc.rect(left, y - 4, width, h).fill(fill);
    let x = left;
    doc.font(bold ? 'bold' : 'regular').fontSize(9.5).fillColor(fill === COLORS.burgundy ? '#FFFFFF' : COLORS.ink);
    values.forEach((v, i) => {
      doc.text(v, x + 4, y, { width: cols[i]!.w - 8, align: cols[i]!.align, lineBreak: false, ellipsis: true });
      x += cols[i]!.w;
    });
    doc.y = y + h;
  };
  drawRow(cols.map((c) => c.title), true, COLORS.burgundy);
  r.ranking.forEach((row, i) =>
    drawRow(
      [String(row.rank), row.name, `${row.teamName} · ${row.className}`, String(row.votes), row.percent.toFixed(1)],
      row.rank <= 3,
      i % 2 ? '#F7F2E6' : undefined,
    ),
  );
  doc.moveDown(1);

  if (r.byZone.length) {
    doc.font('bold').fontSize(12).fillColor(COLORS.burgundy).text('III. THỐNG KÊ THEO GIÁO KHU', left);
    doc.moveDown(0.3);
    doc.font('regular').fontSize(10.5).fillColor(COLORS.ink);
    for (const z of r.byZone) {
      const y = doc.y;
      doc.text(z.name, left + 10, y, { width: width - 120 });
      doc.text(String(z.votes), left + width - 100, y, { width: 100, align: 'right' });
      doc.moveDown(0.15);
    }
    doc.moveDown(1);
  }

  if (doc.y > doc.page.height - 200) doc.addPage();
  doc.moveDown(1);
  const sigY = doc.y;
  const half = width / 2;
  doc.font('bold').fontSize(10.5).fillColor(COLORS.ink);
  doc.text('TRƯỞNG BAN TỔ CHỨC', left, sigY, { width: half, align: 'center' });
  doc.text('THƯ KÝ', left + half, sigY, { width: half, align: 'center' });
  doc.font('regular').fontSize(9).fillColor(COLORS.muted);
  doc.text('(Ký, ghi rõ họ tên)', left, sigY + 16, { width: half, align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', left + half, sigY + 16, { width: half, align: 'center' });

  return pdfToBuffer(doc);
}
