#!/usr/bin/env bash
# Khôi phục database từ một bản backup.
#   ./deploy/scripts/restore.sh backups/db-20261224-210000.dump
set -euo pipefail
cd "$(dirname "$0")/../.."

FILE="${1:-}"
if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Cách dùng: $0 <đường-dẫn-file-.dump>"
  echo "Các bản backup gần nhất:"; ls -1t backups/db-*.dump 2>/dev/null | head -10
  exit 1
fi

set -a; source .env; set +a

echo "⚠ Sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng: $FILE"
read -r -p "Gõ 'KHOI PHUC' để tiếp tục: " CONFIRM
[[ "$CONFIRM" == "KHOI PHUC" ]] || { echo "Đã hủy."; exit 1; }

echo "→ Sao lưu trạng thái hiện tại trước khi khôi phục"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom > "backups/pre-restore-$(date +%Y%m%d-%H%M%S).dump"

echo "→ Dừng ứng dụng"
docker compose stop app

echo "→ Khôi phục"
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner < "$FILE"

echo "→ Chạy migration (nếu bản backup cũ hơn code hiện tại)"
docker compose run --rm migrate

echo "→ Khởi động lại ứng dụng"
docker compose start app
echo "✔ Khôi phục xong."
