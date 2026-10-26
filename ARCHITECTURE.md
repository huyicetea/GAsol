# Tài Liệu Kiến Trúc Hệ Thống (architecture.md)

**Tên dự án:** Ứng dụng Giải thuật Di truyền (Genetic Algorithm - GA) giải phương trình toán học.

---

## 1. Công nghệ sử dụng (Tech Stack)

* **Frontend:**
  * **React + TypeScript (khởi tạo bằng Vite):** Xây dựng giao diện người dùng dạng Single Page Application (SPA), sử dụng TypeScript để kiểm tra kiểu dữ liệu.
  * **TailwindCSS:** Thiết kế giao diện nhanh, hiện đại.
  * **Recharts (hoặc Chart.js):** Vẽ biểu đồ trực quan hóa quá trình hội tụ của thuật toán qua từng thế hệ.
  * **Axios:** Gọi API từ Backend.
* **Backend:**
  * **Python (FastAPI):** Xử lý bất đồng bộ nhanh, tự động sinh tài liệu API (Swagger UI).
  * **NumPy:** Xử lý mảng đa chiều, tối ưu tốc độ tính toán quần thể.
  * **SymPy:** Phân tích cú pháp chuỗi (string) thành biểu thức toán học và tự động tìm biến số.
* **Database:** Không sử dụng (Stateless). Dữ liệu xử lý trực tiếp trên RAM và trả về ngay trong mỗi phiên request.

---

## 2. Cấu trúc dự án (Directory Structure)

```text
GAsol/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api.py
│   │   ├── schemas.py
│   │   └── ga_engine/
│   │       ├── __init__.py
│   │       ├── parser.py
│   │       ├── population.py
│   │       ├── operators.py
│   │       └── solver.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EquationForm.tsx
│   │   │   ├── ParameterConfig.tsx
│   │   │   ├── ResultDisplay.tsx
│   │   │   └── ConvergenceChart.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── eslint.config.js
└── architecture.md
```

---

## 3. Lý thuyết Giải thuật Di truyền (GA) chi tiết

**Bài toán:** Tìm bộ nghiệm cho phương trình tổng quát $f(x_1, x_2, \dots, x_n) = 0$.
(Nếu phương trình có dạng $A = B$, hệ thống sẽ tự chuyển về $A - B = 0$).

### 3.1. Các khái niệm cơ bản trong bài toán

* **Gen (Gene):** Là giá trị của một biến số (ví dụ: giá trị của $x_1$).
* **Nhiễm sắc thể / Cá thể (Chromosome / Individual):** Một mảng chứa các gen, đại diện cho một bộ nghiệm hoàn chỉnh. Ví dụ phương trình $3$ biến $x, y, z$ thì $1$ cá thể là mảng $[1.5, -2.0, 0.4]$.
* **Quần thể (Population):** Tập hợp gồm $N$ cá thể. Khởi tạo dưới dạng ma trận kích thước $(N \times \text{số biến})$.

### 3.2. Luồng hoạt động của thuật toán

1. **Khởi tạo (Initialization):** Sinh ngẫu nhiên $N$ cá thể. Giá trị mỗi gen nằm trong khoảng giới hạn $[\text{min\_bound}, \text{max\_bound}]$ do người dùng cấu hình (ví dụ: $[-100, 100]$).
2. **Đánh giá độ thích nghi (Fitness Evaluation):** Thay bộ nghiệm của từng cá thể vào phương trình $f(X)$. Mục tiêu là $f(X) = 0$, tức là sai số $|f(X)|$ càng nhỏ càng tốt.
   * Công thức hàm mục tiêu (Fitness): 
     $$\text{Fitness} = \frac{1}{1 + |f(X)|}$$
   * Đặc tính: $\text{Fitness} \in (0, 1]$. Cá thể tốt nhất khi $|f(X)| = 0 \Leftrightarrow \text{Fitness} = 1$.
3. **Chọn lọc (Selection):** Sử dụng Tournament Selection (Chọn lọc đấu loại) kết hợp Elitism (Giữ lại cá thể ưu tú):
   * **Elitism:** Giữ nguyên $2$ cá thể có Fitness cao nhất thế hệ hiện tại chuyển thẳng sang thế hệ sau (đảm bảo thuật toán không bị thoái hóa).
   * **Tournament:** Bốc ngẫu nhiên $k$ cá thể (thường $k = 3$) từ quần thể, chọn cá thể có Fitness cao nhất trong nhóm đó làm cha/mẹ. Lặp lại để chọn đủ số lượng cặp cha mẹ.
