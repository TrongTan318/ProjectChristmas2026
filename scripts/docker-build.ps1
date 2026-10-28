# Build lại web nhưng GIỮ bản đang chạy làm dự phòng (hangda-app:previous) cho tới khi duyệt.
#   powershell -ExecutionPolicy Bypass -File scripts/docker-build.ps1
# Duyệt bản mới:   scripts/docker-accept.ps1   (xóa bản dự phòng)
# Quay lại bản cũ: scripts/docker-rollback.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$latest = docker images -q hangda-app:latest
$previous = docker images -q hangda-app:previous
if ($latest -and -not $previous) {
  # Bản đang chạy là bản đã duyệt -> giữ làm dự phòng.
  docker tag hangda-app:latest hangda-app:previous
  Write-Host 'Đã giữ bản đang chạy làm dự phòng (hangda-app:previous).'
} elseif ($previous) {
  Write-Host 'Đã có bản dự phòng chưa duyệt -> giữ nguyên bản đó, chỉ thay bản mới.'
}

docker compose build app
if ($LASTEXITCODE -ne 0) { throw 'Build thất bại, bản đang chạy không bị thay đổi.' }
docker compose up -d app
if ($LASTEXITCODE -ne 0) { throw 'Khởi động bản mới thất bại. Chạy scripts/docker-rollback.ps1 để quay lại.' }

# Cache build không cần cho việc quay lại -> xóa ngay. Image mồ côi (bản chưa duyệt bị thay) cũng xóa.
docker builder prune -f | Select-Object -Last 1
docker image prune -f | Select-Object -Last 1
Write-Host 'Xong. Kiểm tra http://localhost:3000 rồi chạy docker-accept.ps1 (duyệt) hoặc docker-rollback.ps1 (quay lại).'
