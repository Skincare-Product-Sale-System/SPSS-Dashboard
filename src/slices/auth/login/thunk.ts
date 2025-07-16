import { postJwtLogin } from "helpers/fakebackend_helper";
import { clearLoginError, loginError, loginSuccess, logoutSuccess } from "./reducer";
import { ThunkAction } from "redux-thunk";
import { Action, Dispatch } from "redux";
import { RootState } from "slices";
import { getFirebaseBackend } from "helpers/firebase_helper";
import axios from "axios";
import { decodeJWT } from "helpers/jwtDecode";
import { setAuthorization } from "helpers/api_helper";
import { API_CONFIG } from "config/api";

interface User {
  email: string;
  password: string;
}
export const loginUser =
  (
    user: User,
    history: any
  ): ThunkAction<void, RootState, unknown, Action<string>> =>
    async (dispatch: Dispatch) => {
      // Clear any previous errors
      dispatch(clearLoginError());

      axios
        .post(`${API_CONFIG.BASE_URL}/authentications/login`, {
          usernameOrEmail: user.email,
          password: user.password,
        })
        .then((response: any) => {
          console.log("Login response:", response);
          // Since we disabled unwrapping for login endpoint, response.data contains the actual data
          const { accessToken, refreshToken } = response.data;

          if (!accessToken) {
            throw new Error("No access token received");
          }

          const decodedToken = decodeJWT(accessToken);
          console.log("decodedToken", decodedToken);

          if (!decodedToken) {
            throw new Error("Invalid token format");
          }

          dispatch(loginSuccess("ok"));

          // Lưu trữ dữ liệu người dùng
          const userData = {
            accessToken: accessToken,
            token: accessToken, // Giữ lại cho backward compatibility
            refreshToken: refreshToken,
            imageUrl: decodedToken?.AvatarUrl,
            name: decodedToken?.UserName,
            role: decodedToken?.Role,
            id: decodedToken?.Id,
            email: decodedToken?.Email,
            tokenExpiry: decodedToken?.exp, // Lưu thời gian hết hạn để dễ debug
            lastLogin: new Date().toISOString(),
          };

          // Lưu vào cả localStorage và sessionStorage
          const userDataString = JSON.stringify(userData);
          localStorage.setItem("authUser", userDataString);
          sessionStorage.setItem("authUser", userDataString);
          console.log("Đã lưu dữ liệu người dùng vào localStorage và sessionStorage");

          // Thiết lập Authorization header
          setAuthorization(accessToken);

          // Chuyển hướng đến trang dashboard
          history("/dashboard");
        })
        .catch((error) => {
          console.error("Login error:", error);
          console.error("Error response:", error.response);
          dispatch(loginError(error.response?.data?.message || error.message || "Đăng nhập thất bại"));
        });
    }

export const logoutUser = () => async (dispatch: Dispatch) => {
  try {
    // Xóa dữ liệu trong cả localStorage và sessionStorage
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authUser");

    // Xóa Authorization header
    setAuthorization(null);

    // Thêm log để theo dõi
    console.log("User logged out manually");

    // Thông báo logout thành công
    dispatch(logoutSuccess(true));
  } catch (error) {
    console.error("Logout error:", error);
    dispatch(loginError(error));
  }
};

export const socialLogin =
  (type: any, history: any) => async (dispatch: any) => {
    try {
      let response: any;

      if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
        const fireBaseBackend = getFirebaseBackend();
        response = fireBaseBackend.socialLoginUser(type);
      }

      const socialData = await response;

      if (socialData) {
        sessionStorage.setItem("authUser", JSON.stringify(socialData));
        dispatch(loginSuccess(socialData));
        history("/dashboard");
      }
    } catch (error) {
      dispatch(loginError(error));
    }
  };
