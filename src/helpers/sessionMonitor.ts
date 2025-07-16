import { decodeJWT } from "./jwtDecode";

/**
 * Hàm kiểm tra và cảnh báo khi token đã hết hạn mà không tự động đăng xuất
 * @returns Đối tượng chứa thông tin về phiên đăng nhập
 */
export const checkSession = () => {
    try {
        // Kiểm tra cả localStorage và sessionStorage
        const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
        if (!authUser) {
            return { isLoggedIn: false, isExpired: false, message: "Người dùng chưa đăng nhập" };
        }

        // Parse thông tin người dùng
        const parsedUser = JSON.parse(authUser);
        const token = parsedUser.accessToken || parsedUser.token;

        if (!token) {
            return { isLoggedIn: false, isExpired: false, message: "Không tìm thấy token" };
        }

        // Decode token để kiểm tra thời gian hết hạn
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) {
            return {
                isLoggedIn: true,
                isExpired: true,
                message: "Token không hợp lệ hoặc không có thông tin hết hạn",
                user: parsedUser
            };
        }

        // Lấy thời gian hiện tại (Unix timestamp, đơn vị giây)
        const currentTime = Math.floor(Date.now() / 1000);
        const isTokenExpired = currentTime > decoded.exp;

        return {
            isLoggedIn: true,
            isExpired: isTokenExpired,
            message: isTokenExpired ?
                "Phiên đăng nhập đã hết hạn nhưng vẫn được giữ lại" :
                "Phiên đăng nhập còn hiệu lực",
            expiresAt: new Date(decoded.exp * 1000),
            timeLeft: decoded.exp - currentTime,
            user: {
                id: decoded.Id,
                username: decoded.UserName,
                email: decoded.Email,
                role: decoded.Role,
                ...parsedUser
            }
        };
    } catch (error) {
        console.error("Lỗi khi kiểm tra phiên đăng nhập:", error);
        return {
            isLoggedIn: false,
            isExpired: true,
            message: "Lỗi khi kiểm tra phiên đăng nhập",
            error
        };
    }
};

/**
 * Hiển thị cảnh báo khi token hết hạn nhưng không tự động đăng xuất
 */
export const showSessionWarning = () => {
    const session = checkSession();

    if (session.isLoggedIn && session.isExpired) {
        console.warn("=== CẢNH BÁO PHIÊN ĐĂNG NHẬP ===");
        console.warn("Phiên đăng nhập của bạn đã hết hạn nhưng vẫn được duy trì để tránh mất dữ liệu");
        console.warn("Một số tính năng có thể không hoạt động. Vui lòng đăng xuất và đăng nhập lại khi thuận tiện");
        console.warn("Thông tin phiên:", session);

        // Có thể hiển thị thông báo cho người dùng ở đây
        // Nhưng không tự động đăng xuất

        return true;
    }

    return false;
};

/**
 * Bảo vệ phiên đăng nhập khi reload trang
 * Đảm bảo token không bị mất khi reload trang
 */
export const protectSessionOnReload = () => {
    // Lưu token vào sessionStorage trước khi reload
    const handleBeforeUnload = () => {
        try {
            const localData = localStorage.getItem("authUser");
            if (localData) {
                sessionStorage.setItem("authUser", localData);
                console.log("Đã lưu token vào sessionStorage trước khi reload");
            }
        } catch (error) {
            console.error("Lỗi khi bảo vệ phiên:", error);
        }
    };

    // Đăng ký sự kiện beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Trả về hàm dọn dẹp để sử dụng trong useEffect
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
};

// Cung cấp một hàm để gọi khi cần đăng xuất thủ công
export const manualLogout = () => {
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authUser");
    window.location.href = "/";
};

export default {
    checkSession,
    showSessionWarning,
    manualLogout,
    protectSessionOnReload
}; 