4. **Lai ghép (Crossover):** Sử dụng Blend Crossover ($\text{BLX}-\alpha$) với xác suất `crossover_rate` (thường từ $0.7 - 0.9$):
   * Từ $2$ cá thể Cha ($P_1$) và Mẹ ($P_2$), sinh ra cá thể Con ($C$) có giá trị gen nằm trong khoảng mở rộng giữa gen cha và mẹ. Giúp khám phá không gian nghiệm mới.
   * Công thức cho từng gen: 
     $$C_i = P_{1i} + \beta \times (P_{2i} - P_{1i})$$
     với $\beta$ là số ngẫu nhiên trong khoảng $[-\alpha, 1 + \alpha]$ (thường chọn $\alpha = 0.5$).
5. **Đột biến (Mutation):** Sử dụng Gaussian Mutation (Đột biến phân phối chuẩn) với xác suất `mutation_rate` (thường từ $0.05 - 0.2$):
   * Cộng một lượng nhiễu nhỏ vào gen: 
     $$\text{Gen}_{\text{mới}} = \text{Gen}_{\text{cũ}} + \mathcal{N}(0, \sigma)$$
   * Giúp thuật toán thoát khỏi cực trị địa phương (Local Optima) và tinh chỉnh nghiệm chính xác hơn ở các thế hệ cuối.
6. **Điều kiện dừng (Termination):** Vòng lặp $(2) \rightarrow (5)$ dừng lại khi thỏa mãn $1$ trong $2$ điều kiện:
   * Sai số $|f(X)| \le \text{tolerance}$ (ví dụ: $10^{-6}$).
   * Số thế hệ đạt mức tối đa `max_generations`.

---

## 4. Nghiệp vụ Hệ thống và Luồng xử lý (Business Logic & Workflows)

### 4.1. Các nghiệp vụ cốt lõi (Core Business Logic)

1. **Nghiệp vụ Phân tích và Chuẩn hóa Phương trình (`parser.py`):**
   * **Chuẩn hóa cú pháp:** Tự động loại bỏ khoảng trắng thừa, thay thế ký hiệu lũy thừa `^` thành `**` (chuẩn Python) nếu người dùng nhập theo thói quen thông thường.
   * **Chuyển vế đổi dấu:** Nếu chuỗi đầu vào chứa dấu `=`, hệ thống tách thành vế trái ($A$) và vế phải ($B$), sau đó ghép lại thành biểu thức chuẩn $A - (B)$. Nếu không chứa dấu `=`, mặc định hiểu vế phải bằng $0$.
   * **Trích xuất biến số tự động:** Sử dụng `sympy.sympify()` để dựng cây biểu thức và dùng thuộc tính `.free_symbols` để lấy danh sách biến số (sắp xếp theo thứ tự bảng chữ cái).
   * **Biên dịch hàm tính toán nhanh:** Dùng `sympy.lambdify(variables, expr, "numpy")` để chuyển biểu thức ký hiệu sang hàm tính toán vector của NumPy, giúp tính giá trị $f(X)$ cho toàn bộ $N$ cá thể cùng lúc thay vì dùng vòng lặp `for`.

2. **Nghiệp vụ Quản lý và Kiểm soát Tham số GA (`schemas.py`):**
   * Ràng buộc miền giá trị đầu vào để tránh treo máy chủ (DoS) hoặc lỗi logic toán học:
     * `bounds`: Mảng $2$ phần tử $[\text{min}, \text{max}]$ phải thỏa mãn $\text{min} < \text{max}$.
     * `pop_size`: Giới hạn trong khoảng $[10, 5000]$ cá thể.
     * `max_generations`: Giới hạn trong khoảng $[1, 10000]$ thế hệ.
     * `crossover_rate` và `mutation_rate`: Nằm trong đoạn $[0.0, 1.0]$.
     * `tolerance`: Số thực dương ($\text{tolerance} > 0$, mặc định $10^{-6}$).

