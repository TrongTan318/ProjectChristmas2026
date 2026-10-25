# BRD — Hội Thi Hang Đá Giáng Sinh 2026

| Mục | Nội dung |
|---|---|
| Đơn vị tổ chức | Giáo xứ Bình Thới |
| Phiên bản | 0.1 (bản nháp chờ duyệt) |
| Ngày | 2026-10-24 |
| Trạng thái | Phase 1 — Phân tích yêu cầu |

---

## 1. Tổng quan

### 1.1 Bối cảnh

Giáo xứ Bình Thới tổ chức hội thi làm hang đá Giáng Sinh cho khoảng 13 đội thiếu nhi (mỗi đội thuộc một lớp giáo lý). Ban tổ chức cần một website để:

- Trưng bày trực tuyến các hang đá theo phong cách "Digital Museum" nghệ thuật Công giáo.
- Cho giáo dân bình chọn bằng **phiếu giấy có QR Code**, không cần tạo tài khoản.
- Công bố kết quả minh bạch, xuất báo cáo.
- Dùng lại được cho các cuộc thi những năm sau.

### 1.2 Mục tiêu kinh doanh

| # | Mục tiêu | Chỉ số đo |
|---|---|---|
| G1 | Triển lãm trực tuyến toàn bộ sản phẩm | 100% đội có trang sản phẩm đầy đủ trước ngày mở bình chọn |
| G2 | Bình chọn an toàn, minh bạch | 0 phiếu bị tính 2 lần; mọi phiếu truy vết được theo số seri |
| G3 | Dễ dùng cho mọi lứa tuổi | Người lớn tuổi bình chọn xong trong ≤ 4 thao tác, ≤ 60 giây |
| G4 | Trải nghiệm đẹp trên điện thoại | Lighthouse Mobile ≥ 85 (Performance), ≥ 95 (Accessibility) |
| G5 | Tái sử dụng | Tạo cuộc thi mới chỉ bằng cấu hình trong Admin, không sửa code |

### 1.3 Phạm vi

**Trong phạm vi**

- Website công khai: trang chủ, triển lãm, chi tiết sản phẩm, bình chọn, kết quả/xếp hạng, tin tức, nhà tài trợ.
- Hệ thống phiếu QR: sinh 1.000 token, xuất file in phiếu (PDF), bình chọn, khóa token.
- Trang quản trị: đội, sản phẩm, media, token, phiếu bầu, banner, nội dung, cài đặt, thống kê, báo cáo Excel/PDF, nhật ký hệ thống.
- Triển khai trên VPS Ubuntu 24.04 bằng Docker.

**Ngoài phạm vi (phiên bản này)**

- Tài khoản cho người xem/người bình chọn (chỉ Admin có tài khoản).
- Thanh toán, bán vé.
- Ứng dụng di động native.
- Đa ngôn ngữ (chỉ tiếng Việt; kiến trúc để sẵn khả năng mở rộng).
- In phiếu vật lý (hệ thống chỉ xuất file PDF để nhà in in).

### 1.4 Mốc thời gian (đề xuất, cần xác nhận)

| Mốc | Ngày dự kiến |
|---|---|
| Duyệt BRD + kiến trúc | 2026-10-31 |
| Hoàn tất phần mềm (Sprint 1–5) | 2026-12-05 |
| Nhập liệu sản phẩm + xuất PDF phiếu để in | 2026-12-05 → 12-12 |
| UAT + diễn tập vote thử | 2026-12-13 → 12-15 |
| Mở bình chọn | **Cần xác nhận** (ví dụ: 2026-12-20) |
| Đóng bình chọn / công bố | **Cần xác nhận** (ví dụ: 2026-12-27) |

---

## 2. Các bên liên quan và Actor

### 2.1 Các bên liên quan

| Bên liên quan | Quan tâm chính |
|---|---|
| Cha xứ / Ban tổ chức | Minh bạch, đúng tinh thần Công giáo, kết quả đáng tin cậy |
| Các đội thiếu nhi + huynh trưởng | Sản phẩm được trưng bày đẹp, công bằng |
| Giáo dân (người bình chọn) | Dễ dùng, nhanh, không phải đăng ký |
| Nhà tài trợ | Logo/thương hiệu được hiển thị |
| Người vận hành kỹ thuật | Dễ triển khai, sao lưu, khôi phục |

### 2.2 Actor

