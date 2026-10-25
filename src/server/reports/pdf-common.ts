import 'server-only';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');

/** Tạo tài liệu PDF A4 với font hỗ trợ tiếng Việt. */
export function createPdf(options: PDFKit.PDFDocumentOptions = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, ...options });
  doc.registerFont('regular', path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf'));
  doc.registerFont('bold', path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf'));
  doc.font('regular');
  return doc;
}

export function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export const COLORS = {
  gold: '#B38F23',
  burgundy: '#6D1A2B',
  ink: '#1A1416',
  muted: '#6B6B6B',
};
