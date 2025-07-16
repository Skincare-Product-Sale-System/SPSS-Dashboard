import React, { useCallback, useEffect, useMemo, useState } from "react";
import BreadCrumb from "Common/BreadCrumb";
import CountUp from 'react-countup';
import Flatpickr from "react-flatpickr";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "Common/Components/Dropdown";
import DeleteModal from "Common/DeleteModal";
import Modal from "Common/Components/Modal";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import * as Yup from "yup";
import { useFormik } from "formik";
import {
    getAllOrders,
    addOrder,
    updateOrder,
    deleteOrder
} from 'slices/order/thunk';
import { ToastContainer } from "react-toastify";
import filterDataBySearch from "Common/filterDataBySearch";
import { Search, Plus, MoreHorizontal, Trash2, Eye, FileEdit, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

// Add custom styles to ensure dropdowns in tables are visible
const tableDropdownStyles = `
  .table-dropdown-content {
    position: fixed !important;
    z-index: 9999 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
`;

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'Processing':
            return 'Đang xử lý';
        case 'Awaiting Payment':
            return 'Chờ thanh toán';
        case 'Pending':
            return 'Đang chờ';
        case 'Shipping':
            return 'Đang giao';
        case 'Delivered':
            return 'Đã giao';
        case 'Cancelled':
            return 'Đã hủy';
        case 'Return':
            return 'Trả hàng';
        default:
            return status;
    }
};

// Add this Status component definition before the Orders component
const Status = ({ item }: { item: string }) => {
    let statusClass = "";

    switch (item) {
        case "Processing":
            statusClass = "bg-yellow-100 text-yellow-500 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-500/20";
            break;
        case "Awaiting Payment":
            statusClass = "bg-sky-100 text-sky-500 border-sky-200 dark:bg-sky-500/20 dark:border-sky-500/20";
            break;
        case "Pending":
            statusClass = "bg-orange-100 text-orange-500 border-orange-200 dark:bg-orange-500/20 dark:border-orange-500/20";
            break;
        case "Shipping":
            statusClass = "bg-purple-100 text-purple-500 border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/20";
            break;
        case "Delivered":
            statusClass = "bg-green-100 text-green-500 border-green-200 dark:bg-green-500/20 dark:border-green-500/20";
            break;
        case "Cancelled":
            statusClass = "bg-red-100 text-red-500 border-red-200 dark:bg-red-500/20 dark:border-red-500/20";
            break;
        case "Return":
            statusClass = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/20 dark:border-slate-500/20";
            break;
        default:
            statusClass = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/20 dark:border-slate-500/20";
    }

    return (
        <span className={`px-2.5 py-0.5 text-xs inline-block font-medium rounded border ${statusClass}`}>
            {getStatusLabel(item)}
        </span>
    );
};

