import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from "react-redux";
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './slices';

// Đảm bảo token không bị mất khi chuyển trang
const ensureAuthPersistence = () => {
  // Đồng bộ giữa localStorage và sessionStorage khi trang được tải
  const localData = localStorage.getItem("authUser");
  const sessionData = sessionStorage.getItem("authUser");

  if (localData && !sessionData) {
    console.log("index: Đồng bộ từ localStorage sang sessionStorage");
    sessionStorage.setItem("authUser", localData);
  } else if (!localData && sessionData) {
    console.log("index: Đồng bộ từ sessionStorage sang localStorage");
    localStorage.setItem("authUser", sessionData);
  }

  // Đảm bảo token luôn được giữ lại khi chuyển trang
  const originalPushState = window.history.pushState;
  window.history.pushState = function () {
    // Trước khi chuyển trang, lưu token vào cả hai nơi
    const authData = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
    if (authData) {
      localStorage.setItem("authUser", authData);
      sessionStorage.setItem("authUser", authData);
    }

    return originalPushState.apply(this, arguments as any);
  };
};

// Gọi hàm bảo vệ token
ensureAuthPersistence();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const store = configureStore({ reducer: rootReducer, devTools: true });
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