3. **Nghiệp vụ Xử lý Ngoại lệ Toán học và Ràng buộc Biên (`operators.py`):**
   * **Kiểm soát miền xác định:** Trong quá trình tính $f(X)$, nếu cá thể rơi vào điểm kỳ dị (chia cho $0$, căn bậc hai của số âm, $\log$ của số âm) làm phát sinh giá trị `NaN` hoặc `Inf`, hệ thống tự động bắt cảnh báo NumPy và gán $\text{Fitness} = 0$ (hoặc sai số bằng $\infty$) cho cá thể đó để đào thải tự nhiên ở bước chọn lọc.
   * **Cắt biên (Boundary Clipping):** Sau khi lai ghép $\text{BLX}-\alpha$ và đột biến Gaussian, giá trị gen mới có thể vượt ra ngoài đoạn $[\text{min\_bound}, \text{max\_bound}]$. Hệ thống dùng `np.clip()` để ép các gen vượt rào quay về sát biên giới hạn.

4. **Nghiệp vụ Theo dõi Hội tụ và Đánh giá Kết quả (`solver.py`):**
   * Ở mỗi thế hệ, ghi nhận lại cá thể tốt nhất hiện tại (`best_fitness` và `min_error`) vào mảng `history`.
   * Phân loại trạng thái kết thúc của thuật toán:
     * `converged`: Tìm được bộ nghiệm có sai số $|f(X)| \le \text{tolerance}$ trước hoặc tại thế hệ cuối.
     * `max_generations_reached`: Đã chạy hết số thế hệ tối đa nhưng sai số vẫn lớn hơn `tolerance` (thường gặp khi khoảng tìm kiếm sai, tham số chưa tối ưu hoặc phương trình vô nghiệm trên tập số thực).

### 4.2. Luồng hoạt động hệ thống (System Workflows)

#### Workflow 1: Luồng kiểm tra tính hợp lệ của phương trình (Validation Flow)

1. **Người dùng** nhập chuỗi phương trình vào ô input trên `EquationForm.tsx` và nhấn nút kiểm tra (hoặc dừng gõ sau $500\text{ ms}$ nhờ cơ chế Debounce).
2. **Frontend** gửi request `POST /api/v1/validate` kèm chuỗi phương trình.
3. **Backend (`api.py` $\rightarrow$ `parser.py`)** nhận chuỗi, kiểm tra số lượng dấu `=` (báo lỗi nếu có nhiều hơn $1$ dấu `=`).
4. **SymPy** phân tích cú pháp:
   * *Trường hợp lỗi cú pháp* (thiếu ngoặc, hàm không tồn tại như `abc(x)`): Bắt ngoại lệ `SympifyError`, trả về HTTP 200 kèm `"is_valid": false` và thông báo lỗi chi tiết.
   * *Trường hợp không có biến số* (ví dụ nhập `2 + 3 = 5`): Trả về `"is_valid": false` với thông báo phương trình không chứa ẩn số.
   * *Trường hợp hợp lệ:* Trích xuất danh sách biến, trả về `"is_valid": true`, biểu thức chuẩn hóa và mảng `variables`.
5. **Frontend** nhận phản hồi:
   * Nếu hợp lệ: Hiển thị danh sách biến số tìm được lên giao diện và kích hoạt (enable) nút "Giải phương trình".
   * Nếu lỗi: Hiển thị viền đỏ quanh ô nhập và thông báo nguyên nhân lỗi.

#### Workflow 2: Luồng thực thi giải thuật và hiển thị kết quả (Solving Flow)

1. **Người dùng** điều chỉnh các thanh trượt tham số trên `ParameterConfig.tsx` và nhấn nút **"Giải phương trình"**.
2. **Frontend** chuyển sang trạng thái Loading (vô hiệu hóa nút bấm, hiện spinner) và gửi request `POST /api/v1/solve` chứa phương trình cùng bộ tham số GA.
3. **Backend (`schemas.py`)** kiểm tra kiểu dữ liệu và giới hạn của các tham số thông qua Pydantic. Nếu sai lệch, trả về lỗi HTTP 422.
4. **Backend (`solver.py`)** bắt đầu bấm giờ (`time.perf_counter()`) và khởi chạy GA Engine:
   * Gọi `parser.py` để lấy danh sách $n$ biến số và hàm mục tiêu đã vector hóa.
   * Gọi `population.py` khởi tạo ma trận quần thể kích thước $(N \times n)$ ngẫu nhiên phân phối đều trong `bounds`.
   * **Vòng lặp thế hệ (`for gen in range(1, max_generations + 1)`):**
     * Tính mảng giá trị lỗi $|f(X)|$ và mảng `fitness` cho cả quần thể.
     * Xác định cá thể tốt nhất thế hệ, lưu thông số vào danh sách `history`.
     * Kiểm tra nếu $\text{min\_error} \le \text{tolerance}$ thì thoát vòng lặp sớm (`status = "converged"`).
     * Trích xuất $2$ cá thể tốt nhất đưa vào quần thể mới (Elitism).
     * Thực hiện Tournament Selection để chọn các cặp cha mẹ.
     * Thực hiện lai ghép $\text{BLX}-\alpha$ và đột biến Gaussian để tạo $(N - 2)$ cá thể con.
     * Cắt biên (`np.clip`) và gộp với $2$ cá thể ưu tú thành quần thể cho thế hệ kế tiếp.
