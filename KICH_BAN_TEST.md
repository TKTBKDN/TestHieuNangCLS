# 📋 KỊCH BẢN KIỂM THỬ HIỆU NĂNG HỆ THỐNG LMS

> **Dự án:** Kiểm thử hiệu năng hệ thống đào tạo trực tuyến (LMS)
> **Mục tiêu:** Load Test (1.000 CCU, 2.000 CCU, 7.000 CCU) & Stress Test tìm điểm gãy
> **Hành vi đặc biệt:** Mô phỏng thí sinh vào thi cùng một lúc
> **Công cụ:** Grafana k6
> **Ngày cập nhật:** 22/05/2026

---

## 1. MỤC TIÊU KIỂM THỬ (Theo yêu cầu khách hàng)

1. **Load Test (Kiểm thử tải):** 
   - Đánh giá khả năng đáp ứng và đo lường tài nguyên tiêu hao (Resource CPU/RAM/Network) của hệ thống ở các mốc: **1.000 CCU**, **2.000 CCU** và **7.000 CCU**.
2. **Stress Test (Kiểm thử giới hạn):**
   - Tăng tải vượt ngưỡng 7.000 CCU để tìm **điểm gãy (Breakdown Point)** - thời điểm hệ thống bắt đầu quá tải, phản hồi cực chậm hoặc sập hoàn toàn (trả lỗi 502/504).
3. **Spike Test (Tải đột biến vào thi):**
   - Mô phỏng hành vi đặc thù: **2.000 người** và **7.000 người** đồng loạt click nút **Bắt đầu thi** cùng một giây.

---

## 📐 QUY ĐỔI VU ↔ CCU

> **VU (Virtual User)** trong k6 là luồng ảo chạy liên tục, khác với **CCU (Concurrent User)** là người dùng thật có thời gian đọc, suy nghĩ giữa các thao tác.

**Công thức:**
```
CCU = VU × (Think-time thực tế / Sleep trong k6)
```

Người dùng LMS trung bình **đọc/suy nghĩ ~25 giây** giữa mỗi thao tác. k6 cấu hình `sleep = 1s`.

| Loại test | Công thức | Giải thích |
|-----------|-----------|------------|
| **Load Test** (tải duy trì) | VU = CCU ÷ 25 | Mô phỏng hành vi thực tế: đăng nhập, đọc bài, click tiếp |
| **Spike Test** (đột biến) | VU = CCU | Tất cả click cùng 1 giây, không có think-time |

### Bảng quy đổi:

| CCU mục tiêu | VU cho Load Test (sleep=1s) | VU cho Spike Test (sleep=0s) |
|:---:|:---:|:---:|
| 1.000 | **40 VU** | 1.000 VU |
| 2.000 | **80 VU** | 2.000 VU |
| 7.000 | **280 VU** | 7.000 VU *(cần máy mạnh hoặc distributed)* |

---

## 2. KỊCH BẢN API CHI TIẾT (5 API Nghiệp vụ)

Kịch bản mô phỏng hành trình tinh gọn của học viên từ Đăng nhập, Học tập đến làm Bài thi:

| STT | Nghiệp vụ | API Endpoint | Phương thức | Mô tả tải |
|:---:|-----------|--------------|:-----------:|-----------|
| **1** | **Đăng nhập** | `/api/user/login` | POST | 100% người dùng thực hiện |
| **2** | **Vào học** | `/api/learner/get-course-content-detail` | GET | Đọc nội dung bài học |
| **3** | **Hoàn thành bài** | `/api/learner/set-complete-course-content-basic` | POST | Ghi nhận hoàn thành học |
| **4** | **Bắt đầu thi** | `/api/examtest/start-exam` | PATCH | **Tâm điểm tải đột biến** |
| **5** | **Nộp bài thi** | `/api/examtest/set-answer-question` | POST | Nộp kết quả bài thi |

---

## 3. CẤU HÌNH CÁC KỊCH BẢN CHẠY TEST

### 📊 Kịch bản 3.1: Load Test 1.000 CCU (Tính toán tài nguyên mốc 1)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **40** | 40 VU × 25 ≈ 1.000 CCU |
| **Iterations** | 1.000 | Mỗi user thực hiện 1 lượt đầy đủ |
| **Sleep** | 1s | Mô phỏng think-time |
| **API** | Cả 5 API | Hành trình đầy đủ |
| **Executor** | shared-iterations | Chia đều lượt cho các VU |

* **Mô tả:** 40 VU chia nhau 1.000 lượt chạy. Tại mỗi thời điểm, 40 luồng hoạt động đồng thời liên tục — tương đương **1.000 người dùng thật** đang online với hành vi đọc/suy nghĩ bình thường.
* **Mục tiêu:** Đo lượng CPU/RAM/Băng thông tiêu thụ trên máy chủ Web và Database khi hệ thống phục vụ ổn định 1.000 người cùng lúc.

