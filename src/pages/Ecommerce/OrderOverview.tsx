import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import BreadCrumb from "Common/BreadCrumb";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ChevronDown,
  Truck,
  CreditCard,
  CircleDollarSign,
  Download,
  Printer,
  AlertCircle,
  CheckCircle,
  X,
  CalendarClock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// Images
import delivery1 from "assets/images/brand/delivery-1.png";
import logoSm from "assets/images/logo-sm.png";

// icons
import { Link as RouterLink } from "react-router-dom";

// Redux
import { getOrderById, changeOrderStatus } from "slices/order/thunk";
import { getAllPaymentMethods } from "helpers/fakebackend_helper";

// Update the getStatusLabel function to use Vietnamese text
const getStatusLabel = (status: string) => {
  switch (status) {
    case "Processing":
      return "Đang xử lý";
    case "Awaiting Payment":
      return "Chờ thanh toán";
    case "Pending":
      return "Đang chờ";
    case "Shipping":
      return "Đang giao";
    case "Delivering":
      return "Đang giao";
    case "Delivered":
      return "Đã giao";
    case "Cancelled":
      return "Đã hủy";
    case "Return":
      return "Trả hàng";
    default:
      return status;
  }
};

// Status component
const Status = ({ status }: { status: string }) => {
  return (
    <span className="delivery_status px-2.5 py-0.5 text-xs inline-block font-medium rounded border border-slate-200 text-slate-700 dark:border-zink-500 dark:text-zink-200">
      {getStatusLabel(status)}
    </span>
  );
};

// Update the ORDER_STATUSES constant with more detailed styling info
const ORDER_STATUSES = [
  {
    value: "Processing",
    label: "Đang xử lý",
    color: "yellow",
    bgClass: "bg-yellow-100 dark:bg-yellow-500/20",
    textClass: "text-yellow-500",
    dotClass: "bg-yellow-500",
  },
  {
    value: "Delivering",
    label: "Đang giao",
    color: "purple",
    bgClass: "bg-purple-100 dark:bg-purple-500/20",
    textClass: "text-purple-500",
    dotClass: "bg-purple-500",
  },
  {
    value: "Delivered",
    label: "Đã giao",
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-500/20",
    textClass: "text-green-500",
    dotClass: "bg-green-500",
  },
  {
    value: "Cancelled",
    label: "Đã hủy",
    color: "red",
    bgClass: "bg-red-100 dark:bg-red-500/20",
    textClass: "text-red-500",
    dotClass: "bg-red-500",
  },
  {
    value: "Awaiting Payment",
    label: "Chờ thanh toán",
    color: "sky",
    bgClass: "bg-sky-100 dark:bg-sky-500/20",
    textClass: "text-sky-500",
    dotClass: "bg-sky-500",
  },
];

