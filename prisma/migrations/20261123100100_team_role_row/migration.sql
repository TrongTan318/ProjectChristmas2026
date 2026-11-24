-- Dòng vai trò "Lớp" (tách migration riêng vì giá trị enum mới chỉ dùng được sau khi migration trước đã commit).
INSERT INTO "roles" ("code", "name", "created_at", "updated_at")
VALUES ('TEAM', 'Lớp', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;
