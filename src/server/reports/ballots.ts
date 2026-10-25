import 'server-only';
import QRCode from 'qrcode';
import { formatSerial, formatToken } from '@/domain/token';
import type { GeneratedBallot } from '../services/tokens';
import { COLORS, createPdf, pdfToBuffer } from './pdf-common';

const MM = 72 / 25.4;
const COLS = 2;
const ROWS = 4;

/**
 * PDF phiếu bình chọn: 8 phiếu / trang A4 (105 × 74,25 mm), có đường cắt.
 * Mỗi phiếu: QR, số seri, mã nhập tay, hướng dẫn 3 bước.
 */
export async function renderBallotsPdf(
  ballots: GeneratedBallot[],
  info: { contestName: string; organizer: string; baseUrl: string; zoneName?: string | null },
): Promise<Buffer> {
  const doc = createPdf({ margin: 0, info: { Title: `Phiếu bình chọn — ${info.contestName}` } });
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const cellW = pageW / COLS;
  const cellH = pageH / ROWS;
  const perPage = COLS * ROWS;
  const host = info.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  for (let i = 0; i < ballots.length; i++) {
    const b = ballots[i]!;
    if (i > 0 && i % perPage === 0) doc.addPage({ size: 'A4', margin: 0 });
    const slot = i % perPage;
    const x = (slot % COLS) * cellW;
    const y = Math.floor(slot / COLS) * cellH;

    if (slot === 0) {
      // Đường cắt nét đứt
      doc.save().lineWidth(0.5).strokeColor('#AAAAAA').dash(4, { space: 4 });
      for (let c = 1; c < COLS; c++) doc.moveTo(c * cellW, 0).lineTo(c * cellW, pageH).stroke();
      for (let r = 1; r < ROWS; r++) doc.moveTo(0, r * cellH).lineTo(pageW, r * cellH).stroke();
      doc.undash().restore();
    }

    const pad = 5 * MM;
    // Khung viền vàng
    doc.save().lineWidth(1.2).strokeColor(COLORS.gold).roundedRect(x + 3 * MM, y + 3 * MM, cellW - 6 * MM, cellH - 6 * MM, 6).stroke().restore();

    // Tiêu đề
    doc.font('bold').fontSize(10.5).fillColor(COLORS.burgundy)
      .text(info.contestName.toUpperCase(), x + pad, y + pad + 1, { width: cellW - 2 * pad, align: 'center' });
    doc.font('regular').fontSize(7.5).fillColor(COLORS.muted)
      .text(info.organizer, x + pad, doc.y + 1, { width: cellW - 2 * pad, align: 'center' });

    // QR
    const url = `${info.baseUrl.replace(/\/$/, '')}/v/${b.token}`;
    const qr = await QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
    const qrSize = 33 * MM;
    const qrX = x + pad;
    const qrY = y + 17 * MM;
    doc.image(qr, qrX, qrY, { width: qrSize, height: qrSize });

    // Nội dung bên phải QR
    const tx = qrX + qrSize + 4 * MM;
    const tw = x + cellW - pad - tx;
    doc.font('bold').fontSize(11).fillColor(COLORS.ink).text('PHIẾU BÌNH CHỌN', tx, qrY, { width: tw });
    doc.font('bold').fontSize(9).fillColor(COLORS.burgundy).text(`Số: ${formatSerial(b.serial)}`, tx, doc.y + 1, { width: tw });
    if (info.zoneName) doc.font('regular').fontSize(7.5).fillColor(COLORS.muted).text(info.zoneName, tx, doc.y, { width: tw });
    doc.moveDown(0.4);
    doc.font('regular').fontSize(7.8).fillColor(COLORS.ink);
    for (const line of ['1. Mở camera, quét mã QR.', '2. Chọn hang đá yêu thích.', '3. Bấm “Xác nhận bình chọn”.']) {
      doc.text(line, tx, doc.y + 1, { width: tw });
    }

    // Mã nhập tay
    const codeY = qrY + qrSize + 2.5 * MM;
    doc.font('regular').fontSize(7).fillColor(COLORS.muted)
      .text(`Không quét được? Vào ${host}/vote và nhập mã:`, x + pad, codeY, { width: cellW - 2 * pad, align: 'center' });
    doc.font('bold').fontSize(13).fillColor(COLORS.ink)
      .text(formatToken(b.token), x + pad, doc.y + 1, { width: cellW - 2 * pad, align: 'center', characterSpacing: 1.2 });
    doc.font('regular').fontSize(6.5).fillColor(COLORS.muted)
      .text('Mỗi phiếu chỉ bình chọn được 1 lần. Vui lòng không chia sẻ ảnh phiếu.', x + pad, doc.y + 1, {
        width: cellW - 2 * pad,
        align: 'center',
      });
  }

  return pdfToBuffer(doc);
}
