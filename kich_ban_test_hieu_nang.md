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

**VU (Virtual User)** trong k6 là luồng ảo chạy **liên tục không ngừng**, khác với **CCU (Concurrent User)** là người dùng thật có thời gian đọc, suy nghĩ (~25 giây) giữa các thao tác.

**Công thức quy đổi:**

> **CCU = VU × (Think-time thực tế ÷ Sleep trong k6)**
>
> Với Think-time thực tế ≈ 25 giây, Sleep k6 = 1 giây → **1 VU ≈ 25 CCU**

| Loại test | Công thức | Giải thích |
|-----------|-----------|------------|
| **Load Test** (tải duy trì) | VU = CCU ÷ 25 | Mô phỏng hành vi thực tế: đăng nhập, đọc bài, click tiếp |
| **Spike Test** (đột biến) | VU = CCU | Tất cả click cùng 1 giây, không có think-time |

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
| **4** | **Bắt đầu thi** | `/api/examtest/start-exam` | PATCH | **Tâm điểm tải đột biến (2.000 - 7.000 CCU cùng lúc)** |
| **5** | **Nộp bài thi** | `/api/examtest/set-answer-question` | POST | Nộp kết quả bài thi |

---

## 3. CẤU HÌNH CÁC KỊCH BẢN CHẠY TEST

Để đạt được mục tiêu tính toán tài nguyên và tìm điểm gãy, quá trình test được chia làm các bước độc lập sau:

### 📊 Kịch bản 3.1: Load Test 1.000 CCU (Tính toán tài nguyên mốc 1)
* **Số lượng VU:** **40 VU** (40 × 25 = 1.000 CCU) hoạt động đồng thời.
* **Iterations:** 1.000 lượt (mỗi user thực hiện 1 lượt đầy đủ).
* **Sleep:** 1 giây (mô phỏng think-time).
* **Mô tả chạy:** 40 VU chia nhau 1.000 lượt chạy. Tại mỗi thời điểm, 40 luồng hoạt động liên tục — tương đương **1.000 người dùng thật** đang online.
* **Mục tiêu:** Đo lượng CPU/RAM/Băng thông tiêu thụ trên máy chủ Web và Database khi hệ thống phục vụ ổn định 1.000 người cùng lúc.

### 📊 Kịch bản 3.2: Load Test 2.000 CCU + Spike vào thi (mốc 2)

Kịch bản chia làm **2 giai đoạn**:

**Giai đoạn A — Load Test duy trì (Đăng nhập + Học tập):**
* **Số lượng VU:** **80 VU** (80 × 25 = 2.000 CCU).
* **Iterations:** 2.000 lượt.
* **Sleep:** 1 giây.
* **API:** Đăng nhập → Vào học → Hoàn thành bài (3 API đầu).

**Giai đoạn B — Spike Test vào thi (2.000 người thi cùng lúc):**
* **Số lượng VU:** **2.000 VU** (VU = CCU, tất cả click cùng lúc).
* **Iterations:** 2.000 lượt (mỗi VU = 1 lần bắt đầu thi).
* **Sleep:** **0 giây** — không chờ, toàn bộ gọi cùng lúc.
* **API:** Chỉ Bắt đầu thi + Nộp bài.
* **Dùng Token lưu sẵn:** ✅ Có (dùng token từ Giai đoạn A, bỏ qua login).
* **Hành vi đặc biệt (Spike):** Toàn bộ **2.000 VU** đồng loạt gọi API `/api/examtest/start-exam` trong cùng 1-2 giây.
* **Mục tiêu:** Đánh giá hệ thống có bị nghẽn khóa bảng Database (Database Lock) hoặc sập kết nối khi 2.000 người thi cùng lúc hay không.

### 📊 Kịch bản 3.3: Load Test 7.000 CCU + Spike vào thi (Tải đỉnh - mốc 3)

