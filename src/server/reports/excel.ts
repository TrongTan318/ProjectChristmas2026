import 'server-only';
import type { TokenStatus } from '@prisma/client';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { formatSerial, formatToken } from '@/domain/token';
import { formatDateTime } from '@/lib/format';
import type { Contest } from '../contest';
import { prisma } from '../db';
import { getResults } from '../services/results';
import type { GeneratedBallot } from '../services/tokens';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D1A2B' } };
const STATUS_TOKEN = { ACTIVE: 'Chưa dùng', USED: 'Đã dùng', REVOKED: 'Vô hiệu' } as const;

function styleHeader(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function buildResultsWorkbook(contest: Contest): Promise<Buffer> {
  const results = await getResults(contest.id);
  const wb = new ExcelJS.Workbook();
  wb.creator = contest.organizer;
  wb.created = new Date();

  const summary = wb.addWorksheet('Tổng quan');
  summary.columns = [{ header: 'Chỉ số', key: 'k', width: 32 }, { header: 'Giá trị', key: 'v', width: 24 }];
  summary.addRows([
    { k: 'Cuộc thi', v: contest.name },
    { k: 'Đơn vị tổ chức', v: contest.organizer },
    { k: 'Thời điểm xuất', v: formatDateTime(new Date()) },
    { k: 'Tổng số phiếu phát hành', v: results.totals.issued },
    { k: 'Phiếu đã dùng', v: results.totals.used },
    { k: 'Phiếu còn lại', v: results.totals.remaining },
    { k: 'Phiếu vô hiệu', v: results.totals.revoked },
    { k: 'Phiếu bầu hợp lệ', v: results.totals.validVotes },
    { k: 'Phiếu bầu bị hủy', v: results.totals.invalidVotes },
  ]);
  styleHeader(summary);

  const ranking = wb.addWorksheet('Xếp hạng');
  ranking.columns = [
    { header: 'Hạng', key: 'rank', width: 8 },
    { header: 'Sản phẩm', key: 'name', width: 40 },
    { header: 'Đội', key: 'team', width: 26 },
    { header: 'Lớp', key: 'cls', width: 14 },
    { header: 'Số phiếu', key: 'votes', width: 12 },
    { header: 'Tỷ lệ (%)', key: 'pct', width: 12 },
  ];
  for (const r of results.ranking) {
    ranking.addRow({ rank: r.rank, name: r.name, team: r.teamName, cls: r.className, votes: r.votes, pct: Number(r.percent.toFixed(2)) });
  }
  styleHeader(ranking);

  const zones = wb.addWorksheet('Theo giáo khu');
  zones.columns = [{ header: 'Giáo khu', key: 'name', width: 32 }, { header: 'Số phiếu hợp lệ', key: 'votes', width: 18 }];
  zones.addRows(results.byZone.map((z) => ({ name: z.name, votes: z.votes })));
  styleHeader(zones);

  const votes = await prisma.vote.findMany({
    where: { contestId: contest.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { token: { select: { serial: true } }, product: { select: { name: true } }, zone: { select: { name: true } } },
  });
  const detail = wb.addWorksheet('Chi tiết phiếu bầu');
  detail.columns = [
    { header: 'Seri phiếu', key: 'serial', width: 12 },
    { header: 'Thời gian', key: 'time', width: 20 },
    { header: 'Sản phẩm', key: 'product', width: 40 },
    { header: 'Giáo khu', key: 'zone', width: 24 },
    { header: 'Trạng thái', key: 'status', width: 12 },
    { header: 'Lý do hủy', key: 'reason', width: 32 },
  ];
  for (const v of votes) {
    detail.addRow({
      serial: formatSerial(v.token.serial),
      time: formatDateTime(v.createdAt),
      product: v.product.name,
      zone: v.zone?.name ?? '',
      status: v.status === 'VALID' ? 'Hợp lệ' : 'Đã hủy',
      reason: v.invalidReason ?? '',
    });
  }
  styleHeader(detail);

  const tokens = await prisma.voteToken.findMany({
    where: { contestId: contest.id, deletedAt: null },
    orderBy: { serial: 'asc' },
    include: { batch: { select: { label: true } }, zone: { select: { name: true } } },
  });
  const tokenSheet = wb.addWorksheet('Danh sách phiếu');
  tokenSheet.columns = [
    { header: 'Seri', key: 'serial', width: 10 },
    { header: 'Lô', key: 'batch', width: 28 },
    { header: 'Giáo khu', key: 'zone', width: 24 },
    { header: 'Trạng thái', key: 'status', width: 12 },
    { header: 'Thời điểm dùng', key: 'used', width: 20 },
    { header: 'Lý do vô hiệu', key: 'reason', width: 30 },
  ];
  for (const t of tokens) {
    tokenSheet.addRow({
      serial: formatSerial(t.serial),
      batch: t.batch.label,
      zone: t.zone?.name ?? '',
      status: STATUS_TOKEN[t.status],
      used: t.usedAt ? formatDateTime(t.usedAt) : '',
      reason: t.revokeReason ?? '',
    });
  }
  styleHeader(tokenSheet);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Các cột chung của danh sách phiếu (STT luôn là cột đầu tiên). */
const TOKEN_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: 'STT', key: 'no', width: 7 },
  { header: 'Số seri', key: 'serial', width: 10 },
  { header: 'Trạng thái', key: 'status', width: 12 },
  { header: 'Lô', key: 'batch', width: 28 },
  { header: 'Thời điểm dùng', key: 'used', width: 20 },
  { header: 'Bình chọn cho', key: 'product', width: 40 },
];

/**
 * Excel kèm lô phiếu vừa tạo — có mã nhập tay và ảnh QR.
 * Chỉ tạo được trong request sinh lô (mã gốc không lưu DB), giống PDF phiếu.
 */
export async function buildBatchWorkbook(
  ballots: GeneratedBallot[],
  info: { batchLabel: string; baseUrl: string; organizer: string },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = info.organizer;
  wb.created = new Date();
  const sheet = wb.addWorksheet('Phiếu bình chọn');
  sheet.columns = [
    ...TOKEN_COLUMNS,
    { header: 'Mã vote thủ công', key: 'code', width: 18 },
    { header: 'Mã QR', key: 'qr', width: 14 },
  ];
  styleHeader(sheet);

  const base = info.baseUrl.replace(/\/$/, '');
  const QR_PX = 90;
  for (let i = 0; i < ballots.length; i++) {
    const b = ballots[i]!;
    const row = sheet.addRow({
      no: i + 1,
      serial: formatSerial(b.serial),
      status: STATUS_TOKEN.ACTIVE,
      batch: info.batchLabel,
      used: '',
      product: '',
      code: formatToken(b.token),
    });
    row.height = QR_PX * 0.75 + 6; // điểm (pt) ≈ px × 0,75
    row.alignment = { vertical: 'middle' };
    row.getCell('code').font = { bold: true, size: 12, name: 'Consolas' };

    const png = await QRCode.toBuffer(`${base}/v/${b.token}`, { errorCorrectionLevel: 'M', margin: 1, width: QR_PX * 2 });
    const imageId = wb.addImage({ buffer: png as unknown as ExcelJS.Buffer, extension: 'png' });
    // Cột QR là cột thứ 8 (chỉ số 7), dòng dữ liệu bắt đầu từ chỉ số 1.
    sheet.addImage(imageId, { tl: { col: 7.1, row: row.number - 1 + 0.05 }, ext: { width: QR_PX, height: QR_PX }, editAs: 'oneCell' });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Excel tất cả phiếu của cuộc thi, lọc theo trạng thái (không có mã — DB chỉ lưu HMAC). */
export async function buildTokensWorkbook(contest: Contest, status?: TokenStatus): Promise<Buffer> {
  const tokens = await prisma.voteToken.findMany({
    where: { contestId: contest.id, deletedAt: null, status },
    orderBy: { serial: 'asc' },
    include: {
      batch: { select: { label: true } },
      vote: { select: { status: true, product: { select: { name: true } } } },
    },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = contest.organizer;
  wb.created = new Date();
  const sheet = wb.addWorksheet(status ? `Phiếu ${STATUS_TOKEN[status].toLowerCase()}` : 'Tất cả phiếu');
  sheet.columns = TOKEN_COLUMNS;
  tokens.forEach((t, i) => {
    sheet.addRow({
      no: i + 1,
      serial: formatSerial(t.serial),
      status: STATUS_TOKEN[t.status],
      batch: t.batch.label,
      used: t.usedAt ? formatDateTime(t.usedAt) : '',
      product: t.vote ? `${t.vote.product.name}${t.vote.status === 'INVALIDATED' ? ' (đã hủy)' : ''}` : '',
    });
  });
  styleHeader(sheet);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
