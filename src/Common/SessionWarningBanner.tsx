import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkSession, manualLogout } from '../helpers/sessionMonitor';
import { AlertTriangle } from 'lucide-react';

const SessionWarningBanner: React.FC = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<any>(null);

    useEffect(() => {
        // Kiểm tra phiên khi component mount
        checkSessionStatus();

        // Kiểm tra định kỳ mỗi phút
        const interval = setInterval(checkSessionStatus, 60000);

        return () => clearInterval(interval);
    }, []);

    const checkSessionStatus = () => {
        const session = checkSession();
        if (session.isLoggedIn && session.isExpired) {
            setShowBanner(true);
            setSessionInfo(session);
        } else {
            setShowBanner(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleLogout = () => {
        manualLogout();
    };

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white p-2 text-center">
            <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                    Phiên đăng nhập đã hết hạn nhưng vẫn được duy trì để tránh mất dữ liệu.
                    Một số tính năng có thể không hoạt động đúng.
                </span>
                <div className="flex gap-2 ml-2">
                    <button
                        onClick={handleRefresh}
                        className="bg-white text-amber-700 px-3 py-1 rounded text-sm font-medium hover:bg-amber-50"
                    >
                        Làm mới trang
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-amber-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-amber-800"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningBanner; 