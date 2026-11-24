-- Vật phẩm cá nhân: trang trưng bày riêng, không bình chọn, không gắn cuộc thi/lớp.
-- CreateTable
CREATE TABLE "personal_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maker" TEXT NOT NULL DEFAULT '',
    "meaning" TEXT NOT NULL DEFAULT '',
    "details" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "personal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_item_images" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "blur_data_url" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "personal_item_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personal_items_is_active_sort_order_idx" ON "personal_items"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "personal_item_images_key_key" ON "personal_item_images"("key");

-- CreateIndex
CREATE INDEX "personal_item_images_item_id_sort_order_idx" ON "personal_item_images"("item_id", "sort_order");

-- AddForeignKey
ALTER TABLE "personal_item_images" ADD CONSTRAINT "personal_item_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "personal_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