| Actor | Mô tả | Xác thực |
|---|---|---|
| **Guest** | Bất kỳ ai truy cập website | Không |
| **Voter** | Người cầm phiếu giấy hợp lệ, đã quét QR. Không phải tài khoản, chỉ là phiên gắn với 1 token | Token trên phiếu |
| **Admin** | Thành viên ban tổ chức quản lý nội dung, sản phẩm, token, xem thống kê | Email + mật khẩu (+ 2FA khuyến nghị) |
| **Super Admin** | Toàn quyền: quản lý Admin, cài đặt hệ thống, mở/khóa bình chọn, hủy phiếu | Email + mật khẩu + **2FA bắt buộc** |
| **System** (actor phụ) | Tác vụ tự động: mở/đóng bình chọn theo lịch, sao lưu, tổng hợp thống kê | — |

---

## 3. Use Cases

### 3.1 Danh sách Use Case

| ID | Use Case | Actor chính |
|---|---|---|
| **Triển lãm** | | |
| UC-01 | Xem trang chủ | Guest |
| UC-02 | Duyệt triển lãm (danh sách, lọc theo lớp) | Guest |
| UC-03 | Xem chi tiết sản phẩm | Guest |
| UC-04 | Xem ảnh lớn / slideshow / phóng to | Guest |
| UC-05 | Xem video (YouTube / video giới thiệu) | Guest |
| UC-06 | Chia sẻ liên kết sản phẩm | Guest |
| UC-07 | Xem bảng xếp hạng, kết quả (khi được bật) | Guest |
| UC-08 | Xem tin tức, nhà tài trợ | Guest |
| **Bình chọn** | | |
| UC-10 | Quét QR, vào trang bình chọn | Voter |
| UC-11 | Nhập mã phiếu thủ công (khi không quét được QR) | Voter |
| UC-12 | Chọn sản phẩm yêu thích | Voter |
| UC-13 | Xác nhận bình chọn | Voter |
| UC-14 | Xem màn hình cảm ơn / trạng thái phiếu đã dùng | Voter |
| **Quản trị** | | |
| UC-20 | Đăng nhập / đăng xuất / 2FA | Admin, Super Admin |
| UC-21 | Quản lý đội (CRUD, gán lớp) | Admin |
| UC-22 | Quản lý sản phẩm (CRUD, nội dung, nổi bật, thứ tự) | Admin |
| UC-23 | Quản lý ảnh (upload, sắp xếp, ảnh đại diện, tối đa 20) | Admin |
| UC-24 | Quản lý video | Admin |
| UC-25 | Sinh lô token | Super Admin |
| UC-26 | Xuất PDF in phiếu QR | Admin |
| UC-27 | Tra cứu / vô hiệu hóa token (phiếu mất, hỏng) | Admin (tra cứu), Super Admin (vô hiệu) |
| UC-28 | Xem / hủy phiếu bầu gian lận | Admin (xem), Super Admin (hủy) |
| UC-29 | Mở / khóa bình chọn | Super Admin |
| UC-30 | Bật / tắt hiển thị kết quả realtime | Super Admin |
| UC-31 | Quản lý banner, giới thiệu, tin tức, nhà tài trợ | Admin |
| UC-32 | Xem dashboard thống kê | Admin |
| UC-33 | Xuất báo cáo Excel / PDF | Admin |
| UC-34 | Quản lý tài khoản Admin | Super Admin |
| UC-35 | Cài đặt hệ thống (tên cuộc thi, thời gian, đếm ngược...) | Super Admin |
| UC-36 | Xem nhật ký hệ thống (Audit Log) | Super Admin |
| **Hệ thống** | | |
| UC-40 | Tự động mở/đóng bình chọn theo lịch | System |
| UC-41 | Sao lưu dữ liệu định kỳ | System |

### 3.2 Đặc tả Use Case quan trọng

#### UC-10 → UC-13: Bình chọn bằng QR

| Mục | Nội dung |
|---|---|
| Actor | Voter |
| Tiền điều kiện | Phiếu giấy hợp lệ, trạng thái token = `ACTIVE`, bình chọn đang mở |
| Hậu điều kiện | 1 bản ghi `Vote` được tạo; token chuyển `USED` vĩnh viễn |
| Kích hoạt | Voter quét QR bằng camera điện thoại |

**Luồng chính**

