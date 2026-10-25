# Hướng dẫn cùng lập trình

## Các nhánh

| Nhánh | Dùng để | Ai được đưa code vào |
|---|---|---|
| `main` | Bản ổn định — **chỉ bản này được deploy lên website thật** | Chỉ merge từ `develop` qua Pull Request khi CI ✅ |
| `develop` | Nơi gom code của mọi người, thử nghiệm chung | Merge từ nhánh tính năng qua Pull Request khi CI ✅ |
| `feature/...`, `fix/...` | Mỗi việc một nhánh riêng, tách từ `develop` | Người làm việc đó |

```
feature/sua-trang-ket-qua ──┐
feature/them-trang-doi   ───┼──► develop ──► main ──► (tag v1.x.x) ──► website
fix/loi-anh-mobile       ───┘
```

Không push thẳng vào `main` hay `develop`.

## Cài đặt lần đầu

Cần: **Git**, **Docker Desktop**, **VS Code**.

```bash
git clone https://github.com/TrongTan318/ProjectChristmas2026.git
cd ProjectChristmas2026
git checkout develop
cp .env.example .env
```

Sửa `.env` cho máy mình (không dùng mật khẩu của website thật, không commit file này):

```
DATABASE_URL=postgresql://hangda:matkhau123@postgres:5432/hangda?schema=public
POSTGRES_PASSWORD=matkhau123
PUBLIC_BASE_URL=http://localhost:3000
SESSION_SECRET=<chuỗi ngẫu nhiên ≥ 32 ký tự>
TOKEN_SECRET=<chuỗi ngẫu nhiên ≥ 32 ký tự>
IP_SALT=<chuỗi ngẫu nhiên ≥ 16 ký tự>
COOKIE_SECURE=false
SEED_ADMIN_EMAIL=admin@local.test
SEED_ADMIN_PASSWORD=<mật khẩu ≥ 10 ký tự>
SEED_DEMO=true
```

Chạy website trên máy:

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm migrate
docker compose run --rm app npm run db:seed
docker compose up -d app
```

Mở http://localhost:3000 và http://localhost:3000/admin.

## Mỗi lần làm một việc

```bash
# 1. Lấy code mới nhất
git checkout develop
git pull

# 2. Tạo nhánh cho việc mình làm
git checkout -b feature/ten-viec

# 3. Sửa code, rồi build lại để xem kết quả
docker compose build app && docker compose up -d app

# 4. Lưu và đẩy lên GitHub
git add .
git commit -m "feat: mô tả ngắn"
git push -u origin feature/ten-viec
```

Đặt tên nhánh: `feature/...` (thêm tính năng), `fix/...` (sửa lỗi). Viết thường, không dấu, nối bằng `-`.

Mô tả commit bắt đầu bằng: `feat:` thêm tính năng · `fix:` sửa lỗi · `style:` giao diện · `docs:` tài liệu · `ci:` cấu hình CI.

## Chạy CI

CI tự kiểm tra: lỗi TypeScript, toàn bộ test (có PostgreSQL thật), build thử website.

**CI tự chạy khi:**
- push lên `main` hoặc `develop`;
- tạo hoặc cập nhật một **Pull Request**.

**Cách dùng thường ngày — tạo Pull Request:**
1. Sau khi `git push` nhánh của mình, mở GitHub sẽ thấy nút **Compare & pull request** → bấm.
2. Chọn **base: `develop`** ← **compare: `feature/ten-viec`**, viết mô tả, bấm **Create pull request**.
3. Kéo xuống cuối trang Pull Request sẽ thấy CI đang chạy (khoảng 4–6 phút).
   - ✅ **All checks have passed** → báo người còn lại xem, rồi bấm **Merge pull request**.
   - ❌ **failing** → bấm **Details** để xem bước lỗi, sửa code, `git add . && git commit -m "fix: ..." && git push` — CI tự chạy lại trên cùng Pull Request.

**Chạy CI bằng tay trên nhánh của mình (chưa muốn tạo Pull Request):**
GitHub → tab **Actions** → chọn **CI** (bên trái) → **Run workflow** → chọn nhánh → **Run workflow**.

**Chạy kiểm tra ngay trên máy (trước khi push, nhanh hơn):**

```bash
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine sh -c "npm ci && npx prisma generate && npx tsc --noEmit && npx vitest run tests/unit"
```

Lệnh này chạy kiểm tra kiểu và unit test; test tích hợp với database chạy đầy đủ trên CI.

## Đưa lên website thật

Chỉ người quản lý repo làm: tạo Pull Request `develop` → `main`, CI ✅ thì merge, rồi gắn tag phiên bản (`git tag v1.1.0 && git push origin v1.1.0`).

## Lưu ý

- Luôn `git pull` trên `develop` trước khi tạo nhánh mới.
- Khi `git pull` báo **conflict**: VS Code tô màu hai phiên bản — chọn giữ bản đúng, lưu, rồi `git add . && git commit`.
- Không commit `.env`, `storage/`, `backups/` (đã có trong `.gitignore`).
- Sửa `prisma/schema.prisma` thì phải tạo migration (`npx prisma migrate dev --name ten-thay-doi`) và báo người còn lại.
- Quy tắc nghiệp vụ quan trọng (phiếu bầu, token, phân quyền) xem trong `CLAUDE.md` — sửa phần bình chọn phải có test đi kèm.
