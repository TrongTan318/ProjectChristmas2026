# Hội Thi Hang Đá Giáng Sinh 2026 — Giáo xứ Bình Thới

Website triển lãm trực tuyến kiểu "Digital Museum" + bình chọn bằng **phiếu giấy có QR** (không cần đăng nhập).

- Công khai: Trang chủ · Triển lãm · Chi tiết sản phẩm (ảnh lớn, slideshow, zoom, video, chia sẻ) · Kết quả · Tin tức
- Bình chọn: quét QR `/v/<mã>` hoặc nhập mã tại `/vote` → chọn → xác nhận → token khóa vĩnh viễn
- Quản trị `/admin`: Dashboard, Đội, Sản phẩm, Phiếu QR (sinh lô + PDF in), Phiếu bầu, Giáo khu, Banner, Tin tức, Nhà tài trợ, Cài đặt (mở/khóa bình chọn, realtime), Tài khoản, Nhật ký; xuất Excel/PDF

Stack: Next.js 15 · TypeScript · Tailwind 4 · Framer Motion · PostgreSQL 16 · Prisma · Docker · Nginx.

---

## 1. Chạy thử trên máy (Docker)

Yêu cầu: Docker Desktop.

```bash
cp .env.example .env
# Sửa .env: đặt mật khẩu DB, SESSION_SECRET, TOKEN_SECRET, IP_SALT, SEED_ADMIN_*,
# PUBLIC_BASE_URL=http://localhost:3000, COOKIE_SECURE=false, SEED_DEMO=true

docker compose build
docker compose up -d postgres
docker compose run --rm migrate                 # tạo bảng
docker compose run --rm app npm run db:seed     # tài khoản admin + dữ liệu mẫu
docker compose up -d app
```

Mở http://localhost:3000 và http://localhost:3000/admin.

Phát triển với hot-reload (cần Node ≥ 20): `docker compose -f docker-compose.dev.yml up -d`, đặt
`DATABASE_URL=postgresql://hangda:hangda@localhost:5432/hangda`, `UPLOAD_DIR=./storage/media`, rồi
`npm install && npx prisma migrate dev && npm run db:seed && npm run dev`.

---

## 2. Triển khai VPS Ubuntu 24.04

Khuyến nghị: 2–4 vCPU, 4–8 GB RAM, 60 GB SSD. Trỏ DNS tên miền (bản ghi A) về IP VPS.

```bash
# 2.1 Hệ thống, tường lửa
sudo apt update && sudo apt -y upgrade
sudo apt -y install ca-certificates curl git ufw fail2ban nginx certbot python3-certbot-nginx
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
sudo timedatectl set-timezone Asia/Ho_Chi_Minh

# 2.2 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker

# 2.3 Mã nguồn
sudo mkdir -p /srv/hangda && sudo chown $USER:$USER /srv/hangda
git clone <repo-url> /srv/hangda && cd /srv/hangda
cp .env.example .env && nano .env      # điền giá trị thật (xem bên dưới)
mkdir -p storage/media backups && sudo chown -R 1001:1001 storage

# 2.4 Build & khởi tạo
docker compose build
docker compose up -d postgres
docker compose run --rm migrate
docker compose run --rm app npm run db:seed
docker compose up -d app backup
curl -s http://127.0.0.1:3000/api/health

# 2.5 Nginx + SSL
sudo cp deploy/nginx/hangda.conf /etc/nginx/sites-available/hangda.conf
sudo sed -i 's/hangda.example.com/TEN-MIEN-CUA-BAN/g' /etc/nginx/sites-available/hangda.conf
sudo ln -sf /etc/nginx/sites-available/hangda.conf /etc/nginx/sites-enabled/hangda.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/cache/nginx/hangda
sudo usermod -aG 1001 www-data 2>/dev/null || sudo chmod -R o+rX /srv/hangda/storage
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d TEN-MIEN-CUA-BAN --redirect -m email@cua-ban --agree-tos -n
```

Giá trị `.env` bắt buộc khi production:

| Biến | Gợi ý |
|---|---|
| `POSTGRES_PASSWORD` và mật khẩu trong `DATABASE_URL` | `openssl rand -hex 24` |
| `SESSION_SECRET`, `TOKEN_SECRET` | `openssl rand -base64 48` — **không đổi `TOKEN_SECRET` sau khi in phiếu** |
| `IP_SALT` | `openssl rand -hex 16` |
| `PUBLIC_BASE_URL` | `https://ten-mien` (được in vào QR) |
| `COOKIE_SECURE` | `true` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | tài khoản Super Admin đầu tiên (≥ 10 ký tự) |