**Giai đoạn A — Load Test duy trì (Đăng nhập + Học tập):**
* **Số lượng VU:** **280 VU** (280 × 25 = 7.000 CCU).
* **Iterations:** 7.000 lượt.
* **Sleep:** 1 giây.
* **API:** Đăng nhập → Vào học → Hoàn thành bài (3 API đầu).

**Giai đoạn B — Spike Test vào thi (7.000 người thi cùng lúc):**
* **Số lượng VU:** **7.000 VU** (VU = CCU).
* **Iterations:** 7.000 lượt (mỗi VU = 1 lần bắt đầu thi).
* **Sleep:** **0 giây**.
* **API:** Chỉ Bắt đầu thi + Nộp bài.
* **Dùng Token lưu sẵn:** ✅ Có.
* **⚠️ Lưu ý:** 7.000 VU yêu cầu máy test có **RAM ≥ 16GB** và **CPU 8 cores**. Nếu máy cá nhân không đủ, cần dùng **k6 Cloud** hoặc chạy phân tán từ nhiều máy.
* **Mục tiêu:** Đo lường ngưỡng giới hạn thiết kế của hệ thống. Ghi nhận thông số CPU/RAM tối đa để làm căn cứ đề xuất cấu hình máy chủ thực tế cho khách hàng.

### 💥 Kịch bản 3.4: Stress Test tìm điểm gãy (Vượt tải đỉnh)
* **Số lượng VU:** Bắt đầu từ **280 VU**, tăng dần mỗi bước **+40 VU** (tương đương +1.000 CCU):

| Bước | VU | ≈ CCU | Thời gian duy trì | Mục tiêu |
|:---:|:---:|:---:|:---:|----------|
| 1 | **280** | 7.000 | 5 phút | Baseline (mốc yêu cầu) |
| 2 | **320** | 8.000 | 5 phút | Bắt đầu vượt tải |
| 3 | **400** | 10.000 | 5 phút | Quan sát suy giảm |
| 4 | **500** | 12.500 | 5 phút | Tìm điểm gãy |
| 5 | **600+** | 15.000+ | 5 phút | Xác nhận điểm gãy |

* **Mục tiêu:** Xác định chính xác ở mốc VU nào thì hệ thống bắt đầu xuất hiện lỗi 502/504 hoặc thời gian phản hồi API vượt quá 10 giây. Điểm đó chính là **Điểm gãy của hệ thống**.

---

## 4. TỔNG HỢP CẤU HÌNH k6

| Kịch bản | VU | Iterations | Sleep | ≈ CCU | Loại test |
|----------|:---:|:---:|:---:|:---:|------|
| 3.1 Load 1K | **40** | 1.000 | 1s | 1.000 | Load Test |
| 3.2a Load 2K | **80** | 2.000 | 1s | 2.000 | Load Test |
| 3.2b Spike thi 2K | **2.000** | 2.000 | 0s | 2.000 | Spike Test |
| 3.3a Load 7K | **280** | 7.000 | 1s | 7.000 | Load Test |
| 3.3b Spike thi 7K | **7.000** | 7.000 | 0s | 7.000 | Spike Test |
| 3.4 Stress | **280→600** | Liên tục | 1s | 7K→15K | Stress Test |

---

## 5. TIÊU CHÍ ĐÁNH GIÁ (Pass/Fail Criteria)

| Chỉ số | Load Test (duy trì) | Spike Test (thi đồng thời 2K/7K) |
|--------|---------------------|---------------------------|
| **Thời gian phản hồi trung bình (Avg)** | ≤ 2.000 ms | ≤ 4.000 ms |
| **Server Processing (TTFB) P95** | ≤ 3.000 ms | ≤ 6.000 ms |
| **Thời gian phản hồi P95** | ≤ 5.000 ms | ≤ 8.000 ms |
| **Tỷ lệ lỗi HTTP** | ≤ 1% | ≤ 5% (trong giây đột biến) |
| **Trạng thái hệ thống** | Hoạt động bình thường | Tự phục hồi sau 1-2 phút đột biến |

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
