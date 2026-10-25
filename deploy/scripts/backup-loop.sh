#!/bin/sh
# Chạy trong container "backup": pg_dump định kỳ, giữ BACKUP_KEEP bản gần nhất.
set -eu

INTERVAL="${BACKUP_INTERVAL_SECONDS:-3600}"
KEEP="${BACKUP_KEEP:-48}"
mkdir -p /backups

echo "[backup] bắt đầu, chu kỳ ${INTERVAL}s, giữ ${KEEP} bản"
while true; do
  STAMP="$(date +%Y%m%d-%H%M%S)"
  FILE="/backups/db-${STAMP}.dump"
  if pg_dump --format=custom --no-owner --file="${FILE}.tmp"; then
    mv "${FILE}.tmp" "${FILE}"
    echo "[backup] ${FILE} ($(du -h "${FILE}" | cut -f1))"
  else
    echo "[backup] LỖI pg_dump" >&2
    rm -f "${FILE}.tmp"
  fi
  # Xóa bản cũ, giữ KEEP bản mới nhất
  ls -1t /backups/db-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
  sleep "${INTERVAL}"
done
