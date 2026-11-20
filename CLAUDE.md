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

**Build lại web sau khi sửa code: luôn dùng script** (giữ bản cũ làm dự phòng, tự xóa build cache — máy dev ít dung lượng):
`powershell -ExecutionPolicy Bypass -File scripts/docker-build.ps1` → người dùng duyệt thì `scripts/docker-accept.ps1` (xóa bản dự phòng), không ưng thì `scripts/docker-rollback.ps1`. Không chạy `docker compose build` trực tiếp, không tải thêm image lớn khi chưa hỏi.

Trong container Node 22 (`docker run --rm -v "$PWD:/app" -w /app node:22-alpine ...`): `npm run typecheck`, `npm test`, `npx prisma migrate dev --name <ten>`.
Test tích hợp: `RUN_INTEGRATION=true DATABASE_URL=<db test riêng> npx vitest run tests/integration`.

## Cấu trúc

- `src/domain/` — logic thuần (token, trạng thái bình chọn, xếp hạng). Không import Next/Prisma.
- `src/server/` — `import 'server-only'`: db, env, auth (admin JWT + Argon2), vote-session, cache & rate-limit trong bộ nhớ, audit, storage, images (sharp), `services/` (voting, tokens, results, content), `reports/` (PDF phiếu, PDF biên bản, Excel).
- `src/app/(site)` trang công khai (nền tối, hiệu ứng) · `(vote)` luồng bình chọn (nền sáng, chữ to, không framer-motion) · `v/[token]` đích QR · `admin/(panel)` quản trị (server actions trong `actions.ts`) · `api/admin/*` upload, sinh phiếu PDF, export.
- Nhạc nền: quản lý ở `/admin/music` (bảng `music_tracks`, tệp `storage/media/music/<uuid>.<ext>`, upload qua `POST /api/admin/music`), **không để nhạc trong source/git**; `src/server/music.ts` đọc DB, `MusicPlayer` ở root layout (ẩn ở `/admin`). Video: ưu tiên link YouTube (`YouTubeFacade`), tránh upload MP4 lên server. Tuyết (`Snowfall`) chạy trên mọi thiết bị, không phụ thuộc reduced-motion — theo yêu cầu người dùng.
- `prisma/schema.prisma`, `prisma/seed.ts` · `deploy/` nginx + script backup/restore · `tests/unit`, `tests/integration`, `tests/load`.

## Quy tắc nghiệp vụ không được vi phạm

- 1 phiếu = 1 token = 1 lần bầu = 1 sản phẩm. `USED`/`REVOKED` không quay lại `ACTIVE` — **ngoại lệ duy nhất**: "Gỡ phiếu" (`resetVote`, `/admin/votes`) cho bầu nhầm/phiếu thử: Super Admin + mật khẩu + lý do, xóa hẳn lượt bầu (vì `UNIQUE(token_id)`) và đưa token `USED → ACTIVE` trong một transaction, bản ghi đầy đủ lưu ở audit `vote.reset`. Không gỡ được token `REVOKED`. Theo yêu cầu người dùng.
- Ghi phiếu trong **một transaction**: `updateMany ... WHERE status='ACTIVE'` (kiểm tra `count === 1`) + `vote.create` với `UNIQUE(token_id)` (`src/server/services/voting.ts`). Gửi lại cùng sản phẩm → trả biên nhận (idempotent).
- Token: CSPRNG, Crockford Base32 5 ký tự (25 bit, không gạch ngang); DB chỉ lưu `HMAC-SHA256(token, TOKEN_SECRET)` → PDF phiếu + Excel lô (mã nhập tay, ảnh QR) chỉ tải được 1 lần lúc tạo lô (`POST /api/admin/tokens/batches` trả JSON base64 cả 2 file). Excel danh sách phiếu xuất sau này (`GET /api/admin/tokens/export?status=`) không có cột mã.
- Nhận phiếu khi `votingStatus = OPEN` **và** trong `[votingStartAt, votingEndAt]` (`getVotingState`).
- Số phiếu + xếp hạng **luôn công khai**, `ResultsBoard` polling 10s (đã bỏ `resultsPublic/resultsRealtime` theo yêu cầu người dùng). "Nổi bật" = top 3 theo phiếu, bằng phiếu xét `viewCount` (`pickFeatured`, `listFeatured`); 0 phiếu thì không hiện. Không chọn tay.
- Lượt xem: trình duyệt gọi `POST /api/views` (`ViewTracker`), vì HTML công khai bị Nginx microcache; `recordView` chống trùng 1 IP/sản phẩm/30 phút.
- Thao tác nhạy cảm (mở/khóa, sinh/vô hiệu phiếu, hủy phiếu bầu, đổi kết quả, tài khoản): Super Admin + nhập lại mật khẩu (`requireSuperAdminWithPassword`) + `audit()`.
- Soft delete (`deletedAt`); khi xóa mềm bản ghi có cột unique thì đổi tên/slug để không chặn bản ghi mới.
- Giờ lưu UTC, hiển thị `Asia/Ho_Chi_Minh` (`src/lib/format.ts`).
- Nội dung do admin nhập hiển thị dạng text (`whitespace-pre-line`), **không render HTML**.

## Quy ước code

