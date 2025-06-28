import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Select from "react-select";
import Dropzone from "react-dropzone";
import { UploadCloud, Plus, Trash2 } from "lucide-react";
import BreadCrumb from "Common/BreadCrumb";
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';

// Define interfaces
interface ProductImage {
  file: File;
  preview: string;
  formattedSize: string;
}

interface VariationOption {
  id: string;
  value: string;
  variationId?: string;
  variationDto2?: {
    id: string;
    name: string;
  };
}

interface Variation {
  id: string;
  name: string;
  variationOptions: VariationOption[];
  productCategory?: any;
}

interface ProductItem {
  variationOptionIds: string[];
  price: number;
  marketPrice: number;
  purchasePrice: number;
  quantityInStock: number;
  imageUrl?: string;
}

const TINYMCE_API_KEY = process.env.REACT_APP_TINYMCE_API_KEY || "8wmapg650a8xkqj2cwz4qgka67mscn8xm3uaijvcyoh70b1g";
// Add this function to format numbers with spaces
const formatNumberWithSpaces = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Define a common editor configuration to reuse
const editorConfig = {
  height: 250,
  menubar: false,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
  ],
  toolbar: 'undo redo | blocks | ' +
    'bold italic forecolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | help',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  resize: true,
  statusbar: true,
  statusbar_location: 'bottom',
  elementpath: false,
  wordcount: false,
  branding: false,
  min_height: 150,
  max_height: 500
};

