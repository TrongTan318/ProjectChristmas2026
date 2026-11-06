#!/usr/bin/env bash
# Đẩy backup DB + media ra ngoài VPS bằng rclone (Google Drive, Cloudflare R2, S3...).
# Cài đặt: sudo apt install rclone && rclone config   (tạo remote tên "offsite")
# Cron (mỗi 6 giờ):  0 */6 * * * /srv/hangda/deploy/scripts/backup-offsite.sh >> /var/log/hangda-offsite.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/../.."

REMOTE="${RCLONE_REMOTE:-offsite:hangda-backup}"
echo "[$(date '+%F %T')] offsite → $REMOTE"
rclone copy backups "$REMOTE/db" --include 'db-*.dump' --max-age 7d
rclone sync storage/media "$REMOTE/media" --transfers 4
echo "[$(date '+%F %T')] xong"
