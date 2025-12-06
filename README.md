# 💬 ChatNET - Ứng Dụng Nhắn Tin Bảo Mật & Truyền Tải Đa Phương Tiện

ChatNET là ứng dụng nhắn tin thời gian thực hoạt động trên mạng nội bộ (LAN/WiFi), được xây dựng trên nền tảng **React Native**. Ứng dụng tập trung vào tính bảo mật cao với mã hóa đầu cuối và khả năng truyền tải dữ liệu lớn (Video, Hình ảnh, PDF) ổn định thông qua giao thức TCP Socket.

---

## ✨ Tính Năng Nổi Bật

### 🔐 Hệ Thống Mã Hóa Đa Dạng
Người dùng có thể tùy chọn phương thức bảo mật cho từng tin nhắn ngay trên giao diện:
- **AES (Advanced Encryption Standard)**: Chuẩn mã hóa khối cấp quân sự, bảo mật cao.
- **DES (Data Encryption Standard)**: Tiêu chuẩn mã hóa dữ liệu truyền thống.
- **RSA**: Mã hóa bất đối xứng, mô phỏng cơ chế khóa công khai/khóa bí mật.
- **Caesar Cipher**: Mã hóa dịch chuyển cổ điển phục vụ mục đích học thuật.

### 📁 Truyền Tải Đa Phương Tiện Mạnh Mẽ
- **Tin Nhắn Văn Bản**: Gửi nhận tức thì với độ trễ thấp.
- **Hình Ảnh**: Hỗ trợ chọn ảnh từ thư viện, mã hóa và gửi đi chất lượng cao.
- **Tài Liệu PDF**: Hỗ trợ truyền tải tệp tin văn bản và tài liệu PDF đính kèm một cách toàn vẹn.
- **Video Streaming (Mới)**: Sử dụng cơ chế phân mảnh gói tin (Chunking Protocol) và Handshake để gửi video dung lượng lớn mà không gây tràn bộ nhớ (RAM) hay nghẽn mạng.

### ⚙️ Cấu Hình Mạng Linh Hoạt
- **Tùy biến Kết Nối**: Dễ dàng thay đổi địa chỉ IP đích và Cổng (Port) kết nối.
- **Cổng Mặc Định 9000**: Được tối ưu hóa để tránh xung đột với các dịch vụ hệ thống Android.
- **Khóa Bảo Mật**: Cung cấp khả năng thiết lập khóa bí mật (Secret Key) riêng cho mỗi phiên chat.

---

## 🛠️ Công Nghệ Cốt Lõi

Dự án sử dụng các thư viện và kỹ thuật xử lý hiện đại:

- **Core Framework**: React Native (TypeScript).
- **Giao Thức Mạng**: `react-native-tcp-socket` (Giao tiếp TCP thuần túy, độ ổn định cao).
- **Quản Lý File**: `react-native-fs` (Đọc/Ghi luồng dữ liệu - Streaming Read/Write cho file lớn).
- **Bảo Mật**: `crypto-js` (Thư viện mã hóa tiêu chuẩn).
- **Media**: `react-native-image-picker`.

---

## 📥 Hướng Dẫn Cài Đặt

**Yêu Cầu Hệ Thống:** Node.js, JDK 17, Android Studio (Emulator).

### Bước 1: Clone Project
```bash
git clone [https://github.com/datnguyen-hust67/ChatNET-Project.git](https://github.com/datnguyen-hust67/ChatNET-Project.git)
cd ChatNET-Project
```

### Bước 2: Cài Đặt Dependencies
```bash
# Xóa cache và node_modules cũ (nếu có)
rm -rf node_modules package-lock.json android/.gradle android/app/build

# Cài đặt thư viện
npm install
# Cài đặt các native dependencies quan trọng
npm install react-native-tcp-socket react-native-fs react-native-image-picker crypto-js @react-native-community/netinfo

# Build môi trường Android
cd android
./gradlew clean
cd ..
```

---

▶️ Hướng Dẫn Chạy & Cấu Hình Mạng
1. Khởi Động Metro Server
Mở terminal tại thư mục dự án:

Bash

npm start -- --reset-cache
2. Cấu Hình ADB (Quan Trọng cho Emulator)
Để 2 máy ảo Android có thể "nhìn thấy" nhau qua TCP, bạn cần chạy các lệnh Port Forwarding sau trên một Terminal khác:

Bash

# Reset cấu hình cũ
adb forward --remove-all
adb reverse tcp:8081 tcp:8081

# Mở thông luồng cho máy ảo (Giả sử sử dụng port 9000)
# Máy 1 (Sender/Receiver A)
adb -s emulator-5554 forward tcp:9000 tcp:9000
# Máy 2 (Sender/Receiver B)
adb -s emulator-5556 forward tcp:9000 tcp:9000
3. Cài Đặt Ứng Dụng
Bash

npx react-native run-android
Lưu ý: Chạy lệnh này cho từng máy ảo hoặc để nó tự động cài lên các thiết bị đang mở.

📱 Hướng Dẫn Sử Dụng
Thiết Lập Kết Nối (Giữa 2 Máy Ảo)
Mở ứng dụng trên cả 2 thiết bị.

Nhấn vào biểu tượng Cài Đặt (⚙️) ở góc phải.

Nhập thông số:

IP Người Nhận: 10.0.2.2 (Đây là IP Loopback đặc biệt của Android Emulator để trỏ về máy chủ).

Port: 9000.

Secret Key: Nhập giống nhau ở cả 2 máy (Ví dụ: 123).

Nhấn LƯU.

Gửi Dữ Liệu
Gửi Video: Nhấn icon 🎥 -> Chọn video. Ứng dụng sẽ tự động chia nhỏ file và gửi đi (có thanh % tiến trình).

Gửi Ảnh: Nhấn icon 📷.

Gửi PDF: Nhấn icon đính kèm 📎.