const OrderOverview = () => {
  // Use search params to get the order ID
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const dispatch = useDispatch<any>();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);

  // Add state for payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Format currency
  const formatCurrency = (amount: number) => {
    // Check if amount is a valid number before formatting
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(0);
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return moment(dateString).format("DD MMM, YYYY");
  };

  // Update the formatTime function to include seconds
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'  // Add seconds to the time format
    });
  };

  // Add this function to get cancel reason text
  const getCancelReasonText = (reasonId: string) => {
    // You would replace this with your actual mapping of reason IDs to text
    const cancelReasons: { [key: string]: string } = {
      "8f1f6496-4f75-48b9-ab9d-22066c681ebb": "Khách hàng yêu cầu hủy",
      // Add more reason mappings as needed
    };

    return cancelReasons[reasonId] || "Lý do khác";
  };

  // Get order details from redux store
  const orderSelector = createSelector(
    (state: any) => state.order,
    (order) => ({
      currentOrder: order?.currentOrder || null,
      loading: order?.loading || false,
      error: order?.error || null,
    })
  );

  const { currentOrder, loading } = useSelector(orderSelector);

  // Fetch order details when component mounts
  useEffect(() => {
    if (id) {
      dispatch(getOrderById(id));
    }
  }, [dispatch, id]);

  // Add function to fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await getAllPaymentMethods({
        pageNumber: 1,
        pageSize: 10,
      });
      if (response.data.items) {
        setPaymentMethods(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  }, []);

  // Call fetchPaymentMethods in useEffect
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Function to get payment method name by ID
  const getPaymentMethodName = (paymentMethodId: string) => {
    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    return method ? method.paymentType : "Cash on Delivery";
  };

  // Calculate estimated delivery date (7 days from order date)
  const estimatedDeliveryDate = currentOrder?.createdTime
    ? moment(currentOrder.createdTime).add(7, "days").format("DD MMM, YYYY")
    : "N/A";

  // Add a function to generate random invoice ID
  const generateInvoiceId = () => {
    // Use order ID as base if available, otherwise generate random
    const baseId = currentOrder?.id?.substring(0, 6) || "";
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = new Date().getTime().toString().substring(9, 13);
    return `INV-${baseId}${randomPart}-${timestamp}`;
  };

  // Store the invoice ID in state so it remains consistent
  const [invoiceId] = useState(generateInvoiceId());

  // Add this function to calculate discount percentage
  const calculateDiscountPercentage = (original: number, discounted: number) => {
    if (!original || !discounted || original === 0) return 0;
    const percentage = ((original - discounted) / original) * 100;
    return Math.round(percentage);
  };

  // Create a reusable invoice template function with larger text and better spacing
  const createInvoiceTemplate = () => {
    // Generate a unique invoice number
    const invoiceNumber = `INV-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}-${Math.floor(Math.random() * 10000)}`;

    // Ensure all values are valid numbers before formatting
    const orderTotal = currentOrder.orderTotal || 0;
    const discountAmount = currentOrder.discountAmount || 0;
    const originalOrderTotal = currentOrder.originalOrderTotal || orderTotal;
    const discountedOrderTotal = currentOrder.discountedOrderTotal || orderTotal;

    return `
            <div style="font-family: 'Helvetica', 'Arial', sans-serif; width: 210mm; padding: 20mm; color: #333; box-sizing: border-box;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="font-size: 24px; color: #333; margin: 0 0 5px 0;">Hóa Đơn</h1>
                    <h2 style="font-size: 18px; color: #555; margin: 0 0 5px 0;">Mã Hóa Đơn: ${invoiceNumber}</h2>
                    <p style="margin: 0; color: #555;">Ngày: ${formatDate(
      currentOrder.createdTime
    )}</p>
                </div>
                
                <!-- Company and Customer Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <!-- Company Info -->
                    <div style="width: 45%;">
                        <div style="border: 1px solid #eee; border-radius: 5px; padding: 15px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Thông Tin Cửa Hàng</h3>
                            <p style="margin: 5px 0; font-weight: bold;">TAILWICK STORE</p>
                            <p style="margin: 5px 0;">123 Đường Nguyễn Huệ, Quận 1</p>
                            <p style="margin: 5px 0;">TP. Hồ Chí Minh, Việt Nam</p>
                            <p style="margin: 5px 0;">SĐT: 028 1234 5678</p>
                            <p style="margin: 5px 0;">Email: contact@tailwick.com</p>
                        </div>
                    </div>
                    
                    <!-- Customer Info -->
                    <div style="width: 45%;">
                        <div style="border: 1px solid #eee; border-radius: 5px; padding: 15px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Thông Tin Thanh Toán</h3>
                            <p style="margin: 5px 0;"><strong>${currentOrder.address?.customerName || "N/A"
      }</strong></p>
                            <p style="margin: 5px 0;">${currentOrder.address?.streetNumber ? `${currentOrder.address.streetNumber}, ` : ""}${currentOrder.address?.addressLine1 || "N/A"
      }</p>
                            ${currentOrder.address?.addressLine2 && currentOrder.address.addressLine2.trim() !== ""
        ? `<p style="margin: 5px 0;">${currentOrder.address.addressLine2}</p>`
        : ""
      }
                            <p style="margin: 5px 0;">
                                ${currentOrder.address?.ward ? `${currentOrder.address.ward}, ` : ""}${currentOrder.address?.city || ""} ${currentOrder.address?.province ? `, ${currentOrder.address.province}` : ""
      }
                            </p>
                            <p style="margin: 5px 0;">${currentOrder.address?.countryName || ""
      }</p>
                            ${currentOrder.address?.phoneNumber
        ? `<p style="margin: 5px 0;">SĐT: ${formatPhoneNumber(
          currentOrder.address.phoneNumber
        )}</p>`
        : ""
      }
                        </div>
                    </div>
                </div>
                
                <!-- Order Info -->
                <div style="margin-bottom: 20px; border: 1px solid #eee; border-radius: 5px; padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Thông Tin Đơn Hàng</h3>
                    <div style="display: flex; flex-wrap: wrap;">
                        <div style="width: 50%; margin-bottom: 5px;">
                            <span style="font-weight: bold;">Mã đơn hàng:</span> ${currentOrder.id.substring(
        0,
        8
      )}
                        </div>
                        <div style="width: 50%; margin-bottom: 5px;">
                            <span style="font-weight: bold;">Ngày đặt hàng:</span> ${formatDate(
        currentOrder.createdTime
      )}
                        </div>
                        <div style="width: 50%; margin-bottom: 5px;">
                            <span style="font-weight: bold;">Ngày giao dự kiến:</span> ${estimatedDeliveryDate}
                        </div>
                        <div style="width: 50%; margin-bottom: 5px;">
                            <span style="font-weight: bold;">Trạng thái:</span> 
                            <span style="
                                display: inline-block;
                                padding: 3px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                                font-weight: 500;
                                margin-left: 5px;
                                ${getStatusStyle(currentOrder.status)}
                            ">
                                ${getStatusLabel(currentOrder.status)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Products Table -->
                <div style="margin-bottom: 30px;">
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px;">Sản Phẩm</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px;">Đơn Giá</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 14px;">Số Lượng</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px;">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currentOrder.orderDetails &&
      currentOrder.orderDetails
        .map(
          (item: any, index: number) => {
            // Ensure price and quantity are valid numbers
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            const total = price * quantity;

            return `
                                <tr>
                                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px;">
                                        <div style="display: flex; align-items: center;">
                                            <div style="margin-right: 10px;">
                                                <img src="${item.productImage || ""
              }" alt="" style="width: 40px; height: 40px; object-fit: contain; background-color: #f9f9f9; border-radius: 4px;">
                                            </div>
                                            <div>
                                                <p style="margin: 0; font-weight: 500;">${item.productName || "Sản phẩm"
              }</p>
                                                <p style="margin: 3px 0 0 0; color: #777; font-size: 12px;">
                                                    ${item.variationOptionValues &&
                item.variationOptionValues.length > 0
                ? item.variationOptionValues.join(", ")
                : ""
              }
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px;">${formatCurrency(
                price
              )}</td>
                                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee; font-size: 14px;">${quantity
              }</td>
                                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 500;">${formatCurrency(
                total
              )}</td>
                                </tr>
                            `;
          }
        )
        .join("")
      }
                        </tbody>
                    </table>
                </div>
                
                <!-- Totals -->
                <div style="margin-bottom: 30px; width: 100%;">
                    <div style="width: 50%; margin-left: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; text-align: left; font-size: 14px;">Tổng phụ:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 14px;">${formatCurrency(
        originalOrderTotal
      )}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; text-align: left; font-size: 14px;">Giảm giá:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 14px;">${formatCurrency(
        discountAmount
      )}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; text-align: left; font-size: 14px;">Phí vận chuyển:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 14px;">${formatCurrency(
        0
      )}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; text-align: left; font-size: 14px;">Thuế:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 14px;">${formatCurrency(
        0
      )}</td>
                            </tr>
                            <tr style="font-weight: bold; border-top: 2px solid #eee;">
                                <td style="padding: 8px 0; text-align: left; font-size: 16px;">Tổng cộng:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 16px;">${formatCurrency(
        discountedOrderTotal
      )}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #777; font-size: 14px;">
                    <p style="margin: 5px 0;">Cảm ơn bạn đã mua hàng tại SkinCede!</p>
                    <p style="margin: 5px 0;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: support@tailwick.com</p>
                </div>
            </div>
        `;
  };

  // Helper function to get status style for the invoice
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Processing":
        return "background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;";
      case "Awaiting Payment":
        return "background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;";
      case "Pending":
        return "background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;";
      case "Shipping":
        return "background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;";
      case "Delivered":
        return "background-color: #f0fdf4; color: #15803d; border: 1px solid #86efac;";
      case "Cancelled":
        return "background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;";
      case "Return":
        return "background-color: #fdf2f8; color: #be185d; border: 1px solid #fbcfe8;";
      default:
        return "background-color: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;";
    }
  };

  // Fix the handlePrint implementation to use the same template as PDF
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${currentOrder?.id?.substring(0, 8) || "Order"}`,
    onBeforePrint: () => {
      console.log("Preparing content for printing...");
      // Create the invoice template and set it to the print div
      if (invoiceRef.current) {
        invoiceRef.current.innerHTML = createInvoiceTemplate();
      }
      setShowInvoice(true);

      // Add a delay to ensure the invoice is visible before printing
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    },
    onAfterPrint: () => {
      console.log("Print completed successfully");
      setShowInvoice(false);
    },
    onPrintError: (error) => {
      console.error("Print failed:", error);
      setShowInvoice(false);
    },
    pageStyle: `
            @page {
                size: auto;
                margin: 10mm;
            }
            @media print {
                html, body {
                    height: 100%;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden;
                }
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
  });

  // Fix the issue with PDF generation
  const generatePDF = () => {
    if (invoiceRef.current) {
      const invoiceContent = createInvoiceTemplate();

      // Create a temporary div to render the invoice
      const tempDiv = document.createElement("div");
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.margin = "0";
      tempDiv.style.padding = "0";
      tempDiv.style.backgroundColor = "white";
      tempDiv.innerHTML = invoiceContent;
      document.body.appendChild(tempDiv);

      // Use html2canvas with proper settings for A4
      html2canvas(tempDiv, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        width: 793, // A4 width in pixels at 96 DPI
        height: 1122, // A4 height in pixels at 96 DPI
        backgroundColor: "#ffffff",
        onclone: (document) => {
          // This callback allows us to modify the cloned document before rendering
          // We can use it to ensure all images are loaded properly
          const images = document.getElementsByTagName('img');
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img.complete) {
              // Replace with a placeholder if image is not loaded
              img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            }
          }
        }
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // Create PDF with A4 dimensions
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Add the image to fill the page properly
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`hoa-don-${currentOrder.id.substring(0, 8)}.pdf`);

        // Remove the temporary div
        document.body.removeChild(tempDiv);
      });
    }
  };

  // Add these state variables
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Add this function to handle status button click
  const handleStatusButtonClick = (status: string) => {
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  // Add state for MUI notifications
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Update the handleStatusChange function to use MUI notifications
  const handleStatusChange = async () => {
    if (
      !selectedStatus ||
      !currentOrder ||
      selectedStatus === currentOrder.status
    ) {
      setShowStatusModal(false);
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Updating order status...");

      await dispatch(
        changeOrderStatus({
          id: currentOrder.id,
          status: selectedStatus,
        })
      ).unwrap();

      // Fetch updated order details immediately after status change
      await dispatch(getOrderById(currentOrder.id));

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success with MUI Snackbar
      setSnackbarMessage(`Trạng thái được cập nhật thành công: ${selectedStatus}`);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setShowStatusModal(false);
    } catch (error) {
      // Show error with MUI Snackbar
      setSnackbarMessage("Không thể cập nhật trạng thái đơn hàng");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setShowStatusModal(false);
    }
  };

  // Add function to handle Snackbar close
  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  // Update the payment method display in the Payment Info section
  const getPaymentMethodDisplay = (paymentMethodId: string) => {
    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    if (!method) return null;

    return (
      <div className="flex items-center gap-3">
        <div className="size-8 flex items-center justify-center rounded-md bg-white border">
          <img
            src={method.imageUrl}
            alt={method.paymentType}
            className="h-6 w-6 object-contain"
          />
        </div>
        <span className="font-medium">{method.paymentType}</span>
      </div>
    );
  };

  // Add this function to format phone numbers consistently
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    // Format as XXXX XXX XXX
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  };

  // Update the status dropdown styling to accommodate longer Vietnamese text
  const StatusDropdown = ({
    currentStatus,
    onStatusChange,
  }: {
    currentStatus: string;
    onStatusChange: (status: string) => void;
  }) => {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm appearance-none cursor-pointer
                                  dark:bg-zink-700 dark:border-zink-500 
                                  focus:outline-none focus:ring-2 focus:ring-custom-500/20 focus:border-custom-500
                                  disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {ORDER_STATUSES.map((status) => {
              const isCurrentStatus = status.value === currentStatus;
              return (
                <option
                  key={status.value}
                  value={status.value}
                  disabled={isCurrentStatus}
                  className={`py-2 ${isCurrentStatus ? "font-medium" : ""}`}
                >
                  {getStatusLabel(status.value)}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronDown className="size-4 text-slate-500 dark:text-zink-200" />
          </div>
        </div>

        {/* Status as normal text */}
        <div className="text-sm text-slate-700 dark:text-zink-200">
          Trạng thái hiện tại:{" "}
          <span className="font-medium">{getStatusLabel(currentStatus)}</span>
        </div>
      </div>
    );
  };

  // Add this useEffect to ensure toast notifications work properly
  useEffect(() => {
    // Create a container for toast notifications if it doesn't exist
    if (!document.getElementById("toast-container")) {
      const toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "fixed top-4 right-4 z-50";
      document.body.appendChild(toastContainer);
    }

    // Clean up on component unmount
    return () => {
      const container = document.getElementById("toast-container");
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Add this function to handle status filtering
  const handleStatusFilter = (status: string) => {
    // Navigate to the orders page with the status filter
    navigate(`/apps-ecommerce-orders?status=${status}`);
  };

  // Add this to your component to display status filter buttons
  const StatusFilterButtons = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusFilter(status.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5
                       ${status.bgClass} ${status.textClass} hover:opacity-80 transition-opacity`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${status.dotClass}`}></span>
            {status.label}
          </button>
        ))}
      </div>
    );
  };

  // Make sure to import useNavigate
  const navigate = useNavigate();

  if (loading || !currentOrder) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-500"></div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadCrumb title="Chi tiết đơn hàng" pageTitle="Ecommerce" />

      {/* Add Back to Orders button */}
      <div className="flex justify-between items-center mb-4">
        <Link
          to="/apps-ecommerce-orders"
          className="py-2 px-4 text-sm font-medium rounded-md flex items-center gap-2
                            bg-blue-500 text-white
                            hover:bg-blue-600 transition-colors duration-200
                            shadow-sm"
        >
          <i className="ri-arrow-left-line text-16"></i>
          <span>Quay lại danh sách đơn hàng</span>
        </Link>
      </div>

      {/* Invoice template for printing - make it visible but hidden until print */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-white ${showInvoice ? "block z-50" : "hidden -z-10"
          }`}
      >
        <div ref={invoiceRef} className="p-8 bg-white print-only">
          {/* The invoice template will be inserted here dynamically */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-12 2xl:grid-cols-12">
        <div className="lg:col-span-3 2xl:col-span-3">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-center size-12 bg-purple-100 rounded-md dark:bg-purple-500/20 ltr:float-right rtl:float-left">
                <Truck className="text-purple-500 fill-purple-200 dark:fill-purple-500/30" />
              </div>
              <h6 className="mb-4 text-15">Thông tin giao hàng</h6>

              <h6 className="mb-1">
                {currentOrder.address?.customerName || "N/A"}
              </h6>
              <p className="mb-1 text-slate-500 dark:text-zink-200">
                {currentOrder.address?.streetNumber ? `${currentOrder.address.streetNumber}, ` : ""}
                {currentOrder.address?.addressLine1 || "N/A"}
              </p>
              {currentOrder.address?.addressLine2 && currentOrder.address.addressLine2.trim() !== "" && (
                <p className="mb-1 text-slate-500 dark:text-zink-200">
                  {currentOrder.address.addressLine2}
                </p>
              )}
              {currentOrder.address?.ward && (
                <p className="mb-1 text-slate-500 dark:text-zink-200">
                  {currentOrder.address.ward}, {currentOrder.address?.city || ""}, {currentOrder.address?.province || ""}
                </p>
              )}
              <p className="text-slate-500 dark:text-zink-200">
                {currentOrder.address?.countryName || ""}
              </p>

              {currentOrder.address?.phoneNumber && (
                <p className="mt-2 text-slate-500 dark:text-zink-200">
                  <span className="font-medium text-slate-800 dark:text-zink-50">
                    SĐT:
                  </span>{" "}
                  {formatPhoneNumber(currentOrder.address?.phoneNumber)}
                </p>
              )}
            </div>
          </div>

          {/* Update Billing Details Card */}
          <div className="card mt-5">
            <div className="card-body">
              <div className="flex items-center justify-center size-12 bg-amber-100 rounded-md dark:bg-amber-500/20 ltr:float-right rtl:float-left">
                <CreditCard className="text-amber-500 fill-amber-200 dark:fill-amber-500/30" />
              </div>
              <h6 className="mb-4 text-15">Thông tin thanh toán</h6>

              <div className="space-y-4">
                <div>
                  <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                    Tên người thanh toán
                  </h6>
                  <p className="text-slate-500 dark:text-zink-200">
                    {currentOrder.address?.customerName || "N/A"}
                  </p>
                </div>

                <div>
                  <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                    Phương thức thanh toán
                  </h6>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodDisplay(currentOrder.paymentMethodId) || (
                      <div className="flex items-center gap-2">
                        <div className="size-8 flex items-center justify-center rounded-md bg-white border">
                          <img
                            src="/images/payment/cod.png"
                            alt="COD"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span className="text-slate-500 dark:text-zink-200">
                          Thanh toán khi nhận hàng (COD)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                    Địa chỉ thanh toán
                  </h6>
                  <p className="text-slate-500 dark:text-zink-200">
                    {currentOrder.address?.streetNumber ? `${currentOrder.address.streetNumber}, ` : ""}
                    {currentOrder.address?.addressLine1 || "N/A"}
                  </p>
                  {currentOrder.address?.addressLine2 && currentOrder.address.addressLine2.trim() !== "" && (
                    <p className="text-slate-500 dark:text-zink-200">
                      {currentOrder.address.addressLine2}
                    </p>
                  )}
                  {currentOrder.address?.ward && (
                    <p className="text-slate-500 dark:text-zink-200">
                      {currentOrder.address.ward}, {currentOrder.address?.city || ""}, {currentOrder.address?.province || ""}
                    </p>
                  )}
                  <p className="text-slate-500 dark:text-zink-200">
                    {currentOrder.address?.countryName || ""}
                  </p>
                </div>

                {/* <div>
                  <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                    Trạng thái thanh toán
                  </h6>
                  <span className={`px-2.5 py-0.5 text-xs inline-block font-medium rounded border 
                    ${(currentOrder.paymentStatus === "Paid" || currentOrder.status === "Delivering" || currentOrder.status === "Delivered") 
                      ? "bg-green-100 text-green-500 border-green-200 dark:bg-green-500/20 dark:border-green-500/20" 
                      : currentOrder.status === "Cancelled"
                        ? "bg-red-100 text-red-500 border-red-200 dark:bg-red-500/20 dark:border-red-500/20"
                        : "bg-orange-100 text-orange-500 border-orange-200 dark:bg-orange-500/20 dark:border-orange-500/20"}`}>
                    {(currentOrder.paymentStatus === "Paid" || currentOrder.status === "Delivering" || currentOrder.status === "Delivered") 
                      ? "Đã thanh toán" 
                      : currentOrder.status === "Cancelled"
                        ? "Đã hủy"
                        : "Chưa thanh toán"}
                  </span>
                </div> */}

                <div>
                  <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                    Tổng thanh toán
                  </h6>
                  <div className="flex flex-col">
                    <p className="text-lg font-medium text-custom-500">
                      {formatCurrency(currentOrder.discountedOrderTotal || currentOrder.orderTotal || 0)}
                    </p>
                    {currentOrder.discountAmount > 0 && currentOrder.originalOrderTotal && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm line-through text-slate-400">
                          {formatCurrency(currentOrder.originalOrderTotal || 0)}
                        </p>
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-sm">
                          -{Math.round((currentOrder.discountAmount / currentOrder.originalOrderTotal) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add voucher information if available */}
                {currentOrder.voucherCode && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                      Mã giảm giá
                    </h6>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-md border border-green-200 dark:bg-green-500/20 dark:border-green-500/20 dark:text-green-400">
                        {currentOrder.voucherCode}
                      </span>
                      <span className="text-slate-500 dark:text-zink-200">
                        (-{formatCurrency(currentOrder.discountAmount || 0)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Add discount information if available */}
                {currentOrder.discountAmount > 0 && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                      Giảm giá
                    </h6>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-medium">
                        -{formatCurrency(currentOrder.discountAmount || 0)}
                      </span>
                      {currentOrder.voucherCode && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-md border border-green-200 dark:bg-green-500/20 dark:border-green-500/20 dark:text-green-400">
                          {currentOrder.voucherCode}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Date Information */}
                {(currentOrder.paymentStatus === "Paid" ||
                  (currentOrder.paymentMethodId !== "COD" &&
                    currentOrder.status !== "Awaiting Payment" &&
                    currentOrder.status !== "Cancelled")) && (
                    <div>
                      <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                        Ngày thanh toán
                      </h6>
                      <p className="text-slate-500 dark:text-zink-200">
                        {currentOrder.paymentDate
                          ? formatDate(currentOrder.paymentDate)
                          : currentOrder.paymentMethodId !== "COD"
                            ? formatDate(currentOrder.createdTime)
                            : formatDate(currentOrder.updatedTime || currentOrder.createdTime)}
                      </p>
                    </div>
                  )}

                {currentOrder.paymentMethodId === "COD" &&
                  currentOrder.status !== "Cancelled" &&
                  currentOrder.status !== "Delivered" && (
                    <div>
                      <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                        Dự kiến thanh toán
                      </h6>
                      <p className="text-slate-500 dark:text-zink-200">
                        Khi nhận hàng ({moment(currentOrder.createdTime).add(3, "days").format("DD/MM/YYYY")} - {moment(currentOrder.createdTime).add(5, "days").format("DD/MM/YYYY")})
                      </p>
                    </div>
                  )}

                {currentOrder.status === "Cancelled" && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                      Ngày hủy thanh toán
                    </h6>
                    <p className="text-slate-500 dark:text-zink-200">
                      {currentOrder.statusChanges && currentOrder.statusChanges.find((change: { status: string, date: string }) => change.status === "Cancelled")
                        ? formatDate(currentOrder.statusChanges.find((change: { status: string, date: string }) => change.status === "Cancelled")?.date)
                        : formatDate(currentOrder.updatedTime || currentOrder.createdTime)}
                    </p>
                  </div>
                )}

                {currentOrder.cancelReasonId && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                      Lý do hủy
                    </h6>
                    <p className="text-slate-500 dark:text-zink-200">
                      {getCancelReasonText(currentOrder.cancelReasonId) || "Không xác định"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline Card */}
          <div className="card mt-5">
            <div className="card-body">
              <div className="flex items-center justify-center size-12 bg-emerald-100 rounded-md dark:bg-emerald-500/20 ltr:float-right rtl:float-left">
                <CalendarClock className="text-emerald-500 fill-emerald-200 dark:fill-emerald-500/30" />
              </div>
              <h6 className="mb-4 text-15">Lịch sử đơn hàng</h6>

              <div className="space-y-4">
                {currentOrder.statusChanges && currentOrder.statusChanges.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:border-l before:border-slate-200 before:left-[0.3125rem] before:top-1 before:bottom-1 dark:before:border-zink-500">
                    {currentOrder.statusChanges.map((change: any, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute left-[-1.375rem] size-3 bg-custom-500 rounded-full top-1.5"></div>
                        <h6 className="mb-1 text-sm font-medium text-slate-700 dark:text-zink-200">
                          {getStatusLabel(change.status)}
                        </h6>
                        <p className="text-slate-500 dark:text-zink-200">
                          {formatDate(change.date)} {formatTime(change.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-zink-200">
                    Không có thông tin lịch sử đơn hàng
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 2xl:col-span-6">
          <div className="card" ref={invoiceRef}>
            <div className="card-body">
              <div className="flex items-center gap-3">
                <h6 className="text-15 grow">
                  Đơn hàng #{currentOrder.id.substring(0, 8)}
                </h6>
                <div className="shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Invoice button clicked");
                      generatePDF();
                    }}
                    className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
                  >
                    <Download className="inline-block size-4 ltr:mr-1 rtl:ml-1" />
                    <span className="align-middle">Hóa đơn</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead className="ltr:text-left rtl:text-right text-sm text-slate-500 dark:text-zink-200 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200 dark:border-zink-500">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200 dark:border-zink-500">
                        Giá
                      </th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200 dark:border-zink-500">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 font-semibold border-b border-slate-200 dark:border-zink-500">
                        Tổng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.orderDetails &&
                      currentOrder.orderDetails.map(
                        (item: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-slate-200 dark:border-zink-500"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-12 bg-slate-100 rounded-md shrink-0 dark:bg-zink-600">
                                  <img
                                    src={item.productImage}
                                    alt=""
                                    className="h-12 mx-auto"
                                  />
                                </div>
                                <div className="grow">
                                  <h6 className="mb-1 text-15">
                                    {item.productName}
                                  </h6>
                                  <p className="text-slate-500 dark:text-zink-200">
                                    {item.variationOptionValues &&
                                      item.variationOptionValues.join(", ")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-6 py-4">{item.quantity}</td>
                            <td className="px-6 py-4">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Tổng tiền :
                      </td>
                      <td className="px-6 py-3">
                        {formatCurrency(currentOrder.originalOrderTotal || currentOrder.orderTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Giảm giá :
                      </td>
                      <td className="px-6 py-3">
                        {formatCurrency(currentOrder.discountAmount || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Phí vận chuyển :
                      </td>
                      <td className="px-6 py-3">{formatCurrency(0)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Thuế :
                      </td>
                      <td className="px-6 py-3">{formatCurrency(0)}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Tổng tiền :
                      </td>
                      <td className="px-6 py-3">
                        {formatCurrency(currentOrder.discountedOrderTotal || currentOrder.orderTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h6 className="mb-4 text-15">Trạng thái đơn hàng</h6>
              <div>
                <div className="relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden done">
                  <div className="flex gap-4">
                    <div className="grow">
                      <h6 className="mb-2 text-slate-500 text-15 dark:text-slate-400">
                        Đã đặt hàng
                      </h6>
                      <p className="text-gray-400 dark:text-zink-200">
                        Đơn hàng đã được đặt thành công.
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                      {formatDate(currentOrder.createdTime)}
                    </p>
                  </div>
                </div>

                {(currentOrder.status === "Awaiting Payment" ||
                  currentOrder.status === "Pending" ||
                  currentOrder.status === "Shipping" ||
                  currentOrder.status === "Delivered") && (
                    <div
                      className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden ${currentOrder.status === "Awaiting Payment"
                        ? "active"
                        : "done"
                        }`}
                    >
                      <div className="flex gap-4">
                        <div className="grow">
                          <h6 className="mb-2 text-sky-500 text-15 dark:text-sky-400">
                            Chờ thanh toán
                          </h6>
                          <p className="text-gray-400 dark:text-zink-200">
                            Chờ xác nhận thanh toán.
                          </p>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                          {moment(currentOrder.createdTime)
                            .add(1, "days")
                            .format("DD MMM, YYYY")}
                        </p>
                      </div>
                    </div>
                  )}

                {(currentOrder.status === "Pending" ||
                  currentOrder.status === "Shipping" ||
                  currentOrder.status === "Delivered") && (
                    <div
                      className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden ${currentOrder.status === "Pending" ? "active" : "done"
                        }`}
                    >
                      <div className="flex gap-4">
                        <div className="grow">
                          <h6 className="mb-2 text-yellow-500 text-15 dark:text-yellow-400">
                            Đang xử lý
                          </h6>
                          <p className="text-gray-400 dark:text-zink-200">
                            Đơn hàng đang được xử lý và chuẩn bị giao hàng.
                          </p>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                          {moment(currentOrder.createdTime)
                            .add(2, "days")
                            .format("DD MMM, YYYY")}
                        </p>
                      </div>
                    </div>
                  )}

                {(currentOrder.status === "Shipping" ||
                  currentOrder.status === "Delivered") && (
                    <div
                      className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden ${currentOrder.status === "Shipping" ? "active" : "done"
                        }`}
                    >
                      <div className="flex gap-4">
                        <div className="grow">
                          <h6 className="mb-2 text-purple-500 text-15 dark:text-purple-400">
                            Đã giao hàng
                          </h6>
                          <p className="text-gray-400 dark:text-zink-200">
                            Đơn hàng đã được giao và đang trên đường đến bạn.
                          </p>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                          {moment(currentOrder.createdTime)
                            .add(4, "days")
                            .format("DD MMM, YYYY")}
                        </p>
                      </div>
                    </div>
                  )}

                {currentOrder.status === "Delivered" && (
                  <div
                    className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden active`}
                  >
                    <div className="flex gap-4">
                      <div className="grow">
                        <h6 className="mb-2 text-green-500 text-15 dark:text-green-400">
                          Đã giao hàng
                        </h6>
                        <p className="text-gray-400 dark:text-zink-200">
                          Đơn hàng đã được giao thành công.
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                        {estimatedDeliveryDate}
                      </p>
                    </div>
                  </div>
                )}

                {currentOrder.status === "Cancelled" && (
                  <div
                    className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden active`}
                  >
                    <div className="flex gap-4">
                      <div className="grow">
                        <h6 className="mb-2 text-red-500 text-15 dark:text-red-400">
                          Đã hủy đơn hàng
                        </h6>
                        <p className="text-gray-400 dark:text-zink-200">
                          Đơn hàng đã bị hủy.
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                        {moment(
                          currentOrder.updatedTime || currentOrder.createdTime
                        ).format("DD MMM, YYYY")}
                      </p>
                    </div>
                  </div>
                )}

                {currentOrder.status === "Return" && (
                  <div
                    className={`relative ltr:pl-6 rtl:pr-6 before:absolute ltr:before:border-l rtl:before:border-r ltr:before:left-[0.1875rem] rtl:before:right-[0.1875rem] before:border-slate-200 before:top-1.5 before:-bottom-1.5 after:absolute after:size-2 after:bg-white after:border after:border-slate-200 after:rounded-full ltr:after:left-0 rtl:after:right-0 after:top-1.5 pb-4 last:before:hidden active`}
                  >
                    <div className="flex gap-4">
                      <div className="grow">
                        <h6 className="mb-2 text-slate-500 text-15 dark:text-slate-400">
                          Đã trả hàng
                        </h6>
                        <p className="text-gray-400 dark:text-zink-200">
                          Đơn hàng đã được trả lại bởi khách hàng.
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-zink-200 shrink-0">
                        {moment(
                          currentOrder.updatedTime || currentOrder.createdTime
                        ).format("DD MMM, YYYY")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 2xl:col-span-3">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-4 text-15 font-medium">
                Thay đổi trạng thái đơn hàng
              </h6>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zink-200">
                    Trạng thái hiện tại:
                  </span>
                  <div>
                    {ORDER_STATUSES.map(
                      (status) =>
                        status.value === currentOrder.status && (
                          <span
                            key={status.value}
                            className={`px-2.5 py-0.5 text-xs inline-block font-medium rounded border
                              ${status.bgClass} ${status.textClass}
                              border-${status.color}-200 dark:border-${status.color}-500/20`}
                          >
                            {status.label}
                          </span>
                        )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      disabled={status.value === currentOrder.status}
                      onClick={() => handleStatusButtonClick(status.value)}
                      className={`px-3 py-2 text-sm rounded-md border transition-all
                        ${status.value === currentOrder.status
                          ? `${status.bgClass} ${status.textClass} border-${status.color}-200 dark:border-${status.color}-500/20 cursor-not-allowed`
                          : `bg-white dark:bg-zink-700 border-slate-200 dark:border-zink-500 hover:${status.bgClass} hover:${status.textClass}`
                        }`}
                    >
                      <div className="flex items-center justify-center">
                        <span
                          className={
                            status.value === currentOrder.status
                              ? status.textClass
                              : ""
                          }
                        >
                          {status.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal with your font styling */}
      <Dialog
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            fontFamily: "inherit", // Use your app's font
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "inherit",
            fontSize: "1.25rem",
            fontWeight: 500,
            padding: "16px 24px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          Xác nhận thay đổi trạng thái
          <IconButton
            aria-label="close"
            onClick={() => setShowStatusModal(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(0, 0, 0, 0.54)",
            }}
          >
            <X className="size-4" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          <div className="flex flex-col items-center pt-4 mb-3">
            <div className="mb-3 inline-flex items-center justify-center size-10 rounded-full bg-slate-100 dark:bg-zink-600">
              <AlertCircle className="size-5 text-slate-500 dark:text-zink-200" />
            </div>
            <h5 className="mb-2 text-lg font-medium">
              Thay đổi trạng thái đơn hàng
            </h5>
            <p className="text-slate-500 dark:text-zink-200 text-center">
              Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng từ
              <span className="font-medium"> {getStatusLabel(currentOrder?.status)}</span> sang
              <span className="font-medium"> {selectedStatus ? getStatusLabel(selectedStatus) : ''}</span>?
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            {selectedStatus && (
              <div className="w-full">
                {/* Apply the status color to the entire container */}
                {ORDER_STATUSES.map((status) =>
                  status.value === selectedStatus && (
                    <div
                      key={status.value}
                      className={`p-3 rounded-md border ${status.bgClass} border-${status.color}-200 dark:border-${status.color}-500/20`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-7 flex items-center justify-center rounded-full bg-white dark:bg-zink-700 ${status.textClass}`}>
                          <CheckCircle className="size-4" />
                        </div>
                        <div>
                          <h6 className={`font-medium ${status.textClass}`}>
                            {status.label}
                          </h6>
                          <p className="text-sm text-slate-500 dark:text-zink-200">
                            {status.value === "Processing" && "Đơn hàng đang được xử lý"}
                            {status.value === "Delivering" && "Đơn hàng đang được giao"}
                            {status.value === "Delivered" && "Đơn hàng đã được giao"}
                            {status.value === "Cancelled" && "Đơn hàng đã bị hủy"}
                            {status.value === "Awaiting Payment" && "Đơn hàng đang chờ thanh toán"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setShowStatusModal(false)}
            sx={{
              fontFamily: "inherit",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "6px",
            }}
            className="py-2 px-4 text-sm font-medium border rounded-md bg-white border-slate-200 text-slate-500 
                                  dark:bg-zink-700 dark:border-zink-500 dark:text-zink-200 
                                  hover:bg-slate-100 dark:hover:bg-zink-600"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStatusChange}
            sx={{
              fontFamily: "inherit",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "6px",
              backgroundColor: "var(--custom-500, #4b93ff)",
              "&:hover": {
                backgroundColor: "var(--custom-600, #3a84ff)",
              },
            }}
            className="py-2 px-4 text-sm font-medium border rounded-md text-white 
                                  bg-custom-500 border-custom-500 
                                  hover:bg-custom-600 hover:border-custom-600"
          >
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>

      {/* MUI Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            fontFamily: "inherit",
            "& .MuiAlert-icon": {
              fontSize: "1.25rem",
            },
            "& .MuiAlert-message": {
              fontSize: "0.875rem",
              fontWeight: 500,
            },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default OrderOverview;
