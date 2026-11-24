-- Tài khoản lớp (vai trò TEAM): đăng nhập bằng username, gắn với 1 đội.
-- AlterEnum
ALTER TYPE "RoleCode" ADD VALUE 'TEAM';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL,
ADD COLUMN "username" TEXT,
ADD COLUMN "team_id" TEXT;

-- AlterTable: tên/mô tả/bật-tắt giai đoạn riêng từng lớp
ALTER TABLE "products" ADD COLUMN "stage_config" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_team_id_idx" ON "users"("team_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