1. Voter quét QR, trình duyệt mở `https://<domain>/v/<token>`.
2. Hệ thống kiểm tra token (tồn tại, `ACTIVE`, bình chọn đang mở).
3. Hệ thống hiển thị lời chào và danh sách sản phẩm dạng thẻ lớn (ảnh, tên, lớp).
4. Voter có thể chạm "Xem chi tiết" để xem sản phẩm, rồi quay lại (vẫn giữ phiên bình chọn).
5. Voter chạm "Chọn" trên một sản phẩm.
6. Hệ thống hiển thị màn hình xác nhận: ảnh lớn + tên sản phẩm + nút "Xác nhận bình chọn" và "Chọn lại".
7. Voter chạm "Xác nhận bình chọn".
8. Hệ thống ghi phiếu và khóa token trong **một transaction nguyên tử**.
9. Hệ thống hiển thị màn hình cảm ơn (sản phẩm đã chọn, thời gian, số seri phiếu).

**Luồng thay thế**

- 2a. Token không tồn tại / sai định dạng → "Mã phiếu không hợp lệ" + hướng dẫn liên hệ ban tổ chức. Tính vào bộ đếm sai của IP.
- 2b. Token đã dùng → "Phiếu này đã được sử dụng lúc hh:mm ngày dd/mm". Không tiết lộ đã chọn sản phẩm nào.
- 2c. Token bị vô hiệu → "Phiếu này đã bị vô hiệu hóa".
- 2d. Bình chọn chưa mở → hiển thị đồng hồ đếm ngược; vẫn cho xem triển lãm.
- 2e. Bình chọn đã khóa/đóng → "Bình chọn đã kết thúc".
- 8a. Hai thiết bị cùng gửi một token cùng lúc → chỉ một request thành công, request còn lại nhận lỗi 2b.
- 8b. Mất mạng khi gửi → nút hiển thị "Đang gửi..." và cho thử lại. Thử lại an toàn (idempotent): nếu phiếu đã được ghi bởi chính request trước, trả về màn hình cảm ơn.

**UC-11: Nhập mã thủ công**: Trang `/vote` có ô nhập mã in trên phiếu (dạng `XXXX-XXXX-XXXX-XXXX`, không phân biệt hoa thường, bỏ qua dấu gạch và khoảng trắng). Sau đó vào luồng chính từ bước 2.

#### UC-25 / UC-26: Sinh token và xuất phiếu in

1. Super Admin chọn "Tạo lô token": số lượng (mặc định 1.000), giáo khu được phân phối (tùy chọn), ghi chú.
2. Hệ thống sinh token ngẫu nhiên bảo mật, gán số seri tăng dần (0001–1000), lưu **giá trị băm** của token.
3. Hệ thống tạo ngay file PDF phiếu (QR + mã thủ công + số seri + hướng dẫn 3 bước), **chỉ tải được một lần** hoặc trong thời hạn ngắn (vì token gốc không được lưu trong DB).
4. Mọi thao tác được ghi Audit Log.

#### UC-29 / UC-30: Mở/khóa bình chọn, bật/tắt realtime

- Thao tác cần xác nhận lại (nhập mật khẩu hoặc mã 2FA).
- Thay đổi có hiệu lực ngay (≤ 5 giây), ghi Audit Log kèm lý do.

---

## 4. User Stories

Định dạng: *Là [actor], tôi muốn [hành động] để [lợi ích].* Độ ưu tiên theo MoSCoW (M = Must, S = Should, C = Could).

### 4.1 Guest / Triển lãm

| ID | User Story | Ưu tiên | Tiêu chí chấp nhận (tóm tắt) |
|---|---|---|---|
| US-01 | Là Guest, tôi muốn thấy trang chủ trang trọng và có không khí Giáng Sinh để cảm nhận được tinh thần hội thi | M | Có đủ 10 khu vực trang chủ; hiệu ứng có thể tắt; tải < 3s trên 4G |
| US-02 | Là Guest, tôi muốn xem danh sách tất cả hang đá để chọn hang đá muốn xem | M | Hiển thị đủ 13 sản phẩm; lọc theo lớp; ảnh lazy-load |
| US-03 | Là Guest, tôi muốn đọc ý tưởng, ý nghĩa tôn giáo và thông điệp của mỗi hang đá để hiểu tác phẩm | M | Các trường hiển thị theo bố cục "bảng chú thích bảo tàng" |
| US-04 | Là Guest, tôi muốn xem ảnh toàn màn hình, vuốt qua lại, phóng to để thấy chi tiết | M | Lightbox hỗ trợ vuốt, pinch-zoom, phím mũi tên, slideshow tự chạy |
| US-05 | Là Guest, tôi muốn xem video YouTube và video giới thiệu ngay trên trang | M | Video chỉ tải khi người dùng chạm play (facade) |
| US-06 | Là Guest, tôi muốn chia sẻ liên kết sản phẩm qua Zalo/Facebook để mời người khác xem | M | Nút chia sẻ (Web Share API + sao chép link); có ảnh xem trước Open Graph |
| US-07 | Là Guest, tôi muốn xem bảng xếp hạng để biết đội nào dẫn đầu | S | Chỉ hiển thị khi Admin bật; ngoài ra hiển thị "Kết quả sẽ công bố sau" |
| US-08 | Là Guest, tôi muốn xem đồng hồ đếm ngược để biết khi nào mở/đóng bình chọn | S | Đếm theo giờ server, múi giờ Việt Nam |
| US-09 | Là Guest, tôi muốn đọc tin tức và thấy nhà tài trợ | C | Danh sách tin, trang chi tiết tin; khu logo nhà tài trợ |

