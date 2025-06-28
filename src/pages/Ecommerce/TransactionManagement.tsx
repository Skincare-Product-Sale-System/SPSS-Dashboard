import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import BreadCrumb from "Common/BreadCrumb";
import TableContainer from "Common/TableContainer";
import Modal from "Common/Components/Modal";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { Dropdown } from "Common/Components/Dropdown";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { API_CONFIG } from 'config/api';
import { analyzeToken } from 'helpers/tokenHelper';

// Types
interface Transaction {
  id: string;
  userId: string;
  userName: string;
  transactionType: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  qrImageUrl: string;
  bankInformation: string;
  description: string;
  createdTime: string;
  lastUpdatedTime: string;
  approvedTime: string | null;
}

interface FilterState {
  status: string;
  fromDate: string;
  toDate: string;
}

interface ApiDataContent {
  items: Transaction[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  data: ApiDataContent;
  message: string;
  errors: any;
}

interface AxiosApiResponse {
  data?: ApiResponse;
  success?: boolean;
  [key: string]: any;
}

const formatCurrency = (amount: number) => {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Pending':
      return { 
        class: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-500/20', 
        label: 'Chờ duyệt', 
        icon: Clock,
        color: '#f59e0b'
      };
    case 'Approved':
      return { 
        class: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:border-green-500/20', 
        label: 'Đã duyệt', 
        icon: CheckCircle,
        color: '#10b981'
      };
    case 'Rejected':
      return { 
        class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:border-red-500/20', 
        label: 'Đã từ chối', 
        icon: XCircle,
        color: '#ef4444'
      };
    default:
      return { 
        class: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:border-gray-500/20', 
        label: status, 
        icon: AlertTriangle,
        color: '#6b7280'
      };
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TransactionManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaction[]>([]);
  const [data, setData] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshFlag, setRefreshFlag] = useState(false);
  
  // Modal states
  const [show, setShow] = useState<boolean>(false);
  const [isOverview, setIsOverview] = useState<boolean>(false);
  const [eventData, setEventData] = useState<any>();
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Confirm Modal for status update
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{
    transactionId: string;
    status: 'Approved' | 'Rejected';
    transactionInfo?: any;
  } | null>(null);
  const confirmToggle = () => setConfirmModal(!confirmModal);