- Server action: `'use server'`, chỉ export hàm async; dạng `(prev: ActionState, form: FormData)` bọc bằng `runAction`, validate bằng Zod, gọi `requireAdmin/requireSuperAdmin…`, sau khi ghi gọi `invalidatePublic()` (hoặc `invalidate('r:')` cho kết quả) + `revalidatePath`.
- Trang đều `force-dynamic` (root layout); hiệu năng dựa vào cache bộ nhớ (`cached()`, TTL 5–30s) + microcache Nginx 10s. Ứng dụng giả định **1 instance**.
- Ảnh: biến thể `${key}-{400|800|1600}.webp`, dùng `mediaUrl/mediaSrcSet` và component `Picture`.
- Ảnh sản phẩm: mọi ảnh thuộc một giai đoạn (cột `stage` 1–3; ảnh cũ đã chuyển vào GĐ 1 bằng migration), tải và chọn ảnh đại diện ★ ở `/admin/stages`; API upload bắt buộc `stage`. Trang `/trien-lam/<slug>`: các khung giai đoạn (`StageGallery`, `<details>` thu gọn/mở) nằm trên mô tả ngắn, xếp 3 → 2 → 1, mở sẵn giai đoạn mới nhất có ảnh (`defaultOpenStage`). Ảnh đại diện: đánh dấu `isCover` → giai đoạn mới nhất (`pickCover`, `COVER_ORDER`). Tên/mô tả/bật-tắt giai đoạn ở Cài đặt (`stageNTitle/Note/Enabled`, `stageLabels`); giai đoạn tắt thì khách không thấy.
- Giáo xứ không có giáo khu: bảng `zones` và cột `zone_id` còn trong DB nhưng đã gỡ khỏi giao diện, báo cáo và sinh phiếu (luôn `zoneId: null`). Không thêm lại khi chưa hỏi.
- Màu: burgundy `#3B0907`, burgundy-light `#542C2A`, pine `#113621`, ink `#0F0908`, gold `#D4AF37`, ivory — token trong `src/app/globals.css` (Tailwind v4 `@theme`); nền tối xen kẽ `.bg-museum` (ánh đỏ) / `.bg-forest` (ánh xanh).
- Nút: kiểu kính mờ — `.btn-glass` (nút chính, kính xanh cây thông), `.btn-glass-clear` (nút phụ); chất liệu rời `.glass` + `.glass-green|clear|red`. Vùng nền sáng bọc `.surface-light` (trang bình chọn, admin) để kính đậm hơn.
- Trang `/v/*`, `/binh-chon`, `/vote` phải nhẹ: chữ ≥ 18px, nút ≥ 48px.

## Quy trình khi thêm tính năng / sửa code

### 1. Lên kế hoạch (chưa sửa gì)
- Đọc code liên quan, nêu rõ: hiện trạng → thay đổi đề xuất → file sẽ sửa → ảnh hưởng/rủi ro.
- Việc chưa rõ hoặc có nhiều cách làm → hỏi người dùng, kèm phương án khuyến nghị.
- Thay đổi chạm quy tắc nghiệp vụ (phiếu, token, phân quyền, kết quả) → nêu góc nhìn Security/QA và hỏi riêng.
- **Chỉ bắt đầu sửa khi người dùng đồng ý.** Đồng ý cho việc này không áp dụng cho việc khác.

### 2. Viết code
- Mở file đang sửa trong VS Code (`code -r -g "<file>:<dòng>"`) để người dùng theo dõi; lệnh terminal phải ghi ra trước khi chạy.
- Theo "Cấu trúc", "Quy ước code" và "Quy tắc nghiệp vụ" ở trên: logic trong `src/server/`, route/action chỉ validate (Zod) + kiểm tra quyền + gọi service; TypeScript strict, không `any`.
- Đổi `prisma/schema.prisma` → tạo migration và báo người còn lại.
- Không viết thêm tài liệu thiết kế; chỉ cập nhật CLAUDE.md khi quy tắc thay đổi.

### 3. Test
- Logic bình chọn, token, phân quyền, chống gian lận: **bắt buộc có hoặc sửa unit test**.
- Trước khi báo xong, chạy trong container Node 22: `npm ci && npx prisma generate && npx tsc --noEmit && npx vitest run tests/unit`
- Test fail → báo nguyên văn output, không báo "xong".

### 4. QC (kiểm tra trên web)
- Build bằng `scripts/docker-build.ps1`, kiểm tra trang liên quan (mã HTTP, ảnh chụp màn hình khi sửa giao diện), cả laptop và điện thoại nếu có chạm giao diện.
- Báo rõ cái gì đã kiểm tra, cái gì chưa (ví dụ cần đăng nhập admin mới thử được).
- Người dùng duyệt → `docker-accept.ps1`; không ưng → `docker-rollback.ps1`.

### 5. Đưa lên GitHub
- Chỉ khi người dùng yêu cầu. Theo `CONTRIBUTING.md`: nhánh `feature/…`/`fix/…` từ `develop` → Pull Request → CI ✅ → merge; `develop` → `main` qua PR rồi gắn tag `vX.Y.Z`.
- Trước khi push: đánh giá ảnh hưởng, hỏi ý kiến; backup bằng tag `backup/<ngày>/<nhánh>`.

### Checklist trước khi báo hoàn thành
- [ ] Người dùng đã duyệt kế hoạch
- [ ] Typecheck + unit test qua (có test mới nếu chạm phần bình chọn)
- [ ] Đã build và kiểm tra trên web; nêu rõ phần chưa kiểm tra
- [ ] CLAUDE.md cập nhật nếu quy tắc thay đổi
- [ ] Chưa commit/push nếu chưa được yêu cầu

## Khác với tài liệu kiến trúc

Không dùng Redis (cache/rate-limit trong bộ nhớ), không có worker riêng, Nginx + certbot cài trên host (không trong compose), auth admin tự viết (JWT jose) thay vì Auth.js, chưa có 2FA TOTP.

## Git

Conventional Commits. Chỉ commit/push khi được yêu cầu.