### 4.2 Voter

| ID | User Story | Ưu tiên | Tiêu chí chấp nhận (tóm tắt) |
|---|---|---|---|
| US-10 | Là Voter lớn tuổi, tôi muốn quét QR là vào thẳng trang bình chọn, không phải đăng ký | M | Không có màn hình đăng nhập; ≤ 4 thao tác từ quét đến xong |
| US-11 | Là Voter, tôi muốn chữ to, nút to, hướng dẫn rõ ràng để không bấm nhầm | M | Font ≥ 18px, nút ≥ 48px, tương phản AA, có màn hình xác nhận |
| US-12 | Là Voter, tôi muốn xem chi tiết sản phẩm trước khi chọn | M | Xem chi tiết rồi quay lại không mất phiên |
| US-13 | Là Voter, tôi muốn nhập mã bằng tay nếu không quét được QR | M | Ô nhập chấp nhận chữ thường và có/không dấu gạch |
| US-14 | Là Voter, tôi muốn biết chắc phiếu đã được ghi nhận | M | Màn hình cảm ơn có tên sản phẩm, thời gian, số seri |
| US-15 | Là Voter, tôi muốn được báo rõ ràng nếu phiếu đã dùng hoặc không hợp lệ | M | Thông báo dễ hiểu, không thuật ngữ kỹ thuật, có số liên hệ BTC |

### 4.3 Admin / Super Admin

| ID | User Story | Ưu tiên |
|---|---|---|
| US-20 | Là Admin, tôi muốn đăng nhập an toàn để quản trị | M |
| US-21 | Là Admin, tôi muốn tạo/sửa đội và gán lớp | M |
| US-22 | Là Admin, tôi muốn nhập đầy đủ thông tin sản phẩm và xem trước trước khi xuất bản | M |
| US-23 | Là Admin, tôi muốn upload nhiều ảnh cùng lúc, kéo thả sắp xếp, chọn ảnh đại diện | M |
| US-24 | Là Super Admin, tôi muốn sinh 1.000 token và tải PDF phiếu để đem in | M |
| US-25 | Là Admin, tôi muốn tra cứu một phiếu theo số seri để giải đáp thắc mắc của giáo dân | M |
| US-26 | Là Super Admin, tôi muốn vô hiệu hóa các phiếu bị mất hoặc nghi gian lận | M |
| US-27 | Là Super Admin, tôi muốn mở/khóa bình chọn ngay lập tức khi có sự cố | M |
| US-28 | Là Super Admin, tôi muốn bật/tắt hiển thị kết quả realtime | M |
| US-29 | Là Admin, tôi muốn xem dashboard với số liệu và biểu đồ | M |
| US-30 | Là Admin, tôi muốn xuất kết quả ra Excel và PDF để công bố/lưu trữ | M |
| US-31 | Là Admin, tôi muốn quản lý banner, tin tức, nhà tài trợ, nội dung giới thiệu | S |
| US-32 | Là Super Admin, tôi muốn xem nhật ký ai đã làm gì, lúc nào | M |
| US-33 | Là Super Admin, tôi muốn quản lý tài khoản Admin | M |
| US-34 | Là Super Admin, tôi muốn tạo cuộc thi mới cho năm sau mà không mất dữ liệu năm nay | S |

---

## 5. Functional Requirements

### 5.1 Trang chủ (FR-HOME)

