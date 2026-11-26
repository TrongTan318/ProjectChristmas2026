-- "Ý nghĩa tác phẩm": gộp Ý tưởng thiết kế + Ý nghĩa tôn giáo + Thông điệp Giáng Sinh thành 1 trường.
-- Các phần cách nhau 1 dòng trống (thành đoạn riêng), phần trống bị bỏ qua. 3 cột cũ giữ nguyên làm dự phòng.
ALTER TABLE "products" ADD COLUMN "meaning" TEXT NOT NULL DEFAULT '';

UPDATE "products"
SET "meaning" = concat_ws(
  E'\n\n',
  NULLIF(btrim("design_idea", E' \t\r\n'), ''),
  NULLIF(btrim("religious_meaning", E' \t\r\n'), ''),
  NULLIF(btrim("christmas_message", E' \t\r\n'), '')
);
