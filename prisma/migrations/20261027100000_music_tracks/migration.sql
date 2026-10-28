-- Nhạc nền quản lý trong admin (thay cho file trong public/music).
CREATE TABLE "music_tracks" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "music_tracks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "music_tracks_file_key_key" ON "music_tracks"("file_key");
CREATE INDEX "music_tracks_contest_id_is_active_sort_order_idx" ON "music_tracks"("contest_id", "is_active", "sort_order");

ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
