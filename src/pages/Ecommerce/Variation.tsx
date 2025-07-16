import React, { useCallback, useEffect, useMemo, useState } from "react";
import BreadCrumb from "Common/BreadCrumb";
import { Link } from "react-router-dom";
import { Dropdown } from "Common/Components/Dropdown";
import Modal from "Common/Components/Modal";
import { useFormik } from "formik";

// Icon
import {
  MoreHorizontal,
  Eye,
  FileEdit,
  Trash2,
  Search,
  Plus,
} from "lucide-react";

import TableContainer from "Common/TableContainer";
import DeleteModal from "Common/DeleteModal";

// Formik
import * as Yup from "yup";

// react-redux
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { getAllVariations, addVariation, updateVariation, deleteVariation } from "slices/variation/thunk";
import { getAllProductCategories } from "slices/productcategory/thunk";
import { ToastContainer } from "react-toastify";

const Variation = () => {
  const dispatch = useDispatch<any>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [show, setShow] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [isOverview, setIsOverview] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Get categories for dropdown
  useEffect(() => {
    dispatch(getAllProductCategories({ page: 1, pageSize: 100 }))
      .then((res: any) => {
        if (res.payload?.data?.items) {
          setCategories(res.payload.data.items);
        }
      });
  }, [dispatch]);

  const variationSelector = createSelector(
    (state: any) => state.Variation,
    (Variation) => ({
      variations: Variation?.variations?.data?.items || [],
      pageCount: Variation?.variations?.data?.totalPages || 0,
      totalCount: Variation?.variations?.data?.totalCount || 0,
      loading: Variation?.loading || false,
      error: Variation?.error || null,
    })
  );

  const { variations, pageCount, loading } = useSelector(variationSelector);

  const [data, setData] = useState<any>([]);
  const [eventData, setEventData] = useState<any>();

  // Get Data
  useEffect(() => {
    // Don't fetch if current page is greater than page count
    if (pageCount && currentPage > pageCount) {
      setCurrentPage(1); // Reset to first page
      return;
    }
    dispatch(getAllVariations({ page: currentPage, pageSize }));
  }, [dispatch, currentPage, refreshFlag, pageCount]);

  useEffect(() => {
    if (variations) {
      if (variations.length === 0 && currentPage > 1) {
        // If no data and not on first page, go back one page
        setCurrentPage(prev => prev - 1);
      } else {
        setData(variations);
      }
    }
  }, [variations, currentPage]);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const deleteToggle = () => setDeleteModal(!deleteModal);

  // Delete Data
  const onClickDelete = (cell: any) => {
    setDeleteModal(true);
    if (cell.id) {
      setEventData(cell);
    }
  };

  // Search functionality
  const filterSearchData = (e: any) => {
    const search = e.target.value;
    const keysToSearch = ['name', 'productCategory.categoryName', 'options'];
    const filteredData = variations.filter((item: any) => {
      return keysToSearch.some((key) => {
        if (key === 'options' && item.variationOptions) {
          // Search through variation options
          return item.variationOptions.some((option: any) =>
            option.value.toLowerCase().includes(search.toLowerCase())
          );
        }

        const value = key.includes('.')
          ? key.split('.').reduce((obj, k) => obj && obj[k], item)?.toString().toLowerCase() || ''
          : item[key]?.toString().toLowerCase() || '';
        return value.includes(search.toLowerCase());
      });
    });
    setData(filteredData);
  };

  // Delete handler
  const handleDelete = () => {
    if (eventData) {
      dispatch(deleteVariation(eventData.id))
        .then(() => {
          setDeleteModal(false);
          setRefreshFlag(prev => !prev); // Trigger data refresh after deletion
        });
    }
  };

  // Form validation schema
  const validation: any = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: (eventData && eventData.name) || '',
      productCategoryId: (eventData && eventData.productCategory?.id) || '',
      variationOptions: (eventData && eventData.variationOptions) || []
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      productCategoryId: Yup.string().required("Product Category is required")
    }),
    onSubmit: (values) => {
      if (isEdit) {
        const updateData = {
          id: eventData.id,
          data: {
            name: values.name,
            productCategoryId: values.productCategoryId
          }
        };
        dispatch(updateVariation(updateData))
          .then(() => {
            toggle();
            setRefreshFlag(prev => !prev);
          });
      } else {
        const newData = {
          name: values.name,
          productCategoryId: values.productCategoryId
        };
        dispatch(addVariation(newData))
          .then(() => {
            toggle();
            setRefreshFlag(prev => !prev);
          });
      }
    },
  });

  // Update Data
  const handleUpdateDataClick = (ele: any) => {
    setEventData({ ...ele });
    setIsEdit(true);
    setShow(true);
  };

  // Add handler for overview click
  const handleOverviewClick = (ele: any) => {
    setEventData({ ...ele });
    setIsOverview(true);
    setShow(true);
  };

  // Toggle modal
  const toggle = useCallback(() => {
    if (show) {
      setShow(false);
      setEventData("");
      setIsEdit(false);
      setIsOverview(false); // Reset overview mode
    } else {
      setShow(true);
      setEventData("");
      validation.resetForm();
    }
  }, [show, validation]);

  // Find category name by ID
  const getCategoryNameById = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.categoryName : "N/A";
  }, [categories]);

  const columns = useMemo(
    () => [
      {
        header: "Tên",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell: any) => (
          <Link
            to="#"
            className="flex items-center gap-2"
            onClick={() => handleOverviewClick(cell.row.original)}
          >
            {cell.getValue()}
          </Link>
        ),
        size: 150,
      },
      {
        header: "Danh Mục",
        accessorKey: "productCategory.categoryName",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell: any) => (
          <span>{cell.row.original.productCategory?.categoryName || "N/A"}</span>
        ),
        size: 200,
      },
      {
        header: "Tùy Chọn",
        accessorKey: "variationOptions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell: any) => {
          const options = cell.row.original.variationOptions || [];
          return (
            <div className="flex flex-wrap gap-1">
              {options.slice(0, 3).map((option: any, index: number) => (
                <span key={option.id} className="px-2 py-1 text-xs bg-slate-100 dark:bg-zink-600 rounded-md">
                  {option.value}
                </span>
              ))}
              {options.length > 3 && (
                <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-zink-600 rounded-md">
                  +{options.length - 3} more
                </span>
              )}
            </div>
          );
        },
        size: 300,
      },
      {
        header: "Thao Tác",
        enableColumnFilter: false,
        enableSorting: true,
        size: 100,
        cell: (cell: any) => (
          <Dropdown className="relative ltr:ml-2 rtl:mr-2">
            <Dropdown.Trigger id="orderAction1" data-bs-toggle="dropdown" className="flex items-center justify-center size-[30px] p-0 text-slate-500 btn bg-slate-100 hover:text-white hover:bg-slate-600 focus:text-white focus:bg-slate-600 focus:ring focus:ring-slate-100 active:text-white active:bg-slate-600 active:ring active:ring-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:hover:bg-slate-500 dark:hover:text-white dark:focus:bg-slate-500 dark:focus:text-white dark:active:bg-slate-500 dark:active:text-white dark:ring-slate-400/20"><MoreHorizontal className="size-3" /></Dropdown.Trigger>
            <Dropdown.Content placement={cell.row.index ? "top-start" : "bottom-start"} className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md min-w-[10rem] dark:bg-zink-600" aria-labelledby={`dropdownMenuButton_${cell.row.index}`}>
              <li>
                <Link
                  to="#!"
                  className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200"
                  onClick={() => {
                    const data = cell.row.original;
                    handleOverviewClick(data);
                  }}
                >
                  <Eye className="inline-block size-3 ltr:mr-1 rtl:ml-1" />{" "}
                  <span className="align-middle">Xem Chi Tiết</span>
                </Link>
              </li>
              <li>
                <Link to="#!" data-modal-target="addOrderModal" className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" onClick={() => {
                  const data = cell.row.original;
                  handleUpdateDataClick(data);
                }}>
                  <FileEdit className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Chỉnh Sửa</span></Link>
              </li>
              <li>
                <Link to="#!" className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" onClick={() => {
                  const data = cell.row.original;
                  onClickDelete(data);
                }}><Trash2 className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Xóa</span></Link>
              </li>
            </Dropdown.Content>
          </Dropdown>
        ),
      },
    ],
    [handleOverviewClick]
  );

  return (
    <React.Fragment>
      <BreadCrumb title="Variations" pageTitle="Variations" />
      <DeleteModal
        show={deleteModal}
        onHide={deleteToggle}
        onDelete={handleDelete}
      />
      <ToastContainer closeButton={false} limit={1} />
      <div className="card" id="productListTable">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
            <div className="xl:col-span-3">
              <div className="relative">
                <input
                  type="text"
                  className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                  placeholder="Tìm kiếm tên, danh mục..."
                  autoComplete="off"
                  onChange={(e) => filterSearchData(e)}
                />
                <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
              </div>
            </div>
            <div className="lg:col-span-2 ltr:lg:text-right rtl:lg:text-left xl:col-span-2 xl:col-start-11">
              <Link
                to="#!"
                data-modal-target="addVariationModal"
                type="button"
                className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
                onClick={toggle}
              >
                <Plus className="inline-block size-4" />{" "}
                <span className="align-middle">Thêm Biến Thể</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="!pt-1 card-body">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="spinner-border text-custom-500" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : data && data.length > 0 ? (
            <TableContainer
              isPagination={true}
              columns={columns || []}
              data={data || []}
              customPageSize={pageSize}
              pageCount={pageCount}
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
                  Chúng tôi đã tìm kiếm trong tất cả biến thể. Không tìm thấy
                  biến thể nào phù hợp với tìm kiếm của bạn.
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
        dialogClassName="w-screen md:w-[30rem] lg:w-[40rem] bg-white shadow rounded-md dark:bg-zink-600"
      >
        <Modal.Header
          className="flex items-center justify-between p-4 border-b dark:border-zink-500"
          closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500"
        >
          <Modal.Title className="text-16">
            {isEdit ? "Chỉnh Sửa Biến Thể" : isOverview ? "Chi Tiết Biến Thể" : "Thêm Biến Thể"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="max-h-[calc(theme('height.screen')_-_180px)] p-4 overflow-y-auto">
          {isOverview ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="xl:col-span-12">
                <h5 className="mb-1 text-16">{eventData?.name}</h5>
                <p className="mb-4 text-slate-500 dark:text-zink-200">
                  <span className="font-medium text-slate-800 dark:text-zink-50">Danh Mục:</span>{" "}
                  {eventData?.productCategory?.categoryName || "N/A"}
                </p>

                {eventData?.variationOptions && eventData.variationOptions.length > 0 && (
                  <div className="mt-4">
                    <h6 className="mb-2 text-14">Variation Options:</h6>
                    <div className="flex flex-wrap gap-2">
                      {eventData.variationOptions.map((option: any) => (
                        <span key={option.id} className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-zink-600 rounded-md">
                          {option.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
            >
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="xl:col-span-12">
                  <label htmlFor="name" className="inline-block mb-2 text-base font-medium">
                    Tên <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="name"
                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                    placeholder="Nhập tên biến thể"
                    name="name"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.name || ""}
                  />
                  {validation.touched.name && validation.errors.name && (
                    <p className="text-red-400">{validation.errors.name}</p>
                  )}
                </div>

                <div className="xl:col-span-12">
                  <label htmlFor="productCategoryId" className="inline-block mb-2 text-base font-medium">
                    Danh Mục Sản Phẩm <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="productCategoryId"
                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                    name="productCategoryId"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.productCategoryId || ""}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                  {validation.touched.productCategoryId && validation.errors.productCategoryId && (
                    <p className="text-red-400">{validation.errors.productCategoryId}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="text-red-500 bg-white btn hover:text-red-500 hover:bg-red-100 focus:text-red-500 focus:bg-red-100 active:text-red-500 active:bg-red-100 dark:bg-zink-600 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10 dark:active:bg-red-500/10"
                  onClick={toggle}
                >
                  {isOverview ? "Đóng" : "Hủy"}
                </button>
                {!isOverview && (
                  <button
                    type="submit"
                    className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20"
                  >
                    {isEdit ? "Cập Nhật" : "Thêm"}
                  </button>
                )}
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default Variation;
