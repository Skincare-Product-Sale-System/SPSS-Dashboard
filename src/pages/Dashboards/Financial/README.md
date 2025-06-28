# Financial Dashboard

Financial Dashboard là một module mới được thêm vào hệ thống SPSS để hiển thị và phân tích dữ liệu tài chính.

## Tính năng

### 1. Date Range Picker
- Chọn khoảng thời gian tùy chỉnh
- Các preset nhanh: Hôm nay, Tuần này, Tháng này, Năm nay, 30 ngày qua, 90 ngày qua
- Validation: Ngày bắt đầu không thể sau ngày kết thúc

### 2. Financial Summary Cards
Hiển thị các thông số tài chính chính:
- **Tổng Doanh Thu**: Tổng doanh thu trong khoảng thời gian
- **Lợi Nhuận**: Tổng lợi nhuận và tỷ lệ lợi nhuận
- **Chi Phí Mua Hàng**: Tổng chi phí mua hàng
- **Đơn Hàng Hoàn Thành**: Số lượng đơn hàng đã hoàn thành
- **Đơn Hàng Chờ Xử Lý**: Số lượng đơn hàng đang chờ xử lý
- **Giảm Giá**: Tổng số tiền giảm giá

### 3. Monthly Report Chart
- Biểu đồ cột hiển thị doanh thu, lợi nhuận và chi phí theo tháng
- Biểu đồ đường hiển thị tỷ lệ lợi nhuận theo tháng
- Tooltip chi tiết khi hover

### 4. Order Status Distribution
- Biểu đồ tròn hiển thị phân bố trạng thái đơn hàng
- Tổng hợp số lượng và tỷ lệ phần trăm cho mỗi trạng thái
- Legend và tooltip tương tác

### 5. Product Profit Analysis
- Bảng phân tích lợi nhuận sản phẩm
- Sắp xếp theo lợi nhuận, doanh thu hoặc tỷ lệ lợi nhuận
- Hiển thị progress bar cho tỷ lệ lợi nhuận
- Tổng hợp thống kê tổng quan

## API Endpoints

### 1. Financial Summary
```
GET /api/financial-dashboard/summary?startDate={startDate}&endDate={endDate}
```

### 2. Product Profit Analysis
```
GET /api/financial-dashboard/product-profit?startDate={startDate}&endDate={endDate}
```

### 3. Monthly Report
```
GET /api/financial-dashboard/monthly-report/{year}
```

### 4. All Financial Data
```
GET /api/financial-dashboard/all-financial-data?startDate={startDate}&endDate={endDate}
```

## Cấu trúc Components

```
src/pages/Dashboards/Financial/
├── index.tsx                    # Component chính
├── DateRangePicker.tsx          # Chọn khoảng thời gian
├── FinancialSummary.tsx         # Cards thống kê tài chính
├── MonthlyReportChart.tsx       # Biểu đồ báo cáo hàng tháng
├── OrderStatusDistribution.tsx  # Phân bố trạng thái đơn hàng
├── ProductProfitAnalysis.tsx    # Phân tích lợi nhuận sản phẩm
└── README.md                    # Hướng dẫn sử dụng
```

## Cách sử dụng

1. Truy cập vào menu "Bảng Điều Khiển" > "Financial Dashboard"
2. Chọn khoảng thời gian muốn xem dữ liệu
3. Xem các thống kê tổng quan trong các cards
4. Phân tích biểu đồ doanh thu và lợi nhuận theo tháng
5. Xem phân bố trạng thái đơn hàng
6. Phân tích lợi nhuận từng sản phẩm

## Dependencies

- **recharts**: Để tạo các biểu đồ
- **lucide-react**: Icons
- **Tailwind CSS**: Styling

## Responsive Design

Dashboard được thiết kế responsive và hoạt động tốt trên:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## Error Handling

- Loading states cho tất cả API calls
- Error messages khi API fails
- Retry functionality
- Validation cho date range picker 