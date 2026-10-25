# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Dự án

**Hội Thi Hang Đá Giáng Sinh 2026** — Giáo xứ Bình Thới. Website triển lãm "Digital Museum" cho ~13 hang đá (mỗi đội = 1 lớp = 1 sản phẩm) + bình chọn bằng **1.000 phiếu giấy QR**, không đăng nhập. Dùng lại được cho các năm sau (dữ liệu gắn `contest_id`, cuộc thi đang chạy là `Contest.isActive`).

Người dùng muốn **viết code trực tiếp, không làm thêm tài liệu thiết kế**. `docs/01-BRD.md`, `docs/02-system-architecture.md` là tài liệu ban đầu (một số chi tiết đã được đơn giản hóa trong code, xem "Khác với tài liệu").

## Lệnh

Máy dev đang có Node 18 (quá cũ) → chạy mọi thứ qua Docker:

```bash
docker compose build && docker compose up -d postgres
docker compose run --rm migrate              # prisma migrate deploy
docker compose run --rm app npm run db:seed  # SEED_DEMO=true để có dữ liệu mẫu
docker compose up -d app                     # http://localhost:3000
```

Trong container Node 22 (`docker run --rm -v "$PWD:/app" -w /app node:22-alpine ...`): `npm run typecheck`, `npm test`, `npx prisma migrate dev --name <ten>`.
Test tích hợp: `RUN_INTEGRATION=true DATABASE_URL=<db test riêng> npx vitest run tests/integration`.

## Cấu trúc

- `src/domain/` — logic thuần (token, trạng thái bình chọn, xếp hạng). Không import Next/Prisma.
- `src/server/` — `import 'server-only'`: db, env, auth (admin JWT + Argon2), vote-session, cache & rate-limit trong bộ nhớ, audit, storage, images (sharp), `services/` (voting, tokens, results, content), `reports/` (PDF phiếu, PDF biên bản, Excel).
- `src/app/(site)` trang công khai (nền tối, hiệu ứng) · `(vote)` luồng bình chọn (nền sáng, chữ to, không framer-motion) · `v/[token]` đích QR · `admin/(panel)` quản trị (server actions trong `actions.ts`) · `api/admin/*` upload, sinh phiếu PDF, export.
- `prisma/schema.prisma`, `prisma/seed.ts` · `deploy/` nginx + script backup/restore · `tests/unit`, `tests/integration`, `tests/load`.

## Quy tắc nghiệp vụ không được vi phạm

- 1 phiếu = 1 token = 1 lần bầu = 1 sản phẩm. `USED`/`REVOKED` không bao giờ quay lại `ACTIVE`.
- Ghi phiếu trong **một transaction**: `updateMany ... WHERE status='ACTIVE'` (kiểm tra `count === 1`) + `vote.create` với `UNIQUE(token_id)` (`src/server/services/voting.ts`). Gửi lại cùng sản phẩm → trả biên nhận (idempotent).
- Token: CSPRNG 80 bit, Crockford Base32 16 ký tự; DB chỉ lưu `HMAC-SHA256(token, TOKEN_SECRET)` → PDF phiếu chỉ tải được 1 lần lúc tạo lô.
- Nhận phiếu khi `votingStatus = OPEN` **và** trong `[votingStartAt, votingEndAt]` (`getVotingState`).
- `resultsPublic = false` → `/api/results` trả 403, trang không lộ số phiếu.
- Thao tác nhạy cảm (mở/khóa, sinh/vô hiệu phiếu, hủy phiếu bầu, đổi kết quả, tài khoản): Super Admin + nhập lại mật khẩu (`requireSuperAdminWithPassword`) + `audit()`.
- Soft delete (`deletedAt`); khi xóa mềm bản ghi có cột unique thì đổi tên/slug để không chặn bản ghi mới.
- Giờ lưu UTC, hiển thị `Asia/Ho_Chi_Minh` (`src/lib/format.ts`).
- Nội dung do admin nhập hiển thị dạng text (`whitespace-pre-line`), **không render HTML**.

## Quy ước code

- Server action: `'use server'`, chỉ export hàm async; dạng `(prev: ActionState, form: FormData)` bọc bằng `runAction`, validate bằng Zod, gọi `requireAdmin/requireSuperAdmin…`, sau khi ghi gọi `invalidatePublic()` (hoặc `invalidate('r:')` cho kết quả) + `revalidatePath`.
- Trang đều `force-dynamic` (root layout); hiệu năng dựa vào cache bộ nhớ (`cached()`, TTL 5–30s) + microcache Nginx 10s. Ứng dụng giả định **1 instance**.
- Ảnh: biến thể `${key}-{400|800|1600}.webp`, dùng `mediaUrl/mediaSrcSet` và component `Picture`.
- Màu: gold `#D4AF37`, burgundy, ink (đen), ivory — token trong `src/app/globals.css` (Tailwind v4 `@theme`).
- Trang `/v/*`, `/binh-chon`, `/vote` phải nhẹ: chữ ≥ 18px, nút ≥ 48px.

## Khác với tài liệu kiến trúc

Không dùng Redis (cache/rate-limit trong bộ nhớ), không có worker riêng, Nginx + certbot cài trên host (không trong compose), auth admin tự viết (JWT jose) thay vì Auth.js, chưa có 2FA TOTP.

## Git

Conventional Commits. Chỉ commit/push khi được yêu cầu.
