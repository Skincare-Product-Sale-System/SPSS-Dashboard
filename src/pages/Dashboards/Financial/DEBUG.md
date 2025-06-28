# Debug Financial API Issues

## Vấn đề: API bị Forbidden (403)

### Nguyên nhân có thể:
1. **Thiếu Authorization Header**: API cần Bearer token
2. **Token hết hạn**: JWT token đã expired
3. **Không đủ quyền**: User role không có quyền truy cập Financial Dashboard
4. **Token không đúng format**: Header không đúng chuẩn

### Cách Debug:

#### 1. Kiểm tra Token trong localStorage
```javascript
// Mở browser console và chạy:
const authUser = localStorage.getItem("authUser");
console.log("AuthUser:", authUser);

if (authUser) {
  const user = JSON.parse(authUser);
  console.log("Token:", user.accessToken);
  
  // Decode token
  const payload = JSON.parse(atob(user.accessToken.split('.')[1]));
  console.log("Token payload:", payload);
  console.log("User role:", payload.Role);
  console.log("Expires at:", new Date(payload.exp * 1000));
}
```

#### 2. Test API trực tiếp
```javascript
// Copy file src/test-financial-api.js vào browser console
// Hoặc truy cập: http://localhost:3000/simple-financial
```

#### 3. Kiểm tra Network Tab
1. Mở Developer Tools (F12)
2. Vào tab Network
3. Truy cập Financial Dashboard
4. Xem request có Authorization header không

#### 4. Kiểm tra Backend Logs
- Xem log của API server
- Kiểm tra xem có nhận được token không
- Kiểm tra quyền của user

### Các bước khắc phục:

#### 1. Đảm bảo đã login
```javascript
// Kiểm tra login status
const authUser = localStorage.getItem("authUser");
if (!authUser) {
  // Redirect to login
  window.location.href = '/login';
}
```

#### 2. Refresh token nếu cần
```javascript
// Nếu token hết hạn, logout và login lại
localStorage.removeItem("authUser");
window.location.href = '/login';
```

#### 3. Kiểm tra quyền user
- Đảm bảo user có role phù hợp (Admin, Manager, etc.)
- Kiểm tra backend có authorize Financial Dashboard endpoints

#### 4. Test với Postman/Insomnia
```
GET http://localhost:5041/api/financial-dashboard/summary
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
```

### API Endpoints cần test:
1. `GET /api/financial-dashboard/summary`
2. `GET /api/financial-dashboard/product-profit`
3. `GET /api/financial-dashboard/all-financial-data`
4. `GET /api/financial-dashboard/monthly-report/{year}`

### Expected Response Format:
```json
{
  "success": true,
  "data": {
    // Financial data here
  },
  "message": "Success message",
  "errors": null
}
```

### Error Response Format:
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": ["Error details"]
}
``` 