| ID | Yêu cầu |
|---|---|
| FR-HOME-01 | Hero Banner: ảnh/video nền, tiêu đề chương trình, nút "Vào triển lãm" và "Bình chọn"; nội dung quản lý từ Admin, hỗ trợ nhiều banner (carousel) |
| FR-HOME-02 | Giới thiệu chương trình (rich text từ Admin) |
| FR-HOME-03 | Đồng hồ đếm ngược đến mốc kế tiếp (mở bình chọn → đóng bình chọn → công bố) |
| FR-HOME-04 | Video giới thiệu (YouTube embed dạng facade) |
| FR-HOME-05 | Sản phẩm nổi bật (Admin đánh dấu, có thứ tự) |
| FR-HOME-06 | Danh sách sản phẩm (dạng lưới, link đến triển lãm) |
| FR-HOME-07 | Bảng xếp hạng (Top N, chỉ hiển thị khi bật cài đặt công khai kết quả) |
| FR-HOME-08 | Tin tức (3–6 tin mới nhất) |
| FR-HOME-09 | Nhà tài trợ (logo, liên kết, phân hạng) |
| FR-HOME-10 | Footer: thông tin giáo xứ, liên hệ, mạng xã hội |

### 5.2 Triển lãm và sản phẩm (FR-EXH)

| ID | Yêu cầu |
|---|---|
| FR-EXH-01 | Trang triển lãm hiển thị tất cả sản phẩm đã xuất bản; lọc theo lớp; sắp xếp theo thứ tự Admin / tên |
| FR-EXH-02 | Trang chi tiết có URL thân thiện `/trien-lam/<slug>` |
| FR-EXH-03 | Trường sản phẩm: tên, mô tả ngắn, ý tưởng thiết kế, ý nghĩa tôn giáo, thông điệp Giáng Sinh, ảnh đại diện, album (≤ 20 ảnh), ≥ 0 video YouTube, video giới thiệu (tùy chọn) |
| FR-EXH-04 | Lightbox: xem ảnh lớn, vuốt/phím mũi tên, pinch-zoom/double-tap zoom, slideshow tự chạy, đếm "3/20" |
| FR-EXH-05 | Video YouTube nhúng dạng facade (chỉ tải iframe khi chạm play) |
| FR-EXH-06 | Chia sẻ: Web Share API, fallback sao chép link; thẻ Open Graph / Twitter Card theo từng sản phẩm |
| FR-EXH-07 | Đếm lượt xem sản phẩm (tối đa 1 lượt / phiên / sản phẩm / 30 phút, loại trừ bot) |
| FR-EXH-08 | Nút "Bình chọn sản phẩm này" chỉ hiển thị khi đang trong phiên bình chọn hợp lệ |

### 5.3 Token và bình chọn (FR-VOTE)

| ID | Yêu cầu |
|---|---|
| FR-VOTE-01 | Sinh token bằng CSPRNG, ≥ 80 bit entropy, mã hóa Crockford Base32 16 ký tự (hiển thị `XXXX-XXXX-XXXX-XXXX`) |
| FR-VOTE-02 | DB chỉ lưu `HMAC-SHA256(token, server_secret)`; không lưu token gốc |
| FR-VOTE-03 | Mỗi token có số seri công khai (in trên phiếu) để tra cứu/vô hiệu mà không cần token gốc |
| FR-VOTE-04 | Trạng thái token: `ACTIVE` → `USED` hoặc `REVOKED`; không có chuyển trạng thái ngược lại |
| FR-VOTE-05 | URL QR: `https://<domain>/v/<token>`; trang `/vote` cho nhập thủ công |
| FR-VOTE-06 | Mỗi token bầu đúng **1 sản phẩm** (cấu hình được `votes_per_token`, mặc định 1) |
| FR-VOTE-07 | Ghi phiếu + khóa token trong 1 transaction: `UPDATE ... WHERE status='ACTIVE'` (kiểm tra số dòng bị ảnh hưởng) + `INSERT vote`; `UNIQUE(token_id)` trên bảng votes |
| FR-VOTE-08 | Chỉ nhận phiếu khi `voting_status = OPEN` và thời điểm hiện tại nằm trong `[voting_start, voting_end]` |
| FR-VOTE-09 | Lưu metadata chống gian lận: thời gian, IP (đã băm), User-Agent, fingerprint nhẹ; dùng để phát hiện bất thường, không hiển thị công khai |
| FR-VOTE-10 | Rate limit: xác thực token ≤ 10 lần/phút/IP; ≥ 20 lần sai/giờ/IP → chặn 1 giờ |
| FR-VOTE-11 | Super Admin hủy phiếu (soft): phiếu bị đánh dấu `INVALIDATED` kèm lý do, không tính vào kết quả, token vẫn khóa |
| FR-VOTE-12 | Xuất PDF phiếu: mỗi phiếu gồm logo, tên cuộc thi, QR, mã thủ công, số seri, hướng dẫn 3 bước; bố cục nhiều phiếu/trang A4 có đường cắt |

