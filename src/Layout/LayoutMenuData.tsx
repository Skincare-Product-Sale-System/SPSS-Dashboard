import { MonitorDot, ShoppingBag, TrendingUp } from "lucide-react";

const menuData: any = [
    {
        label: 'Menu',
        isTitle: true,
    },
    {
        id: "dashboard",
        label: 'Bảng Điều Khiển',
        link: "/#",
        icon: <MonitorDot />,
        subItems: [
            {
                id: 'ecommercedashboard',
                label: 'Thương Mại Điện Tử',
                link: '/dashboard',
                parentId: "dashboard"
            },
            {
                id: 'financialdashboard',
                label: 'Kinh Tế',
                link: '/financial-dashboard',
                parentId: "dashboard"
            },
        ]
    },
    {
        label: 'Ứng Dụng',
        isTitle: true,
    },
    {
        id: "ecommerce",
        label: 'Thương Mại Điện Tử',
        link: "/#",
        icon: <ShoppingBag />,
        subItems: [
            {
                id: 'account',
                label: 'Tài Khoản',
                link: '/apps-ecommerce-account',
                parentId: 'ecommerce'
            },
            // {
            //     id: 'blog',
            //     label: 'Blog',
            //     link: '/apps-ecommerce-blog',
            //     parentId: 'ecommerce'
            // },
            {
                id: 'cancel reason',
                label: 'Lý Do Hủy Đơn',
                link: '/apps-ecommerce-cancel-reason',
                parentId: 'ecommerce'
            },
            // {
            //     id: 'category',
            //     label: 'Category',
            //     link: '/apps-ecommerce-category',
            //     parentId: 'ecommerce'
            // },
            {
                id: 'order',
                label: 'Đơn Hàng',
                link: '/apps-ecommerce-orders',
                parentId: 'ecommerce'
            },
            {
                id: 'payment-method',
                label: 'Phương Thức Thanh Toán',
                link: '/apps-ecommerce-payment-method',
                parentId: 'ecommerce'
            },
            {
                id: 'product',
                label: 'Sản Phẩm',
                parentId: 'ecommerce',
                link: "/apps-ecommerce-product-list",
            },
            {
                id: 'reviews',
                label: 'Đánh Giá',
                link: '/apps-ecommerce-reviews',
                parentId: 'ecommerce'
            },
            {
                id: 'survey-question',
                label: 'Câu Hỏi Khảo Sát',
                link: '/apps-ecommerce-survey-question',
                parentId: 'ecommerce'
            },
            {
                id: 'variation',
                label: 'Biến Thể',
                link: '/apps-ecommerce-variation',
                parentId: 'ecommerce'
            },
            {
                id: 'variation-option',
                label: 'Tùy Chọn Biến Thể',
                link : '/apps-ecommerce-variation-option',
                parentId: 'ecommerce'
            },
            {
                id: 'voucher',
                label: 'Phiếu Giảm Giá',
                link: '/apps-ecommerce-voucher',
                parentId: 'ecommerce'
            },
            {
                id: 'brand',
                label: 'Thương Hiệu',
                link: '/apps-ecommerce-brand',
                parentId: 'ecommerce'
            },
            {
                id: 'skin-analysis',
                label: 'Phân Tích Da',
                link: '/apps-ecommerce-skin-analysis',
                parentId: 'ecommerce'
            },
            {
                id: 'transaction-management',
                label: 'Quản Lý Giao Dịch',
                link: '/apps-ecommerce-transaction-management',
                parentId: 'ecommerce'
            }
        ]
    },
];

export { menuData };