  // Fetch transaction data
  const fetchTransactions = useCallback(async (page: number, size: number, searchFilters?: any) => {
    setLoading(true);
    try {
      const authUser = localStorage.getItem("authUser");
      const token = authUser ? JSON.parse(authUser).accessToken : null;
      
      if (token) {
        analyzeToken(token);
      }
      
      // Build query parameters
      const params: any = {
        pageNumber: page,
        pageSize: size
      };
      
      // Add search filters if provided
      const activeFilters = searchFilters || filters;
      if (activeFilters.status) {
        params.status = activeFilters.status;
      }
      if (activeFilters.fromDate) {
        params.fromDate = activeFilters.fromDate;
      }
      if (activeFilters.toDate) {
        params.toDate = activeFilters.toDate;
      }
      
      // Ensure token is set in axios defaults
      if (token && !axios.defaults.headers.common["Authorization"]) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      // Updated endpoint to match the new API structure
      const response: AxiosApiResponse = await axios.get(
        `${API_CONFIG.BASE_URL}/transactions`,
        {
          params
        }
      );
      
      let apiData: ApiResponse;
      
      if (response.data && response.data.success !== undefined) {
        apiData = response.data;
      } else if (response.success !== undefined) {
        apiData = response as any;
      } else if (response.items && response.totalCount !== undefined) {
        apiData = {
          success: true,
          data: response as any,
          message: "Operation completed successfully",
          errors: null
        };
      } else {
        throw new Error("Unexpected response structure");
      }
      
      if (apiData.success && apiData.data && apiData.data.items) {
        setTransactionData(apiData.data.items);
        setTotalCount(apiData.data.totalCount);
        setTotalPages(apiData.data.totalPages);
        
        if (apiData.data.pageNumber !== currentPage) {
          setCurrentPage(apiData.data.pageNumber);
        }
        
        // toast.success(`Tải thành công ${apiData.data.items.length} giao dịch`);
      } else {
        toast.error('Không thể tải dữ liệu giao dịch');
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        toast.error('Không có quyền truy cập');
      } else {
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Show confirm modal before updating status
  const showConfirmModal = (transactionId: string, status: 'Approved' | 'Rejected', transactionInfo?: any) => {
    setConfirmAction({
      transactionId,
      status,
      transactionInfo
    });
    setConfirmModal(true);
  };

  // Handle transaction status update
  const updateTransactionStatus = async () => {
    if (!confirmAction) return;
    
    try {
      const authUser = localStorage.getItem("authUser");
      const token = authUser ? JSON.parse(authUser).accessToken : null;
      
      if (token) {
        analyzeToken(token);
      }
      
      // Ensure token is set in axios defaults
      if (token && !axios.defaults.headers.common["Authorization"]) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/transactions/status`,
        {
          transactionId: confirmAction.transactionId,
          status: confirmAction.status
        }
      );
      
      // API call successful - update local data
      toast.success(`Giao dịch đã được ${confirmAction.status === 'Approved' ? 'duyệt' : 'từ chối'} thành công`);
      
      // Update local data instead of refetching
      const updatedTransactions = transactionData.map(transaction => 
        transaction.id === confirmAction.transactionId
          ? { ...transaction, status: confirmAction.status as any }
          : transaction
      );
      setTransactionData(updatedTransactions);
      setData(updatedTransactions);
      
      setConfirmModal(false);
      setConfirmAction(null);
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        toast.error('Không có quyền thực hiện hành động này');
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái giao dịch');
      }
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, pageSize);
  }, [currentPage, pageSize, fetchTransactions]);

  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchTransactions(1, pageSize, filters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      fromDate: '',
      toDate: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchTransactions(1, pageSize, clearedFilters);
  };

  // Update data when transactions change
  useEffect(() => {
    setData(transactionData);
  }, [transactionData]);

  // Search functionality
  const filterSearchData = (e: any) => {
    const search = e.target.value;
    const keysToSearch = [
      "userName",
      "transactionType", 
      "description",
      "status"
    ];
    const filteredData = transactionData.filter((item: any) => {
      return keysToSearch.some((key) => {
        const value = item[key]?.toString().toLowerCase() || "";
        return value.includes(search.toLowerCase());
      });
    });
    setData(filteredData);
  };

  // Update Data - for viewing details
  const handleUpdateDataClick = (ele: any) => {
    setEventData({ ...ele });
    setIsOverview(true);
    setShow(true);
  };

  // Modify toggle to reset overview mode
  const toggle = useCallback(() => {
    if (show) {
      setShow(false);
      setEventData("");
      setIsOverview(false);
    } else {
      setShow(true);
      setEventData("");
    }
  }, [show]);

  const pendingCount = transactionData.filter(t => t.status === 'Pending').length;
  const approvedCount = transactionData.filter(t => t.status === 'Approved').length;
  const rejectedCount = transactionData.filter(t => t.status === 'Rejected').length;
  const totalAmount = transactionData.reduce((sum, t) => sum + t.amount, 0);

  const columns = useMemo(
    () => [
      {
        header: "Giao Dịch",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: true,
        size: 200,
        cell: (cell: any) => (
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-slate-100 dark:bg-zink-600 flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <div>
              <span className="font-medium">{cell.getValue().substring(0, 8)}...</span>
              <div className="text-xs text-slate-500">{cell.row.original.transactionType}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Người Dùng",
        accessorKey: "userName",
        enableColumnFilter: false,
        enableSorting: true,
        size: 150,
        cell: (cell: any) => (
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{cell.getValue()}</div>
              <div className="text-xs text-slate-500">{cell.row.original.userId.substring(0, 8)}...</div>
            </div>
          </div>
        ),
      },
      {
        header: "Số Tiền",
        accessorKey: "amount",
        enableColumnFilter: false,
        enableSorting: true,
        size: 120,
        cell: (cell: any) => (
          <span className="font-semibold text-green-600">
            {formatCurrency(cell.getValue())}
          </span>
        ),
      },
      {
        header: "Trạng Thái",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        size: 120,
        cell: (cell: any) => {
          const statusConfig = getStatusConfig(cell.getValue());
          const StatusIcon = statusConfig.icon;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
              <StatusIcon size={12} className="mr-1" />
              {statusConfig.label}
            </span>
          );
        },
      },
      {
        header: "Ngày Tạo",
        accessorKey: "createdTime",
        enableColumnFilter: false,
        enableSorting: true,
        size: 150,
        cell: (cell: any) => (
          <div className="text-sm">
            {formatDate(cell.getValue())}
          </div>
        ),
      },
      {
        header: "Hành Động",
        enableColumnFilter: false,
        enableSorting: false,
        size: 100,
        cell: (cell: any) => (
          <Dropdown className="relative ltr:ml-2 rtl:mr-2">
            <Dropdown.Trigger
              id="transactionAction1"
              data-bs-toggle="dropdown"
              className="flex items-center justify-center size-[30px] p-0 text-slate-500 btn bg-slate-100 hover:text-white hover:bg-slate-600 focus:text-white focus:bg-slate-600 focus:ring focus:ring-slate-100 active:text-white active:bg-slate-600 active:border-slate-600 active:ring active:ring-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:hover:bg-slate-500 dark:hover:text-white dark:focus:bg-slate-500 dark:focus:text-white dark:active:bg-slate-500 dark:active:text-white dark:ring-slate-400/20"
            >
              <MoreHorizontal className="size-3" />
            </Dropdown.Trigger>
            <Dropdown.Content
              placement="bottom-end"
              className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md min-w-[10rem] dark:bg-zink-600"
              aria-labelledby="transactionAction1"
            >
              <li>
                <Link
                  to="#!"
                  className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
                  onClick={() => {
                    const data = cell.row.original;
                    handleUpdateDataClick(data);
                  }}
                >
                  <Eye className="inline-block size-3 ltr:mr-1 rtl:ml-1" />{" "}
                  <span className="align-middle">Xem Chi Tiết</span>
                </Link>
              </li>
              {cell.row.original.status === 'Pending' && (
                <>
                  <li>
                    <Link
                      to="#!"
                      className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
                                             onClick={() => {
                         const data = cell.row.original;
                         showConfirmModal(data.id, 'Approved', data);
                       }}
                    >
                      <CheckCircle className="inline-block size-3 ltr:mr-1 rtl:ml-1" />{" "}
                      <span className="align-middle">Duyệt</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#!"
                      className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
                      onClick={() => {
                        const data = cell.row.original;
                        showConfirmModal(data.id, 'Rejected', data);
                      }}
                    >
                      <XCircle className="inline-block size-3 ltr:mr-1 rtl:ml-1" />{" "}
                      <span className="align-middle">Từ Chối</span>
                    </Link>
                  </li>
                </>
              )}
            </Dropdown.Content>
          </Dropdown>
        ),
      },
    ],
    [updateTransactionStatus]
  );

  return (
    <React.Fragment>
      <BreadCrumb title="Quản Lý Giao Dịch" pageTitle="Ecommerce" />
      <ToastContainer closeButton={false} limit={1} />
      
      {/* Header Stats Card */}
      <div className="grid grid-cols-1 gap-4 mb-5 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="size-12 rounded-lg bg-custom-100 dark:bg-custom-500/20 flex items-center justify-center text-custom-500 dark:text-custom-500 mr-3">
                <DollarSign className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-16">{totalCount}</h5>
                <p className="text-slate-500 dark:text-zink-200 mb-0">Tổng giao dịch</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="size-12 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-500 dark:text-green-500 mr-3">
                <CheckCircle className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-16">{approvedCount}</h5>
                <p className="text-slate-500 dark:text-zink-200 mb-0">Đã duyệt</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="size-12 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-500 dark:text-yellow-500 mr-3">
                <Clock className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-16">{pendingCount}</h5>
                <p className="text-slate-500 dark:text-zink-200 mb-0">Chờ duyệt</p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="size-12 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-500 mr-3">
                <XCircle className="size-6" />
              </div>
              <div>
                <h5 className="mb-1 text-16">{rejectedCount}</h5>
                <p className="text-slate-500 dark:text-zink-200 mb-0">Đã từ chối</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" id="transactionListTable">
        <div className="card-body">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative">
                <input
                  type="text"
                  className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                  placeholder="Tìm kiếm giao dịch..."
                  autoComplete="off"
                  onChange={(e) => filterSearchData(e)}
                />
                <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
              </div>
              <div>
                <select
                  className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Approved">Đã duyệt</option>
                  <option value="Rejected">Đã từ chối</option>
                </select>
              </div>
            </div>
            <div>
              <button
                className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20 whitespace-nowrap"
                onClick={() => fetchTransactions(currentPage, pageSize)}
              >
                <RefreshCw className="inline-block size-4" />{" "}
                <span className="align-middle">Làm mới</span>
              </button>
            </div>
          </div>
        </div>
        <div className="!pt-1 card-body">
          {data && data.length > 0 ? (
            <TableContainer
              isPagination={true}
              columns={columns || []}
              data={data || []}
              customPageSize={pageSize}
              pageCount={totalPages}
              currentPage={currentPage}
              onPageChange={(page: number) => {
                setCurrentPage(page);
              }}
              divclassName="overflow-x-auto"
              tableclassName="w-full whitespace-nowrap"
              theadclassName="ltr:text-left rtl:text-right bg-slate-100 dark:bg-zink-600"
              thclassName="px-3.5 py-2.5 font-semibold border-b border-slate-200 dark:border-zink-500"
              tdclassName="px-3.5 py-2.5 border-y border-slate-200 dark:border-zink-500"
              PaginationClassName="flex flex-col items-center gap-4 px-4 mt-4 md:flex-row"
              showPagination={true}
            />
          ) : (
            <div className="noresult">
              <div className="py-6 text-center">
                <Search className="size-6 mx-auto mb-3 text-sky-500 fill-sky-100 dark:fill-sky-500/20" />
                <h5 className="mt-2 mb-1">Xin lỗi! Không Tìm Thấy Kết Quả</h5>
                <p className="mb-0 text-slate-500 dark:text-zink-200">
                  Chúng tôi đã tìm kiếm giao dịch. Chúng tôi không tìm thấy
                  giao dịch nào cho tìm kiếm của bạn.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        show={show}
        onHide={toggle}
        modal-center="true"
        className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
        dialogClassName="w-screen md:w-[30rem] lg:w-[50rem] bg-white shadow rounded-md dark:bg-zink-600"
      >
        <Modal.Header
          className="flex items-center justify-between p-4 border-b dark:border-zink-500"
          closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500"
        >
          <Modal.Title className="text-16">
            Chi Tiết Giao Dịch
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="max-h-[calc(theme('height.screen')_-_180px)] p-4 overflow-y-auto">
          {eventData && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-12">
                <div className="mb-3 text-center">
                  <div className="relative mx-auto mb-4 size-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600 flex items-center justify-center">
                    <DollarSign size={32} className="text-green-600" />
                  </div>
                  <h5 className="mb-1">{eventData.id}</h5>
                  <p className="text-slate-500 dark:text-zink-200">ID Giao Dịch</p>
                </div>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Người Dùng
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {eventData.userName}
                </p>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Loại Giao Dịch
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {eventData.transactionType}
                </p>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Số Tiền
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600 text-green-600 font-semibold">
                  {formatCurrency(eventData.amount)}
                </p>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Trạng Thái
                </label>
                <div className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {(() => {
                    const statusConfig = getStatusConfig(eventData.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
                        <StatusIcon size={12} className="mr-1" />
                        {statusConfig.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="xl:col-span-12">
                <label className="inline-block mb-2 text-base font-medium">
                  Mô Tả
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {eventData.description}
                </p>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Ngày Tạo
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {formatDate(eventData.createdTime)}
                </p>
              </div>

              <div className="xl:col-span-6">
                <label className="inline-block mb-2 text-base font-medium">
                  Ngày Cập Nhật
                </label>
                <p className="form-input border-slate-200 dark:border-zink-500 bg-slate-100 dark:bg-zink-600">
                  {formatDate(eventData.lastUpdatedTime)}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="text-red-500 bg-white btn hover:text-red-500 hover:bg-red-100 focus:text-red-500 focus:bg-red-100 active:text-red-500 active:bg-red-100 dark:bg-zink-600 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10 dark:active:bg-red-500/10"
              onClick={toggle}
            >
              Đóng
            </button>
          </div>
                 </Modal.Body>
       </Modal>

       {/* Confirm Modal */}
       <Modal
         show={confirmModal}
         onHide={confirmToggle}
         modal-center="true"
         className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
         dialogClassName="w-screen md:w-[25rem] bg-white shadow rounded-md dark:bg-zink-600"
       >
         <Modal.Header
           className="flex items-center justify-between p-4 border-b dark:border-zink-500"
           closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500"
         >
           <Modal.Title className="text-16">
             Xác Nhận {confirmAction?.status === 'Approved' ? 'Duyệt' : 'Từ Chối'} Giao Dịch
           </Modal.Title>
         </Modal.Header>

         <Modal.Body className="p-4">
           {confirmAction && (
             <div>
               <div className="mb-4 text-center">
                 <div className={`mx-auto mb-4 size-12 rounded-full flex items-center justify-center ${
                   confirmAction.status === 'Approved' 
                     ? 'bg-green-100 dark:bg-green-500/20' 
                     : 'bg-red-100 dark:bg-red-500/20'
                 }`}>
                   {confirmAction.status === 'Approved' ? (
                     <CheckCircle size={24} className="text-green-600" />
                   ) : (
                     <XCircle size={24} className="text-red-600" />
                   )}
                 </div>
                 <h5 className="mb-2">
                   {confirmAction.status === 'Approved' ? 'Duyệt' : 'Từ chối'} giao dịch này?
                 </h5>
                 <p className="text-slate-500 dark:text-zink-200">
                   Bạn có chắc chắn muốn {confirmAction.status === 'Approved' ? 'duyệt' : 'từ chối'} giao dịch{' '}
                   <span className="font-medium">{confirmAction.transactionId.substring(0, 8)}...</span>?
                 </p>
               </div>

               {confirmAction.transactionInfo && (
                 <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm text-slate-600 dark:text-slate-400">Người dùng:</span>
                     <span className="font-medium">{confirmAction.transactionInfo.userName}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-600 dark:text-slate-400">Số tiền:</span>
                     <span className="font-medium text-green-600">
                       {formatCurrency(confirmAction.transactionInfo.amount)}
                     </span>
                   </div>
                 </div>
               )}
             </div>
           )}

           <div className="flex justify-end gap-2 mt-4">
             <button
               type="button"
               className="text-slate-500 bg-white btn hover:text-slate-500 hover:bg-slate-100 focus:text-slate-500 focus:bg-slate-100 active:text-slate-500 active:bg-slate-100 dark:bg-zink-600 dark:hover:bg-slate-500/10 dark:focus:bg-slate-500/10 dark:active:bg-slate-500/10"
               onClick={confirmToggle}
             >
               Hủy
             </button>
             <button
               type="button"
               className={`text-white btn ${
                 confirmAction?.status === 'Approved'
                   ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600'
                   : 'bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600'
               } focus:ring focus:ring-opacity-50`}
               onClick={updateTransactionStatus}
             >
               {confirmAction?.status === 'Approved' ? 'Duyệt' : 'Từ chối'}
             </button>
           </div>
         </Modal.Body>
       </Modal>
    </React.Fragment>
  );
};

export default TransactionManagement; 