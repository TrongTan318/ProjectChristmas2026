# Duyệt bản đang chạy: xóa bản dự phòng cũ (hangda-app:previous) và dọn cache để giải phóng dung lượng.
#   powershell -ExecutionPolicy Bypass -File scripts/docker-accept.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (docker images -q hangda-app:previous) {
  docker rmi hangda-app:previous | Out-Null
  Write-Host 'Đã xóa bản dự phòng cũ.'
} else {
  Write-Host 'Không có bản dự phòng nào cần xóa.'
}
docker image prune -f | Select-Object -Last 1
docker builder prune -a -f | Select-Object -Last 1
docker system df
