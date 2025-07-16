import axios from "axios";
import { API_CONFIG } from "../config/api";
import { decodeJWT } from "./jwtDecode";

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

    // Nếu thời gian hiện tại lớn hơn thời gian hết hạn, token đã hết hạn
    // Tạo buffer 60 giây để tránh trường hợp token sắp hết hạn
    return currentTime > decoded.exp - 60;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// Refresh token
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const authUser = localStorage.getItem("authUser");
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
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data && response.data.accessToken) {
      const newAccessToken = response.data.accessToken;

      // Cập nhật lại localStorage
      parsedUser.accessToken = newAccessToken;
      parsedUser.token = newAccessToken;
      localStorage.setItem("authUser", JSON.stringify(parsedUser));

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
  const authUser = localStorage.getItem("authUser");
  console.log("authUser from localStorage:", authUser);
  if (authUser) {
    try {
      const parsedUser = JSON.parse(authUser);
      const token = parsedUser.accessToken || parsedUser.token;
      console.log("Parsed token:", token);
      if (token) {
        axios.defaults.headers.common["Authorization"] = "Bearer " + token;
        console.log("Authorization header loaded:", axios.defaults.headers.common["Authorization"]);
      }
    } catch (error) {
      console.error("Error parsing auth user from localStorage:", error);
      localStorage.removeItem("authUser");
    }
  } else {
    console.log("No authUser found in localStorage");
  }
};

// Initialize auth token
loadAuthToken();

// Add withCredentials to support cookies, authorization headers with HTTPS
axios.defaults.withCredentials = true;

// Add request interceptor to check token expiration and refresh if needed
axios.interceptors.request.use(
  async function (config) {
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL
    });

    // Không kiểm tra token cho các request liên quan đến authentication
    if (config.url?.includes('/authentications/login') ||
      config.url?.includes('/authentications/refresh-token')) {
      return config;
    }

    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      const parsedUser = JSON.parse(authUser);
      const token = parsedUser.accessToken || parsedUser.token;

      if (token && isTokenExpired(token)) {
        console.log("Token expired, attempting to refresh");
        const newToken = await refreshAuthToken();

        if (newToken) {
          // Cập nhật token cho request hiện tại
          config.headers.Authorization = `Bearer ${newToken}`;
          console.log("Request will use new token");
        } else {
          // Nếu không refresh được token, xóa thông tin user và chuyển hướng đến trang login
          localStorage.removeItem("authUser");
          window.location.href = "/";
          console.log("Could not refresh token, redirecting to login");
        }
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
    console.log("Axios interceptor - original response:", response);
    const result = response.data ? response.data : response;
    console.log("Axios interceptor - returning:", result);
    return result;
  },
  async function (error) {
    // Xử lý trường hợp token hết hạn (401 Unauthorized)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true; // Đánh dấu đã thử refresh token

      try {
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Cập nhật Authorization header cho request ban đầu
          error.config.headers.Authorization = `Bearer ${newToken}`;
          // Thử lại request ban đầu
          return axios(error.config);
        } else {
          // Nếu không refresh được token, xóa thông tin user và chuyển hướng đến trang login
          localStorage.removeItem("authUser");
          window.location.href = "/";
          console.log("Could not refresh token after 401, redirecting to login");
        }
      } catch (refreshError) {
        console.error("Error during token refresh after 401:", refreshError);
        localStorage.removeItem("authUser");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('CORS or Network Error:', error);
      return Promise.reject('Network Error: API is not accessible. This may be due to CORS restrictions.');
    }

    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let message;
    switch (error.response?.status) {
      case 500:
        message = "Internal Server Error";
        break;
      case 401:
        message = "Invalid credentials";
        break;
      case 404:
        message = "Sorry! the data you are looking for could not be found";
        break;
      default:
        message = error.message || error;
    }
    return Promise.reject(message);
  }
);

class APIClient {
  get = (url: string, params?: any) => {
    return axios.get(url, { params });
  };

  create = (url: string, data: any) => {
    return axios.post(url, data);
  };

  update = (url: string, data: any) => {
    return axios.patch(url, data);
  };

  put = (url: string, data: any) => {
    return axios.put(url, data);
  };

  delete = (url: string, config?: any) => {
    return axios.delete(url, config);
  };
}

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

export { APIClient, setAuthorization, loadAuthToken, refreshAuthToken, isTokenExpired };
