# 💬 ChatNET - Hệ Thống Nhắn Tin Bảo Mật & Truyền Tải Đa Phương Tiện


**ChatNET** là ứng dụng nhắn tin thời gian thực (Real-time Secure Chat) hoạt động trong mạng nội bộ (LAN/WiFi), được phát triển trên nền tảng **React Native**. Ứng dụng tập trung giải quyết bài toán bảo mật dữ liệu đường truyền (End-to-End Encryption) và tối ưu hóa việc truyền tải file lớn (Video) qua giao thức TCP Socket.

---

## 🚀 Tính Năng Nổi Bật

### 1. 🔐 Hệ Thống Mã Hóa Đa Tầng
Người dùng có toàn quyền kiểm soát phương thức bảo mật cho từng tin nhắn:
- **AES (Advanced Encryption Standard):** Chuẩn mã hóa khối cấp quân sự (Symmetric).
- **DES (Data Encryption Standard):** Mã hóa dữ liệu tiêu chuẩn (Demo thuật toán cổ điển).
- **RSA:** Mã hóa bất đối xứng (Public/Private Key simulation).
- **Caesar Cipher:** Mã hóa dịch chuyển (Học thuật).

### 2. 📁 Truyền Tải Đa Phương Tiện (Multimedia)
- **Tin Nhắn Văn Bản:** Tốc độ thực thi tức thì.
- **Hình Ảnh:** Chuyển đổi Bitmap sang Base64, mã hóa và truyền tải.
- **Tài Liệu (PDF/Doc):** Hỗ trợ gửi file tài liệu giả lập (Mock) và file thật.
- **Video Streaming (Nâng Cấp):** - Tích hợp cơ chế **Chunking (Phân mảnh)**: Chia nhỏ video thành các gói tin.
  - **Handshake Protocol**: Đảm bảo bên nhận sẵn sàng trước khi gửi dữ liệu lớn.
  - Giải quyết triệt để vấn đề tràn bộ nhớ (OOM) khi gửi file >10MB qua Socket.

### 3. ⚙️ Cấu Hình Mạng Mở Rộng
- **Tùy biến Socket:** Cho phép nhập IP đích và Port tùy ý.
- **Cổng Mặc Định 9000:** Tối ưu hóa luồng dữ liệu, tránh xung đột hệ thống.
- **Secret Key Management:** Quản lý khóa bí mật cho phiên làm việc.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành Phần | Công Nghệ / Thư Viện | Mô Tả |
| :--- | :--- | :--- |
| **Core** | React Native (0.7x) | Framework phát triển đa nền tảng. |
| **Network** | `react-native-tcp-socket` | Giao tiếp TCP thuần túy, độ trễ thấp. |
| **File System** | `react-native-fs` | Đọc/Ghi file, xử lý luồng dữ liệu (Stream). |
| **Security** | `crypto-js` | Thư viện thuật toán mã hóa tiêu chuẩn. |
| **Media** | `react-native-image-picker` | Truy cập thư viện ảnh/video thiết bị. |

---

## 📥 Hướng Dẫn Cài Đặt & Biên Dịch

### Yêu Cầu Hệ Thống
- Node.js (>= 18.x)
- Java Development Kit (JDK 17)
- Android Studio (kèm Android SDK & Emulator)

### Bước 1: Clone Mã Nguồn
```bash
git clone [https://github.com/datnguyen-hust67/ChatNET-Project.git](https://github.com/datnguyen-hust67/ChatNET-Project.git)
cd ChatNET-Project
Bước 2: Cài Đặt Thư Viện (Dependencies)
Chạy lần lượt các lệnh sau để đảm bảo môi trường sạch sẽ:

Bash

# 1. Xóa cache và file rác cũ (Quan trọng để tránh lỗi build)
rm -rf node_modules package-lock.json android/.gradle android/app/build

# 2. Cài đặt các gói thư viện
npm install
npm install react-native-tcp-socket react-native-fs react-native-image-picker crypto-js @react-native-community/netinfo

# 3. Làm sạch và biên dịch Native Module cho Android
cd android
./gradlew clean
cd ..
▶️ Hướng Dẫn Chạy (Run)
Để chạy ứng dụng trên Android Emulator, cần mở 2 cửa sổ Terminal:

Terminal 1: Khởi động Metro Bundler

Bash

npm start -- --reset-cache
Terminal 2: Cài đặt ứng dụng vào máy ảo

Bash

npx react-native run-android
🌐 Cấu Hình Mạng (ADB Port Forwarding)
Do đặc thù của Android Emulator (nằm sau NAT), để 2 máy ảo có thể giao tiếp, bạn BẮT BUỘC phải chạy các lệnh sau trên Terminal để mở cổng:

Bash

# 1. Reset toàn bộ kết nối cũ
adb forward --remove-all
adb reverse tcp:8081 tcp:8081

# 2. Mở cổng 9000 cho các máy ảo
# (Lệnh này cho phép máy tính chuyển tiếp dữ liệu từ cổng 9000 vào máy ảo)
adb -s emulator-5554 forward tcp:9000 tcp:9000
adb -s emulator-5556 forward tcp:9000 tcp:9000
📱 Hướng Dẫn Sử Dụng App
Mở ứng dụng trên cả 2 thiết bị.

Bấm vào nút Cài Đặt (⚙️).

Thiết lập thông số:

IP Người Nhận: 10.0.2.2 (Đây là IP Loopback đặc biệt của Android Emulator).

Port: 9000.

Secret Key: Nhập giống nhau (VD: 123).

Bấm LƯU.

Gửi dữ liệu:

Bấm 🎥 để gửi Video.

Bấm 📷 để gửi Ảnh.

Bấm 📎 để gửi File PDF.

Chọn thuật toán (AES/DES...) để gửi tin nhắn bảo mật.