Dùng Cloudflare (khuyến nghị, miễn phí): bật proxy cam, SSL mode **Full (strict)**, rồi
`sudo cp deploy/nginx/cloudflare-realip.conf /etc/nginx/snippets/` và bỏ comment dòng `include` trong `hangda.conf`.

**Cập nhật phiên bản mới**

```bash
cd /srv/hangda && git pull
docker compose build app && docker compose run --rm migrate && docker compose up -d app
```

---

## 3. Vận hành

### Quy trình hội thi
1. **Admin → Giáo khu**: đặt tên các giáo khu thật.
2. **Đội thi → Sản phẩm**: nhập nội dung, tải ảnh (≤ 20), video, chuyển **Xuất bản**.
3. **Cài đặt**: đặt thời gian mở/đóng bình chọn.
4. **Phiếu QR** (Super Admin): sinh lô 1.000 phiếu → PDF tải về **một lần duy nhất** → gửi nhà in. Gán giáo khu cho lô/dải seri khi phát.
5. In thử vài phiếu, quét thử trên Android + iPhone (mở bình chọn tạm, rồi vô hiệu các phiếu thử).
6. Ngày bình chọn: **Cài đặt → Mở bình chọn**. Theo dõi Dashboard. Đặt `BACKUP_INTERVAL_SECONDS=900` rồi `docker compose up -d backup`.
7. Kết thúc: **Khóa bình chọn** → Xuất Excel/PDF biên bản → bật **Công khai kết quả**.

### Sự cố thường gặp
| Tình huống | Xử lý |
|---|---|
| Phiếu bị mất / lộ | Phiếu QR → Vô hiệu phiếu theo seri |
| Nghi gian lận | Phiếu bầu → lọc "nghi vấn" → Hủy phiếu (có lý do, ghi nhật ký) |
| Cần dừng khẩn cấp | Cài đặt → Khóa bình chọn |
| Admin quên mật khẩu | Super Admin → Tài khoản → Đặt lại mật khẩu |
| Website không vào được | `docker compose ps`, `docker compose logs --tail=200 app`, `curl 127.0.0.1:3000/api/health` |

### Giám sát
- `GET /api/health` (kiểm tra DB). Gợi ý: UptimeRobot / Uptime Kuma ping mỗi 1 phút, báo qua email/Telegram.
- Log: `docker compose logs -f app`. Nginx: `/var/log/nginx/`.

---

## 4. Backup & khôi phục

- Container `backup` chạy `pg_dump` mỗi `BACKUP_INTERVAL_SECONDS` vào `./backups`, giữ `BACKUP_KEEP` bản.
- Ảnh/video nằm ở `./storage/media`.
- Sao lưu ngoài VPS: cài `rclone`, `rclone config` (remote tên `offsite`), thêm cron:
  `0 */6 * * * /srv/hangda/deploy/scripts/backup-offsite.sh >> /var/log/hangda-offsite.log 2>&1`
- Bật snapshot VPS của nhà cung cấp trước ngày bình chọn.

Khôi phục DB: `./deploy/scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.dump` (tự backup trạng thái hiện tại trước khi ghi đè).
Khôi phục media: `rclone copy offsite:hangda-backup/media storage/media`.

**Mất VPS hoàn toàn (DR)**: dựng VPS mới theo mục 2 (dùng lại `.env` cũ — đặc biệt `TOKEN_SECRET`), khôi phục media, chạy `restore.sh` với bản backup mới nhất, trỏ DNS sang IP mới. Mục tiêu RTO ≤ 1 giờ.

---

## 5. Kiểm thử

```bash
npm test                                   # unit test (token, trạng thái bình chọn, xếp hạng…)
# Tích hợp với PostgreSQL thật — dùng DB RIÊNG vì dữ liệu sẽ bị xóa:
RUN_INTEGRATION=true DATABASE_URL=postgresql://.../hangda_test npx vitest run tests/integration
# Tải: cài k6, tạo phiếu thử rồi
k6 run -e BASE_URL=https://ten-mien tests/load/browse.k6.js
```

Kịch bản đã có test tự động: vote trùng, token giả, token hết hạn, token bị vô hiệu, session giả mạo, 30 request đồng thời cùng 1 token, 200 người vote đồng thời.

## 6. Bảo mật (tóm tắt)
Token 80-bit CSPRNG, DB chỉ lưu HMAC · ghi phiếu trong transaction + `UNIQUE(token_id)` · rate limit ứng dụng + Nginx · Argon2id, khóa tài khoản sau 5 lần sai, xác nhận mật khẩu cho thao tác nhạy cảm · CSP, HSTS, cookie HttpOnly/SameSite · Prisma (truy vấn tham số hóa) · nội dung hiển thị dạng văn bản thuần (không render HTML) · ảnh được giải mã lại và xóa EXIF/GPS · Audit log cho mọi thao tác quản trị.
