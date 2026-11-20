-- Ảnh theo giai đoạn thực hiện (1–3) trên trang chi tiết đội. Ảnh cũ giữ nguyên (stage = NULL = ảnh đại diện/ảnh chung).
ALTER TABLE "product_images" ADD COLUMN "stage" INTEGER;

CREATE INDEX "product_images_product_id_stage_sort_order_idx" ON "product_images"("product_id", "stage", "sort_order");
