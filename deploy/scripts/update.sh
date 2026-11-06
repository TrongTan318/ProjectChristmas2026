#!/usr/bin/env bash
# Cập nhật website trên server: lấy code mới → build → migrate → chạy bản mới → dọn rác Docker.
# Dọn ngay sau mỗi lần build để ổ đĩa server không đầy dần (image cũ + build cache ~1–3 GB/lần).
#   ./deploy/scripts/update.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "→ Lấy code mới"
git pull --ff-only

echo "→ Build (vài phút)"
docker compose build app

echo "→ Migration database"
docker compose run --rm migrate

echo "→ Chạy bản mới"
docker compose up -d app backup

echo "→ Kiểm tra website"
ok=0
for _ in $(seq 1 30); do
  if curl -fs http://127.0.0.1:3000/api/health >/dev/null; then ok=1; break; fi
  sleep 2
done
if [[ $ok == 1 ]]; then
  echo "✔ Website đang chạy"
else
  echo "✘ Website chưa phản hồi sau 60 giây — xem log: docker compose logs --tail=100 app" >&2
fi

echo "→ Dọn rác Docker: image cũ không còn dùng + toàn bộ build cache"
docker image prune -f
docker builder prune -a -f

echo "→ Dung lượng hiện tại"
df -h / | tail -1
docker system df

[[ $ok == 1 ]]