### 5.4 Kết quả và thống kê (FR-RES)

| ID | Yêu cầu |
|---|---|
| FR-RES-01 | Số liệu: tổng phiếu phát hành, đã dùng, còn lại, bị vô hiệu |
| FR-RES-02 | Bảng xếp hạng đầy đủ + Top 10 (số phiếu, %) |
| FR-RES-03 | Thống kê theo giáo khu (dựa trên giáo khu được gán cho lô phiếu khi phân phối) |
| FR-RES-04 | Cài đặt `results_public` (ẩn/hiện kết quả công khai) và `results_realtime` (cập nhật tự động ≤ 10 giây hoặc chỉ khi tải lại) |
| FR-RES-05 | Dashboard Admin: tổng đội, tổng sản phẩm, tổng lượt xem, các số liệu phiếu, top sản phẩm, biểu đồ phiếu theo ngày/giờ, biểu đồ theo giáo khu |
| FR-RES-06 | Xuất Excel (.xlsx): xếp hạng, chi tiết phiếu (seri, sản phẩm, thời gian, giáo khu), danh sách token |
| FR-RES-07 | Xuất PDF: biên bản kết quả có thời gian xuất, người xuất, chữ ký ban tổ chức |

### 5.5 Quản trị (FR-ADM)

| ID | Yêu cầu |
|---|---|
| FR-ADM-01 | Đăng nhập email/mật khẩu (Argon2id), TOTP 2FA (bắt buộc với Super Admin), khóa tài khoản sau 5 lần sai trong 15 phút |
| FR-ADM-02 | CRUD đội: tên, lớp, huynh trưởng phụ trách, thành viên (tùy chọn), logo |
| FR-ADM-03 | CRUD sản phẩm: soạn thảo rich text, trạng thái `DRAFT/PUBLISHED`, nổi bật, thứ tự, slug tự sinh |
| FR-ADM-04 | Upload ảnh: JPEG/PNG/WebP/HEIC, ≤ 15MB/ảnh, tự xoay theo EXIF, xóa EXIF GPS, sinh nhiều kích thước WebP/AVIF; kéo thả sắp xếp; tối đa 20 ảnh/sản phẩm |
| FR-ADM-05 | Video: link YouTube (kiểm tra định dạng) và/hoặc upload MP4 ≤ 200MB cho video giới thiệu |
| FR-ADM-06 | Quản lý token: sinh lô, gán giáo khu cho lô/dải seri, tra cứu theo seri, vô hiệu, lọc theo trạng thái |
| FR-ADM-07 | Quản lý phiếu bầu: danh sách, lọc, đánh dấu nghi vấn, hủy |
| FR-ADM-08 | Quản lý banner, giới thiệu, tin tức (Announcements), nhà tài trợ |
| FR-ADM-09 | Cài đặt: tên cuộc thi, thời gian mở/đóng, trạng thái bình chọn, hiển thị kết quả, hiệu ứng (tuyết/nến bật tắt), thông tin liên hệ, SEO |
| FR-ADM-10 | Audit Log: ghi mọi thao tác ghi của Admin (ai, khi nào, hành động, đối tượng, giá trị trước/sau, IP) — chỉ thêm, không sửa/xóa |
| FR-ADM-11 | Quản lý cuộc thi (Contest): mọi dữ liệu đội/sản phẩm/token/phiếu gắn với `contest_id` để dùng lại hệ thống năm sau |

---

## 6. Non-Functional Requirements

