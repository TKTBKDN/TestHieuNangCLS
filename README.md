# 🚀 Kịch Bản Test Hiệu Năng — Hệ Thống CLS (k6)

Tool test hiệu năng sử dụng **k6** với **Dashboard Web** để đo hiệu năng API hệ thống CLS: đăng nhập, xem khóa học, làm bài thi.

---

## 📊 VU vs CCU — Hiểu Đúng Số Liệu

| Khái niệm | Ý nghĩa | Ví dụ |
|---|---|---|
| **VU (Virtual User)** | Luồng ảo chạy liên tục, gửi request không ngừng | 10 VU = 10 luồng chạy song song |
| **CCU (Concurrent User)** | Người dùng thật đang online, có think-time (đọc, suy nghĩ) | 200 CCU = 200 người online |

### Công thức quy đổi:

```
CCU thực tế ≈ VU × (Think-time thực tế / Sleep trong k6)
```

Người dùng thật trung bình **đọc 20-30 giây** giữa mỗi thao tác.
k6 mặc định `sleep = 1 giây` giữa mỗi vòng lặp.

**→ 1 VU (sleep=1s) ≈ 20-30 CCU thực tế**

| VU (k6, sleep=1s) | ≈ CCU thực tế | Mức tải |
|---|---|---|
| 5 VU | ~100-150 CCU | 🟢 Nhẹ — kiểm tra cơ bản |
| 10 VU | ~200-300 CCU | 🟢 Bình thường — hoạt động hàng ngày |
| 30 VU | ~600-900 CCU | 🟡 Trung bình — giờ cao điểm |
| 50 VU | ~1,000-1,500 CCU | 🟠 Cao — sự kiện, kỳ thi |
| 100 VU | ~2,000-3,000 CCU | 🔴 Rất cao — stress test |
| 200 VU | ~4,000-6,000 CCU | 🔴 Cực cao — tìm giới hạn |

---

## ⚡ Quick Start

### 1. Yêu cầu
- [Node.js 18+](https://nodejs.org/)
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) — cài qua `choco install k6 -y` hoặc tải portable

### 2. Cài đặt
```bash
cd k6-dashboard
npm install
```

### 3. Chạy Dashboard
```bash
node server.js
# Mở trình duyệt → http://localhost:3000
```

---

## 🎯 Kịch Bản Test

### Kịch bản 1: Smoke Test (Kiểm tra hoạt động)
> Mục đích: Đảm bảo hệ thống hoạt động đúng với tải nhẹ

| Thông số | Giá trị |
|---|---|
| VU | **5** |
| Iterations | **50** |
| Sleep | 1s |
| API | Tất cả |
| ≈ CCU | ~100-150 |

**Tiêu chí đạt:**
- ✅ Tỷ lệ lỗi = 0%
- ✅ Thời gian P95 < 500ms
- ✅ Login thành công 100%

---

### Kịch bản 2: Load Test (Tải bình thường)
> Mục đích: Đo hiệu năng ở mức tải hoạt động hàng ngày

| Thông số | Giá trị |
|---|---|
| VU | **10** |
| Iterations | **200** |
| Sleep | 1s |
| API | Tất cả |
| ≈ CCU | ~200-300 |

**Tiêu chí đạt:**
- ✅ Tỷ lệ lỗi < 1%
- ✅ Thời gian P95 < 2,000ms
- ✅ Server TTFB P95 < 1,500ms

---

### Kịch bản 3: Peak Load Test (Giờ cao điểm)
> Mục đích: Mô phỏng giờ cao điểm (nhiều học viên vào học cùng lúc)

| Thông số | Giá trị |
|---|---|
| VU | **30** |
| Iterations | **600** |
| Sleep | 1s |
| API | Tất cả |
| ≈ CCU | ~600-900 |

**Tiêu chí đạt:**
- ✅ Tỷ lệ lỗi < 5%
- ✅ Thời gian P95 < 5,000ms
- ✅ Server TTFB P95 < 3,000ms

---

### Kịch bản 4: Stress Test (Tìm giới hạn)
> Mục đích: Tìm ngưỡng server bắt đầu từ chối request

| Thông số | Giá trị |
|---|---|
| VU | **50 → 100 → 200** |
| Iterations | **VU × 10** |
| Sleep | 0s |
| API | Chỉ Login |
| ≈ CCU | Stress (không mô phỏng thực tế) |

