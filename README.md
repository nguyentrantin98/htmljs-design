# Tài Liệu Mô Tả Công Nghệ Web

## 1. Kiến Trúc Tổng Quan
Hệ thống web được chia thành ba lớp chính:
- **Frontend Layer**: Giao diện người dùng
- **Backend Layer**: Xử lý logic nghiệp vụ và cung cấp API
- **Database Layer**: Lưu trữ và quản lý dữ liệu

---

## 2. Frontend Layer
### Công Nghệ Sử Dụng
- **HTMLJS-CODE Framework**: Một framework full lowcode web application, giúp phát triển giao diện web nhanh chóng mà không cần nhiều mã nguồn.
- **HTML / CSS / JavaScript**: Xây dựng và thiết kế giao diện người dùng.

### Chức Năng Chính
- Hiển thị dữ liệu từ Backend thông qua API.
- Cập nhật giao diện theo thời gian thực với WebSocket.
- Tương tác với người dùng thông qua các sự kiện và thao tác DOM.

---

## 3. Backend Layer
### Công Nghệ Sử Dụng
- **.NET Core / C#**: Xây dựng hệ thống Web API.
- **WebSocket**: Hỗ trợ tính năng realtime cho hệ thống.

### Chức Năng Chính
- Cung cấp các API để truy xuất dữ liệu và xử lý nghiệp vụ.
- Giao tiếp với Database Layer để lấy hoặc lưu trữ dữ liệu.
- Sử dụng WebSocket để gửi và nhận dữ liệu theo thời gian thực.

---

## 4. Database Layer
### Công Nghệ Sử Dụng
- **SQL Server**: Hệ quản trị cơ sở dữ liệu.

### Chức Năng Chính
- Lưu trữ dữ liệu của hệ thống.
- Đảm bảo tính nhất quán và toàn vẹn dữ liệu.
- Cung cấp truy vấn tối ưu để cải thiện hiệu suất.

---

## 5. Quản Lý Nhiệm Vụ Và Gửi Thông Báo
### Công Nghệ Sử Dụng
- **Hangfire**: Quản lý các tác vụ nền và gửi thông báo.

### Chức Năng Chính
- Lên lịch thực hiện các tác vụ tự động.
- Gửi thông báo theo lịch hoặc theo sự kiện của hệ thống.

---

## 6. Lưu Trữ Dữ Liệu
Hệ thống sử dụng SQL Server để lưu trữ dữ liệu với các đặc điểm:
- **Cấu trúc bảng tối ưu**: Tăng hiệu suất truy vấn.
- **Sao lưu định kỳ**: Đảm bảo an toàn dữ liệu.
- **Tích hợp bảo mật**: Kiểm soát truy cập và quyền hạn chặt chẽ.

---

## 7. Tổng Kết
Hệ thống được xây dựng với các công nghệ hiện đại, đảm bảo hiệu suất, bảo mật và khả năng mở rộng:
- **Frontend**: HTMLJS-CODE (full lowcode web application), HTML, CSS, JavaScript.
- **Backend**: .NET Core, Web API, WebSocket.
- **Database**: SQL Server.
- **Hỗ trợ nền**: Hangfire cho thông báo và quản lý tác vụ.

Hệ thống đảm bảo khả năng hoạt động ổn định, cung cấp trải nghiệm tốt cho người dùng và dễ dàng bảo trì, nâng cấp.