| ID | Nhóm | Yêu cầu |
|---|---|---|
| NFR-01 | Tải | Dự kiến thực tế ~500 người dùng; thiết kế chịu **5.000 người dùng đồng thời** và **20.000 lượt truy cập/ngày** (theo Phase 8) |
| NFR-02 | Hiệu năng | TTFB trang công khai < 300ms (đã cache); LCP < 2,5s trên 4G; API bình chọn p95 < 300ms |
| NFR-03 | Thiết bị yếu | Dùng được trên Android 3GB RAM / Chrome; tự giảm hiệu ứng khi `prefers-reduced-motion` hoặc thiết bị yếu; JS trang bình chọn < 150KB gzip |
| NFR-04 | Sẵn sàng | Uptime ≥ 99,5% trong thời gian bình chọn; có quy trình khôi phục RTO ≤ 1 giờ, RPO ≤ 15 phút |
| NFR-05 | Toàn vẹn dữ liệu | 0 phiếu trùng; phiếu được ghi bền vững (commit DB) trước khi báo thành công |
| NFR-06 | Bảo mật | Theo OWASP Top 10; HTTPS bắt buộc + HSTS; CSP; cookie `HttpOnly`/`Secure`/`SameSite` |
| NFR-07 | Riêng tư | Không thu thập danh tính người bình chọn; IP lưu dạng băm có salt, xóa sau 90 ngày kể từ khi kết thúc cuộc thi |
| NFR-08 | Khả dụng (Usability) | WCAG 2.1 AA; luồng bình chọn cho người lớn tuổi: chữ ≥ 18px, nút ≥ 48px, tiếng Việt đơn giản, không cần cuộn ngang |
| NFR-09 | Tương thích | 2 phiên bản mới nhất của Chrome, Safari iOS, Samsung Internet, Edge, Firefox; Zalo in-app browser |
| NFR-10 | SEO | SSR/SSG, sitemap, robots, structured data (Event, CreativeWork), Open Graph |
| NFR-11 | Bảo trì | TypeScript strict, Clean Architecture, test coverage ≥ 80% cho module bình chọn |
| NFR-12 | Mở rộng | Hỗ trợ nhiều cuộc thi (multi-contest) mà không sửa code |
| NFR-13 | Vận hành | Triển khai bằng 1 lệnh `docker compose up -d`; sao lưu tự động hằng ngày + trước/sau bình chọn; giám sát uptime và cảnh báo |
| NFR-14 | Kiểm toán | Mọi thay đổi kết quả/token/cài đặt đều truy vết được qua Audit Log |

---

## 7. Business Rules

| ID | Quy tắc |
|---|---|
| BR-01 | Mỗi phiếu giấy = 1 token = 1 lần bình chọn = 1 sản phẩm |
| BR-02 | Token đã dùng hoặc bị vô hiệu thì không thể dùng lại, kể cả Super Admin cũng không mở lại được |
| BR-03 | Chỉ nhận phiếu trong khoảng thời gian bình chọn **và** khi trạng thái là `OPEN` |
| BR-04 | Người bình chọn không được đổi lựa chọn sau khi đã xác nhận |
| BR-05 | Mỗi đội có đúng 1 sản phẩm chính trong một cuộc thi |
| BR-06 | Chỉ sản phẩm `PUBLISHED` mới xuất hiện trong triển lãm và trong danh sách bình chọn |
| BR-07 | Phiếu bị hủy (`INVALIDATED`) không được tính; việc hủy phải có lý do và ghi Audit Log |
| BR-08 | Kết quả chính thức là kết quả xuất tại thời điểm đóng bình chọn, có biên bản PDF |
| BR-09 | Khi `results_public = false`, API công khai không trả về số phiếu theo sản phẩm |
| BR-10 | Đồng phiếu: xếp đồng hạng; ban tổ chức quyết định theo quy chế (hệ thống không tự phân định) |
| BR-11 | Album tối đa 20 ảnh/sản phẩm; bắt buộc có 1 ảnh đại diện trước khi xuất bản |
| BR-12 | Giờ chuẩn của hệ thống: `Asia/Ho_Chi_Minh` (UTC+7) |
| BR-13 | Các thao tác nhạy cảm (mở/khóa bình chọn, sinh token, hủy phiếu, đổi cài đặt kết quả) chỉ Super Admin được làm và phải xác thực lại |

---

## 8. Risk Analysis

