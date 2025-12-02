# 💬 ChatNET - Ứng Dụng Nhắn Tin Bảo Mật

Ứng dụng nhắn tin thời gian thực cho mạng nội bộ (LAN/WiFi) được xây dựng trên nền tảng **React Native**, tích hợp mã hóa đầu cuối và khả năng truyền tải đa phương tiện.

---

## ✨ Tính Năng Nổi Bật

### 🔐 Đa Dạng Thuật Toán Mã Hóa
Lựa chọn phương thức mã hóa trực tiếp trên giao diện:
- **AES (Advanced Encryption Standard)** - Chuẩn mã hóa khối mạnh mẽ
- **DES (Data Encryption Standard)** - Tiêu chuẩn mã hóa cổ điển
- **RSA (Rivest–Shamir–Adleman)** - Mã hóa bất đối xứng với mô phỏng khóa công khai/riêng tư
- **Caesar Cipher** - Mã hóa dịch chuyển ký tự cổ điển

### 📁 Truyền Tải Đa Phương Tiện
- **Tin Nhắn Văn Bản** - Nhắn tin được mã hóa theo thời gian thực
- **Hình Ảnh** - Gửi ảnh từ thư viện với chuyển đổi Base64 và mã hóa
- **Mô Phỏng File** - Tính năng gửi file giả lập để demo truyền tải file an toàn (tối ưu cho Android Emulator)

### ⚙️ Cấu Hình Mạng Linh Hoạt
- **Tùy chỉnh IP/Port** - Kết nối dễ dàng giữa các thiết bị LAN hoặc máy ảo
- **Cổng 9000** - Tối ưu để tránh xung đột cổng hệ thống
- **Khóa Bí Mật** - Cấu hình khóa chia sẻ linh hoạt

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework:** React Native (TypeScript/JavaScript)
- **Mạng:** `react-native-tcp-socket` (Giao tiếp TCP Socket thuần túy)
- **Mã Hóa:** `crypto-js` (Các thuật toán AES, DES, RSA)
- **Đa Phương Tiện:** `react-native-image-picker` (Xử lý hình ảnh)
- **Nền Tảng:** Android Emulator / Thiết bị thật

---

## 📥 Hướng Dẫn Cài Đặt

**Yêu Cầu:** Node.js, JDK 17, Android Studio

### Bước 1: Clone Repository
```bash
git clone https://github.com/datnguyen-hust67/ChatNET-Project.git
cd ChatNET-Project
```

### Bước 2: Cài Đặt Sạch Dependencies
```bash
# Xóa cache cũ (nếu có)
rm -rf node_modules package-lock.json android/.gradle android/app/build

# Cài đặt thư viện
npm install
npm install react-native-tcp-socket react-native-image-picker crypto-js

# Chuẩn bị môi trường Android
cd android
./gradlew clean
cd ..
```

---

## ▶️ Chạy Ứng Dụng

### 1. Khởi Động Ứng Dụng

**Terminal 1** (Metro Server):
```bash
npm start -- --reset-cache
```

**Terminal 2** (Cài đặt trên Emulator):
```bash
npx react-native run-android
```

Đợi ứng dụng tải lên cả hai máy ảo.

### 2. Cấu Hình Mạng (BẮT BUỘC)

Kích hoạt kết nối giữa các emulator bằng port forwarding:

```bash
# Reset cấu hình trước đó
adb forward --remove-all
adb reverse tcp:8081 tcp:8081

# Forward cổng 9000 cho cả hai emulator
adb -s emulator-5554 forward tcp:9000 tcp:9000
adb -s emulator-5556 forward tcp:9000 tcp:9000
```

Sau khi chạy các lệnh này, nhấn **R** hai lần trên cả hai thiết bị để reload.

---

## 📱 Kịch Bản Thử Nghiệm

### Kịch Bản 1: Client-Server (Thiết Bị-Tới-Thiết Bị)

**Thiết Bị Trái (5554):** Mở app và chờ (server lắng nghe)

**Thiết Bị Phải (5556):**
1. Nhấn Cài Đặt (⚙️)
2. Nhập IP: `10.0.2.2`
3. Nhập Khóa Bí Mật: `123`
4. Nhấn LƯU
5. Chọn thuật toán mã hóa (ví dụ: AES)
6. Gửi tin nhắn

### Kịch Bản 2: Loopback (Tự Kiểm Tra)

Hoàn hảo để kiểm tra thuật toán mã hóa nếu firewall chặn kết nối emulator:

1. Vào Cài Đặt
2. Nhập IP: `127.0.0.1`
3. Nhấn LƯU
4. Gửi tin nhắn/file/hình ảnh

**Kết Quả:** Tin nhắn xuất hiện ngay lập tức (một gửi, một nhận) xác nhận mã hóa/giải mã hoạt động chính xác.

---

**Nguồn Gốc:**
- Repository Gốc: [xuandungpham/ChatNET](https://github.com/xuandungpham/ChatNET)
- Xin cảm ơn tác giả gốc đã cung cấp nền tảng cho dự án nâng cấp này

---

## 📄 Giấy Phép

Dự án này phục vụ mục đích giáo dục như một phần của bài tập môn An Toàn Thông Tin.

---

## 🐛 Xử Lý Sự Cố

**Ứng dụng không kết nối được?**
- Xác nhận các lệnh port forwarding đã được thực thi
- Kiểm tra cả hai thiết bị đang sử dụng cùng một khóa bí mật
- Đảm bảo firewall không chặn cổng 9000

**Không gửi được hình ảnh?**
- Cấp quyền truy cập bộ nhớ trong cài đặt Android
- Thử sử dụng chế độ loopback trước để kiểm tra chức năng

**Lỗi Metro bundler?**
- Xóa cache: `npm start -- --reset-cache`
- Clean Android build: `cd android && ./gradlew clean`