---

### 📊 Kịch bản 3.2: Load Test 2.000 CCU + Spike vào thi

Kịch bản này gồm **2 giai đoạn**:

#### Giai đoạn A — Load Test duy trì (Đăng nhập + Học tập)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **80** | 80 VU × 25 ≈ 2.000 CCU |
| **Iterations** | 2.000 | Đăng nhập + vào học |
| **Sleep** | 1s | Mô phỏng think-time |
| **API** | Login + Vào học + Hoàn thành bài | 3 API đầu |

#### Giai đoạn B — Spike Test vào thi (2.000 người thi cùng lúc)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **2.000** | VU = CCU (tất cả click cùng lúc) |
| **Iterations** | 2.000 | Mỗi VU = 1 lần bắt đầu thi |
| **Sleep** | **0s** | Không chờ — tất cả gọi cùng lúc |
| **API** | Chỉ Bắt đầu thi + Nộp bài | 2 API thi |
| **Dùng Token lưu sẵn** | ✅ Có | Dùng token từ Giai đoạn A |

* **Hành vi đặc biệt (Spike):** Toàn bộ **2.000 VU** đồng loạt gọi API `start-exam` trong cùng 1-2 giây.
* **Mục tiêu:** Đánh giá hệ thống có bị nghẽn khóa bảng Database (Database Lock) hoặc sập kết nối khi 2.000 người thi cùng lúc hay không.

---

### 📊 Kịch bản 3.3: Load Test 7.000 CCU + Spike vào thi (Tải đỉnh)

#### Giai đoạn A — Load Test duy trì (Đăng nhập + Học tập)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **280** | 280 VU × 25 ≈ 7.000 CCU |
| **Iterations** | 7.000 | Đăng nhập + vào học |
| **Sleep** | 1s | Mô phỏng think-time |
| **API** | Login + Vào học + Hoàn thành bài | 3 API đầu |

#### Giai đoạn B — Spike Test vào thi (7.000 người thi cùng lúc)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **7.000** | VU = CCU (tất cả click cùng lúc) |
| **Iterations** | 7.000 | Mỗi VU = 1 lần bắt đầu thi |
| **Sleep** | **0s** | Không chờ — tất cả gọi cùng lúc |
| **API** | Chỉ Bắt đầu thi + Nộp bài | 2 API thi |
| **Dùng Token lưu sẵn** | ✅ Có | Dùng token từ Giai đoạn A |

* **⚠️ Lưu ý:** 7.000 VU yêu cầu máy test có **RAM ≥ 16GB** và CPU mạnh. Nếu máy cá nhân không đủ, cần dùng **k6 Cloud** hoặc chạy phân tán từ nhiều máy.
* **Mục tiêu:** Đo lường ngưỡng giới hạn thiết kế của hệ thống. Ghi nhận thông số CPU/RAM tối đa để làm căn cứ đề xuất cấu hình máy chủ thực tế cho khách hàng.

---

### 💥 Kịch bản 3.4: Stress Test tìm điểm gãy (Vượt tải đỉnh)

| Thông số | Giá trị | Ghi chú |
|----------|---------|---------|
| **Số VU** | **280 → 320 → 400 → 500** | Tăng dần, mỗi bước tương đương +1.000 CCU |
| **Thời gian mỗi bước** | 5 phút | Đủ để đo trạng thái ổn định |
| **Sleep** | 1s | Load Test duy trì |
| **API** | Cả 5 API | Hành trình đầy đủ |

**Bảng quy đổi từng bước:**

| Bước | VU | ≈ CCU | Mục tiêu |
|:---:|:---:|:---:|----------|
| 1 | 280 | 7.000 | Baseline (mốc yêu cầu) |
| 2 | 320 | 8.000 | Bắt đầu vượt tải |
| 3 | 400 | 10.000 | Quan sát suy giảm |
| 4 | 500 | 12.500 | Tìm điểm gãy |
| 5 | 600+ | 15.000+ | Xác nhận điểm gãy |

* **Mục tiêu:** Xác định chính xác ở mốc VU nào thì hệ thống bắt đầu xuất hiện lỗi 502/504 hoặc thời gian phản hồi API vượt quá 10 giây. Điểm đó chính là **Điểm gãy của hệ thống**.

---

## 4. TIÊU CHÍ ĐÁNH GIÁ (Pass/Fail Criteria)

| Chỉ số | Load Test (duy trì) | Spike Test (thi đồng thời) |
|--------|---------------------|---------------------------|
| **Thời gian phản hồi TB (Avg)** | ≤ 2.000 ms | ≤ 4.000 ms |
| **Server Processing (TTFB) P95** | ≤ 3.000 ms | ≤ 6.000 ms |
| **Thời gian phản hồi P95** | ≤ 5.000 ms | ≤ 8.000 ms |
| **Tỷ lệ lỗi HTTP** | ≤ 1% | ≤ 5% (trong giây đột biến) |
| **Trạng thái hệ thống** | Hoạt động bình thường | Tự phục hồi sau 1-2 phút đột biến |

