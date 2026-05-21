# 🚀 Load Test - Hệ Thống Web (JMeter)

Bộ công cụ load testing sử dụng **Apache JMeter** để đo hiệu năng hệ thống web: đăng nhập, vào học, nộp bài thi.

## ⚡ Quick Start

### 1. Cài đặt
- [Download Java 17+](https://adoptium.net/)
- [Download Apache JMeter 5.6.3](https://jmeter.apache.org/download_jmeter.cgi)

### 2. Cấu hình
1. Mở `test-plan.jmx` bằng JMeter GUI
2. Sửa các biến: `BASE_URL`, `LOGIN_PATH`, `EXAM_LIST_PATH`, `EXAM_SUBMIT_PATH`
3. Sửa request body cho phù hợp với API của bạn
4. Sửa JSON Path trong JSON Extractor cho phù hợp

### 3. Chuẩn bị dữ liệu
Sửa file `data/users.csv` với tài khoản test thật

### 4. Chạy test
```bash
# Windows
scripts\run-load-test.bat

# Hoặc chạy trực tiếp (50 users, ramp 60s, test 5 phút)
jmeter -n -t test-plan.jmx -l reports/results.csv -Jthreads=50 -Jrampup=60 -Jduration=300 -e -o reports/html-report
```

### 5. Xem kết quả
Mở file `reports/html-report/index.html` trong trình duyệt

## 📁 Cấu trúc
```
├── test-plan.jmx          ← JMeter Test Plan
├── user.properties        ← Cấu hình JMeter
├── data/
│   └── users.csv          ← Dữ liệu user test
├── scripts/
│   ├── run-load-test.bat  ← Script chạy (Windows)
│   └── run-load-test.sh   ← Script chạy (Linux/Mac)
└── reports/               ← Kết quả & Báo cáo HTML
```

## 🔧 Tùy chỉnh số user
```bash
# 100 users, ramp 120s, test 10 phút
jmeter -n -t test-plan.jmx -l results.csv -Jthreads=100 -Jrampup=120 -Jduration=600 -e -o report

# 500 users stress test
jmeter -n -t test-plan.jmx -l results.csv -Jthreads=500 -Jrampup=300 -Jduration=900 -e -o report
```

## ⚠️ Lưu ý quan trọng
- **KHÔNG** chạy test ở chế độ GUI (chỉ dùng GUI để thiết kế)
- Tắt tất cả Listener trước khi chạy test thật
- Chạy test từ máy khác server để kết quả chính xác
- Tăng JVM Heap nếu test nhiều user: sửa `HEAP="-Xms1g -Xmx4g"` trong `jmeter.bat`
