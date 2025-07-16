import axios from "axios";
import { API_CONFIG } from "../config/api";
import { decodeJWT } from "./jwtDecode";

// Extend AxiosRequestConfig to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    _isRefreshRequest?: boolean;
    _retry?: boolean;
  }
}

// Set base URL for all API calls
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// Configure CORS settings
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';

// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

// Kiểm tra token có hết hạn hay không
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    // Lấy thời gian hiện tại (Unix timestamp, đơn vị giây)
    const currentTime = Math.floor(Date.now() / 1000);

    // Tạo buffer 5 phút (300 giây) để tránh trường hợp token sắp hết hạn
    // Tăng buffer từ 60s lên 300s để đảm bảo token luôn được refresh sớm
    return currentTime > decoded.exp - 300;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// Refresh token
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    // Ưu tiên lấy từ sessionStorage trước
    let authUser = sessionStorage.getItem("authUser");

    // Nếu không có trong sessionStorage thì thử lấy từ localStorage
    if (!authUser) {
      authUser = localStorage.getItem("authUser");
    }

    if (!authUser) return null;

    const parsedUser = JSON.parse(authUser);
    const refreshToken = parsedUser.refreshToken;

    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    console.log("Attempting to refresh token");
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/authentications/refresh-token`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
        // Đánh dấu request này để không bị interceptor xử lý
        _isRefreshRequest: true
      }
    );

    if (response.data && response.data.accessToken) {
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken || refreshToken; // Sử dụng refresh token mới nếu có

      // Cập nhật lại localStorage và sessionStorage với cả refresh token mới nếu có
      parsedUser.accessToken = newAccessToken;
      parsedUser.token = newAccessToken;
      parsedUser.refreshToken = newRefreshToken;

      const updatedUserData = JSON.stringify(parsedUser);
      localStorage.setItem("authUser", updatedUserData);
      sessionStorage.setItem("authUser", updatedUserData);

      // Đảm bảo header Authorization được cập nhật
      axios.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;

      console.log("Token refreshed successfully");
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

// Load authorization token from localStorage on app start
const loadAuthToken = () => {
  console.log("loadAuthToken called");

  // Ưu tiên lấy từ sessionStorage trước (phiên hiện tại)
  let authUser = sessionStorage.getItem("authUser");

  // Nếu không có trong sessionStorage thì thử lấy từ localStorage
  if (!authUser) {
    console.log("Không tìm thấy authUser trong sessionStorage, thử lấy từ localStorage");
    authUser = localStorage.getItem("authUser");

    // Nếu tìm thấy trong localStorage nhưng không có trong sessionStorage,
    // sao chép từ localStorage sang sessionStorage để đồng bộ
    if (authUser) {
      console.log("Tìm thấy authUser trong localStorage, sao chép sang sessionStorage");
      sessionStorage.setItem("authUser", authUser);
    }
  }

  console.log("authUser:", authUser ? "Đã tìm thấy" : "Không tìm thấy");

  if (authUser) {
    try {
      const parsedUser = JSON.parse(authUser);
      const token = parsedUser.accessToken || parsedUser.token;
      console.log("Parsed token:", token ? "Tồn tại" : "Không tồn tại");
      if (token) {
        // Kiểm tra xem token có hết hạn hay không
        if (isTokenExpired(token)) {
          console.log("Token expired on load, refreshing silently");
          // Thử refresh token
          refreshAuthToken().then(newToken => {
            if (newToken) {
              console.log("Token refreshed on app load");
              axios.defaults.headers.common["Authorization"] = "Bearer " + newToken;
            } else {
              console.log("Could not refresh token on app load");
              // Không xóa token ở đây để tránh log out không cần thiết
            }
          }).catch(err => {
            console.error("Error refreshing token on app load:", err);
          });
        } else {
          axios.defaults.headers.common["Authorization"] = "Bearer " + token;
          console.log("Authorization header loaded:", "Bearer " + token.substring(0, 15) + "...");
        }
      }
    } catch (error) {
      console.error("Error parsing auth user:", error);
      // Không xóa token ở đây để tránh log out không cần thiết
    }
  } else {
    console.log("No authUser found in localStorage or sessionStorage");
  }
};

// Add withCredentials to support cookies, authorization headers with HTTPS
axios.defaults.withCredentials = true;

// Biến để theo dõi trạng thái refresh token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Hàm để thêm các callback vào hàng đợi
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Hàm để thực thi tất cả các callback với token mới
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Add request interceptor to check token expiration and refresh if needed
axios.interceptors.request.use(
  async function (config) {
    // Lưu lại cấu hình URL để debug
    const requestUrl = config.url || '';

    // Không kiểm tra token cho các request liên quan đến authentication hoặc đang refresh
    if (requestUrl.includes('/authentications/login') ||
      requestUrl.includes('/authentications/refresh-token') ||
      config._isRefreshRequest) {
      return config;
    }

    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      try {
        const parsedUser = JSON.parse(authUser);
        const token = parsedUser.accessToken || parsedUser.token;

        if (!token) {
          console.log("No token found in localStorage for request:", requestUrl);
          return config;
        }

        if (isTokenExpired(token)) {
          console.log("Token expired for request:", requestUrl);

          // Nếu đang refresh token, đợi cho đến khi hoàn tất
          if (isRefreshing) {
            console.log("Token refresh in progress, adding request to queue:", requestUrl);
            return new Promise((resolve) => {
              subscribeTokenRefresh((newToken) => {
                config.headers.Authorization = `Bearer ${newToken}`;
                resolve(config);
              });
            });
          }

          isRefreshing = true;
          console.log("Starting token refresh for request:", requestUrl);

          try {
            const newToken = await refreshAuthToken();

            if (newToken) {
              // Cập nhật token cho request hiện tại
              config.headers.Authorization = `Bearer ${newToken}`;
              onRefreshed(newToken);
              console.log("Request will use new token:", requestUrl);
            } else {
              console.log("Could not refresh token, continuing with original token:", requestUrl);

              // QUAN TRỌNG: Vẫn sử dụng token cũ mặc dù đã hết hạn
              // Không xóa token để tránh tự động đăng xuất
              if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log("Using expired token for request:", requestUrl);
              }
            }
          } catch (error) {
            console.error("Error during token refresh:", error);

            // Vẫn sử dụng token cũ nếu có lỗi xảy ra
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              console.log("Using original token after refresh error:", requestUrl);
            }
          } finally {
            isRefreshing = false;
          }
        } else {
          // Đảm bảo token được đính kèm vào mọi request
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error processing auth data for request:", requestUrl, error);

        // Không làm gì cả, không xóa token
      }
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    // For login endpoint, don't unwrap the response to avoid confusion
    if (response.config?.url?.includes('/authentications/login')) {
      console.log("Login response (not unwrapped):", response);
      return response;
    }
    const result = response.data ? response.data : response;
    return result;
  },
  async function (error) {
    // Lưu lại URL của request gặp lỗi
    const requestUrl = error.config?.url || 'unknown URL';

    // Xử lý trường hợp token hết hạn (401 Unauthorized)
    if (error.response?.status === 401 && !error.config._retry) {
      console.log("401 Unauthorized for request:", requestUrl);
      error.config._retry = true; // Đánh dấu đã thử refresh token

      // Nếu đang refresh token, đợi cho đến khi hoàn tất
      if (isRefreshing) {
        console.log("Token refresh already in progress, adding 401 request to queue:", requestUrl);
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            error.config.headers.Authorization = `Bearer ${token}`;
            resolve(axios(error.config));
          });
        });
      }

      isRefreshing = true;
      console.log("Starting token refresh after 401 for request:", requestUrl);

      try {
        const newToken = await refreshAuthToken();

        if (newToken) {
          console.log("Token refreshed after 401, retrying request:", requestUrl);
          // Cập nhật Authorization header cho request ban đầu
          error.config.headers.Authorization = `Bearer ${newToken}`;
          // Thử lại request ban đầu
          isRefreshing = false;
          return axios(error.config);
        } else {
          isRefreshing = false;
          console.log("Could not refresh token after 401:", requestUrl);

          // QUAN TRỌNG: KHÔNG xóa token và KHÔNG chuyển hướng
          console.log("Not redirecting to login to prevent automatic logout");

          // Chỉ ghi log, không có hành động nào khác
          console.warn("Authentication issue detected, but auto-logout disabled");

          return Promise.reject(error);
        }
      } catch (refreshError) {
        isRefreshing = false;
        console.error("Error during token refresh after 401:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('CORS or Network Error:', error);
      return Promise.reject('Network Error: API is not accessible. This may be due to CORS restrictions.');
    }

    return Promise.reject(error);
  }
);

const setAuthorization = (token: any) => {
  console.log("setAuthorization called with token:", token);
  if (token) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    console.log("Authorization header set:", axios.defaults.headers.common["Authorization"]);
  } else {
    delete axios.defaults.headers.common["Authorization"];
    console.log("Authorization header removed");
  }
};

export {
  loadAuthToken,
  setAuthorization
};

// Get logged in user
const getLoggedinUser = () => {
  // Ưu tiên lấy từ sessionStorage trước
  const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");

  if (!authUser) {
    return null;
  }

  try {
    const userData = JSON.parse(authUser);
    return userData;
  } catch (error) {
    console.error("Error parsing auth user:", error);
    return null;
  }
};

// Is user is logged in
const isUserAuthenticated = () => {
  const user = getLoggedinUser();
  if (!user) {
    return false;
  }

  const token = user.accessToken || user.token;
  if (!token) {
    return false;
  }

  // QUAN TRỌNG: Bỏ kiểm tra token hết hạn để tránh tự động đăng xuất
  // Chỉ thử refresh token nhưng không ảnh hưởng đến kết quả xác thực
  if (isTokenExpired(token)) {
    console.log("Token expired but keeping user logged in");

    // Vẫn thử refresh token nhưng không gây ảnh hưởng đến phiên đăng nhập
    refreshAuthToken().catch((err) => {
      console.error("Failed to refresh token silently:", err);
      // Không xóa dữ liệu người dùng dù refresh thất bại
    });

    // Luôn trả về true bất kể token có hết hạn hay không
    return true;
  }

  return true;
};

export default {
  getLoggedinUser,
  isUserAuthenticated,
  setAuthorization,
  loadAuthToken
};
