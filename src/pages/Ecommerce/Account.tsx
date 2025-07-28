import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BreadCrumb from 'Common/BreadCrumb';
import { Link } from 'react-router-dom';
import { Dropdown } from 'Common/Components/Dropdown';
import TableContainer from 'Common/TableContainer';
import Flatpickr from "react-flatpickr";
import moment from "moment";
import Select from 'react-select';

// Icons
import { Search, Eye, Trash2, Plus, MoreHorizontal, FileEdit, CheckCircle, Loader, X, Download, SlidersHorizontal, ImagePlus } from 'lucide-react';
import Modal from 'Common/Components/Modal';
import DeleteModal from 'Common/DeleteModal';

// Images
import dummyImg from "assets/images/users/user-dummy-img.jpg";

// react-redux
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

import {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser
} from 'slices/users/thunk';

import {
    getAllSkinTypes
} from 'slices/skintype/thunk';

import {
    getAllRoles
} from 'slices/role/thunk';

import { toast, ToastContainer } from 'react-toastify';
import filterDataBySearch from 'Common/filterDataBySearch';
import { getFirebaseBackend } from 'helpers/firebase_helper';

// Helper function for phone validation
const isValidPhoneNumber = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return /^[0-9]{9,10}$/.test(cleanNumber);
};

// Helper function to format phone number
const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phoneNumber;
};

// Status component with Vietnamese text
const Status = ({ item }: any) => {
    switch (item) {
        case "Active":
            return (
                <span className="px-2.5 py-0.5 text-xs inline-block font-medium rounded border bg-green-100 border-green-200 text-green-500 dark:bg-green-500/20 dark:border-green-500/20">
                    Hoạt Động
                </span>
            );
        case "Inactive":
            return (
                <span className="px-2.5 py-0.5 text-xs inline-block font-medium rounded border bg-red-100 border-red-200 text-red-500 dark:bg-red-500/20 dark:border-red-500/20">
                    Không Hoạt Động
                </span>
            );
        default:
            return (
                <span className="px-2.5 py-0.5 text-xs inline-block font-medium rounded border bg-yellow-100 border-yellow-200 text-yellow-500 dark:bg-yellow-500/20 dark:border-yellow-500/20">
                    {item}
                </span>
            );
    }
};