5. **Backend** dừng bấm giờ, đóng gói bộ nghiệm tốt nhất (map từng giá trị trong mảng nghiệm với tên biến tương ứng), thời gian chạy, trạng thái và mảng `history` thành JSON trả về cho Frontend.
6. **Frontend** nhận dữ liệu, tắt trạng thái Loading:
   * Component `ResultDisplay.tsx` hiển thị trạng thái hội tụ, thời gian xử lý ($\text{ms}$), sai số cuối cùng và giá trị cụ thể của từng biến.
   * Component `ConvergenceChart.tsx` nhận mảng `history` và vẽ biểu đồ đường (Line Chart) thể hiện sự biến thiên của `best_fitness` và `min_error` qua từng thế hệ.

---

## 5. Thiết kế Schema & API

### 5.1. Data Schema (JSON Format)

**1. Validate Equation Request:**

```json
{
  "equation": "x**2 + 2*y - sin(z) = 4"
}
```

**Validate Equation Response:**

```json
{
  "is_valid": true,
  "normalized_equation": "x**2 + 2*y - sin(z) - (4)",
  "variables": ["x", "y", "z"],
  "message": "Phương trình hợp lệ"
}
```

**2. Solve Equation Request:**

```json
{
  "equation": "x**2 + 2*y - 4",
  "bounds": [-10.0, 10.0],
  "pop_size": 100,
  "max_generations": 500,
  "crossover_rate": 0.8,
  "mutation_rate": 0.1,
  "tolerance": 1e-6
}
```

**Solve Equation Response:**

```json
{
  "status": "converged",
  "execution_time_ms": 125.4,
  "generations_run": 85,
  "best_solution": {
    "x": 1.414213,
    "y": 1.000000
  },
  "best_fitness": 0.9999998,
  "final_error": 0.0000002,
  "history": [
    {
      "generation": 1,
      "best_fitness": 0.25,
      "min_error": 3.0
    },
    {
      "generation": 2,
      "best_fitness": 0.50,
      "min_error": 1.0
    }
  ]
}
```

### 5.2. Danh sách API Endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/validate` | Kiểm tra cú pháp phương trình và tự động trích xuất danh sách biến số. |
| `POST` | `/api/v1/solve` | Nhận cấu hình GA và phương trình, thực thi thuật toán và trả về kết quả. |

---

## 6. Các giai đoạn triển khai (Implementation Phases)

* **Phase 1: Xây dựng Core GA Engine (Backend)**
  * Cài đặt môi trường Python, viết module xử lý chuỗi phương trình bằng SymPy.
  * Lập trình các toán tử di truyền (Khởi tạo, Fitness, Chọn lọc, Lai ghép, Đột biến) bằng NumPy.
  * Chạy thử nghiệm thuật toán trên Terminal.
* **Phase 2: Xây dựng RESTful API (Backend)**
  * Định nghĩa Pydantic Schemas.
  * Tạo các API endpoints bằng FastAPI kết nối với Core GA Engine.
  * Cấu hình CORS để cho phép ứng dụng React + TypeScript gọi API.
* **Phase 3: Xây dựng Giao diện người dùng (Frontend - React)**
  * Khởi tạo project React + TypeScript (Vite) + TailwindCSS.
  * Xây dựng Component nhập phương trình (có gọi API validate) và thanh trượt (Slider) chỉnh tham số GA.
  * Xây dựng Component hiển thị kết quả nghiệm và vẽ biểu đồ hội tụ từ dữ liệu `history`.
* **Phase 4: Tích hợp và Kiểm thử (Integration & Testing)**
  * Kết nối Frontend và Backend.
  * Kiểm thử với các phương trình: Bậc nhất, đa thức bậc cao, lượng giác, phương trình vô nghiệm (xem cách thuật toán phản ứng).