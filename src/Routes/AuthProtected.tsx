import React, { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";

interface AuthProtectedProps {
  children: ReactNode;
}

const AuthProtected: React.FC<AuthProtectedProps> = ({ children }) => {
  // Kiểm tra token trong cả localStorage và sessionStorage
  const hasToken = () => {
    return !!localStorage.getItem("authUser") || !!sessionStorage.getItem("authUser");
  };

  // Đồng bộ hóa giữa localStorage và sessionStorage
  useEffect(() => {
    const syncStorages = () => {
      const localData = localStorage.getItem("authUser");
      const sessionData = sessionStorage.getItem("authUser");

      if (localData && !sessionData) {
        console.log("AuthProtected: Đồng bộ từ localStorage sang sessionStorage");
        sessionStorage.setItem("authUser", localData);
      } else if (!localData && sessionData) {
        console.log("AuthProtected: Đồng bộ từ sessionStorage sang localStorage");
        localStorage.setItem("authUser", sessionData);
      }
    };

    syncStorages();
  }, []);

  // Nếu không có token trong cả hai nơi lưu trữ, chuyển hướng về trang đăng nhập
  if (!hasToken()) {
    console.log("AuthProtected: Không tìm thấy token, chuyển hướng về trang đăng nhập");
    return <Navigate to="/" />;
  }

  // Nếu có token, cho phép truy cập trang được bảo vệ
  console.log("AuthProtected: Đã xác thực thành công");
  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthProtected;
