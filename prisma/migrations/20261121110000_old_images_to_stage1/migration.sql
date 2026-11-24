-- Ảnh cũ (chưa gán giai đoạn) chuyển vào giai đoạn 1 theo yêu cầu người dùng; ảnh đại diện giữ nguyên is_cover.
-- Đảo ngược ngay sau deploy (trước khi tải thêm ảnh GĐ 1): UPDATE "product_images" SET "stage" = NULL WHERE "stage" = 1;
-- Sau khi đã tải thêm ảnh GĐ 1 thì không còn phân biệt được ảnh cũ với ảnh mới.
UPDATE "product_images" SET "stage" = 1 WHERE "stage" IS NULL;
