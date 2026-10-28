/**
 * Seed dữ liệu ban đầu (chạy lại nhiều lần an toàn):
 *   - Vai trò, tài khoản Super Admin (từ SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
 *   - Cuộc thi "Hội Thi Hang Đá Giáng Sinh 2026", cài đặt mặc định, giáo khu mẫu
 *   - SEED_DEMO=true: 13 đội (Tiền Khai tâm → Hiệp sĩ 1), sản phẩm có ảnh minh họa, tin tức, nhà tài trợ
 */
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import sharp from 'sharp';
import { IMAGE_SIZES } from '../src/lib/media';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './storage/media');

async function main() {
  const superRole = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    create: { code: 'SUPER_ADMIN', name: 'Super Admin' },
    update: {},
  });
  await prisma.role.upsert({ where: { code: 'ADMIN' }, create: { code: 'ADMIN', name: 'Admin' }, update: {} });

  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (email && password) {
    if (password.length < 10) throw new Error('SEED_ADMIN_PASSWORD phải có ít nhất 10 ký tự');
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: { email, name: 'Super Admin', passwordHash: await hash(password), roleId: superRole.id },
      });
      console.log(`✔ Đã tạo Super Admin: ${email}`);
    } else {
      console.log(`• Super Admin ${email} đã tồn tại (giữ nguyên mật khẩu)`);
    }
  } else {
    console.warn('⚠ Chưa đặt SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD — bỏ qua tạo tài khoản.');
  }

  const contest = await prisma.contest.upsert({
    where: { slug: 'hang-da-giang-sinh-2026' },
    create: {
      slug: 'hang-da-giang-sinh-2026',
      name: 'Hội Thi Hang Đá Giáng Sinh 2026',
      organizer: 'Giáo xứ Bình Thới',
      year: 2026,
      isActive: true,
      votingStatus: 'LOCKED',
      votingStartAt: new Date('2026-12-20T18:00:00+07:00'),
      votingEndAt: new Date('2026-12-27T21:00:00+07:00'),
    },
    update: {},
  });
  console.log(`✔ Cuộc thi: ${contest.name}`);

  const zoneCount = await prisma.zone.count();
  if (zoneCount === 0) {
    await prisma.zone.createMany({
      data: ['Giáo khu 1', 'Giáo khu 2', 'Giáo khu 3', 'Giáo khu 4', 'Giáo khu 5'].map((name, i) => ({ name, sortOrder: i + 1 })),
    });
    console.log('✔ Đã tạo 5 giáo khu mẫu (đổi tên trong Admin → Giáo khu)');
  }

  if (process.env.SEED_DEMO === 'true') await seedDemo(contest.id);
}

// ===== Dữ liệu mẫu =====

const PALETTES = [
  ['#1b1035', '#6d1a2b', '#d4af37'],
  ['#0b1f3a', '#1e4078', '#f3dc8a'],
  ['#1a0f0a', '#5c2a12', '#e8b04a'],
  ['#0d2418', '#145a3c', '#d4af37'],
  ['#20081a', '#7a1f4f', '#f1d67a'],
];

function artworkSvg(seed: number, title: string, variant: number) {
  const [sky, glow, gold] = PALETTES[seed % PALETTES.length]!;
  const starX = 480 + ((seed * 37 + variant * 90) % 240) - 120;
  const stars = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 97 + seed * 31 + variant * 13) % 1200;
    const y = (i * 53 + seed * 17) % 380;
    return `<circle cx="${x}" cy="${y}" r="${(i % 3) + 1}" fill="#fff" opacity="${0.3 + (i % 5) / 10}"/>`;
  }).join('');
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1200 900">
  <defs>
    <radialGradient id="g" cx="${starX / 1200}" cy="0.18" r="0.9">
      <stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${sky}"/>
    </radialGradient>
    <radialGradient id="light" cx="0.5" cy="0.72" r="0.35">
      <stop offset="0" stop-color="#ffe9a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  ${stars}
  <path transform="translate(${starX} 150)" d="M0 -60 L14 -14 L60 0 L14 14 L0 60 L-14 14 L-60 0 L-14 -14Z" fill="${gold}"/>
  <path d="M${starX} 210 L600 560" stroke="${gold}" stroke-width="3" opacity="0.35"/>
  <path d="M0 760 Q 300 ${680 - variant * 20} 600 720 T 1200 740 L1200 900 L0 900Z" fill="#0d0a0b" opacity="0.85"/>
  <path d="M380 760 L600 ${520 - variant * 10} L820 760Z" fill="#2a1a12" stroke="${gold}" stroke-width="4"/>
  <rect x="440" y="620" width="320" height="140" fill="#1a0f0a"/>
  <ellipse cx="600" cy="690" rx="260" ry="130" fill="url(#light)"/>
  <ellipse cx="600" cy="715" rx="46" ry="22" fill="#f8efd8"/>
  <circle cx="530" cy="660" r="24" fill="#3a5a8c"/><rect x="510" y="680" width="40" height="70" rx="16" fill="#3a5a8c"/>
  <circle cx="672" cy="660" r="24" fill="#7a4a2a"/><rect x="652" y="680" width="40" height="70" rx="16" fill="#7a4a2a"/>
  <text x="600" y="860" font-family="Georgia, serif" font-size="34" fill="${gold}" text-anchor="middle">${safeTitle}</text>
