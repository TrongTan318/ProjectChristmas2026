-- Tên đội không bắt buộc (có lớp chỉ có tên lớp). Lưu NULL khi trống: PostgreSQL coi các NULL là khác nhau
-- nên nhiều đội không tên vẫn qua được UNIQUE(contest_id, name); đội có tên vẫn không được trùng.
ALTER TABLE "teams" ALTER COLUMN "name" DROP NOT NULL;
