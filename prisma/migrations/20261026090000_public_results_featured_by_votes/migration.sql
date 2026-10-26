-- Kết quả bình chọn luôn công khai + realtime; "Nổi bật" tính theo số phiếu (không chọn tay).
ALTER TABLE "contests" DROP COLUMN "results_public",
DROP COLUMN "results_realtime";

ALTER TABLE "products" DROP COLUMN "is_featured";