### Ý nghĩa các chỉ số:
| Chỉ số | Giải thích |
|--------|-----------|
| **HTTP Duration** | Tổng thời gian request (bao gồm mạng + server) |
| **Server TTFB** | Thời gian server xử lý thuần túy — **chỉ số chính xác nhất** |
| **P95** | 95% request nhanh hơn giá trị này (loại bỏ outlier) |
| **P99** | 99% request nhanh hơn giá trị này |

---

## 5. TỔNG HỢP CẤU HÌNH k6

| Kịch bản | VU | Iterations | Sleep | ≈ CCU | Loại |
|----------|:---:|:---:|:---:|:---:|------|
| 3.1 Load 1K | **40** | 1.000 | 1s | 1.000 | Load Test |
| 3.2a Load 2K | **80** | 2.000 | 1s | 2.000 | Load Test |
| 3.2b Spike thi 2K | **2.000** | 2.000 | 0s | 2.000 | Spike Test |
| 3.3a Load 7K | **280** | 7.000 | 1s | 7.000 | Load Test |
| 3.3b Spike thi 7K | **7.000** | 7.000 | 0s | 7.000 | Spike Test |
| 3.4 Stress | **280→600** | Liên tục | 1s | 7K→15K | Stress Test |

---

## 6. PHƯƠNG ÁN & GIẢI PHÁP KHI HỆ THỐNG QUÁ TẢI (Limit người dùng)

Khi Stress Test tìm ra điểm gãy (ví dụ hệ thống sập ở mốc 4.000 CCU), chúng tôi đề xuất các giải pháp kỹ thuật sau để giới hạn người dùng, tránh gây sập toàn bộ hệ thống:

### 🛡️ Giải pháp 1: Rate Limiting (Giới hạn tần suất ở Nginx/API Gateway)
* **Nguyên lý:** Cấu hình Nginx chỉ cho phép tối đa X request/giây từ một địa chỉ IP hoặc trên toàn hệ thống đối với API Đăng nhập và Vào thi.
* **Khi quá tải:** Những người dùng vượt ngưỡng sẽ nhận ngay phản hồi lỗi `429 Too Many Requests` (nhẹ hơn rất nhiều so với lỗi sập 502) và được yêu cầu thử lại sau vài giây.

### 🛡️ Giải pháp 2: Hàng đợi ảo / Phòng chờ (Virtual Waiting Room)
* **Nguyên lý:** Khi số lượng CCU vượt quá ngưỡng chịu tải an toàn của hệ thống (ví dụ quá 3.000 CCU):
  - Hệ thống sẽ chuyển hướng người dùng mới đến một trang chờ hiển thị thông báo: *"Hệ thống đang bận, bạn vui lòng đợi trong giây lát. Thời gian chờ dự kiến: XX giây"*.
  - Người dùng trong hàng đợi sẽ được cho vào hệ thống lần lượt khi có người dùng khác thoát ra ngoài.

### 🛡️ Giải pháp 3: Tránh nghẽn Database bằng hàng đợi tin nhắn (Message Queue)
* **Nguyên lý:** API `/api/examtest/start-exam` và `/api/examtest/set-answer-question` khi nhận tải lớn sẽ không ghi trực tiếp xuống Database. Thay vào đó, ghi tạm thời vào hàng đợi (Redis/RabbitMQ). 
* Hệ thống sẽ có các tiến trình chạy ngầm (Workers) rút dữ liệu ra để ghi xuống Database một cách tuần tự với tốc độ mà Database có thể chịu đựng được, ngăn chặn triệt để lỗi sập Database.

---

## 7. YÊU CẦU MÁY TEST

| Kịch bản | RAM tối thiểu | CPU | Ghi chú |
|----------|:---:|:---:|---------|
| Load 1K (40 VU) | 4 GB | 2 cores | Máy cá nhân đủ |
| Load 2K (80 VU) | 4 GB | 2 cores | Máy cá nhân đủ |
| Load 7K (280 VU) | 8 GB | 4 cores | Máy khá |
| Spike 2K (2.000 VU) | 8 GB | 4 cores | Cần máy riêng |
| Spike 7K (7.000 VU) | **16+ GB** | **8 cores** | Cần server hoặc k6 Cloud |
| Stress 15K (600 VU) | 8 GB | 4 cores | Máy khá |

> ⚠️ **Luôn chạy test từ máy KHÁC server** để kết quả chính xác (tránh máy test cạnh tranh tài nguyên với server đích).
