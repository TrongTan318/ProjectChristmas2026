# Quay web về bản dự phòng (bản cuối cùng đã duyệt) trong vài giây, không cần build lại.
#   powershell -ExecutionPolicy Bypass -File scripts/docker-rollback.ps1
# Lưu ý: chỉ đổi bản đang chạy; code trong git vẫn là bản mới (sửa/revert code riêng).
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (docker images -q hangda-app:previous)) { throw 'Không có bản dự phòng để quay lại.' }
docker tag hangda-app:previous hangda-app:latest
docker compose up -d --force-recreate app
if ($LASTEXITCODE -ne 0) { throw 'Khởi động bản dự phòng thất bại.' }
docker rmi hangda-app:previous | Out-Null   # chỉ gỡ tên "previous", image vẫn là bản đang chạy
docker image prune -f | Select-Object -Last 1
Write-Host 'Đã quay về bản dự phòng.'