export default function AddNew() {
  const [productImage, setProductImage] = useState<ProductImage | null>(null);
  const [brandOptions, setBrandOptions] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [skinTypeOptions, setSkinTypeOptions] = useState<any[]>([]);
  const [variationOptions, setVariationOptions] = useState<VariationOption[]>([]);
  const [variations, setVariations] = useState<Array<{
    id: string;
    variationOptionIds: string[];
  }>>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productItemImages, setProductItemImages] = useState<{[key: number]: ProductImage | null}>({});
  const [productItemErrors, setProductItemErrors] = useState<{ [key: number]: { [key: string]: string } }>({});
  const [availableVariations, setAvailableVariations] = useState<Variation[]>([]);
  const navigate = useNavigate();

  const handleProductImageUpload = (files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      setProductImage({
        file,
        preview: URL.createObjectURL(file),
        formattedSize: formatBytes(file.size),
      });
    }
  };

  const removeProductImage = () => {
    setProductImage(null);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      // Fetch brands
      const brandsResponse = await axios.get("https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/brands");
      if (brandsResponse.data && brandsResponse.data.items) {
        setBrandOptions(
          brandsResponse.data.items.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }

      // Fetch skin types
      const skinTypesResponse = await axios.get("https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/skin-types");
      if (skinTypesResponse.data && skinTypesResponse.data.items) {
        setSkinTypeOptions(
          skinTypesResponse.data.items.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }

      // Fetch categories
      const categoriesResponse = await axios.get("https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/product-categories");
      if (categoriesResponse.data && categoriesResponse.data.items) {
        setCategoryOptions(
          categoriesResponse.data.items.map((item: any) => ({
            value: item.id,
            label: item.categoryName,
          }))
        );
      }

      // Fetch variation options - fix the data structure access
      const variationOptionsResponse = await axios.get("https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/variation-options");
      console.log("Variation options response:", variationOptionsResponse.data);
      
      // Check if the response has the expected structure
      if (variationOptionsResponse.data && variationOptionsResponse.data.success && variationOptionsResponse.data.data && variationOptionsResponse.data.data.items) {
        setVariationOptions(variationOptionsResponse.data.data.items);
      } else if (variationOptionsResponse.data && variationOptionsResponse.data.items) {
        // Alternative structure
        setVariationOptions(variationOptionsResponse.data.items);
      } else {
        console.error("Unexpected variation options response structure:", variationOptionsResponse.data);
      }

      // Fetch variations
      const variationsResponse = await axios.get("https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/variations");
      console.log("Variations response:", variationsResponse.data);
      
      if (variationsResponse.data && variationsResponse.data.success && variationsResponse.data.data && variationsResponse.data.data.items) {
        setAvailableVariations(variationsResponse.data.data.items);
      } else if (variationsResponse.data && variationsResponse.data.items) {
        // Alternative structure
        setAvailableVariations(variationsResponse.data.items);
      } else {
        console.error("Unexpected variations response structure:", variationsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      alert("Failed to load form options. Please refresh the page.");
    }
  };

  // Update the addProductItem function to use the selected variation option
  const addProductItem = () => {
    setProductItems([
      ...productItems,
      {
        variationOptionIds: [],
        price: 0,
        marketPrice: 0,
        purchasePrice: 0,
        quantityInStock: 0
      }
    ]);
    
    // Also initialize the image state
    setProductItemImages({
      ...productItemImages,
      [productItems.length]: null // Use the new index as the key
    });
    setProductItemErrors({
      ...productItemErrors,
      [productItems.length]: {} // Use the new index as the key
    });
  };

  // Remove a product item
  const removeProductItem = (index: number) => {
    setProductItems(productItems.filter((_, i) => i !== index));
  };

  // Update a product item
  const updateProductItem = (index: number, field: string, value: any) => {
    const updatedItems = [...productItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProductItems(updatedItems);
    
    // Validate the updated item
    const errors = validateProductItem(updatedItems[index], index);
    setProductItemErrors({
      ...productItemErrors,
      [index]: errors
    });
  };

  // Add this function for price formatting
  const formatPrice = (value: string): string => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    // Format with spaces for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Add this function to handle price input changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const formattedValue = formatPrice(e.target.value);
    const numericValue = formattedValue.replace(/\s/g, '');
    
    // Update the display value with formatting
    e.target.value = formattedValue;
    
    // Update formik with numeric value
    productFormik.setFieldValue(fieldName, numericValue);
  };

  // Update the validateProductItem function to fix image validation
  const validateProductItem = (item: any, index: number) => {
    const errors: { [key: string]: string } = {};
    
    // Validate variation options
    if (item.variationOptionIds.length === 0) {
      errors.variationOptionIds = "Tùy chọn biến thể là bắt buộc";
    }
    
    // Validate quantity
    if (item.quantityInStock === undefined || item.quantityInStock === null) {
      errors.quantityInStock = "Số lượng là bắt buộc";
    } else if (item.quantityInStock < 0) {
      errors.quantityInStock = "Số lượng không thể âm";
    }
    
    // Validate price
    if (item.price === undefined || item.price === null || item.price === 0) {
      errors.price = "Giá là bắt buộc";
    } else if (item.price < 0) {
      errors.price = "Giá không thể âm";
    }
    
    // Validate market price
    if (item.marketPrice === undefined || item.marketPrice === null || item.marketPrice === 0) {
      errors.marketPrice = "Giá thị trường là bắt buộc";
    } else if (item.marketPrice < 0) {
      errors.marketPrice = "Giá thị trường không thể âm";
    }
    
    // Only validate image if no image URL exists
    if (!item.imageUrl && !productItemImages[index] && productImage === null) {
      errors.image = "Hình ảnh sản phẩm là bắt buộc";
    }
    
    return errors;
  };

  // Replace toast notifications with MUI alerts
  const showSuccessAlert = (message: string) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
    console.log("SUCCESS:", message);
  };

  const showErrorAlert = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
    console.error("ERROR:", message);
  };

  // Create a simplified form with Formik
  const productFormik = useFormik({
    initialValues: {
      title: '',
      quantity: '',
      brand: '',
      category: '',
      productType: '',
      gender: '',
      price: '',
      marketPrice: '',
      skinType: [] as string[],
      variationOptions: [] as string[],
      description: '',
      detailedIngredients: '',
      mainFunction: '',
      texture: '',
      englishName: '',
      keyActiveIngredients: '',
      storageInstruction: '',
      usageInstruction: '',
      expiryDate: '',
      skinIssues: '',
      status: 'Draft',
      visibility: 'Public',
      tags: '',
      stockQuantity: '',
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .required('Tên sản phẩm là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/,
          'Tên sản phẩm không được chứa ký tự đặc biệt'
        ),
      brand: Yup.string().required('Thương hiệu là bắt buộc'),
      category: Yup.string().required('Danh mục là bắt buộc'),
      price: Yup.number().required('Giá là bắt buộc').min(0, 'Giá phải là số dương'),
      marketPrice: Yup.number().required('Giá thị trường là bắt buộc').min(0, 'Giá thị trường phải là số dương'),
      skinType: Yup.array().min(1, 'Phải chọn ít nhất một loại da').required('Loại da là bắt buộc'),
      description: Yup.string().required('Mô tả là bắt buộc'),
      detailedIngredients: Yup.string().required('Thành phần chi tiết là bắt buộc'),
      mainFunction: Yup.string()
        .required('Chức năng chính là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9.,]+$/,
          'Không được chứa ký tự đặc biệt'
        ),
      texture: Yup.string()
        .required('Kết cấu là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9.,]+$/,
          'Không được chứa ký tự đặc biệt'
        ),
      englishName: Yup.string()
        .matches(
          /^[a-zA-Z0-9\s.,]*$/,
          'Không được chứa ký tự đặc biệt'
        ),
      keyActiveIngredients: Yup.string()
        .required('Thành phần chính là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9.,]+$/,
          'Không được chứa ký tự đặc biệt'
        ),
      storageInstruction: Yup.string().required('Hướng dẫn lưu trữ là bắt buộc'),
      usageInstruction: Yup.string().required('Hướng dẫn sử dụng là bắt buộc'),
      expiryDate: Yup.string()
        .required('Ngày hạn sử dụng là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9.,]+$/,
          'Không được chứa ký tự đặc biệt'
        ),
      skinIssues: Yup.string()
        .required('Vấn đề da là bắt buộc')
        .matches(
          /^[a-zA-Z0-9\s\u00C0-\u1EF9.,]+$/,
          'Không được chứa ký tự đặc biệt'
        ),
    }),
    onSubmit: async (values) => {
      try {
        console.log("Form submission started with values:", values);
        console.log("Product items:", productItems);
        
        // Validate all product items
        let hasProductItemErrors = false;
        const allProductItemErrors: { [key: number]: { [key: string]: string } } = {};
        
        if (productItems.length === 0) {
          showErrorAlert("Cần ít nhất một sản phẩm");
          console.error("Validation failed: No product items");
          return;
        }
        
        productItems.forEach((item, index) => {
          const errors = validateProductItem(item, index);
          if (Object.keys(errors).length > 0) {
            hasProductItemErrors = true;
            allProductItemErrors[index] = errors;
            console.error(`Validation errors for item #${index + 1}:`, errors);
          }
        });
        
        if (hasProductItemErrors) {
          setProductItemErrors(allProductItemErrors);
          showErrorAlert("Vui lòng sửa tất cả lỗi trong các sản phẩm");
          return;
        }
        
        setIsSubmitting(true);
        
        // Get Firebase backend instance
        const firebaseBackend = getFirebaseBackend();
        console.log("Firebase backend initialized");
        
        // Upload product image if exists
        let productImageUrl = "";
        if (productImage?.file) {
          console.log("Uploading product image...");
          try {
            productImageUrl = await firebaseBackend.uploadFileWithDirectory(
              productImage.file, 
              "SPSS/Product-Images"
            );
            console.log("Product image uploaded successfully:", productImageUrl);
          } catch (uploadError) {
            console.error("Error uploading product image:", uploadError);
            showErrorAlert("Failed to upload product image. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
        
        // Upload product item images if exist
        console.log("Processing product items...");
        const updatedProductItems = await Promise.all(productItems.map(async (item, index) => {
          let imageUrl = item.imageUrl || "";
          
          // If there's an image file for this item, upload it
          if (productItemImages[index]?.file) {
            console.log(`Uploading image for product item #${index + 1}...`);
            try {
              imageUrl = await firebaseBackend.uploadFileWithDirectory(
                productItemImages[index]!.file, 
                "SPSS/Product-Item-Images"
              );
              console.log(`Image for product item #${index + 1} uploaded successfully:`, imageUrl);
            } catch (uploadError) {
              console.error(`Error uploading image for product item #${index + 1}:`, uploadError);
              throw new Error(`Failed to upload image for product item #${index + 1}`);
            }
          }
          
          return {
            ...item,
            imageUrl
          };
        }));
        
        // Prepare data for API submission in the required format
        const productData = {
          brandId: values.brand,
          productCategoryId: values.category,
          name: values.title,
          description: values.description,
          price: parseFloat(values.price.replace(/\s/g, '')),
          marketPrice: parseFloat(values.marketPrice.toString().replace(/\s/g, '')),
          skinTypeIds: values.skinType,
          productImageUrls: productImageUrl ? [productImageUrl] : [],
          variations: variations,
          productItems: updatedProductItems.map(item => ({
            variationOptionIds: item.variationOptionIds,
            price: parseFloat(item.price.toString().replace(/\s/g, '')),
            marketPrice: parseFloat(item.marketPrice.toString().replace(/\s/g, '')),
            quantityInStock: parseInt(item.quantityInStock.toString()),
            imageUrl: item.imageUrl
          })),
          specifications: {
            detailedIngredients: values.detailedIngredients,
            mainFunction: values.mainFunction,
            texture: values.texture,
            englishName: values.englishName,
            keyActiveIngredients: values.keyActiveIngredients,
            storageInstruction: values.storageInstruction,
            usageInstruction: values.usageInstruction,
            expiryDate: values.expiryDate,
            skinIssues: values.skinIssues
          }
        };
        
        console.log("FULL JSON PAYLOAD:", JSON.stringify(productData));
        
        // Make API call to create product
        try {
          const response = await axios.post(
            'https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api/products', 
            productData,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log("API response:", response.data);
          
          // More robust success check
          if (response.data || response.data.success === true) {
            console.log("SUCCESS DETECTED! Redirecting to product list...");
            showSuccessAlert("Product created successfully!");
            
            // Redirect to list view after successful submission
            setTimeout(() => {
              navigate('/apps-ecommerce-product-list');
            }, 2000);
            return;
          } else {
            console.error("API returned success=false:", response.data);
            const errorMsg = response.data?.message || "Failed to create product. Please try again.";
            showErrorAlert(errorMsg);
          }
        } catch (apiError: any) {
          console.error("API error:", apiError);
          
          // Improved error handling to show more details
          if (apiError.response) {
            console.error("API error response data:", apiError.response.data);
            console.error("API error response status:", apiError.response.status);
            
            // Extract error message from response with more detail
            let errorMessage = "Failed to create product. Please try again.";
            
            if (apiError.response.data) {
              if (typeof apiError.response.data === 'string') {
                errorMessage = apiError.response.data;
              } else if (apiError.response.data.message) {
                errorMessage = apiError.response.data.message;
              } else if (apiError.response.data.error) {
                errorMessage = apiError.response.data.error;
              } else if (apiError.response.data.errors) {
                // Handle validation errors
                if (Array.isArray(apiError.response.data.errors)) {
                  errorMessage = apiError.response.data.errors.join(", ");
                } else if (typeof apiError.response.data.errors === 'object') {
                  // Handle object of errors
                  const errorMessages = Object.entries(apiError.response.data.errors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join("; ");
                  errorMessage = errorMessages;
                }
              }
            }
            
            showErrorAlert(`Error (${apiError.response.status}): ${errorMessage}`);
          } else if (apiError.request) {
            console.error("API error request:", apiError.request);
            showErrorAlert("No response received from server. Please check your internet connection and try again.");
          } else {
            console.error("API error message:", apiError.message);
            showErrorAlert("An error occurred while creating the product. Please try again.");
          }
        }
      } catch (error: any) {
        console.error("Error creating product:", error);
        showErrorAlert(error.message || "Failed to create product. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Add this function to debug form validation errors
  const debugFormValidation = () => {
    console.log("Form values:", productFormik.values);
    console.log("Form errors:", productFormik.errors);
    console.log("Form touched:", productFormik.touched);
    console.log("Form isValid:", productFormik.isValid);
    console.log("Form dirty:", productFormik.dirty);
    console.log("Product items:", productItems);
    console.log("Product item errors:", productItemErrors);
  };

  const handleProductItemImageUpload = (index: number, files: File[]) => {
    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      setProductItemImages({
        ...productItemImages,
        [index]: {
          file,
          preview: URL.createObjectURL(file),
          formattedSize: formatBytes(file.size)
        }
      });
      
      // Update the product item with the file reference
      const updatedItems = [...productItems];
      updatedItems[index] = { 
        ...updatedItems[index], 
        imageUrl: URL.createObjectURL(file) 
      };
      setProductItems(updatedItems);
    }
  };

  const removeProductItemImage = (index: number) => {
    const updatedImages = { ...productItemImages };
    delete updatedImages[index];
    setProductItemImages(updatedImages);
    
    // Remove the file reference from the product item
    const updatedItems = [...productItems];
    const updatedItem = { ...updatedItems[index] };
    delete updatedItem.imageUrl;
    updatedItems[index] = updatedItem;
    setProductItems(updatedItems);
  };

  // Add this function to add a new variation
  const addVariation = () => {
    setVariations([
      ...variations,
      {
        id: "",
        variationOptionIds: []
      }
    ]);
  };

  // Add this function to remove a variation
  const removeVariation = (index: number) => {
    const newVariations = [...variations];
    newVariations.splice(index, 1);
    setVariations(newVariations);
  };

  // Add this function to update a variation
  const updateVariation = (index: number, field: string, value: any) => {
    const newVariations = [...variations];
    if (field === 'id') {
      newVariations[index] = {
        ...newVariations[index],
        id: value,
        variationOptionIds: [] // Reset options when variation type changes
      };
    } else if (field === 'variationOptionIds') {
      newVariations[index] = {
        ...newVariations[index],
        variationOptionIds: value
      };
    }
    setVariations(newVariations);
  };

  // Update the generateProductItems function to correctly create combinations
  const generateProductItems = () => {
    // Check if we have valid variations
    if (variations.length === 0 || variations.some(v => !v.id || v.variationOptionIds.length === 0)) {
      showErrorAlert("Vui lòng chọn đầy đủ biến thể và tùy chọn trước khi tạo sản phẩm");
      return;
    }
    
    // Create a new array to hold the product items
    const newProductItems: ProductItem[] = [];
    
    // For each variation, create a product item with that variation option
    variations.forEach(variation => {
      // For each selected variation option in this variation
      variation.variationOptionIds.forEach(optionId => {
        // Create a new product item with this variation option
        newProductItems.push({
          variationOptionIds: [optionId],
          price: 0,
          marketPrice: 0,
          purchasePrice: 0,
          quantityInStock: 0
        });
      });
    });
    
    // Set the new product items
    setProductItems(newProductItems);
    
    // Initialize images and errors for each new product item
    const newImages: { [key: number]: ProductImage | null } = {};
    const newErrors: { [key: number]: { [key: string]: string } } = {};
    
    newProductItems.forEach((_: any, index: number) => {
      newImages[index] = null;
      newErrors[index] = {};
    });
    
    setProductItemImages(newImages);
    setProductItemErrors(newErrors);
  };

  const handleBackToList = () => {
    navigate('/apps-ecommerce-product-list');
  };

  return (
    <React.Fragment>
      <BreadCrumb title="Thêm Sản Phẩm" pageTitle="Sản Phẩm" />
      <ToastContainer />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-5">
        <div className="xl:col-span-12">
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h6 className="text-15">Thêm Sản Phẩm</h6>
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
                >
                  Trở Lại Danh Sách
                </button>
              </div>
              
              <form onSubmit={productFormik.handleSubmit}>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12 mb-5">
                  {/* Product Image Section - Single Image */}
                  <div className="xl:col-span-12">
                    <label className="inline-block mb-2 text-base font-medium">
                      Hình Ảnh Sản Phẩm
                    </label>
                    <Dropzone
                      onDrop={(acceptedFiles) => handleProductImageUpload(acceptedFiles)}
                      accept={{
                        "image/*": [".png", ".jpg", ".jpeg"],
                      }}
                      maxFiles={1}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <div
                          className="border-2 border-dashed rounded-lg border-slate-200 dark:border-zink-500"
                          {...getRootProps()}
                        >
                          <input {...getInputProps()} />
                          <div className="p-4 text-center">
                            {productImage ? (
                              <div className="relative">
                                <img
                                  src={productImage.preview}
                                  alt="Product"
                                  className="h-32 mx-auto object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeProductImage();
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 size-5 flex items-center justify-center"
                                >
                                  ×
                                </button>
                                <p className="mt-1 text-sm text-slate-500">
                                  {productImage.formattedSize}
                                </p>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="size-6 mx-auto mb-3" />
                                <h5 className="mb-1">
                                  Đặt hình ảnh vào đây hoặc nhấp để tải lên.
                                </h5>
                                <p className="text-slate-500 dark:text-zink-200">
                                  Kích thước tối đa: 2MB
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </Dropzone>
                  </div>
                </div>

                {/* Basic Product Information */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12">
                  <div className="xl:col-span-6">
                    <label htmlFor="title" className="inline-block mb-2 text-base font-medium">
                      Tên Sản Phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className={`form-input w-full ${
                        productFormik.touched.title && productFormik.errors.title ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="Tên sản phẩm"
                      value={productFormik.values.title}
                      onChange={productFormik.handleChange}
                      onBlur={productFormik.handleBlur}
                    />
                    {productFormik.touched.title && productFormik.errors.title && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.title}</p>
                    )}
                  </div>

                  <div className="xl:col-span-6">
                    <label htmlFor="description" className="inline-block mb-2 text-base font-medium">
                      Mô Tả <span className="text-red-500">*</span>
                    </label>
                    <Editor
                      id="description"
                      apiKey="8wmapg650a8xkqj2cwz4qgka67mscn8xm3uaijvcyoh70b1g"
                      init={editorConfig}
                      value={productFormik.values.description}
                      onEditorChange={(content : any) => {
                        productFormik.setFieldValue('description', content);
                      }}
                      onBlur={() => productFormik.setFieldTouched('description', true)}
                    />
                    {productFormik.touched.description && productFormik.errors.description && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.description}</p>
                    )}
                  </div>

                  <div className="xl:col-span-6">
                    <label htmlFor="brand" className="inline-block mb-2 text-base font-medium">
                      Thương Hiệu <span className="text-red-500">*</span>
                    </label>
                    <Select
                      className="react-select"
                      options={brandOptions}
                      isSearchable={true}
                      name="brand"
                      id="brand"
                      placeholder="Chọn thương hiệu..."
                      value={brandOptions.find(option => option.value === productFormik.values.brand)}
                      onChange={(option) => productFormik.setFieldValue('brand', option?.value || '')}
                      onBlur={() => productFormik.setFieldTouched('brand', true)}
                    />
                    {productFormik.touched.brand && productFormik.errors.brand && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.brand}</p>
                    )}
                  </div>

                  <div className="xl:col-span-6">
                    <label htmlFor="category" className="inline-block mb-2 text-base font-medium">
                      Danh Mục <span className="text-red-500">*</span>
                    </label>
                    <Select
                      className="react-select"
                      options={categoryOptions}
                      isSearchable={true}
                      name="category"
                      id="category"
                      placeholder="Chọn danh mục..."
                      value={categoryOptions.find(option => option.value === productFormik.values.category)}
                      onChange={(option) => productFormik.setFieldValue('category', option?.value || '')}
                      onBlur={() => productFormik.setFieldTouched('category', true)}
                    />
                    {productFormik.touched.category && productFormik.errors.category && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.category}</p>
                    )}
                  </div>

                  <div className="xl:col-span-6">
                    <label htmlFor="price" className="inline-block mb-2 text-base font-medium">
                      Giá (VND) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="price"
                        name="price"
                        className={`form-input w-full ${
                          productFormik.touched.price && productFormik.errors.price ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="0"
                        value={formatPrice(productFormik.values.price.toString())}
                        onChange={(e) => handlePriceChange(e, 'price')}
                        onBlur={productFormik.handleBlur}
                      />
                    </div>
                    {productFormik.touched.price && productFormik.errors.price && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.price}</p>
                    )}
                  </div>

                  <div className="xl:col-span-6">
                    <label htmlFor="marketPrice" className="inline-block mb-2 text-base font-medium">
                      Giá Thị Trường (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="marketPrice"
                      name="marketPrice"
                      className="form-input w-full border-slate-200"
                      placeholder="0"
                      value={productFormik.values.marketPrice ? formatPrice(productFormik.values.marketPrice.toString()) : ''}
                      onChange={(e) => {
                        const formattedValue = formatPrice(e.target.value);
                        const numericValue = parseFloat(formattedValue.replace(/\s/g, '')) || 0;
                        productFormik.setFieldValue('marketPrice', numericValue);
                      }}
                      onBlur={productFormik.handleBlur}
                    />
                    {productFormik.touched.marketPrice && productFormik.errors.marketPrice && (
                      <p className="mt-1 text-sm text-red-500">{productFormik.errors.marketPrice}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12">
                    <div className="xl:col-span-12">
                      <label htmlFor="skinType" className="inline-block mb-2 text-base font-medium">
                        Loại Da <span className="text-red-500">*</span>
                      </label>
                      <Select
                        className="react-select w-full"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '42px',
                            width: '100%'
                          })
                        }}
                        options={skinTypeOptions}
                        isSearchable={true}
                        isMulti={true}
                        name="skinType"
                        id="skinType"
                        placeholder="Chọn loại da..."
                        value={skinTypeOptions.filter(option => 
                          productFormik.values.skinType.includes(option.value)
                        )}
                        onChange={(selectedOptions) => {
                          const selectedIds = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
                          productFormik.setFieldValue('skinType', selectedIds);
                        }}
                        onBlur={() => productFormik.setFieldTouched('skinType', true)}
                      />
                      {productFormik.touched.skinType && productFormik.errors.skinType && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.skinType}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variations Section - Simplified */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h6 className="text-15 font-medium">Biến Thể</h6>
                    <button
                      type="button"
                      onClick={addVariation}
                      className="flex items-center justify-center px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-sm"
                    >
                      <Plus className="size-4 mr-2" /> Thêm Biến Thể
                    </button>
                  </div>
                  
                  {variations.length === 0 && (
                    <div className="p-4 text-center border border-dashed rounded-lg">
                      <p className="text-slate-500">
                        Chưa có biến thể. Click "Thêm Biến Thể" để tạo biến thể mới.
                      </p>
                    </div>
                  )}
                  
                  {variations.map((variation, index) => (
                    <div key={index} className="p-4 mb-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h6 className="text-base font-medium">Biến Thể #{index + 1}</h6>
                        <button
                          type="button"
                          onClick={() => removeVariation(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                          <label className="inline-block mb-2 text-sm font-medium">
                            Loại Biến Thể <span className="text-red-500">*</span>
                          </label>
                          <Select
                            className="react-select"
                            options={availableVariations.map(v => ({
                              value: v.id,
                              label: v.name
                            }))}
                            isSearchable={true}
                            placeholder="Chọn loại biến thể..."
                            value={availableVariations
                              .filter(v => v.id === variation.id)
                              .map(v => ({
                                value: v.id,
                                label: v.name
                              }))[0]}
                            onChange={(option) => 
                              updateVariation(index, 'id', option?.value || "")
                            }
                          />
                        </div>
                        
                        <div>
                          <label className="inline-block mb-2 text-sm font-medium">
                            Tùy Chọn Biến Thể <span className="text-red-500">*</span>
                          </label>
                          <Select
                            className="react-select"
                            options={
                              availableVariations
                                .find(v => v.id === variation.id)?.variationOptions
                                ?.map(option => ({
                                  value: option.id,
                                  label: option.value
                                })) || []
                            }
                            isSearchable={true}
                            isMulti={true}
                            placeholder={variation.id ? "Chọn tùy chọn..." : "Chọn loại biến thể trước"}
                            isDisabled={!variation.id}
                            value={
                              availableVariations
                                .find(v => v.id === variation.id)?.variationOptions
                                ?.filter(option => variation.variationOptionIds.includes(option.id))
                                .map(option => ({
                                  value: option.id,
                                  label: option.value
                                })) || []
                            }
                            onChange={(selectedOptions) => {
                              const selectedIds = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
                              updateVariation(index, 'variationOptionIds', selectedIds);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Items Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h6 className="text-15 font-medium">Sản Phẩm</h6>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={generateProductItems}
                        className="flex items-center justify-center px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-sm"
                        disabled={variations.length === 0}
                      >
                        <Plus className="size-4 mr-2" /> Tạo Sản Phẩm Từ Biến Thể
                      </button>
                    </div>
                  </div>
                  
                  {productItems.length === 0 && (
                    <div className="p-4 text-center border border-dashed rounded-lg">
                      <p className="text-slate-500">
                        Chưa có sản phẩm. Click "Tạo Sản Phẩm Từ Biến Thể" để tự động tạo sản phẩm từ các biến thể đã chọn.
                      </p>
                    </div>
                  )}

                  {productItems.map((item, index) => (
                    <div key={index} className="p-4 mb-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h6 className="text-base font-medium">Sản Phẩm #{index + 1}</h6>
                        <button
                          type="button"
                          onClick={() => removeProductItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Show only one field per variation option */}
                        {item.variationOptionIds.map((optionId, optIndex) => {
                          // Find which variation this option belongs to
                          const variationInfo = availableVariations.find(v => 
                            v.variationOptions.some(opt => opt.id === optionId)
                          );
                          
                          // Find the specific option
                          const option = variationInfo?.variationOptions.find(opt => opt.id === optionId);
                          
                          return variationInfo && option ? (
                            <div key={optIndex}>
                              <label className="inline-block mb-2 text-sm font-medium">
                                {variationInfo.name} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-input w-full bg-gray-100"
                                value={option.value || ""}
                                disabled
                              />
                            </div>
                          ) : null;
                        })}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Giá bán */}
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => updateProductItem(index, 'price', Number(e.target.value))}
                            placeholder="Giá bán"
                            className="input"
                          />
                          {/* Giá thị trường */}
                          <input
                            type="number"
                            value={item.marketPrice}
                            onChange={e => updateProductItem(index, 'marketPrice', Number(e.target.value))}
                            placeholder="Giá thị trường"
                            className="input"
                          />
                          {/* Giá nhập */}
                          <input
                            type="number"
                            value={item.purchasePrice}
                            onChange={e => updateProductItem(index, 'purchasePrice', Number(e.target.value))}
                            placeholder="Giá nhập"
                            className="input"
                          />
                          {/* Số lượng */}
                          <input
                            type="number"
                            value={item.quantityInStock}
                            onChange={e => updateProductItem(index, 'quantityInStock', Number(e.target.value))}
                            placeholder="Số lượng"
                            className="input"
                          />
                        </div>
                        
                        <div className="lg:col-span-2">
                          <label className="inline-block mb-2 text-sm font-medium">
                            Hình Ảnh Sản Phẩm <span className="text-red-500">*</span>
                          </label>
                          <Dropzone
                            onDrop={(acceptedFiles) => handleProductItemImageUpload(index, acceptedFiles)}
                            accept={{
                              'image/*': ['.jpeg', '.jpg', '.png', '.gif']
                            }}
                            maxSize={2 * 1024 * 1024} // 2MB
                          >
                            {({ getRootProps, getInputProps }) => (
                              <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 ${
                                  productItemErrors[index]?.image ? 'border-red-500' : 'border-slate-200'
                                }`}
                              >
                                <input {...getInputProps()} />
                                
                                {productItemImages[index] ? (
                                  <div className="relative">
                                    <img 
                                      src={productItemImages[index]?.preview} 
                                      alt="Preview" 
                                      className="mx-auto h-32 object-contain"
                                    />
                                    <p className="mt-2 text-sm text-slate-500">
                                      {productItemImages[index]?.formattedSize}
                                    </p>
                                    <button
                                      type="button"
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProductItemImage(index);
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud className="mx-auto size-8 text-slate-400" />
                                    <p className="mt-2 text-sm text-slate-500">
                                      Drop image here or click to upload
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      (Max size: 2MB)
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </Dropzone>
                          {productItemErrors[index]?.image && (
                            <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.image}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Specifications */}
                <div className="mt-8">
                  <h6 className="mb-4 text-15 font-medium">Thông Số Sản Phẩm</h6>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12">
                    <div className="xl:col-span-6">
                      <label htmlFor="detailedIngredients" className="inline-block mb-2 text-base font-medium">
                        Thành Phần Chi Tiết <span className="text-red-500">*</span>
                      </label>
                      <Editor
                        id="detailedIngredients"
                        apiKey="8wmapg650a8xkqj2cwz4qgka67mscn8xm3uaijvcyoh70b1g"
                        init={editorConfig}
                        value={productFormik.values.detailedIngredients}
                        onEditorChange={(content : any) => {
                          productFormik.setFieldValue('detailedIngredients', content);
                        }}
                        onBlur={() => productFormik.setFieldTouched('detailedIngredients', true)}
                      />
                      {productFormik.touched.detailedIngredients && productFormik.errors.detailedIngredients && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.detailedIngredients}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="mainFunction" className="inline-block mb-2 text-base font-medium">
                        Chức Năng Chính <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="mainFunction"
                        name="mainFunction"
                        className={`form-input w-full ${
                          productFormik.touched.mainFunction && productFormik.errors.mainFunction ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Nhập chức năng chính"
                        value={productFormik.values.mainFunction}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.mainFunction && productFormik.errors.mainFunction && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.mainFunction}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="texture" className="inline-block mb-2 text-base font-medium">
                        Kết Cấu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="texture"
                        name="texture"
                        className={`form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200 ${
                          productFormik.touched.texture && productFormik.errors.texture ? "border-red-500" : ""
                        }`}
                        placeholder="Nhập kết cấu sản phẩm"
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                        value={productFormik.values.texture}
                      />
                      {productFormik.touched.texture && productFormik.errors.texture && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.texture}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="englishName" className="inline-block mb-2 text-base font-medium">
                        Tên Tiếng Anh
                      </label>
                      <input
                        type="text"
                        id="englishName"
                        name="englishName"
                        className="form-input w-full border-slate-200"
                        placeholder="Nhập tên tiếng anh"
                        value={productFormik.values.englishName}
                        onChange={productFormik.handleChange}
                      />
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="keyActiveIngredients" className="inline-block mb-2 text-base font-medium">
                        Thành Phần Chính <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="keyActiveIngredients"
                        name="keyActiveIngredients"
                        className={`form-input w-full ${
                          productFormik.touched.keyActiveIngredients && productFormik.errors.keyActiveIngredients ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Nhập thành phần chính"
                        value={productFormik.values.keyActiveIngredients}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.keyActiveIngredients && productFormik.errors.keyActiveIngredients && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.keyActiveIngredients}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="storageInstruction" className="inline-block mb-2 text-base font-medium">
                        Hướng Dẫn Lưu Trữ <span className="text-red-500">*</span>
                      </label>
                      <Editor
                        id="storageInstruction"
                        apiKey="8wmapg650a8xkqj2cwz4qgka67mscn8xm3uaijvcyoh70b1g"
                        init={editorConfig}
                        value={productFormik.values.storageInstruction}
                        onEditorChange={(content : any) => {
                          productFormik.setFieldValue('storageInstruction', content);
                        }}
                        onBlur={() => productFormik.setFieldTouched('storageInstruction', true)}
                      />
                      {productFormik.touched.storageInstruction && productFormik.errors.storageInstruction && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.storageInstruction}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="usageInstruction" className="inline-block mb-2 text-base font-medium">
                        Hướng Dẫn Sử Dụng <span className="text-red-500">*</span>
                      </label>
                      <Editor
                        id="usageInstruction"
                        apiKey="8wmapg650a8xkqj2cwz4qgka67mscn8xm3uaijvcyoh70b1g"
                        init={editorConfig}
                        value={productFormik.values.usageInstruction}
                        onEditorChange={(content : any) => {
                          productFormik.setFieldValue('usageInstruction', content);
                        }}
                        onBlur={() => productFormik.setFieldTouched('usageInstruction', true)}
                      />
                      {productFormik.touched.usageInstruction && productFormik.errors.usageInstruction && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.usageInstruction}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="expiryDate" className="inline-block mb-2 text-base font-medium">
                        Ngày Hạn Sử Dụng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        className={`form-input w-full ${
                          productFormik.touched.expiryDate && productFormik.errors.expiryDate ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Nhập ngày hạn sử dụng (ví dụ: 2 months)"
                        value={productFormik.values.expiryDate}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.expiryDate && productFormik.errors.expiryDate && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.expiryDate}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="skinIssues" className="inline-block mb-2 text-base font-medium">
                        Vấn Đề Da <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="skinIssues"
                        name="skinIssues"
                        className={`form-input w-full ${
                          productFormik.touched.skinIssues && productFormik.errors.skinIssues ? 'border-red-500' : 'border-slate-200'
                        }`}
                        placeholder="Nhập vấn đề da mà sản phẩm giải quyết"
                        value={productFormik.values.skinIssues}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.skinIssues && productFormik.errors.skinIssues && (
                        <p className="mt-1 text-sm text-red-500">{productFormik.errors.skinIssues}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      productFormik.resetForm();
                      setProductImage(null);
                      setProductItems([]);
                      setVariations([{id: "", variationOptionIds: []}]);
                    }}
                    className="text-red-500 bg-white btn hover:text-red-500 hover:bg-red-100 focus:text-red-500 focus:bg-red-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      debugFormValidation();
                      // Force form submission regardless of validation
                      productFormik.handleSubmit();
                    }}
                    disabled={isSubmitting}
                    className="text-white btn bg-custom-500 hover:text-white hover:bg-custom-600 focus:text-white focus:bg-custom-600"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2 animate-spin">
                          <i className="mdi mdi-loading"></i>
                        </span>
                        Đang tạo sản phẩm...
                      </>
                    ) : (
                      "Tạo Sản Phẩm"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}