const Orders = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();

    const [currentPage, setCurrentPage] = useState(1);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [activeStatus, setActiveStatus] = useState<string | null>(null);
    const pageSize = 10; // Display page size

    // Updated selector to work with the new order reducer structure
    const orderSelector = createSelector(
        (state: any) => state.order,
        (order) => ({
            orders: order?.orders?.data?.items || [],
            totalCount: order?.orders?.data?.totalCount || 0,
            loading: order?.loading || false,
            error: order?.error || null,
        })
    );

    const { orders, loading } = useSelector(orderSelector);

    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [eventData, setEventData] = useState<any>();
    const [refreshFlag, setRefreshFlag] = useState(false);

    const [show, setShow] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);

    // Get all orders at once with large page size
    useEffect(() => {
        console.log("Fetching all orders with large page size");
        dispatch(getAllOrders({ page: 1, pageSize: 500 }));
    }, [dispatch, refreshFlag]);

    // Update local data when orders change
    useEffect(() => {
        console.log("Orders data updated:", orders);
        if (orders && orders.length > 0) {
            setAllOrders(orders);

            // Apply status filter if active
            if (activeStatus) {
                const filtered = orders.filter((order: any) => order.status === activeStatus);
                setFilteredData(filtered);
            } else {
                setFilteredData(orders);
            }
        }
    }, [orders, activeStatus]);

    // Handle pagination for filtered data
    useEffect(() => {
        // Reset to page 1 when filter changes
        setCurrentPage(1);
    }, [activeStatus]);

    // Get current page data
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredData.slice(startIndex, endIndex);
    };

    // Calculate total pages for pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);

    // Handle status filter
    const handleStatusFilter = (status: string | null) => {
        if (status === activeStatus) {
            // Toggle off the filter if clicking the active status
            setActiveStatus(null);
        } else {
            setActiveStatus(status);
        }
        setCurrentPage(1); // Reset to first page
    };

    // Delete toggle
    const deleteToggle = () => setDeleteModal(!deleteModal);

    // Delete Data
    const onClickDelete = (cell: any) => {
        setDeleteModal(true);
        if (cell.id) {
            setEventData(cell);
        }
    };

    // Handle Delete
    const handleDelete = () => {
        if (eventData) {
            dispatch(deleteOrder(eventData.id))
                .then(() => {
                    setDeleteModal(false);
                    setRefreshFlag(prev => !prev); // Trigger data refresh after deletion
                });
        }
    };

    // Search Data
    const filterSearchData = (e: any) => {
        const search = e.target.value.toLowerCase();
        if (search) {
            // Filter from all orders
            const searchFiltered = allOrders.filter((item: any) => {
                // Check order ID
                if (item.id && item.id.substring(0, 8).toLowerCase().includes(search)) {
                    return true;
                }

                // Check order date
                if (item.createdTime) {
                    const formattedDate = formatDate(item.createdTime).toLowerCase();
                    if (formattedDate.includes(search)) {
                        return true;
                    }
                }

                // Check product names
                if (item.orderDetails && Array.isArray(item.orderDetails)) {
                    const hasMatchingProduct = item.orderDetails.some((product: any) =>
                        product.productName &&
                        product.productName.toLowerCase().includes(search)
                    );
                    if (hasMatchingProduct) return true;
                }

                // Check order total
                if (typeof item.orderTotal === 'number') {
                    const totalAsString = item.orderTotal.toString();
                    if (totalAsString.includes(search)) {
                        return true;
                    }
                }

                // Check status
                if (item.status && getStatusLabel(item.status).toLowerCase().includes(search)) {
                    return true;
                }

                return false;
            });

            // Apply active status filter to search results if needed
            if (activeStatus) {
                setFilteredData(searchFiltered.filter((order: any) => order.status === activeStatus));
            } else {
                setFilteredData(searchFiltered);
            }
        } else {
            // Reset to filtered by status or all orders
            if (activeStatus) {
                setFilteredData(allOrders.filter((order: any) => order.status === activeStatus));
            } else {
                setFilteredData(allOrders);
            }
        }
        setCurrentPage(1); // Reset to first page when searching
    };

    // View Order Details
    const handleViewOrder = (orderId: string) => {
        console.log("Navigating to order overview with ID:", orderId);
        navigate(`/apps-ecommerce-order-overview?id=${orderId}`);
    };

    // Handle dropdown actions
    const handleDropdownAction = (action: string, order: any) => {
        if (action === "view") {
            handleViewOrder(order.id);
        } else if (action === "delete") {
            onClickDelete(order);
        }
    };

    return (
        <React.Fragment>
            {/* Add style tag for custom dropdown styling */}
            <style>{tableDropdownStyles}</style>

            <BreadCrumb title="Đơn Hàng" pageTitle="Ecommerce" />
            <DeleteModal
                show={deleteModal}
                onHide={deleteToggle}
                onDelete={handleDelete}
            />

            <div className="card" id="ordersTable">
                <div className="card-body">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
                        <div className="xl:col-span-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Tìm kiếm..."
                                    autoComplete="off"
                                    onChange={filterSearchData}
                                />
                                <Search className="absolute ltr:left-2.5 rtl:right-2.5 top-2 text-slate-500 dark:text-zink-200 size-4" />
                            </div>
                        </div>
                        <div className="xl:col-span-9">
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {/* Status filter buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === null
                                            ? 'bg-custom-500 text-white'
                                            : 'bg-slate-100 text-slate-500 dark:bg-zink-600 dark:text-zink-200'
                                            }`}
                                        onClick={() => handleStatusFilter(null)}
                                    >
                                        Tất Cả
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Processing'
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-yellow-100 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Processing')}
                                    >
                                        Đang Xử Lý
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Awaiting Payment'
                                            ? 'bg-sky-500 text-white'
                                            : 'bg-sky-100 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Awaiting Payment')}
                                    >
                                        Chờ Thanh Toán
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Pending'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-orange-100 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Pending')}
                                    >
                                        Đang Chờ
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Shipping'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-purple-100 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Shipping')}
                                    >
                                        Đang Giao
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Delivered'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-green-100 text-green-500 dark:bg-green-500/20 dark:text-green-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Delivered')}
                                    >
                                        Đã Giao
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeStatus === 'Cancelled'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400'
                                            }`}
                                        onClick={() => handleStatusFilter('Cancelled')}
                                    >
                                        Đã Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div id="table-loading-state" className="flex items-center justify-center h-80">
                            <div className="px-3 py-1 text-xs font-medium leading-none text-center text-white bg-custom-500 rounded-full animate-pulse">Đang tải...</div>
                        </div>
                    ) : filteredData.length > 0 ? (
                        <>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full whitespace-nowrap">
                                    <thead className="bg-slate-100 dark:bg-zink-600">
                                        <tr>
                                            <th className="px-10 py-3 font-semibold text-slate-500 border-b border-slate-200">Mã Đơn Hàng</th>
                                            <th className="px-10 py-3 font-semibold text-slate-500 border-b border-slate-200">Ngày Đặt</th>
                                            <th className="px-10 py-3 font-semibold text-slate-500 border-b border-slate-200">Sản Phẩm</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 border-b border-slate-200 text-right">Tổng Tiền</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 border-b border-slate-200 text-center">Trạng Thái</th>
                                            <th className="px-6 py-3 font-semibold text-slate-500 border-b border-slate-200">Thao Tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getCurrentPageData().map((order: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-8 py-3 border-y border-slate-200">
                                                    <Link to="#!" onClick={() => handleViewOrder(order.id)} className="transition-all duration-150 ease-linear text-custom-500 hover:text-custom-600">
                                                        #{order.id.substring(0, 8)}
                                                    </Link>
                                                </td>
                                                <td className="px-8 py-3 border-y border-slate-200">{formatDate(order.createdTime)}</td>
                                                <td className="px-8 py-3 border-y border-slate-200">
                                                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                                        {order.orderDetails && order.orderDetails.length > 0 ? (
                                                            order.orderDetails.map((product: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2 mb-2 last:mb-0">
                                                                    {product.productImage && (
                                                                        <img
                                                                            src={product.productImage}
                                                                            alt={product.productName}
                                                                            className="h-10 w-10 object-cover rounded flex-shrink-0"
                                                                        />
                                                                    )}
                                                                    <div className="truncate max-w-[180px] text-sm">
                                                                        {product.productName}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 text-sm italic">Không có sản phẩm</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 border-y border-slate-200 text-right">{formatCurrency(order.orderTotal)}</td>
                                                <td className="px-6 py-3 border-y border-slate-200 text-center">
                                                    <Status item={order.status} />
                                                </td>
                                                <td className="px-6 py-3 border-y border-slate-200">
                                                    <Dropdown className="relative">
                                                        <Dropdown.Trigger id={`orderAction${index}`} data-bs-toggle="dropdown" className="flex items-center justify-center size-[30px] p-0 text-slate-500 btn bg-slate-100 hover:text-white hover:bg-slate-600 focus:text-white focus:bg-slate-600 focus:ring focus:ring-slate-100 active:text-white active:bg-slate-600 active:ring active:ring-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:hover:bg-slate-500 dark:hover:text-white dark:focus:bg-slate-500 dark:focus:text-white dark:active:bg-slate-500 dark:active:text-white dark:ring-slate-400/20">
                                                            <MoreHorizontal className="size-3" />
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content placement={index > 5 ? "top-start" : "bottom-start"} className="absolute z-[9999] py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md min-w-[10rem] dark:bg-zink-600 !transform-none table-dropdown-content" aria-labelledby={`orderAction${index}`}>
                                                            <li>
                                                                <Link
                                                                    to={`/apps-ecommerce-order-overview?id=${order.id}`}
                                                                    className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
                                                                >
                                                                    <Eye className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Xem Chi Tiết</span>
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link
                                                                    to="#!"
                                                                    onClick={() => handleDropdownAction("delete", order)}
                                                                    className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-50 dark:focus:bg-zink-500 dark:focus:text-zink-50"
                                                                >
                                                                    <Trash2 className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Xóa</span>
                                                                </Link>
                                                            </li>
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col items-center gap-4 mt-5 md:flex-row">
                                <div className="text-slate-500 dark:text-zink-200">
                                    Hiển thị <span className="font-semibold">{Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}</span> đến{" "}
                                    <span className="font-semibold">
                                        {Math.min(currentPage * pageSize, filteredData.length)}
                                    </span>{" "}
                                    trong tổng số <span className="font-semibold">{filteredData.length}</span> kết quả
                                </div>
                                <ul className="flex flex-wrap items-center gap-2 pagination grow justify-end">
                                    <li>
                                        <button
                                            className={`inline-flex items-center justify-center bg-white dark:bg-zink-700 h-8 px-3 transition-all duration-150 ease-linear border rounded border-slate-200 dark:border-zink-500 text-slate-500 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500 hover:border-custom-500 dark:hover:border-custom-500 focus:bg-custom-50 dark:focus:bg-custom-500/10 focus:text-custom-500 dark:focus:text-custom-500 focus:border-custom-500 dark:focus:border-custom-500 focus:ring focus:ring-custom-500/20 dark:focus:ring-custom-500/20 active:bg-custom-50 dark:active:bg-custom-500/10 active:text-custom-500 dark:active:text-custom-500 active:border-custom-500 dark:active:border-custom-500 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Trước
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Logic to show pages around current page
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <li key={i}>
                                                <button
                                                    className={`inline-flex items-center justify-center size-8 transition-all duration-150 ease-linear border rounded border-slate-200 dark:border-zink-500 hover:text-custom-500 dark:hover:text-custom-500 hover:border-custom-500 dark:hover:border-custom-500 focus:bg-custom-50 dark:focus:bg-custom-500/10 focus:text-custom-500 dark:focus:text-custom-500 focus:border-custom-500 dark:focus:border-custom-500 focus:ring focus:ring-custom-500/20 dark:focus:ring-custom-500/20 active:bg-custom-50 dark:active:bg-custom-500/10 active:text-custom-500 dark:active:text-custom-500 active:border-custom-500 dark:active:border-custom-500 ${currentPage === pageNum ? "bg-custom-50 dark:bg-custom-500/10 text-custom-500 dark:text-custom-500 border-custom-500 dark:border-custom-500" : "bg-white dark:bg-zink-700 text-slate-500 dark:text-zink-200"}`}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li>
                                        <button
                                            className={`inline-flex items-center justify-center bg-white dark:bg-zink-700 h-8 px-3 transition-all duration-150 ease-linear border rounded border-slate-200 dark:border-zink-500 text-slate-500 dark:text-zink-200 hover:text-custom-500 dark:hover:text-custom-500 hover:border-custom-500 dark:hover:border-custom-500 focus:bg-custom-50 dark:focus:bg-custom-500/10 focus:text-custom-500 dark:focus:text-custom-500 focus:border-custom-500 dark:focus:border-custom-500 focus:ring focus:ring-custom-500/20 dark:focus:ring-custom-500/20 active:bg-custom-50 dark:active:bg-custom-500/10 active:text-custom-500 dark:active:text-custom-500 active:border-custom-500 dark:active:border-custom-500 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Tiếp
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="noresult py-6 text-center">
                            <Search className="size-6 mx-auto text-sky-500 fill-sky-100 dark:sky-500/20" />
                            <h5 className="mt-2 mb-1">Xin lỗi! Không tìm thấy kết quả</h5>
                            <p className="mb-0 text-slate-500 dark:text-zink-200">
                                {activeStatus
                                    ? `Không tìm thấy đơn hàng nào có trạng thái "${getStatusLabel(activeStatus)}".`
                                    : "Không tìm thấy đơn hàng nào phù hợp với tìm kiếm của bạn."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};

export default Orders;