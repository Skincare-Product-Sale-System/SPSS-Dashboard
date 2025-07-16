import React, { useEffect } from 'react';
import { MoreVertical, Download } from 'lucide-react';
import { Dropdown } from 'Common/Components/Dropdown';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'slices/store';
import { fetchBestSellers, fetchTotalRevenue } from 'slices/dashboard/reducer';
import * as XLSX from 'xlsx';

const TopSellingProducts = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { bestSellers, loading, error } = useSelector((state: RootState) => {
        return state.dashboard;
    });

    useEffect(() => {
        dispatch(fetchBestSellers({ pageNumber: 1, pageSize: 10 }))
            .unwrap()
            .catch(error => console.error('Error fetching best sellers:', error));
    }, [dispatch]);

    // Transform data for display
    const products = bestSellers?.items || [];

    // Function to convert image URL to base64
    const getBase64FromUrl = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return '';
        }
    };

    // Function to export data to Excel
    const exportToExcel = () => {
        if (!products || products.length === 0) return;

        try {
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet([]);

            // Add title and timestamp
            XLSX.utils.sheet_add_aoa(worksheet, [
                ["BÁO CÁO SẢN PHẨM BÁN CHẠY"],
                [`Xuất dữ liệu lúc: ${new Date().toLocaleString('vi-VN')}`],
                [""]
            ], { origin: "A1" });

            // Add headers
            XLSX.utils.sheet_add_aoa(worksheet, [
                ["STT", "Tên sản phẩm", "Giá thị trường", "Giá bán", "Giảm giá (%)", "Đánh giá", "Mã sản phẩm"]
            ], { origin: "A4" });

            // Set column widths
            worksheet['!cols'] = [
                { wch: 5 },   // STT
                { wch: 40 },  // Tên sản phẩm
                { wch: 15 },  // Giá thị trường
                { wch: 15 },  // Giá bán
                { wch: 15 },  // Giảm giá
                { wch: 15 },  // Đánh giá
                { wch: 20 }   // Mã sản phẩm
            ];

            // Add data rows
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const rowIndex = i + 5; // Start from row 5 (after headers)

                XLSX.utils.sheet_add_aoa(worksheet, [[
                    i + 1,
                    product.name,
                    product.marketPrice.toLocaleString('vi-VN'),
                    product.price.toLocaleString('vi-VN'),
                    ((product.marketPrice - product.price) / product.marketPrice * 100).toFixed(2),
                    "⭐⭐⭐⭐⭐",
                    product.id
                ]], { origin: `A${rowIndex}` });
            }

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sản phẩm bán chạy');

            // Generate Excel file and download
            XLSX.writeFile(workbook, 'san_pham_ban_chay.xlsx');

        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Có lỗi khi xuất Excel. Vui lòng thử lại sau.');
        }
    };

    return (
        <React.Fragment>
            <div className="col-span-12 card lg:col-span-6 2xl:col-span-3">
                <div className="card-body">
                    <div className="flex items-center mb-3">
                        <div className="grow">
                            <h6 className="text-15">Sản phẩm bán chạy</h6>
                        </div>
                        <div className="flex items-center gap-2">
                            {!loading && products.length > 0 && (
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-custom-500 border border-transparent rounded-md hover:bg-custom-600 focus:outline-none"
                                >
                                    <Download className="size-4 mr-1.5" />
                                    Xuất Excel
                                </button>
                            )}
                            <Dropdown className="relative shrink-0">
                                <Dropdown.Trigger type="button" className="flex items-center justify-center size-[30px] p-0 bg-white text-slate-500 btn hover:text-slate-500 hover:bg-slate-100 focus:text-slate-500 focus:bg-slate-100 active:text-slate-500 active:bg-slate-100 dark:bg-zink-700 dark:hover:bg-slate-500/10 dark:focus:bg-slate-500/10 dark:active:bg-slate-500/10 dropdown-toggle" id="sellingProductDropdown" data-bs-toggle="dropdown">
                                    <MoreVertical className="inline-block size-4"></MoreVertical>
                                </Dropdown.Trigger>

                                <Dropdown.Content placement="bottom-start" className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md dropdown-menu min-w-[10rem] dark:bg-zink-600" aria-labelledby="sellingProductDropdown">
                                    <li>
                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">1 Tuần</Link>
                                    </li>
                                    <li>
                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">1 Tháng</Link>
                                    </li>
                                    <li>
                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">3 Tháng</Link>
                                    </li>
                                    <li>
                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">6 Tháng</Link>
                                    </li>
                                    <li>
                                        <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 dropdown-item hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!">Năm nay</Link>
                                    </li>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4 text-red-500">
                            <p>Lỗi tải sản phẩm: {error}</p>
                            <button
                                className="mt-2 px-4 py-2 bg-primary-500 text-white rounded"
                                onClick={() => dispatch(fetchBestSellers({ pageNumber: 1, pageSize: 6 }))}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-5">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <li key={product.id} className="flex items-center gap-3">
                                        <div className="flex items-center justify-center size-10 rounded-md bg-slate-100 dark:bg-zink-600">
                                            <img src={product.thumbnail} alt={product.name} className="h-6" />
                                        </div>
                                        <div className="overflow-hidden grow">
                                            <h6 className="truncate">{product.name}</h6>
                                            <div className="text-yellow-500">
                                                <i className="ri-star-fill"></i>
                                                <i className="ri-star-fill"></i>
                                                <i className="ri-star-fill"></i>
                                                <i className="ri-star-fill"></i>
                                                <i className="ri-star-half-fill"></i>
                                            </div>
                                        </div>
                                        <h6 className="shrink-0">
                                            ₫{(product.marketPrice || 0).toLocaleString('vi-VN')}
                                        </h6>
                                    </li>
                                ))
                            ) : (
                                <li className="text-center py-4">
                                    Không tìm thấy sản phẩm
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};

export default TopSellingProducts;