const Account = () => {
    const dispatch = useDispatch<any>();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [viewMode, setViewMode] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);

    // Add selector for pagination data
    const selectUserData = createSelector(
        (state: any) => state.User,
        (user) => ({
            users: user?.users?.data?.items || [],
            totalCount: user?.users?.data?.totalCount || 0,
            pageNumber: user?.users?.data?.pageNumber || 1,
            pageSize: user?.users?.data?.pageSize || 10,
            totalPages: user?.users?.data?.totalPages || 1,
            loading: user?.loading || false
        })
    );

    const selectSkinTypeData = createSelector(
        (state: any) => state.SkinType,
        (skinType) => ({
            skinTypes: skinType?.skinTypes?.data?.items || []
        })
    );

    const selectRoleData = createSelector(
        (state: any) => state.Role,
        (role) => ({
            roles: role?.roles?.data?.items || []
        })
    );

    const { users, totalCount, totalPages, loading } = useSelector(selectUserData);
    const { skinTypes } = useSelector(selectSkinTypeData);
    const { roles } = useSelector(selectRoleData);

    const [filteredUsers, setFilteredUsers] = useState<any>([]);
    const [userData, setUserData] = useState<any>();

    const [show, setShow] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);

    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        skinType: 'All',
        role: 'All'
    });

    // Add state for the file
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImage, setSelectedImage] = useState<any>();

    // Add state for image removal
    const [isImageRemoved, setIsImageRemoved] = useState(false);

    // Toggle Modal
    const toggle = useCallback(() => {
        if (show) {
            setShow(false);
            setUserData(null);
            setIsEdit(false);
            setViewMode(false);
            setSelectedImage(null);
        } else {
            setShow(true);
            setUserData(null);
            setIsEdit(false);
            setViewMode(false);
            setSelectedImage(null);
        }
    }, [show]);

    // Apply filters
    const applyFilters = useCallback(() => {
        // Check if any filter is active
        const isAnyFilterActive =
            filters.search !== '' ||
            filters.status !== 'All' ||
            filters.skinType !== 'All' ||
            filters.role !== 'All';

        setIsFiltering(isAnyFilterActive);

        if (!users || users.length === 0) {
            setFilteredUsers([]);
            return;
        }

        let result = [...users];

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter((item: any) => {
                return (
                    (item.userName?.toLowerCase() || '').includes(searchTerm) ||
                    (item.surName?.toLowerCase() || '').includes(searchTerm) ||
                    (item.lastName?.toLowerCase() || '').includes(searchTerm) ||
                    (item.emailAddress?.toLowerCase() || '').includes(searchTerm) ||
                    (item.phoneNumber?.toLowerCase() || '').includes(searchTerm)
                );
            });
        }

        // Status filter
        if (filters.status !== 'All') {
            result = result.filter((user: any) => user.status === filters.status);
        }

        // Skin type filter
        if (filters.skinType !== 'All') {
            if (filters.skinType === 'None') {
                result = result.filter((user: any) => !user.skinTypeId);
            } else {
                result = result.filter((user: any) => user.skinTypeId === filters.skinType);
            }
        }

        // Role filter
        if (filters.role !== 'All') {
            result = result.filter((user: any) => user.roleId === filters.role);
        }

        setFilteredUsers(result);
    }, [users, filters]);

    // Fetch all data when filtering is active
    useEffect(() => {
        // Check if any filter is active
        const isAnyFilterActive =
            filters.search !== '' ||
            filters.status !== 'All' ||
            filters.skinType !== 'All' ||
            filters.role !== 'All';

        if (isAnyFilterActive) {
            // Fetch all data (use 100 as the maximum allowed pageSize)
            dispatch(getAllUsers({ page: 1, pageSize: 100 }));
        } else {
            // Normal pagination mode - fetch only current page
            dispatch(getAllUsers({ page: currentPage, pageSize }));
        }
    }, [dispatch, filters, currentPage, pageSize]);

    // Apply filters when users or filters change
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Initial data fetch - only once on component mount
    useEffect(() => {
        dispatch(getAllUsers({ page: 1, pageSize }));
        dispatch(getAllSkinTypes({ page: 1, pageSize: 100 }));
        dispatch(getAllRoles({ page: 1, pageSize: 100 }));
    }, [dispatch, pageSize]);

    // Update filtered users when users change
    useEffect(() => {
        if (!isFiltering) {
            setFilteredUsers(users);
        } else {
            applyFilters();
        }
    }, [users, isFiltering, applyFilters]);

    // Delete Modal
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const deleteToggle = () => setDeleteModal(!deleteModal);

    // Delete Data
    const onClickDelete = (cell: any) => {
        setDeleteModal(true);
        if (cell.userId) {
            setUserData(cell);
        }
    };

    const handleDelete = () => {
        if (userData) {
            dispatch(deleteUser(userData.userId))
                .then((response: any) => {
                    // Check if the delete was successful
                    if (response && response.meta && response.meta.requestStatus === 'fulfilled') {
                        // Refresh the data after successful deletion
                        dispatch(getAllUsers({ page: currentPage, pageSize }));
                        setDeleteModal(false);
                    }
                });
        }
    };

    // Update Data
    const handleUpdateDataClick = (ele: any) => {
        setUserData({ ...ele });
        setIsEdit(true);
        setViewMode(false);
        setShow(true);
    };

    // View Data
    const handleViewDataClick = (ele: any) => {
        setUserData({ ...ele });
        setViewMode(true);
        setIsEdit(true);
        setShow(true);
    };

    // Get skin type name by ID
    const getSkinTypeName = (skinTypeId: string | null) => {
        if (!skinTypeId) return 'Không Có';
        const skinType = skinTypes.find((type: any) => type.id === skinTypeId);
        return skinType ? skinType.name : 'N/A';
    };

    // Get role name by ID
    const getRoleName = (roleId: string) => {
        const role = roles.find((r: any) => r.roleId === roleId);
        return role ? role.roleName : 'N/A';
    };

    // Update the handleImageChange function
    const handleImageChange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e: any) => {
                setSelectedImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle search input change
    const handleSearchChange = (e: any) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    // Handle status filter change
    const handleStatusChange = (selectedOption: any) => {
        setFilters(prev => ({ ...prev, status: selectedOption.value }));
    };

    // Handle skin type filter change
    const handleSkinTypeChange = (selectedOption: any) => {
        setFilters(prev => ({ ...prev, skinType: selectedOption.value }));
    };

    // Handle role filter change
    const handleRoleChange = (selectedOption: any) => {
        setFilters(prev => ({ ...prev, role: selectedOption.value }));
    };

    // Handle image removal
    const handleRemoveImage = () => {
        setIsImageRemoved(true);
        setSelectedImage(null);
        validation.setFieldValue('avatarUrl', '');
    };

    // Update the validation onSubmit function
    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            avatarUrl: (userData && userData.avatarUrl) || '',
            userName: (userData && userData.userName) || '',
            surName: (userData && userData.surName) || '',
            lastName: (userData && userData.lastName) || '',
            emailAddress: (userData && userData.emailAddress) || '',
            phoneNumber: (userData && userData.phoneNumber) || '',
            password: (userData && userData.password) || '',
            status: (userData && userData.status) || 'Active',
            skinTypeId: (userData && userData.skinTypeId) || '',
            roleId: (userData && userData.roleId) || '',
        },
        validationSchema: Yup.object({
            userName: Yup.string().required("Vui lòng nhập tên người dùng"),
            surName: Yup.string().required("Vui lòng nhập họ"),
            lastName: Yup.string().required("Vui lòng nhập tên"),
            emailAddress: Yup.string()
                .required("Vui lòng nhập email")
                .email("Định dạng email không hợp lệ")
                .matches(
                    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
                    "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@domain.com)"
                ),
            phoneNumber: Yup.string()
                .required("Vui lòng nhập số điện thoại")
                .test("phone", "Số điện thoại phải có 9 hoặc 10 chữ số", function (value) {
                    if (!value) return false;
                    return isValidPhoneNumber(value);
                })
                .test("numeric", "Số điện thoại chỉ được chứa chữ số", function (value) {
                    if (!value) return false;
                    const cleanNumber = value.replace(/\s/g, '');
                    return /^\d+$/.test(cleanNumber);
                }),
            password: Yup.string()
                .required("Vui lòng nhập mật khẩu")
                .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
            status: Yup.string().required("Vui lòng chọn trạng thái"),
            roleId: Yup.string().required("Vui lòng chọn vai trò")
        }),
        onSubmit: async (values) => {
            try {
                let avatarUrl = values.avatarUrl;

                // Upload image to Firebase if a new file is selected
                if (selectedFile) {
                    const firebaseBackend = getFirebaseBackend();
                    avatarUrl = await firebaseBackend.uploadAccountImage(selectedFile);
                }

                // Format the phone number and handle skinTypeId
                const formattedValues = {
                    ...values,
                    phoneNumber: values.phoneNumber.replace(/\s/g, ''),
                    skinTypeId: values.skinTypeId === '' ? null : values.skinTypeId
                };

                if (isEdit) {
                    const updateUserData = {
                        id: userData ? userData.userId : '',
                        data: {
                            ...formattedValues,
                            avatarUrl: avatarUrl
                        },
                    };

                    // Dispatch update and then refresh data
                    dispatch(updateUser(updateUserData))
                        .then((response: any) => {
                            if (response && response.meta && response.meta.requestStatus === 'fulfilled') {
                                // Refresh the data after successful update
                                dispatch(getAllUsers({ page: currentPage, pageSize }));
                            }
                        });
                } else {
                    const newUser = {
                        ...formattedValues,
                        avatarUrl: avatarUrl
                    };

                    // Dispatch add and then refresh data
                    dispatch(addUser(newUser))
                        .then((response: any) => {
                            if (response && response.meta && response.meta.requestStatus === 'fulfilled') {
                                // Refresh the data after successful add
                                dispatch(getAllUsers({ page: currentPage, pageSize }));
                            }
                        });
                }
                toggle();
            } catch (error) {
                console.error("Lỗi khi tải lên hình ảnh:", error);
                toast.error("Lỗi khi tải lên hình ảnh. Vui lòng thử lại.");
            }
        },
    });

    // Optional: Add a handler for phone number input to format while typing
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any non-digit characters except spaces
        value = value.replace(/[^\d\s]/g, '');
        // Limit to 10 digits (excluding spaces)
        const digits = value.replace(/\s/g, '');
        if (digits.length > 10) {
            return;
        }

        // Format the phone number as user types
        if (digits.length >= 7) {
            value = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        } else if (digits.length >= 4) {
            value = `${digits.slice(0, 4)} ${digits.slice(4)}`;
        }

        validation.setFieldValue('phoneNumber', value);
    };

    // Table columns
    const columns = useMemo(() => [
        {
            header: "Tên",
            accessorKey: "userName",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-10 font-medium rounded-full shrink-0 bg-slate-200 text-slate-800 dark:text-zink-50 dark:bg-zink-600">
                        {cell.row.original.avatarUrl ?
                            <img src={cell.row.original.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> :
                            (cell.getValue().charAt(0).toUpperCase())}
                    </div>
                    <div className="grow">
                        <h6 className="mb-1"><Link to="#!" className="name">{cell.getValue()}</Link></h6>
                        <p className="text-slate-500 dark:text-zink-200">{`${cell.row.original.surName} ${cell.row.original.lastName}`}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Email",
            accessorKey: "emailAddress",
            enableColumnFilter: false,
        },
        {
            header: "Số Điện Thoại",
            accessorKey: "phoneNumber",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span>{formatPhoneNumber(cell.getValue())}</span>
            ),
        },
        {
            header: "Loại Da",
            accessorKey: "skinTypeId",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span>{getSkinTypeName(cell.getValue())}</span>
            ),
        },
        {
            header: "Vai Trò",
            accessorKey: "roleId",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span>{cell.getValue() ? getRoleName(cell.getValue()) : 'N/A'}</span>
            ),
        },
        {
            header: "Trạng Thái",
            accessorKey: "status",
            enableColumnFilter: false,
            enableSorting: true,
            cell: (cell: any) => (
                <Status item={cell.getValue()} />
            ),
        },
        {
            header: "Hành Động",
            enableColumnFilter: false,
            enableSorting: true,
            cell: (cell: any) => (
                <Dropdown className="relative">
                    <Dropdown.Trigger className="flex items-center justify-center size-[30px] p-0 text-slate-500 btn bg-slate-100 hover:text-white hover:bg-slate-600 focus:text-white focus:bg-slate-600 focus:ring focus:ring-slate-100 active:text-white active:bg-slate-600 active:ring active:ring-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:hover:bg-slate-500 dark:hover:text-white dark:focus:bg-slate-500 dark:focus:text-white dark:active:bg-slate-500 dark:active:text-white dark:ring-slate-400/20" id="usersAction1">
                        <MoreHorizontal className="size-3" />
                    </Dropdown.Trigger>
                    <Dropdown.Content placement="bottom-start" className="absolute z-50 py-2 mt-1 ltr:text-left rtl:text-right list-none bg-white rounded-md shadow-md min-w-[10rem] dark:bg-zink-600" aria-labelledby="usersAction1">
                        <li>
                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!" onClick={() => {
                                const userData = cell.row.original;
                                handleViewDataClick(userData);
                            }}><Eye className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Xem Chi Tiết</span></Link>
                        </li>
                        <li>
                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!"
                                onClick={() => {
                                    const data = cell.row.original;
                                    handleUpdateDataClick(data);
                                }}>
                                <FileEdit className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Chỉnh Sửa</span></Link>
                        </li>
                        <li>
                            <Link className="block px-4 py-1.5 text-base transition-all duration-200 ease-linear text-slate-600 hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 dark:text-zink-100 dark:hover:bg-zink-500 dark:hover:text-zink-200 dark:focus:bg-zink-500 dark:focus:text-zink-200" to="#!" onClick={() => {
                                const userData = cell.row.original;
                                onClickDelete(userData);
                            }}><Trash2 className="inline-block size-3 ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Xóa</span></Link>
                        </li>
                    </Dropdown.Content>
                </Dropdown>
            ),
        }
    ], [skinTypes, roles]);

    // Prepare options for dropdowns
    const statusOptions = [
        { value: 'All', label: 'Tất Cả Trạng Thái' },
        { value: 'Active', label: 'Hoạt Động' },
        { value: 'Inactive', label: 'Không Hoạt Động' },
    ];

    const skinTypeOptions = useMemo(() => [
        { value: 'All', label: 'Tất Cả Loại Da' },
        { value: 'None', label: 'Không Có' },
        ...skinTypes.map((type: any) => ({
            value: type.id,
            label: type.name
        }))
    ], [skinTypes]);

    const roleOptions = useMemo(() => [
        { value: 'All', label: 'Tất Cả Vai Trò' },
        ...roles.map((role: any) => ({
            value: role.roleId,
            label: role.roleName
        }))
    ], [roles]);

    // Function to directly navigate to a specific page
    const goToPage = (page: number) => {
        // Only change page if not in filtering mode
        if (!isFiltering) {
            setCurrentPage(page);
            dispatch(getAllUsers({
                page: page,
                pageSize: pageSize
            }));
        }
    };

    // Custom pagination component with direct navigation
    const CustomPagination = () => {
        // Don't show pagination when filtering
        if (isFiltering) {
            return (
                <div className="flex justify-between items-center mt-4 mr-4">
                    <div className="text-sm text-slate-500 dark:text-zink-200">
                        Hiển thị {filteredUsers.length} kết quả (Tổng số: {totalCount})
                    </div>
                    <button
                        type="button"
                        className="text-custom-500 bg-white btn border-custom-500 hover:text-white hover:bg-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600"
                        onClick={() => {
                            // Reset all filters
                            setFilters({
                                search: '',
                                status: 'All',
                                skinType: 'All',
                                role: 'All'
                            });
                            setIsFiltering(false);
                        }}
                    >
                        Xóa Bộ Lọc
                    </button>
                </div>
            );
        }

        return (
            <div className="flex justify-end mt-4 mr-4">
                <ul className="flex flex-wrap items-center gap-2 mt-2">
                    <li className="inline">
                        <button
                            type="button"
                            className="flex items-center justify-center size-8 transition-all duration-150 ease-linear border rounded text-slate-500 border-slate-200 dark:border-zink-500 hover:text-custom-500 hover:border-custom-500 focus:text-custom-500 focus:border-custom-500 active:text-custom-500 active:border-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:hover:border-custom-500 disabled:text-slate-400 disabled:cursor-auto disabled:dark:text-zink-300"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <i className="ri-arrow-left-s-line text-xl rtl:rotate-180"></i>
                        </button>
                    </li>

                    {[...Array(totalPages || 1)].map((_, i) => (
                        <li key={i + 1} className="inline">
                            <button
                                type="button"
                                className={`flex items-center justify-center size-8 transition-all duration-150 ease-linear border rounded border-slate-200 dark:border-zink-500 ${currentPage === i + 1
                                    ? "text-white bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 active:text-white active:bg-custom-600 active:border-custom-600"
                                    : "text-slate-500 bg-white hover:text-custom-500 hover:border-custom-500 focus:text-custom-500 focus:border-custom-500 active:text-custom-500 active:border-custom-500 dark:bg-zink-700 dark:text-zink-200 dark:border-zink-500 dark:hover:text-custom-500 dark:hover:border-custom-500"
                                    }`}
                                onClick={() => goToPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}

                    <li className="inline">
                        <button
                            type="button"
                            className="flex items-center justify-center size-8 transition-all duration-150 ease-linear border rounded text-slate-500 border-slate-200 dark:border-zink-500 hover:text-custom-500 hover:border-custom-500 focus:text-custom-500 focus:border-custom-500 active:text-custom-500 active:border-custom-500 dark:text-zink-200 dark:hover:text-custom-500 dark:hover:border-custom-500 disabled:text-slate-400 disabled:cursor-auto disabled:dark:text-zink-300"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === (totalPages || 1)}
                        >
                            <i className="ri-arrow-right-s-line text-xl rtl:rotate-180"></i>
                        </button>
                    </li>
                </ul>
            </div>
        );
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <BreadCrumb title="Tài Khoản" pageTitle="Người Dùng" />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-5">
                    <div className="xl:col-span-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h6 className="text-15 grow">Chi Tiết Tài Khoản <span className="ml-2 text-sm font-normal text-slate-500 dark:text-zink-200">(Tổng số: {totalCount})</span></h6>
                                    <div className="flex gap-2">
                                        <button type="button" className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20" onClick={toggle}>
                                            <Plus className="inline-block size-4 align-middle ltr:mr-1 rtl:ml-1" /> <span className="align-middle">Thêm Tài Khoản</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="!py-3.5 card-body border-y border-dashed border-slate-200 dark:border-zink-500 bg-white">
                                    <form action="#!">
                                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                                            <div className="relative xl:col-span-3">
                                                <input
                                                    type="text"
                                                    className="ltr:pl-8 rtl:pr-8 search form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                                    placeholder="Tìm kiếm tên, email, số điện thoại..."
                                                    autoComplete="off"
                                                    onChange={handleSearchChange}
                                                    value={filters.search}
                                                />
                                                <Search className="inline-block size-4 absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-500 dark:text-zink-200 fill-slate-100 dark:fill-zink-600" />
                                                {filters.search && (
                                                    <button
                                                        type="button"
                                                        className="absolute ltr:right-2.5 rtl:left-2.5 top-2.5 text-slate-500 dark:text-zink-200"
                                                        onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="xl:col-span-3">
                                                <Select
                                                    className="border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                                    options={statusOptions}
                                                    isSearchable={false}
                                                    value={statusOptions.find(option => option.value === filters.status)}
                                                    onChange={handleStatusChange}
                                                    id="status-filter"
                                                />
                                            </div>
                                            <div className="xl:col-span-3">
                                                <Select
                                                    className="border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                                    options={skinTypeOptions}
                                                    isSearchable={true}
                                                    value={skinTypeOptions.find(option => option.value === filters.skinType)}
                                                    onChange={handleSkinTypeChange}
                                                    id="skin-type-filter"
                                                />
                                            </div>
                                            <div className="xl:col-span-3">
                                                <Select
                                                    className="border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                                    options={roleOptions}
                                                    isSearchable={true}
                                                    value={roleOptions.find(option => option.value === filters.role)}
                                                    onChange={handleRoleChange}
                                                    id="role-filter"
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <TableContainer
                                        isPagination={false}
                                        columns={columns}
                                        data={filteredUsers || []}
                                        customPageSize={pageSize}
                                        divclassName={"overflow-x-auto"}
                                        tableclassName={"w-full whitespace-nowrap"}
                                        theadclassName={"bg-white ltr:text-left rtl:text-right"}
                                        trclassName={"border-y border-slate-200 dark:border-zink-500"}
                                        thclassName={"px-3.5 py-2.5 font-semibold border-y border-slate-200 dark:border-zink-500"}
                                        tdclassName={"px-3.5 py-2.5 border-y border-slate-200 dark:border-zink-500"}
                                    />

                                    <CustomPagination />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteModal show={deleteModal} onHide={deleteToggle} onDelete={handleDelete} />
            <ToastContainer closeButton={false} limit={1} />

            {/* User Modal */}
            <Modal show={show} onHide={toggle} modal-center="true"
                className="fixed flex flex-col transition-all duration-300 ease-in-out left-2/4 z-drawer -translate-x-2/4 -translate-y-2/4"
                dialogClassName="w-screen md:w-[30rem] bg-white shadow rounded-md dark:bg-zink-600">
                <Modal.Header className="flex items-center justify-between p-4 border-b dark:border-zink-500"
                    closeButtonClass="transition-all duration-200 ease-linear text-slate-400 hover:text-red-500">
                    <Modal.Title className="text-16">{isEdit ? (viewMode ? "Xem Tài Khoản" : "Chỉnh Sửa Tài Khoản") : "Thêm Tài Khoản"}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="max-h-[calc(theme('height.screen')_-_180px)] p-4 overflow-y-auto">
                    <form action="#!" onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                    }}>
                        <div className="mb-3">
                            <div className="relative size-24 mx-auto mb-4 rounded-full shadow-md bg-slate-100 dark:bg-zink-500">
                                <img
                                    src={
                                        isImageRemoved
                                            ? dummyImg
                                            : (selectedImage || validation.values.avatarUrl || dummyImg)
                                    }
                                    alt=""
                                    className="size-full rounded-full"
                                />
                                {!viewMode && (
                                    <>
                                        <div className="absolute bottom-0 ltr:right-0 rtl:left-0 flex items-center justify-center size-8 rounded-full cursor-pointer bg-slate-100 dark:bg-zink-600">
                                            <input
                                                type="file"
                                                className="absolute inset-0 size-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    handleImageChange(e);
                                                    setIsImageRemoved(false);
                                                }}
                                            />
                                            <ImagePlus className="size-4 text-slate-500 fill-slate-200 dark:text-zink-200 dark:fill-zink-600" />
                                        </div>
                                        {(selectedImage || validation.values.avatarUrl) && !isImageRemoved && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-0 right-0 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                                                title="Remove image"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                            <div className="xl:col-span-6">
                                <label htmlFor="userName" className="inline-block mb-2 text-base font-medium">
                                    Tên Người Dùng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="userName"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập tên người dùng"
                                    onChange={validation.handleChange}
                                    value={validation.values.userName || ""}
                                    disabled={viewMode}
                                />
                                {validation.touched.userName && validation.errors.userName ? (
                                    <p className="text-red-500">{validation.errors.userName}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="surName" className="inline-block mb-2 text-base font-medium">
                                    Họ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="surName"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập họ"
                                    onChange={validation.handleChange}
                                    value={validation.values.surName || ""}
                                    disabled={viewMode}
                                />
                                {validation.touched.surName && validation.errors.surName ? (
                                    <p className="text-red-500">{validation.errors.surName}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="lastName" className="inline-block mb-2 text-base font-medium">
                                    Tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập tên"
                                    onChange={validation.handleChange}
                                    value={validation.values.lastName || ""}
                                    disabled={viewMode}
                                />
                                {validation.touched.lastName && validation.errors.lastName ? (
                                    <p className="text-red-500">{validation.errors.lastName}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="emailAddress" className="inline-block mb-2 text-base font-medium">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="emailAddress"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập email"
                                    onChange={validation.handleChange}
                                    value={validation.values.emailAddress || ""}
                                    disabled={viewMode}
                                />
                                {validation.touched.emailAddress && validation.errors.emailAddress ? (
                                    <p className="text-red-500">{validation.errors.emailAddress}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="phoneNumber" className="inline-block mb-2 text-base font-medium">
                                    Số Điện Thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    onChange={handlePhoneChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.phoneNumber}
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập số điện thoại"
                                    disabled={viewMode}
                                />
                                {validation.touched.phoneNumber && validation.errors.phoneNumber && (
                                    <p className="text-red-400">{validation.errors.phoneNumber}</p>
                                )}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="password" className="inline-block mb-2 text-base font-medium">
                                    Mật Khẩu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type={viewMode ? "text" : "password"}
                                    id="password"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    placeholder="Nhập mật khẩu"
                                    onChange={validation.handleChange}
                                    value={validation.values.password || ""}
                                    disabled={viewMode}
                                />
                                {validation.touched.password && validation.errors.password ? (
                                    <p className="text-red-500">{validation.errors.password}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="status" className="inline-block mb-2 text-base font-medium">
                                    Trạng Thái <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    onChange={validation.handleChange}
                                    value={validation.values.status || "Active"}
                                    disabled={viewMode}
                                >
                                    <option value="Active">Hoạt Động</option>
                                    <option value="Inactive">Không Hoạt Động</option>
                                </select>
                                {validation.touched.status && validation.errors.status ? (
                                    <p className="text-red-500">{validation.errors.status}</p>
                                ) : null}
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="skinTypeId" className="inline-block mb-2 text-base font-medium">
                                    Loại Da
                                </label>
                                <select
                                    id="skinTypeId"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    onChange={validation.handleChange}
                                    value={validation.values.skinTypeId || ""}
                                    disabled={viewMode}
                                >
                                    <option value="">Không Có</option>
                                    {skinTypes.map((type: any) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="xl:col-span-6">
                                <label htmlFor="roleId" className="inline-block mb-2 text-base font-medium">
                                    Vai Trò <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="roleId"
                                    className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200"
                                    onChange={validation.handleChange}
                                    value={validation.values.roleId || ""}
                                    disabled={viewMode}
                                >
                                    <option value="">Chọn Vai Trò</option>
                                    {roles.map((role: any) => (
                                        <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
                                    ))}
                                </select>
                                {validation.touched.roleId && validation.errors.roleId ? (
                                    <p className="text-red-500">{validation.errors.roleId}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" className="text-red-500 bg-white btn border-red-500 hover:text-white hover:bg-red-600 focus:text-white focus:bg-red-600 focus:border-red-600 focus:ring focus:ring-red-100 active:text-white active:bg-red-600 active:border-red-600 active:ring active:ring-red-100 dark:ring-red-400/20" onClick={toggle}>
                                Hủy
                            </button>
                            {!viewMode && (
                                <button type="submit" className="text-white btn bg-custom-500 border-custom-500 hover:text-white hover:bg-custom-600 hover:border-custom-600 focus:text-white focus:bg-custom-600 focus:border-custom-600 focus:ring focus:ring-custom-100 active:text-white active:bg-custom-600 active:border-custom-600 active:ring active:ring-custom-100 dark:ring-custom-400/20">
                                    {isEdit ? "Cập Nhật" : "Thêm"}
                                </button>
                            )}
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </React.Fragment>
    );
};

export default Account;