**Quan sát:**
- 📊 Thời gian phản hồi tăng bao nhiêu so với Smoke Test?
- 📊 Tại mức VU nào tỷ lệ lỗi > 10%?
- 📊 Server có tự phục hồi sau khi giảm tải?

---

### Kịch bản 5: Login Đồng Thời (Sáng đầu giờ)
> Mục đích: Mô phỏng nhiều người đăng nhập cùng lúc (ví dụ: 8h sáng)

| Thông số | Giá trị |
|---|---|
| VU | **50** |
| Iterations | **50** (mỗi VU 1 lần) |
| Sleep | 0s |
| API | Chỉ Login |
| ≈ CCU | 50 login đồng thời |

**Tiêu chí đạt:**
- ✅ 50 login hoàn thành trong < 30 giây
- ✅ Tỷ lệ thành công > 95%
- ✅ Server TTFB P95 < 5,000ms

---

### Kịch bản 6: Kỳ Thi Online
> Mục đích: Mô phỏng nhiều học viên thi cùng lúc (dùng Excel)

| Thông số | Giá trị |
|---|---|
| VU | **30** |
| Iterations | Theo số tài khoản Excel |
| Sleep | 1s |
| API | Login + Kỳ thi (start-exam, set-answer) |
| Dùng Excel | ✅ Có |
| Dùng Token lưu sẵn | ✅ Có (login trước bằng nút Bulk Login) |

**Tiêu chí đạt:**
- ✅ Nộp bài thi thành công > 95%
- ✅ Thời gian P95 < 3,000ms

---

## 📐 Cách Chọn VU Phù Hợp

### Bước 1: Xác định số CCU mục tiêu
> Ví dụ: Hệ thống cần phục vụ **500 người dùng đồng thời**

### Bước 2: Quy đổi CCU → VU
```
VU = CCU / 25    (với sleep = 1s, think-time thực tế = 25s)
```
> 500 CCU ÷ 25 = **20 VU**

### Bước 3: Chạy test và đánh giá
| Nếu kết quả... | Hành động |
|---|---|
| P95 < 2s, lỗi < 1% | ✅ **Đạt** — hệ thống chịu được |
| P95 = 2-5s, lỗi < 5% | ⚠️ **Cảnh báo** — cần tối ưu |
| P95 > 5s hoặc lỗi > 5% | ❌ **Không đạt** — cần nâng cấp |

---

## 📁 Cấu Trúc Thư Mục

```
HieuNangCLS/
├── testgov2.js                 ← Script k6 chính
├── tokens_cache.json           ← Cache token đã login
├── users_data.json             ← Dữ liệu user từ Excel
├── k6-dashboard/
│   ├── server.js               ← Server dashboard
│   ├── public/
│   │   ├── index.html          ← Giao diện web
│   │   ├── app.js              ← Logic frontend
│   │   └── index.css           ← Giao diện CSS
│   └── package.json
└── testgov2_k6/
    └── results/                ← Kết quả JSON sau mỗi lần test
```

---

## 🔧 Chỉ Số Quan Trọng

| Chỉ số | Ý nghĩa | Mục tiêu |
|---|---|---|
| **HTTP Duration** | Tổng thời gian request (bao gồm mạng) | < 2,000ms |
| **Server TTFB** | Thời gian server xử lý thuần (chính xác nhất) | < 1,000ms |
| **P95** | 95% request nhanh hơn giá trị này | < 3,000ms |
| **P99** | 99% request nhanh hơn giá trị này | < 5,000ms |
| **Error Rate** | Tỷ lệ request thất bại | < 5% |
| **Req/s** | Số request server xử lý mỗi giây | Càng cao càng tốt |

---

## ⚠️ Lưu Ý Quan Trọng

1. **Chạy test từ máy khác server** để kết quả chính xác (tránh tự cạnh tranh tài nguyên)
2. **Dùng "Đăng nhập hàng loạt"** trước khi test API — tiết kiệm thời gian login trong test
3. **Sleep = 0** chỉ dùng cho Stress Test — không mô phỏng hành vi thực tế
4. **Sleep = 1s** cho Load Test — mô phỏng gần đúng ~25 CCU/VU
5. **Không chạy quá 200 VU** trên máy cá nhân — k6 cần RAM (~50MB/VU)
6. **So sánh kết quả**: Luôn so sánh cùng điều kiện (cùng VU, cùng API, cùng thời điểm)
