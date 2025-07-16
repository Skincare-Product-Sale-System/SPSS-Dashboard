import React, { useEffect } from 'react';
import './assets/scss/themes.scss';
import RouteIndex from 'Routes/Index';

import fakeBackend from "./helpers/AuthType/fakeBackend";
import { initFirebaseBackend } from "./helpers/firebase_helper";
import { loadAuthToken } from "./helpers/api_helper";
import { showSessionWarning, protectSessionOnReload } from "./helpers/sessionMonitor";

// Activating fake backend
fakeBackend();

// init firebase backend
const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN,
  databaseURL: process.env.REACT_APP_DATABASEURL,
  projectId: process.env.REACT_APP_PROJECTID,
  storageBucket: process.env.REACT_APP_STORAGEBUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
  appId: process.env.REACT_APP_APPID,
  measurementId: process.env.REACT_APP_MEASUREMENTID,
};

// init firebase backend
initFirebaseBackend(firebaseConfig);

function App() {
  useEffect(() => {
    // Đăng ký chức năng bảo vệ phiên khi reload trang
    const cleanupProtectSession = protectSessionOnReload();

    // Đồng bộ hóa localStorage và sessionStorage
    const syncStorages = () => {
      const localData = localStorage.getItem("authUser");
      const sessionData = sessionStorage.getItem("authUser");

      // Nếu có dữ liệu trong localStorage nhưng không có trong sessionStorage
      if (localData && !sessionData) {
        console.log("Đồng bộ dữ liệu từ localStorage sang sessionStorage");
        sessionStorage.setItem("authUser", localData);
      }
      // Nếu có dữ liệu trong sessionStorage nhưng không có trong localStorage
      else if (!localData && sessionData) {
        console.log("Đồng bộ dữ liệu từ sessionStorage sang localStorage");
        localStorage.setItem("authUser", sessionData);
      }
    };

    // Thực hiện đồng bộ khi khởi động
    syncStorages();

    // Load auth token when app starts
    loadAuthToken();

    // Kiểm tra và hiển thị cảnh báo nếu phiên đã hết hạn
    showSessionWarning();

    // Thiết lập kiểm tra phiên định kỳ, nhưng không tự động đăng xuất
    const sessionCheck = setInterval(() => {
      showSessionWarning();

      // Đồng bộ hóa định kỳ
      syncStorages();
    }, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút

    // Theo dõi các thay đổi trong localStorage để xử lý đăng nhập/đăng xuất
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authUser') {
        if (!e.newValue) {
          console.log('User logged out (detected by storage event)');
          // Vô hiệu hóa tự động chuyển hướng - chỉ ghi log, không làm gì cả
          console.log('Auto-redirect disabled to prevent automatic logout');

          // QUAN TRỌNG: Không tự động chuyển hướng
          // const currentPath = window.location.pathname;
          // if (currentPath !== "/" && currentPath !== "/login") {
          //   window.location.href = "/";
          // }
        } else if (!e.oldValue) {
          console.log('User logged in (detected by storage event)');
          // Token mới được thêm vào, có thể thực hiện các hành động cần thiết
          loadAuthToken(); // Nạp lại token
        }
      }
    };

    // Đăng ký sự kiện theo dõi localStorage
    window.addEventListener('storage', handleStorageChange);

    // Dọn dẹp khi component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(sessionCheck);
      cleanupProtectSession(); // Dọn dẹp chức năng bảo vệ phiên
    };
  }, []);

  return (
    <RouteIndex />
  );
}

export default App;
