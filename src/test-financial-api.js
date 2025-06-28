// Test file để kiểm tra Financial API
// Chạy file này trong browser console để debug

const testFinancialAPI = async () => {
  try {
    // Lấy token từ localStorage
    const authUser = localStorage.getItem("authUser");
    const token = authUser ? JSON.parse(authUser).accessToken : null;
    
    console.log("🔍 [Financial API Test] Debug Info:");
    console.log("- AuthUser found:", authUser ? 'YES' : 'NO');
    console.log("- Token:", token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    if (!token) {
      console.error("❌ No token found in localStorage");
      return;
    }
    
    // Decode token để xem thông tin
    try {
      const payload = JSON.parse(atob(token.split('.')[1] + '==='.slice((token.split('.')[1].length + 3) % 4)));
      console.log("📋 Token payload:", payload);
      console.log("👤 User role:", payload.Role);
      console.log("🆔 User ID:", payload.Id);
      console.log("⏰ Token expires at:", new Date(payload.exp * 1000));
      console.log("🕐 Current time:", new Date());
      console.log("❓ Is token expired?", Date.now() / 1000 > payload.exp);
    } catch (e) {
      console.error("❌ Failed to decode token:", e);
    }
    
    // Test API endpoints
    const endpoints = [
      {
        name: "Financial Summary",
        url: "http://localhost:5041/api/financial-dashboard/summary?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z"
      },
      {
        name: "Product Profit",
        url: "http://localhost:5041/api/financial-dashboard/product-profit?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z"
      },
      {
        name: "All Financial Data",
        url: "http://localhost:5041/api/financial-dashboard/all-financial-data?startDate=2024-12-31T17%3A00%3A00.000Z&endDate=2025-06-28T03%3A40%3A42.894Z"
      },
      {
        name: "Monthly Report 2024",
        url: "http://localhost:5041/api/financial-dashboard/monthly-report/2024"
      }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔗 Testing: ${endpoint.name}`);
      console.log(`📡 URL: ${endpoint.url}`);
      
      try {
        const response = await fetch(endpoint.url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        console.log(`📋 Response headers:`, [...response.headers.entries()]);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success:`, data);
        } else {
          const errorData = await response.text();
          console.log(`❌ Error response:`, errorData);
        }
      } catch (error) {
        console.error(`💥 Request failed:`, error);
      }
    }
    
  } catch (error) {
    console.error("💥 Test failed:", error);
  }
};

// Chạy test
console.log("🚀 Starting Financial API Test...");
testFinancialAPI(); 