</svg>`;
}

async function saveImage(svg: string, folder: string) {
  const key = `${folder}/${randomUUID()}`;
  const base = sharp(Buffer.from(svg));
  for (const size of IMAGE_SIZES) {
    const file = path.join(UPLOAD_DIR, `${key}-${size}.webp`);
    await mkdir(path.dirname(file), { recursive: true });
    await base.clone().resize({ width: size }).webp({ quality: 80 }).toFile(file);
  }
  const blur = await base.clone().resize(16).webp({ quality: 40 }).toBuffer();
  return { key, width: 1600, height: 1200, blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}` };
}

const CLASS_NAMES = [
  'Tiền Khai tâm', 'Khai tâm 1', 'Khai tâm 2', 'Rước lễ 1', 'Rước lễ 2', 'Rước lễ 3', 'Thêm sức 1',
  'Thêm sức 2', 'Thêm sức 3', 'Bao đồng 1', 'Bao đồng 2', 'Bao đồng 3', 'Hiệp sĩ 1',
];

const NAMES = [
  'Bêlem Ánh Sao', 'Đêm Thánh Vô Cùng', 'Ngôi Lời Nhập Thể', 'Hang Đá Yêu Thương', 'Vinh Danh Thiên Chúa',
  'Ánh Sáng Trần Gian', 'Máng Cỏ Khiêm Nhường', 'Bình An Dưới Thế', 'Thiên Thần Báo Tin', 'Ba Vua Tìm Chúa',
  'Gia Đình Thánh Gia', 'Hài Nhi Giêsu', 'Ngôi Sao Hy Vọng',
];

async function seedDemo(contestId: string) {
  if ((await prisma.team.count({ where: { contestId } })) > 0) {
    console.log('• Đã có dữ liệu đội — bỏ qua dữ liệu mẫu');
    return;
  }
  console.log('… Đang tạo dữ liệu mẫu (13 đội, ảnh minh họa)');
  for (let i = 0; i < 13; i++) {
    const name = NAMES[i]!;
    const className = CLASS_NAMES[i]!;
    const team = await prisma.team.create({
      data: { contestId, name: `Đội ${i + 1}`, className, leaderName: `Huynh trưởng ${className}`, sortOrder: i + 1 },
    });
    const product = await prisma.product.create({
      data: {
        contestId,
        teamId: team.id,
        name,
        slug: name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: `Hang đá “${name}” do các em ${className} thực hiện bằng vật liệu tái chế, gợi lại khung cảnh đêm Chúa giáng sinh tại Bêlem.`,
        designIdea:
          'Các em dùng giấy kraft, thùng carton và đá tự nhiên để dựng hang đá. Ánh sáng vàng ấm được bố trí từ trên cao, tượng trưng cho ngôi sao dẫn đường.\n\nPhía trước là con đường nhỏ dẫn vào hang, mời gọi mỗi người bước vào gặp gỡ Chúa Hài Đồng.',
        religiousMeaning:
          'Thiên Chúa đã chọn sinh ra trong cảnh nghèo hèn của hang đá Bêlem để ở cùng con người. Hang đá nhắc chúng ta sống khiêm nhường, đơn sơ và yêu thương.',
        christmasMessage: 'Chúa đến để mang bình an cho mọi tâm hồn thiện chí.\nHãy mở cửa lòng đón Chúa Hài Đồng.',
        status: 'PUBLISHED',
        sortOrder: i + 1,
      },
    });
    for (let v = 0; v < 3; v++) {
      const img = await saveImage(artworkSvg(i, name, v), `products/${product.id}`);
      await prisma.productImage.create({ data: { productId: product.id, ...img, alt: `${name} — ảnh ${v + 1}`, isCover: v === 0, sortOrder: v } });
    }
    process.stdout.write(`  ✔ ${name}\n`);
  }

  await prisma.announcement.createMany({
    data: [
      {
        contestId,
        slug: 'khai-mac-hoi-thi-hang-da-2026',
        title: 'Khai mạc Hội Thi Hang Đá Giáng Sinh 2026',
        excerpt: 'Hội thi chính thức khởi động với sự tham gia của 13 đội thiếu nhi.',
        content: 'Hội Thi Hang Đá Giáng Sinh 2026 chính thức khởi động. Mời cộng đoàn cùng theo dõi và cổ vũ các em thiếu nhi.\n\nPhiếu bình chọn sẽ được phát sau các Thánh lễ trong tuần Giáng Sinh.',
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        contestId,
        slug: 'huong-dan-binh-chon-bang-qr',
        title: 'Hướng dẫn bình chọn bằng phiếu QR',
        excerpt: 'Chỉ 3 bước đơn giản: quét mã, chọn hang đá, xác nhận.',
        content: 'Bước 1: Mở camera điện thoại và quét mã QR trên phiếu.\nBước 2: Chọn hang đá bạn yêu thích.\nBước 3: Bấm “Xác nhận bình chọn”.\n\nMỗi phiếu chỉ bình chọn được một lần.',
        isPublished: true,
        publishedAt: new Date(Date.now() - 86_400_000),
      },
    ],
  });
  await prisma.sponsor.createMany({
    data: [
      { contestId, name: 'Hội Đồng Mục Vụ Giáo Xứ', tier: 'Đồng hành', sortOrder: 1 },
      { contestId, name: 'Ban Giáo Lý Thiếu Nhi', tier: 'Đồng hành', sortOrder: 2 },
      { contestId, name: 'Ân nhân giáo xứ', tier: 'Tài trợ', sortOrder: 3 },
    ],
  });
  console.log('✔ Đã tạo dữ liệu mẫu');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