| ID | Rủi ro | Khả năng | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|---|
| R-01 | Phiếu giấy bị gom/mua để dồn phiếu cho một đội | Trung bình | Cao | Kiểm soát phân phối phiếu theo dải seri + giáo khu; dashboard cảnh báo khi nhiều phiếu dùng từ cùng IP/thiết bị trong thời gian ngắn; quy chế cuộc thi |
| R-02 | Ảnh chụp phiếu bị lan truyền, người khác dùng trước | Trung bình | Trung bình | In hướng dẫn "không chia sẻ ảnh phiếu"; có thể dùng lớp cào phủ mã (tùy ngân sách); người nhận phiếu có thể tra seri với BTC |
| R-03 | Dò/đoán token | Thấp | Cao | 80 bit entropy + rate limit + chặn IP; lưu HMAC nên lộ DB cũng không lấy được token |
| R-04 | Lộ file PDF phiếu trước khi phát | Thấp | Cao | PDF chỉ tải 1 lần, ghi log người tải; nếu lộ, vô hiệu cả lô và sinh lô mới |
| R-05 | Hai request cùng token (race condition) | Trung bình | Cao | Transaction nguyên tử + `UNIQUE(token_id)` + test đồng thời |
| R-06 | VPS sập trong ngày bình chọn | Thấp | Cao | Giám sát + cảnh báo; snapshot VPS; quy trình khôi phục đã diễn tập; Cloudflare phục vụ trang tĩnh |
| R-07 | Lưu lượng đột biến sau Thánh lễ (nhiều người quét cùng lúc) | Cao | Trung bình | Cache trang công khai qua CDN, trang bình chọn nhẹ, kiểm thử tải 5.000 người dùng |
| R-08 | Điện thoại cũ chạy chậm vì hiệu ứng nặng | Cao | Trung bình | Giảm hiệu ứng tự động, ảnh responsive, trang bình chọn tối giản |
| R-09 | Người lớn tuổi không biết quét QR | Cao | Trung bình | Hướng dẫn in trên phiếu; nhập mã thủ công; bàn hỗ trợ tại nhà thờ |
| R-10 | Trễ tiến độ (chỉ ~7 tuần trước Giáng Sinh) | Trung bình | Cao | Ưu tiên MoSCoW; khóa phạm vi Must trước 2026-12-05; tính năng Could có thể bỏ |
| R-11 | Nội dung/ảnh không phù hợp hoặc sai giáo lý | Thấp | Trung bình | Quy trình duyệt `DRAFT → PUBLISHED`; xem trước trước khi xuất bản |
| R-12 | Admin thao tác nhầm (khóa bình chọn, xóa sản phẩm) | Trung bình | Cao | Xác thực lại thao tác nhạy cảm; soft delete; Audit Log; sao lưu |
| R-13 | Mất dữ liệu phiếu | Thấp | Rất cao | Sao lưu mỗi 15 phút trong thời gian bình chọn; sao lưu ngoài VPS; diễn tập khôi phục |
| R-14 | Zalo in-app browser hạn chế (cookie, chia sẻ) | Trung bình | Thấp | Luồng bình chọn không phụ thuộc cookie bên thứ ba; kiểm thử trên Zalo |

---

## 9. Giả định và câu hỏi mở

| # | Giả định / Câu hỏi | Ảnh hưởng |
|---|---|---|
| Q-01 | **Mâu thuẫn tải**: mục "Lượng truy cập" ghi ~500 người dùng, Phase 8 ghi 5.000 đồng thời. Giả định: thiết kế cho 5.000 đồng thời, cấu hình VPS ước lượng theo ~500 thực tế, có thể nâng cấp | Chi phí VPS |
| Q-02 | **"Thống kê theo giáo khu"**: đội được chia theo lớp, không theo giáo khu. Giả định: mỗi **lô/dải seri phiếu được gán cho một giáo khu** khi phân phối, thống kê theo giáo khu của phiếu. Cần danh sách giáo khu | Data model, thống kê |
| Q-03 | Mỗi phiếu bầu cho 1 sản phẩm (không phải nhiều) | Luồng bình chọn |
| Q-04 | Thời gian mở/đóng bình chọn và ngày công bố cụ thể? | Roadmap, token expiry |
| Q-05 | "Token hết hạn" = hết hạn khi kết thúc thời gian bình chọn (không có hạn riêng từng phiếu) | Logic token |
| Q-06 | "Video giới thiệu (nếu có)" là file upload MP4 hay cũng là link YouTube? Giả định: hỗ trợ cả hai | Lưu trữ, băng thông |
| Q-07 | Tên miền? Đã có VPS chưa (cấu hình)? Có dùng Cloudflare (miễn phí) được không? | Phase 9 |
| Q-08 | Phiếu có lớp cào phủ mã không? (tăng chống gian lận, tăng chi phí in) | R-02 |
| Q-09 | Ai là Super Admin? Bao nhiêu Admin? | Seed data |
| Q-10 | Kết quả có hiển thị công khai trong khi đang bình chọn không, hay chỉ sau khi đóng? Mặc định: ẩn, Super Admin quyết định | Cài đặt mặc định |
| Q-11 | Có cần trang "Đội" công khai (giới thiệu thành viên) không? | Phạm vi UI |
