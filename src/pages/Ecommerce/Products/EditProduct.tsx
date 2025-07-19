import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Select from "react-select";
import Dropzone from "react-dropzone";
import { UploadCloud, Plus, Trash2 } from "lucide-react";
import BreadCrumb from "Common/BreadCrumb";
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { getProductById } from 'slices/product/thunk';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import { Link } from "react-router-dom";

// Define base URL for API
const API_BASE_URL = "https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net";

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
// Note: CORS headers need to be set on the server side, not the client side
// axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

// Create axios instance with proxy configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization interceptor
apiClient.interceptors.request.use(
  config => {
    // Get the auth token from sessionStorage
    const authUser = sessionStorage.getItem('authUser');
    if (authUser) {
      try {
        const parsedAuth = JSON.parse(authUser);
        if (parsedAuth && parsedAuth.accessToken) {
          config.headers['Authorization'] = `Bearer ${parsedAuth.accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Fix for _error$response$data3.join is not a function
    // Make sure error.response.data exists and is properly formatted
    if (error.response && error.response.data) {
      // Ensure that if errors is an array, we handle it properly
      if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
        console.log('Error response contains errors array:', error.response.data.errors);
      } else if (error.response.data.errors && typeof error.response.data.errors === 'object') {
        // Convert object of errors to array of strings
        error.response.data.errors = Object.values(error.response.data.errors).flat();
        console.log('Converted error object to array:', error.response.data.errors);
      }
    }

    // If the error is 403 (Forbidden) or 401 (Unauthorized) and we haven't retried yet
    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token or redirect to login
        const authUser = sessionStorage.getItem('authUser');
        if (authUser) {
          // You can implement token refresh logic here if your API supports it
          // For now, we'll just redirect to login

          // Clear the current session
          sessionStorage.removeItem('authUser');

          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Define interfaces
interface ProductImage {
  file: File | null;
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
  name?: string;
  variationOptions?: VariationOption[];
  variationOptionIds: string[];
}

interface ProductItem {
  id?: string;  // Make it optional since new items won't have an ID yet
  variationOptionIds: string[];
  price: number;
  marketPrice: number;
  purchasePrice: number;
  quantityInStock: number;
  imageUrl?: string;
  imageFile?: File;  // Add this property
}

export default function EditProduct() {
  const dispatch = useDispatch<any>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get product ID from URL query parameter
  const params = new URLSearchParams(location.search);
  const productId = params.get('id');

  // State for product data
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Fetch product data when component mounts
  useEffect(() => {
    if (productId) {
      setLoading(true);
      apiClient.get(`/api/products/${productId}/edit`)
        .then(response => {
          if (response.data && response.data.success && response.data.data) {
            // Successfully got product data
            setProductData(response.data.data);
          } else {
            setError("Failed to load product data: " + (response.data.message || "Unknown error"));
          }
        })
        .catch(err => {
          console.error("API Error:", err);
          if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            if (err.response.status === 403) {
              setError("Bạn không có quyền truy cập sản phẩm này. Vui lòng đăng nhập lại.");
            } else if (err.response.status === 404) {
              setError("Không tìm thấy sản phẩm. Sản phẩm có thể đã bị xóa hoặc di chuyển.");
            } else {
              setError(`Lỗi khi tải dữ liệu sản phẩm: ${err.response.status} - ${err.response.data?.message || err.message}`);
            }
          } else if (err.request) {
            // The request was made but no response was received
            setError("Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.");
          } else {
            // Something happened in setting up the request that triggered an Error
            setError("Lỗi khi tải dữ liệu sản phẩm: " + err.message);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productId]);

  // Handle form initialization separately
  useEffect(() => {
    if (productData && !loading) {
      console.log("Initializing form with product data:", productData);

      // Set form values based on product data
      productFormik.setValues({
        title: productData.name || '',
        description: productData.description || '',
        quantity: productData.soldCount?.toString() || '0',
        brand: productData.brandId || '',
        category: productData.productCategoryId || '',
        productType: productData.productType || '',
        gender: productData.gender || '',
        price: productData.price?.toString() || '',
        marketPrice: productData.marketPrice?.toString() || '',
        skinType: productData.skinTypeIds || [],
        variationOptions: [],
        detailedIngredients: productData.specifications?.detailedIngredients || '',
        mainFunction: productData.specifications?.mainFunction || '',
        texture: productData.specifications?.texture || '',
        englishName: productData.specifications?.englishName === null ? '' : productData.specifications?.englishName || '',
        keyActiveIngredients: productData.specifications?.keyActiveIngredients || '',
        storageInstruction: productData.specifications?.storageInstruction || '',
        usageInstruction: productData.specifications?.usageInstruction || '',
        expiryDate: productData.specifications?.expiryDate || '',
        skinIssues: productData.specifications?.skinIssues || '',
        status: productData.status || 'Draft',
        visibility: productData.visibility || 'Public',
        tags: productData.tags?.join(', ') || ''
      });

      // Set product images from API
      if (productData.productImageUrls && productData.productImageUrls.length > 0) {
        console.log("Product images from API:", productData.productImageUrls);

        // Set thumbnail to first image
        setThumbnail({
          preview: productData.productImageUrls[0],
          file: null,
          formattedSize: "Existing image"
        });

        // Set all images as product images for display in the grid
        const allImages = productData.productImageUrls.map((url: string) => ({
          preview: url,
          file: null,
          formattedSize: "Existing image"
        }));

        setProductImages(allImages);
        console.log("Set all product images:", allImages);
      } else {
        // Reset thumbnail and product images if none are available
        setThumbnail(null);
        setProductImages([]);
      }

      // Initialize variations from productData
      if (productData.variations && productData.variations.length > 0) {
        console.log("Initializing variations from API:", productData.variations);

        const mappedVariations = productData.variations.map((variation: any) => {
          // Find selected options
          const selectedOptions = variation.options ?
            variation.options.filter((option: any) => option.isSelected).map((option: any) => option.id) :
            [];

          console.log(`Selected options for variation ${variation.name}:`, selectedOptions);

          return {
            id: variation.id,
            name: variation.name || '',
            variationOptions: variation.options || [],
            variationOptionIds: selectedOptions
          };
        });

        setVariations(mappedVariations);
        console.log("Mapped variations:", mappedVariations);
      } else {
        // If no variations, initialize with an empty one
        setVariations([{
          id: "",
          name: "",
          variationOptions: [],
          variationOptionIds: []
        }]);
      }

      // Initialize product items from productItems
      if (productData.productItems && productData.productItems.length > 0) {
        console.log("Initializing product items from API:", productData.productItems);

        // Đảm bảo mỗi productItem có variationOptionIds không rỗng
        const items = productData.productItems.map((item: any, index: number) => {
          // Kiểm tra và log variationOptionIds
          if (!item.variationOptionIds || item.variationOptionIds.length === 0) {
            console.warn(`Product item #${index + 1} has empty variationOptionIds:`, item);

            // Tìm một variationOptionId từ variations nếu có
            let defaultVariationOptionId = null;
            if (productData.variations && productData.variations.length > 0) {
              const firstVariation = productData.variations[0];
              if (firstVariation.options && firstVariation.options.length > 0) {
                const selectedOption = firstVariation.options.find((opt: any) => opt.isSelected);
                if (selectedOption) {
                  defaultVariationOptionId = selectedOption.id;
                  console.log(`Using default variationOptionId for item #${index + 1}:`, defaultVariationOptionId);
                }
              }
            }

            // Gán variationOptionIds mặc định nếu tìm được
            item.variationOptionIds = defaultVariationOptionId ? [defaultVariationOptionId] : [];
          }

          // Create an entry in productItemImages for existing images
          if (item.imageUrl) {
            const itemKey = item.id || `temp-${index}`;
            setProductItemImages(prev => ({
              ...prev,
              [itemKey]: {
                preview: item.imageUrl,
                file: null,
                formattedSize: "Existing image"
              } as ProductImage
            }));
          }

          console.log(`Mapped product item #${index + 1}:`, {
            id: item.id,
            variationOptionIds: item.variationOptionIds
          });

          return {
            id: item.id || `temp-${index}`,
            variationOptionIds: item.variationOptionIds || [],
            quantityInStock: item.quantityInStock || 0,
            price: item.price || 0,
            marketPrice: item.marketPrice || 0,
            purchasePrice: item.purchasePrice || 0,
            imageUrl: item.imageUrl || ""
          };
        });

        setProductItems(items);
        console.log("Final mapped product items:", items);
      } else {
        // Initialize with an empty product item
        setProductItems([{
          variationOptionIds: [],
          price: parseFloat(productData.price?.toString() || '0') || 0,
          marketPrice: parseFloat(productData.marketPrice?.toString() || '0') || 0,
          purchasePrice: 0,
          quantityInStock: 0
        }]);
      }
    }
  }, [productData, loading]);

  const [availableVariations, setAvailableVariations] = useState<Variation[]>([]);

  // Now the useEffect that depends on availableVariations
  useEffect(() => {
    if (productData && !loading && availableVariations.length > 0) {
      // Extract variation data from product items
      if (productData.productItems && productData.productItems.length > 0) {
        // Get the first product item to extract variation info
        const firstItem = productData.productItems[0];

        if (firstItem.configurations && firstItem.configurations.length > 0) {
          // Extract variation info from the first configuration
          const config = firstItem.configurations[0];

          // Find the variation in available variations
          const matchingVariation = availableVariations.find(v => v.name === config.variationName);

          if (matchingVariation) {
            // Set up a single variation with the matching option
            setProductVariations([{
              id: matchingVariation.id,
              variationId: matchingVariation.id,
              variationOptionIds: [config.optionId]
            }]);
          }
        }

        // Set up product items
        const items = productData.productItems.map((item: any) => {
          // Create an entry in productItemImages for existing images
          if (item.imageUrl) {
            const itemKey = item.id || `temp-${productData.productItems.indexOf(item)}`;
            setProductItemImages(prev => ({
              ...prev,
              [itemKey]: {
                preview: item.imageUrl,
                file: null,
                formattedSize: "Existing image"
              } as ProductImage
            }));
          }

          // Extract variation option IDs from configurations
          const variationOptionIds = item.configurations ?
            item.configurations.map((config: any) => config.optionId) : [];

          return {
            id: item.id,
            variationOptionIds,
            quantityInStock: item.quantityInStock || 0,
            price: item.price || 0,
            marketPrice: item.marketPrice || 0,
            purchasePrice: item.purchasePrice || 0,
            imageUrl: item.imageUrl || ""
          };
        });

        setProductItems(items);
      }
    }
  }, [productData, loading, availableVariations]);

  const [thumbnail, setThumbnail] = useState<any>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [brandOptions, setBrandOptions] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [skinTypeOptions, setSkinTypeOptions] = useState<any[]>([]);
  const [variationOptions, setVariationOptions] = useState<VariationOption[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [productVariations, setProductVariations] = useState<any[]>([]);
  const [productItemImages, setProductItemImages] = useState<Record<string, ProductImage>>({});
  const [productItemErrors, setProductItemErrors] = useState<{ [key: number]: { [key: string]: string } }>({});
  const [variationErrors, setVariationErrors] = useState<{ [key: number]: { [key: string]: string } }>({});

  const handleThumbnailUpload = (files: File[]) => {
    if (files && files[0]) {
      const file = files[0];
      setThumbnail({
        file,
        preview: URL.createObjectURL(file),
        formattedSize: formatBytes(file.size),
      });
    }
  };

  const handleProductImagesUpload = (files: File[]) => {
    const newImages = files.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
      formattedSize: formatBytes(file.size),
    }));
    setProductImages([...productImages, ...newImages]);
  };

  const removeProductImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  // Add the processCategoriesForDropdown function after the formatBytes function
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Add this helper function to process categories for dropdown display
  const processCategoriesForDropdown = (categories: any[], level = 0): { value: string, label: string }[] => {
    let result: { value: string, label: string }[] = [];

    categories.forEach(category => {
      // Add the current category with proper indentation
      result.push({
        value: category.id,
        label: `${'\u00A0'.repeat(level * 4)}${level > 0 ? '└ ' : ''}${category.categoryName}`
      });

      // Process children recursively if they exist
      if (category.children && category.children.length > 0) {
        const childrenOptions = processCategoriesForDropdown(category.children, level + 1);
        result = [...result, ...childrenOptions];
      }
    });

    return result;
  };

  // Add this function to format file sizes
  const formatFileSize = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Modify the fetchOptions function to use processCategoriesForDropdown
  const fetchOptions = async () => {
    try {
      // Fetch brands
      const brandsResponse = await axios.get(`${API_BASE_URL}/api/brands?pageSize=100`);
      if (brandsResponse.data && brandsResponse.data.items) {
        setBrandOptions(
          brandsResponse.data.items.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }

      // Fetch skin types
      const skinTypesResponse = await axios.get(`${API_BASE_URL}/api/skin-types?pageSize=100`);
      if (skinTypesResponse.data && skinTypesResponse.data.items) {
        setSkinTypeOptions(
          skinTypesResponse.data.items.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }

      // Fetch categories - preserve hierarchy for nested categories
      const categoriesResponse = await axios.get(`${API_BASE_URL}/api/product-categories?pageSize=100`);
      if (categoriesResponse.data && categoriesResponse.data.items) {
        // Process categories to create a flat list with proper indentation for the dropdown
        const processedCategories = processCategoriesForDropdown(categoriesResponse.data.items);
        setCategoryOptions(processedCategories);
      }

      // Fetch variations
      const variationsResponse = await axios.get(`${API_BASE_URL}/api/variations?pageSize=100`);

      let variationsData = [];
      if (variationsResponse.data && variationsResponse.data.success && variationsResponse.data.data && variationsResponse.data.data.items) {
        variationsData = variationsResponse.data.data.items;
      } else if (variationsResponse.data && variationsResponse.data.items) {
        variationsData = variationsResponse.data.items;
      }

      // If variations don't have options, we might need to fetch them separately
      const variationsWithOptions = await Promise.all(variationsData.map(async (variation: any) => {
        // If variation already has options, use them
        if (variation.variationOptions && variation.variationOptions.length > 0) {
          return variation;
        }

        // Otherwise, try to fetch options separately (if your API supports this)
        try {
          const optionsResponse = await axios.get(`${API_BASE_URL}/api/variations/${variation.id}?pageSize=100`);

          if (optionsResponse.data && optionsResponse.data.variationOptions) {
            return {
              ...variation,
              variationOptions: optionsResponse.data.variationOptions
            };
          }
        } catch (error) {
          console.warn(`Could not fetch options for variation ${variation.id}:`, error);
        }

        // If we couldn't fetch options, return variation with empty options
        return {
          ...variation,
          variationOptions: []
        };
      }));

      setAvailableVariations(variationsWithOptions);

    } catch (error) {
      console.error("Error fetching options:", error);
      setErrorMessage("Failed to load form options. Please refresh the page.");
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Update the addProductItem function to use the selected variation option
  const addProductItem = () => {
    // Tìm tất cả các variationOptionIds đã được chọn từ variations
    const allSelectedOptionIds: string[] = [];
    variations.forEach(variation => {
      if (variation.variationOptionIds && variation.variationOptionIds.length > 0) {
        allSelectedOptionIds.push(...variation.variationOptionIds);
      }
    });

    console.log("Adding new product item with variationOptionIds:", allSelectedOptionIds);

    setProductItems([
      ...productItems,
      {
        variationOptionIds: allSelectedOptionIds,
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

  // Update the addVariation function to match the Variation interface
  const addVariation = () => {
    setVariations([
      ...variations,
      {
        id: "",
        name: "",
        variationOptions: [],
        variationOptionIds: [] // Add this required property
      }
    ]);
  };

  // Update the updateVariation function to properly handle variationOptionIds
  const updateVariation = (index: number, field: string, value: any) => {
    const newVariations = [...variations];

    if (field === 'id') {
      newVariations[index] = {
        ...newVariations[index],
        id: value,
        variationOptions: [],
        variationOptionIds: []
      };
    } else if (field === 'variationOptionIds') {
      newVariations[index] = {
        ...newVariations[index],
        variationOptionIds: value
      };

      // Cập nhật variationOptionIds cho tất cả product items khi thay đổi
      if (value && value.length > 0) {
        const updatedItems = productItems.map(item => ({
          ...item,
          variationOptionIds: value
        }));
        setProductItems(updatedItems);
        console.log("Updated all product items with new variationOptionIds:", value);
      }
    }

    setVariations(newVariations);
  }

  // Add this function to format price with spaces for thousands
  const formatPriceDisplay = (price: number | string): string => {
    if (!price) return '';
    // Convert to string, remove non-digits, then format with spaces
    return String(price).replace(/\D/g, '')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Update the handleProductItemImageUpload function
  const handleProductItemImageUpload = (index: number, acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const formattedSize = formatBytes(file.size);
      const preview = URL.createObjectURL(file);

      // Find the item ID or use a temporary ID
      const itemId = productItems[index]?.id || `temp-${index}`;

      // Update the productItemImages state
      setProductItemImages(prev => ({
        ...prev,
        [itemId]: {
          file,
          preview,
          formattedSize
        }
      }));

      // Update the product item with the file info
      const updatedItems = [...productItems];
      updatedItems[index] = {
        ...updatedItems[index],
        imageFile: file
      };
      setProductItems(updatedItems);
    }
  };

  // Update the removeProductItemImage function
  const removeProductItemImage = (index: number) => {
    // Create a copy of the current productItemImages
    const updatedImages = { ...productItemImages };

    // Get the item ID or use the index as fallback
    const itemId = productItems[index]?.id || `temp-${index}`;

    // If there's an image for this item, remove it
    if (updatedImages[itemId]) {
      // Revoke the object URL to prevent memory leaks
      if (updatedImages[itemId]?.preview) {
        URL.revokeObjectURL(updatedImages[itemId]!.preview);
      }
      // Delete the image entry
      delete updatedImages[itemId];
      setProductItemImages(updatedImages);
    }

    // Also clear the imageUrl and imageFile from the product item
    const updatedItems = [...productItems];
    updatedItems[index] = {
      ...updatedItems[index],
      imageUrl: "",
      imageFile: undefined
    };
    setProductItems(updatedItems);
  };

  // Update the validateProductItem function to validate variationOptionIds
  const validateProductItem = (item: any, index: number) => {
    const errors: { [key: string]: string } = {};

    // Validate variationOptionIds - thêm kiểm tra này
    if (!item.variationOptionIds || item.variationOptionIds.length === 0) {
      errors.variationOptionIds = "Vui lòng chọn biến thể cho sản phẩm";
    }

    // Validate quantity
    if (item.quantityInStock === undefined || item.quantityInStock === null) {
      errors.quantityInStock = "Vui lòng nhập số lượng";
    } else if (item.quantityInStock < 0) {
      errors.quantityInStock = "Số lượng không thể là số âm";
    }

    // Validate price
    if (item.price === undefined || item.price === null || item.price === 0) {
      errors.price = "Vui lòng nhập giá";
    } else if (item.price < 0) {
      errors.price = "Giá không thể là số âm";
    }

    // Validate market price
    if (item.marketPrice === undefined || item.marketPrice === null || item.marketPrice === 0) {
      errors.marketPrice = "Vui lòng nhập giá thị trường";
    } else if (item.marketPrice < 0) {
      errors.marketPrice = "Giá thị trường không thể là số âm";
    }

    // Validate purchase price
    if (item.purchasePrice === undefined || item.purchasePrice === null || item.purchasePrice === 0) {
      errors.purchasePrice = "Vui lòng nhập giá nhập";
    } else if (item.purchasePrice < 0) {
      errors.purchasePrice = "Giá nhập không thể là số âm";
    }

    // Validate image
    const itemId = item.id || `temp-${index}`;
    const hasImage =
      item.imageUrl ||
      (productItemImages[itemId] && productItemImages[itemId]?.file) ||
      (productItemImages[itemId] && productItemImages[itemId]?.preview) ||
      item.imageFile;

    if (!hasImage) {
      errors.image = "Vui lòng tải lên hình ảnh sản phẩm";
    }

    return errors;
  };

  // Add an effect to update product items when variations change
  useEffect(() => {
    // Get all selected variation options from the variations
    const allSelectedVariationOptions: string[] = [];
    variations.forEach(variation => {
      if (variation.variationOptions && variation.variationOptions.length > 0) {
        // Extract the IDs from the variationOptions objects
        const optionIds = variation.variationOptions.map(option => option.id);
        allSelectedVariationOptions.push(...optionIds);
      }
    });

    // Update all product items to use the selected variation options
    if (productItems.length > 0 && allSelectedVariationOptions.length > 0) {
      const updatedItems = productItems.map(item => ({
        ...item,
        variationOptionIds: allSelectedVariationOptions
      }));

      setProductItems(updatedItems);

      // Validate all updated items
      const newErrors: { [key: number]: { [key: string]: string } } = {};
      updatedItems.forEach((item, index) => {
        const errors = validateProductItem(item, index);
        if (Object.keys(errors).length > 0) {
          newErrors[index] = errors;
        }
      });

      setProductItemErrors(newErrors);
    }
  }, [variations]);

  // Thêm useEffect mới để đảm bảo productItems luôn có variationOptionIds đúng
  useEffect(() => {
    // Chỉ thực hiện khi đã có dữ liệu productItems và variations
    if (productItems.length > 0 && variations.length > 0) {
      console.log("Running effect to ensure productItems have correct variationOptionIds");

      // Tìm tất cả các variationOptionIds đã được chọn từ variations
      const allSelectedOptionIds: string[] = [];
      variations.forEach(variation => {
        if (variation.variationOptionIds && variation.variationOptionIds.length > 0) {
          allSelectedOptionIds.push(...variation.variationOptionIds);
        }
      });

      console.log("All selected variation option IDs:", allSelectedOptionIds);

      // Nếu có variationOptionIds đã chọn, đảm bảo tất cả productItems đều có các IDs này
      if (allSelectedOptionIds.length > 0) {
        const updatedItems = productItems.map(item => {
          // Nếu item chưa có variationOptionIds hoặc rỗng, gán các IDs đã chọn
          if (!item.variationOptionIds || item.variationOptionIds.length === 0) {
            return {
              ...item,
              variationOptionIds: [...allSelectedOptionIds]
            };
          }
          return item;
        });

        // Chỉ cập nhật state nếu có thay đổi
        const hasChanges = updatedItems.some((item, index) => {
          const originalItem = productItems[index];
          if (!originalItem.variationOptionIds || !item.variationOptionIds) return true;
          if (originalItem.variationOptionIds.length !== item.variationOptionIds.length) return true;
          return !originalItem.variationOptionIds.every(id => item.variationOptionIds.includes(id));
        });

        if (hasChanges) {
          console.log("Updating productItems with correct variationOptionIds:", updatedItems);
          setProductItems(updatedItems);
        }
      }
    }
  }, [productItems, variations]);

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
      tags: ''
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .required("Vui lòng nhập tên sản phẩm"),
      brand: Yup.string().required("Vui lòng chọn thương hiệu"),
      category: Yup.string().required("Vui lòng chọn danh mục"),
      price: Yup.number()
        .typeError("Giá phải là số")
        .required("Vui lòng nhập giá")
        .min(0, "Giá không thể là số âm"),
      marketPrice: Yup.number()
        .typeError("Giá thị trường phải là số")
        .required("Vui lòng nhập giá thị trường")
        .min(0, "Giá thị trường không thể là số âm"),
      description: Yup.string().required("Vui lòng nhập mô tả sản phẩm"),
      detailedIngredients: Yup.string().required("Vui lòng nhập thành phần chi tiết"),
      mainFunction: Yup.string()
        .required("Vui lòng nhập chức năng chính"),
      texture: Yup.string()
        .required("Vui lòng nhập kết cấu"),
      englishName: Yup.string(),
      keyActiveIngredients: Yup.string()
        .required("Vui lòng nhập thành phần hoạt chất chính"),
      storageInstruction: Yup.string().required("Vui lòng nhập hướng dẫn bảo quản"),
      usageInstruction: Yup.string().required("Vui lòng nhập hướng dẫn sử dụng"),
      expiryDate: Yup.string()
        .required("Vui lòng nhập hạn sử dụng"),
      skinIssues: Yup.string()
        .required("Vui lòng nhập vấn đề về da"),
      status: Yup.string().required("Vui lòng chọn trạng thái"),
      visibility: Yup.string().required("Vui lòng chọn hiển thị"),
    }),
    onSubmit: async (values: any) => {
      try {
        // Validate all product items
        let hasProductItemErrors = false;
        const allProductItemErrors: { [key: number]: { [key: string]: string } } = {};

        if (productItems.length === 0) {
          setErrorMessage("At least one product item is required");
          return;
        }

        productItems.forEach((item, index) => {
          const errors = validateProductItem(item, index);
          if (Object.keys(errors).length > 0) {
            hasProductItemErrors = true;
            allProductItemErrors[index] = errors;
          }
        });

        if (hasProductItemErrors) {
          setProductItemErrors(allProductItemErrors);
          setErrorMessage("Please fix all errors in product items");
          return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        // Call the handleUpdateProduct function to handle the update
        await handleUpdateProduct();
      } catch (error: any) {
        console.error("Error submitting form:", error);
        setErrorMessage(error.message || "An error occurred while submitting the form");
        setIsSubmitting(false);
      }
    }
  });



  // Update the form title and button text based on whether this is an edit or create
  const formTitle = productId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới";
  const submitButtonText = productId ? "Cập nhật sản phẩm" : "Thêm sản phẩm";

  // Add this function to show error alerts
  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    // Optionally scroll to the error message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add this function to check if the form has any validation errors
  const hasFormErrors = () => {
    // Check formik errors
    const formikErrors = Object.keys(productFormik.errors).length > 0;

    // Check if any fields are touched and have errors
    const touchedErrors = Object.entries(productFormik.touched).some(
      ([key, isTouched]) => isTouched && key in productFormik.errors
    );

    // Check product item errors
    const itemErrors = Object.values(productItemErrors).some(
      errors => Object.keys(errors).length > 0
    );

    // Check if there are no product items
    const noItems = productItems.length === 0;

    return formikErrors || touchedErrors || itemErrors || noItems;
  };

  // Add this function to handle removing variations
  const removeVariation = (index: number) => {
    const newVariations = [...variations];
    newVariations.splice(index, 1);
    setVariations(newVariations);
  };

  // Add this function to generate product items from variations
  const generateProductItems = () => {
    if (variations.length === 0 || variations.some(v => !v.id || v.variationOptionIds.length === 0)) {
      toast.error("Vui lòng chọn đầy đủ biến thể và tùy chọn trước khi tạo sản phẩm");
      return;
    }

    // Generate all possible combinations of variation options
    let combinations: string[][] = [[]];

    variations.forEach(variation => {
      const newCombinations: string[][] = [];
      variation.variationOptionIds.forEach(optionId => {
        combinations.forEach(combo => {
          newCombinations.push([...combo, optionId]);
        });
      });
      combinations = newCombinations;
    });

    // Create product items from combinations
    const newProductItems = combinations.map(combo => ({
      variationOptionIds: combo,
      price: parseFloat(productFormik.values.price.toString()) || 0,
      marketPrice: parseFloat(productFormik.values.marketPrice?.toString() || '0') || 0,
      purchasePrice: 0,
      quantityInStock: 0
    }));

    setProductItems(newProductItems);
  };

  // Add this function to log API requests and responses for debugging
  const logApiRequest = (method: string, url: string, data: any): void => {
    console.log(`API ${method} Request to ${url}:`, data);
  };

  // Add this function to handle API errors with better logging
  const handleApiError = (error: any, action: string): void => {
    console.error(`Error ${action}:`, error);

    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request made but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  };

  // Update the handleUpdateProduct function to fix the 400 Bad Request error
  const handleUpdateProduct = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      console.log("Starting product update with productItems:", productItems);

      // Kiểm tra variationOptionIds trong productItems
      const itemsWithEmptyVariationOptions = productItems.filter(item =>
        !item.variationOptionIds || item.variationOptionIds.length === 0
      );

      if (itemsWithEmptyVariationOptions.length > 0) {
        console.error("Found items with empty variationOptionIds:", itemsWithEmptyVariationOptions);
        setErrorMessage("Vui lòng chọn biến thể cho tất cả các sản phẩm");
        setIsSubmitting(false);
        toast.error("Vui lòng chọn biến thể cho tất cả các sản phẩm", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      // Get Firebase backend instance
      const firebaseBackend = getFirebaseBackend();

      // Upload thumbnail if exists
      let thumbnailUrl = "";
      if (thumbnail?.file) {
        try {
          thumbnailUrl = await firebaseBackend.uploadFileWithDirectory(thumbnail.file, "SPSS/Product-Thumbnail");
        } catch (uploadError) {
          setErrorMessage("Failed to upload thumbnail. Please try again.");
          setIsSubmitting(false);
          return;
        }
      } else if (thumbnail?.preview) {
        // Use existing preview if available
        thumbnailUrl = thumbnail.preview;
      }

      // Upload product images if exist
      let productImageUrls: string[] = [];
      if (productImages.length > 0) {
        try {
          const imageFiles = productImages.map(image => image.file).filter(Boolean);
          const existingUrls = productImages
            .filter(image => !image.file && image.preview)
            .map(image => image.preview);

          // Upload new files
          if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(file =>
              firebaseBackend.uploadFileWithDirectory(file, "SPSS/Product-Images")
            );

            // Wait for all uploads to complete
            const uploadedUrls = await Promise.all(uploadPromises);
            productImageUrls = [...existingUrls, ...uploadedUrls];
          } else {
            productImageUrls = existingUrls;
          }
        } catch (uploadError) {
          setErrorMessage("Failed to upload product images. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      // Combine all image URLs - ensure thumbnail is first if it exists
      const allProductImageUrls = [];

      // Add thumbnail if exists
      if (thumbnailUrl) {
        allProductImageUrls.push(thumbnailUrl);
      }

      // Add all product images
      if (productImageUrls.length > 0) {
        allProductImageUrls.push(...productImageUrls);
      }

      // Upload product item images and prepare product items
      const processedProductItems = await Promise.all(productItems.map(async (item, index) => {
        let imageUrl = item.imageUrl || "";

        // Get the item ID or use a temporary ID
        const itemKey = item.id || `temp-${index}`;

        // If there's an image file for this item, upload it
        if (productItemImages[itemKey]?.file) {
          try {
            imageUrl = await firebaseBackend.uploadFileWithDirectory(
              productItemImages[itemKey]!.file,
              "SPSS/Product-Item-Images"
            );
          } catch (uploadError) {
            throw new Error(`Failed to upload image for product item #${index + 1}`);
          }
        }

        // Đảm bảo variationOptionIds không rỗng
        const safeVariationOptionIds = item.variationOptionIds && item.variationOptionIds.length > 0
          ? item.variationOptionIds
          : [];

        // Nếu không có variationOptionIds và có variations, thì lấy ID của option đầu tiên từ variation đầu tiên
        if (safeVariationOptionIds.length === 0 && variations.length > 0) {
          // Tìm variation đầu tiên có options
          const variationWithOptions = variations.find(v => v.variationOptionIds && v.variationOptionIds.length > 0);

          if (variationWithOptions && variationWithOptions.variationOptionIds.length > 0) {
            console.log(`Adding default variationOptionId to item #${index + 1}:`, variationWithOptions.variationOptionIds[0]);
            safeVariationOptionIds.push(variationWithOptions.variationOptionIds[0]);
          } else {
            console.error(`Cannot find any variation options for item #${index + 1}`);
          }
        }

        console.log(`Processed product item #${index + 1}:`, {
          id: item.id,
          variationOptionIds: safeVariationOptionIds,
          imageUrl: imageUrl
        });

        // Ensure all numeric values are properly formatted
        return {
          id: item.id || undefined, // Only include ID if it exists
          variationOptionIds: safeVariationOptionIds,
          imageUrl: imageUrl,
          price: Number(String(item.price).replace(/\s/g, '')),
          marketPrice: Number(String(item.marketPrice).replace(/\s/g, '')),
          purchasePrice: Number(String(item.purchasePrice).replace(/\s/g, '')),
          quantityInStock: Number(String(item.quantityInStock))
        };
      }));

      // Prepare variations data with selected options
      const variationsData = variations.map(v => {
        // Get all available options for this variation
        const allOptions = availableVariations.find(av => av.id === v.id)?.variationOptions || [];

        console.log(`Processing variation ${v.id} with options:`, allOptions);
        console.log(`Selected option IDs for variation ${v.id}:`, v.variationOptionIds);

        // Map options with isSelected flag
        const options = allOptions.map(opt => ({
          id: opt.id,
          value: opt.value,
          isSelected: v.variationOptionIds.includes(opt.id)
        }));

        console.log(`Mapped options for variation ${v.id}:`, options);

        return {
          id: v.id,
          name: availableVariations.find(av => av.id === v.id)?.name || '',
          options: options
        };
      });

      // Get values from formik
      const values = productFormik.values;

      // Prepare data for API submission
      const productData = {
        id: productId,
        name: values.title, // Đảm bảo title không rỗng
        description: values.description, // Đảm bảo description không rỗng
        price: Number(String(values.price).replace(/\s/g, '')),
        marketPrice: Number(String(values.marketPrice).replace(/\s/g, '')),
        status: values.status,
        brandId: values.brand,
        productCategoryId: values.category,
        productImageUrls: allProductImageUrls,
        skinTypeIds: values.skinType || [],
        variations: variationsData.map(variation => ({
          id: variation.id,
          name: variation.name,
          options: variation.options.map(option => ({
            id: option.id,
            value: option.value,
            isSelected: option.isSelected
          }))
        })),
        productItems: processedProductItems.map(item => ({
          id: item.id,
          variationOptionIds: item.variationOptionIds,
          price: item.price,
          marketPrice: item.marketPrice,
          purchasePrice: item.purchasePrice,
          quantityInStock: item.quantityInStock,
          imageUrl: item.imageUrl
        })),
        specifications: {
          detailedIngredients: values.detailedIngredients || "",
          mainFunction: values.mainFunction || "",
          texture: values.texture || "",
          englishName: values.englishName === "" ? null : values.englishName || "",
          keyActiveIngredients: values.keyActiveIngredients || "",
          storageInstruction: values.storageInstruction || "",
          usageInstruction: values.usageInstruction || "",
          expiryDate: values.expiryDate || "",
          skinIssues: values.skinIssues || ""
        }
      };

      // Kiểm tra lại một lần nữa trước khi gửi
      const hasEmptyVariationOptionIds = productData.productItems.some(item =>
        !item.variationOptionIds || item.variationOptionIds.length === 0
      );

      if (hasEmptyVariationOptionIds) {
        console.error("Still found items with empty variationOptionIds after processing:",
          productData.productItems.filter(item => !item.variationOptionIds || item.variationOptionIds.length === 0)
        );
        setErrorMessage("Vui lòng chọn biến thể cho tất cả các sản phẩm");
        setIsSubmitting(false);
        toast.error("Vui lòng chọn biến thể cho tất cả các sản phẩm", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      // Log request data before sending
      console.log("Product data before sending:", productData);

      // Kiểm tra các trường bắt buộc
      if (!productData.name) {
        setErrorMessage("Tên sản phẩm không được để trống");
        setIsSubmitting(false);
        toast.error("Tên sản phẩm không được để trống", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      if (!productData.description) {
        setErrorMessage("Mô tả sản phẩm không được để trống");
        setIsSubmitting(false);
        toast.error("Mô tả sản phẩm không được để trống", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      // Kiểm tra các trường bắt buộc khác
      if (!productData.brandId) {
        setErrorMessage("Vui lòng chọn thương hiệu");
        setIsSubmitting(false);
        toast.error("Vui lòng chọn thương hiệu", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      if (!productData.productCategoryId) {
        setErrorMessage("Vui lòng chọn danh mục sản phẩm");
        setIsSubmitting(false);
        toast.error("Vui lòng chọn danh mục sản phẩm", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      if (productData.productImageUrls.length === 0) {
        setErrorMessage("Vui lòng tải lên ít nhất một hình ảnh sản phẩm");
        setIsSubmitting(false);
        toast.error("Vui lòng tải lên ít nhất một hình ảnh sản phẩm", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      // Kiểm tra productItems
      if (productData.productItems.length === 0) {
        setErrorMessage("Vui lòng thêm ít nhất một sản phẩm con");
        setIsSubmitting(false);
        toast.error("Vui lòng thêm ít nhất một sản phẩm con", {
          position: "top-right",
          autoClose: 5000
        });
        return;
      }

      // Log the request for debugging
      logApiRequest('PUT', `/api/products/${productId}`, productData);

      // Make API call to update the product
      try {
        // Đảm bảo mỗi productItem có ít nhất một variationOptionId
        const finalProductData = {
          ...productData,
          productItems: productData.productItems.map(item => {
            // Nếu không có variationOptionIds hoặc rỗng, thử tìm một giá trị mặc định
            if (!item.variationOptionIds || item.variationOptionIds.length === 0) {
              // Tìm trong variations
              let defaultOptionId = null;
              if (productData.variations && productData.variations.length > 0) {
                const firstVariation = productData.variations[0];
                if (firstVariation.options && firstVariation.options.length > 0) {
                  const selectedOption = firstVariation.options.find(opt => opt.isSelected);
                  if (selectedOption) {
                    defaultOptionId = selectedOption.id;
                  } else {
                    defaultOptionId = firstVariation.options[0].id;
                  }
                }
              }

              return {
                ...item,
                variationOptionIds: defaultOptionId ? [defaultOptionId] : []
              };
            }
            return item;
          })
        };

        // Kiểm tra lại một lần nữa
        const stillHasEmptyOptions = finalProductData.productItems.some(
          item => !item.variationOptionIds || item.variationOptionIds.length === 0
        );

        if (stillHasEmptyOptions) {
          console.error("CRITICAL: Still have empty variationOptionIds after final processing");
          setErrorMessage("Không thể tìm biến thể mặc định cho sản phẩm");
          setIsSubmitting(false);
          toast.error("Không thể tìm biến thể mặc định cho sản phẩm", {
            position: "top-right",
            autoClose: 5000
          });
          return;
        }

        console.log("Final request data:", finalProductData);

        const response = await axios.put(
          `${API_BASE_URL}/api/products/${productId}`,
          finalProductData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JSON.parse(sessionStorage.getItem('authUser') || '{}').accessToken}`
            }
          }
        );

        console.log("Update response:", response);

        // Show success toast notification
        toast.success("Sản phẩm đã được cập nhật thành công!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        // Wait for toast to be visible before redirecting
        setTimeout(() => {
          navigate('/apps-ecommerce-product-list');
        }, 2000);
      } catch (error: any) {
        // Log detailed error information
        handleApiError(error, 'updating product');

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx

          const errorMessage = error.response.data?.message ||
            error.response.data?.errors?.join(", ") ||
            "Không thể cập nhật sản phẩm. Vui lòng thử lại.";
          setErrorMessage(errorMessage);

          // Show error toast
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else if (error.request) {
          // The request was made but no response was received
          const noResponseMsg = "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.";
          setErrorMessage(noResponseMsg);

          // Show error toast
          toast.error(noResponseMsg, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          const setupErrorMsg = error.message || "Lỗi không xác định khi cập nhật sản phẩm.";
          setErrorMessage(setupErrorMsg);

          // Show error toast
          toast.error(setupErrorMsg, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      }
    } catch (error: any) {
      handleApiError(error, 'processing update');
      setErrorMessage(error.message || "Đã xảy ra lỗi khi xử lý yêu cầu");

      // Show error toast
      toast.error(error.message || "Đã xảy ra lỗi khi xử lý yêu cầu", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replace window.location.href with navigate
  const handleBackToList = () => {
    try {
      // Use navigate with replace option to avoid history stack issues
      navigate('/apps-ecommerce-product-list', { replace: true });
    } catch (error) {
      // Fallback to direct navigation if there's an error
      navigate('/apps-ecommerce-product-list');
    }
  };

  // Also update the success handler
  const handleUpdateSuccess = () => {
    toast.success("Sản phẩm đã được cập nhật thành công!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    // Wait for toast to be visible before redirecting
    setTimeout(() => {
      // Use navigate with replace option
      navigate('/apps-ecommerce-product-list', { replace: true });
    }, 2000);
  };



  return (
    <React.Fragment>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <BreadCrumb title={formTitle} pageTitle='Sản phẩm' />

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline"> {error}</span>
          {error.includes("không có quyền") || error.includes("đăng nhập lại") ? (
            <div className="flex gap-2 mt-3">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  sessionStorage.removeItem('authUser');
                  window.location.href = '/login';
                }}
              >
                Đăng nhập lại
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => window.location.reload()}
              >
                Tải lại trang
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => navigate('/apps-ecommerce-product-list')}
              >
                Quay lại danh sách
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-5">
          <div className="xl:col-span-12">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-4 text-15">Chỉnh sửa sản phẩm</h6>

                {successMessage && (
                  <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
                    {successMessage}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateProduct();
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12 mb-5">
                    {/* Product Image Section - Multiple Images */}
                    <div className="xl:col-span-12">
                      <label className="inline-block mb-2 text-base font-medium">
                        Hình ảnh sản phẩm
                      </label>

                      {/* Display uploaded images */}
                      {productImages.length > 0 && (
                        <div className="mb-4 grid grid-cols-5 gap-4">
                          {productImages.map((img, idx) => (
                            <div key={idx} className="relative h-32 w-32 border rounded-md overflow-hidden">
                              <img
                                src={img.preview}
                                alt={`Product Image ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeProductImage(idx)}
                                className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 size-5 flex items-center justify-center"
                              >
                                ×
                              </button>
                              <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                {img.formattedSize}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload dropzone */}
                      <Dropzone
                        onDrop={(acceptedFiles) => handleProductImagesUpload(acceptedFiles)}
                        accept={{
                          "image/*": [".png", ".jpg", ".jpeg"],
                        }}
                        maxFiles={5}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div
                            className="border-2 border-dashed rounded-lg border-slate-200 dark:border-zink-500"
                            {...getRootProps()}
                          >
                            <input {...getInputProps()} />
                            <div className="p-4 text-center">
                              <UploadCloud className="size-6 mx-auto mb-3" />
                              <h5 className="mb-1">
                                Đặt hình ảnh vào đây hoặc nhấp để tải lên.
                              </h5>
                              <p className="text-slate-500 dark:text-zink-200">
                                Kích thước tối đa: 2MB
                              </p>
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
                        Tên sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className={`form-input w-full ${productFormik.touched.title && productFormik.errors.title ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Nhập tên sản phẩm"
                        value={productFormik.values.title}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.title && productFormik.errors.title && (
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.title)}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="description" className="inline-block mb-2 text-base font-medium">
                        Mô Tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200 w-full p-2 min-h-[150px]"
                        value={productFormik.values.description}
                        onChange={productFormik.handleChange}
                        onBlur={productFormik.handleBlur}
                      />
                      {productFormik.touched.description && productFormik.errors.description && (
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.description)}</p>
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
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.brand)}</p>
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
                        styles={{
                          option: (provided, state) => ({
                            ...provided,
                            fontWeight: state.data.label.includes('└') ? 'normal' : 'bold',
                            paddingLeft: state.data.label.startsWith(' ') ? '20px' : provided.paddingLeft,
                          }),
                        }}
                      />
                      {productFormik.touched.category && productFormik.errors.category && (
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.category)}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="price" className="inline-block mb-2 text-base font-medium">
                        Price (VND) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="price"
                          name="price"
                          className={`form-input w-full ${productFormik.touched.price && productFormik.errors.price ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="0"
                          value={formatPrice(productFormik.values.price.toString())}
                          onChange={(e) => handlePriceChange(e, 'price')}
                          onBlur={productFormik.handleBlur}
                        />
                      </div>
                      {productFormik.touched.price && productFormik.errors.price && (
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.price)}</p>
                      )}
                    </div>

                    <div className="xl:col-span-6">
                      <label htmlFor="marketPrice" className="inline-block mb-2 text-base font-medium">
                        Market Price (VND) <span className="text-red-500">*</span>
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
                        <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.marketPrice)}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12">
                      <div className="xl:col-span-12">
                        <label htmlFor="skinType" className="inline-block mb-2 text-base font-medium">
                          Skin Type
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
                          placeholder="Select skin types..."
                          value={skinTypeOptions.filter(option =>
                            productFormik.values.skinType.includes(option.value)
                          )}
                          onChange={(selectedOptions) => {
                            const selectedIds = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
                            productFormik.setFieldValue('skinType', selectedIds);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variations Section */}
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
                              onChange={(option) => {
                                console.log("Selected variation type:", option);
                                updateVariation(index, 'id', option?.value || "");
                              }}
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
                                console.log("Selected variation options:", selectedIds);
                                updateVariation(index, 'variationOptionIds', selectedIds);

                                // Cập nhật variationOptionIds cho tất cả product items
                                if (selectedIds.length > 0) {
                                  const updatedItems = productItems.map(item => ({
                                    ...item,
                                    variationOptionIds: selectedIds
                                  }));
                                  setProductItems(updatedItems);
                                  console.log("Updated all product items with new variationOptionIds:", selectedIds);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Product Items Section */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium">Sản Phẩm</h4>
                      <button
                        type="button"
                        onClick={addProductItem}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-white transition-all duration-200 ease-linear rounded-md bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-200"
                      >
                        <Plus className="size-4" />
                        Thêm Sản Phẩm
                      </button>
                    </div>

                    {productItems.length === 0 ? (
                      <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
                        Vui lòng thêm ít nhất một sản phẩm.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productItems.map((item, index) => (
                          <div key={index} className="p-4 mb-4 border rounded-lg bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                              <h6 className="text-base font-medium">Sản phẩm #{index + 1}</h6>
                              <div className="flex items-center">
                                {/* Debug info - chỉ hiển thị trong development */}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="text-xs text-gray-500 mr-2">
                                    {item.variationOptionIds && item.variationOptionIds.length > 0
                                      ? `VariationOptionIds: ${item.variationOptionIds.join(', ')}`
                                      : 'No variationOptionIds'}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeProductItem(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {/* Show only one field per variation option */}
                              {item.variationOptionIds.map((optionId, optIndex) => {
                                const variationInfo = availableVariations.find(v => v.variationOptions?.some(opt => opt.id === optionId));
                                const option = variationInfo?.variationOptions?.find(opt => opt.id === optionId);
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

                              {/* Hiển thị cảnh báo nếu không có variationOptionIds */}
                              {(!item.variationOptionIds || item.variationOptionIds.length === 0) && (
                                <div className="col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                  <strong className="font-bold">Cảnh báo!</strong>
                                  <span className="block sm:inline"> Sản phẩm này chưa có biến thể. Vui lòng chọn biến thể ở phần trên.</span>
                                </div>
                              )}

                              {/* Các trường số: giá bán, giá thị trường, giá nhập, số lượng */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="inline-block mb-2 text-sm font-medium">
                                    Giá thị trường (VND) <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={formatPriceDisplay(item.marketPrice?.toString() || '')}
                                    onChange={e => {
                                      const raw = e.target.value.replace(/\s/g, '');
                                      if (/^\d*$/.test(raw)) {
                                        const num = parseInt(raw) || 0;
                                        if (num >= 0) {
                                          updateProductItem(index, 'marketPrice', num);
                                        }
                                      }
                                    }}
                                    placeholder="Nhập giá thị trường"
                                    className={`form-input w-full ${productItemErrors[index]?.marketPrice ? 'border-red-500' : 'border-slate-200'}`}
                                  />
                                  {item.marketPrice < 0 && <p className="mt-1 text-sm text-red-500">Giá thị trường không được âm</p>}
                                  {productItemErrors[index]?.marketPrice && (
                                    <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.marketPrice}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="inline-block mb-2 text-sm font-medium">
                                    Số lượng <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={item.quantityInStock?.toString() || ''}
                                    onChange={e => {
                                      const raw = e.target.value.replace(/\s/g, '');
                                      if (/^\d*$/.test(raw)) {
                                        const num = parseInt(raw) || 0;
                                        if (num >= 0) {
                                          updateProductItem(index, 'quantityInStock', num);
                                        }
                                      }
                                    }}
                                    placeholder="Nhập số lượng"
                                    className={`form-input w-full ${productItemErrors[index]?.quantityInStock ? 'border-red-500' : 'border-slate-200'}`}
                                  />
                                  {item.quantityInStock < 0 && <p className="mt-1 text-sm text-red-500">Số lượng không được âm</p>}
                                  {productItemErrors[index]?.quantityInStock && (
                                    <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.quantityInStock}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="inline-block mb-2 text-sm font-medium">
                                    Giá bán (VND) <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={formatPriceDisplay(item.price?.toString() || '')}
                                    onChange={e => {
                                      const raw = e.target.value.replace(/\s/g, '');
                                      if (/^\d*$/.test(raw)) {
                                        const num = parseInt(raw) || 0;
                                        if (num >= 0) {
                                          updateProductItem(index, 'price', num);
                                        }
                                      }
                                    }}
                                    placeholder="Nhập giá bán"
                                    className={`form-input w-full ${productItemErrors[index]?.price ? 'border-red-500' : 'border-slate-200'}`}
                                  />
                                  {item.price < 0 && <p className="mt-1 text-sm text-red-500">Giá bán không được âm</p>}
                                  {productItemErrors[index]?.price && (
                                    <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.price}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="inline-block mb-2 text-sm font-medium">
                                    Giá nhập (VND) <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={formatPriceDisplay(item.purchasePrice?.toString() || '')}
                                    onChange={e => {
                                      const raw = e.target.value.replace(/\s/g, '');
                                      if (/^\d*$/.test(raw)) {
                                        const num = parseInt(raw) || 0;
                                        if (num >= 0) {
                                          updateProductItem(index, 'purchasePrice', num);
                                        }
                                      }
                                    }}
                                    placeholder="Nhập giá nhập"
                                    className={`form-input w-full ${productItemErrors[index]?.purchasePrice ? 'border-red-500' : 'border-slate-200'}`}
                                  />
                                  {item.purchasePrice < 0 && <p className="mt-1 text-sm text-red-500">Giá nhập không được âm</p>}
                                  {productItemErrors[index]?.purchasePrice && (
                                    <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.purchasePrice}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="lg:col-span-3">
                              <label className="inline-block mb-2 text-sm font-medium">
                                Hình ảnh sản phẩm <span className="text-red-500">*</span>
                              </label>
                              <Dropzone
                                onDrop={(acceptedFiles) => handleProductItemImageUpload(index, acceptedFiles)}
                                maxFiles={1}
                                accept={{
                                  "image/*": [".png", ".jpg", ".jpeg", ".webp"],
                                }}
                              >
                                {({ getRootProps, getInputProps }) => (
                                  <div
                                    className={`border-2 border-dashed rounded-lg ${productItemErrors[index]?.image
                                      ? 'border-red-500'
                                      : 'border-slate-200 dark:border-zink-500'
                                      }`}
                                    {...getRootProps()}
                                  >
                                    <input {...getInputProps()} />
                                    <div className="p-4 text-center">
                                      {/* Check for image in multiple places */}
                                      {productItemImages[item.id || `temp-${index}`]?.preview ? (
                                        <div className="relative">
                                          <img
                                            src={productItemImages[item.id || `temp-${index}`]?.preview}
                                            alt={`Product Item ${index + 1}`}
                                            className="h-32 mx-auto object-contain"
                                          />
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeProductItemImage(index);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 size-5 flex items-center justify-center"
                                          >
                                            ×
                                          </button>
                                          <p className="mt-2 text-sm text-slate-500">
                                            {productItemImages[item.id || `temp-${index}`]?.formattedSize || "Hình ảnh đã tải lên"}
                                          </p>
                                        </div>
                                      ) : item.imageUrl ? (
                                        <div className="relative">
                                          <img
                                            src={item.imageUrl}
                                            alt={`Product Item ${index + 1}`}
                                            className="h-32 mx-auto object-contain"
                                          />
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeProductItemImage(index);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 size-5 flex items-center justify-center"
                                          >
                                            ×
                                          </button>
                                          <p className="mt-2 text-sm text-slate-500">Hình ảnh hiện tại</p>
                                        </div>
                                      ) : (
                                        <>
                                          <UploadCloud className="size-6 mx-auto mb-3" />
                                          <h5 className="mb-1">
                                            Kéo thả hình ảnh vào đây hoặc nhấp để tải lên.
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
                              {productItemErrors[index]?.image && (
                                <p className="mt-1 text-sm text-red-500">{productItemErrors[index]?.image}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Specifications */}
                  <div className="mt-8">
                    <h6 className="mb-4 text-15 font-medium">Product Specifications</h6>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12">
                      <div className="xl:col-span-6">
                        <label htmlFor="detailedIngredients" className="inline-block mb-2 text-base font-medium">
                          Thành Phần Chi Tiết <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="detailedIngredients"
                          className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200 w-full p-2 min-h-[150px]"
                          value={productFormik.values.detailedIngredients}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.detailedIngredients && productFormik.errors.detailedIngredients && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.detailedIngredients)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="mainFunction" className="inline-block mb-2 text-base font-medium">
                          Chức năng chính <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="mainFunction"
                          name="mainFunction"
                          className={`form-input w-full ${productFormik.touched.mainFunction && productFormik.errors.mainFunction ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập chức năng chính"
                          value={productFormik.values.mainFunction}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.mainFunction && productFormik.errors.mainFunction && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.mainFunction)}</p>
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
                          className={`form-input w-full ${productFormik.touched.texture && productFormik.errors.texture ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập kết cấu sản phẩm"
                          value={productFormik.values.texture}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.texture && productFormik.errors.texture && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.texture)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="englishName" className="inline-block mb-2 text-base font-medium">
                          Tên tiếng Anh <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="englishName"
                          name="englishName"
                          className={`form-input w-full ${productFormik.touched.englishName && productFormik.errors.englishName ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập tên tiếng Anh"
                          value={productFormik.values.englishName}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.englishName && productFormik.errors.englishName && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.englishName)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="keyActiveIngredients" className="inline-block mb-2 text-base font-medium">
                          Key Active Ingredients <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="keyActiveIngredients"
                          name="keyActiveIngredients"
                          className={`form-input w-full ${productFormik.touched.keyActiveIngredients && productFormik.errors.keyActiveIngredients ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập thành phần hoạt chất chính"
                          value={productFormik.values.keyActiveIngredients}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.keyActiveIngredients && productFormik.errors.keyActiveIngredients && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.keyActiveIngredients)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="storageInstruction" className="inline-block mb-2 text-base font-medium">
                          Hướng Dẫn Lưu Trữ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="storageInstruction"
                          className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200 w-full p-2 min-h-[150px]"
                          value={productFormik.values.storageInstruction}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.storageInstruction && productFormik.errors.storageInstruction && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.storageInstruction)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="usageInstruction" className="inline-block mb-2 text-base font-medium">
                          Hướng Dẫn Sử Dụng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="usageInstruction"
                          className="form-input border-slate-200 dark:border-zink-500 focus:outline-none focus:border-custom-500 disabled:bg-slate-100 dark:disabled:bg-zink-600 disabled:border-slate-300 dark:disabled:border-zink-500 dark:disabled:text-zink-200 disabled:text-slate-500 dark:text-zink-100 dark:bg-zink-700 dark:focus:border-custom-800 placeholder:text-slate-400 dark:placeholder:text-zink-200 w-full p-2 min-h-[150px]"
                          value={productFormik.values.usageInstruction}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.usageInstruction && productFormik.errors.usageInstruction && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.usageInstruction)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="expiryDate" className="inline-block mb-2 text-base font-medium">
                          Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          className={`form-input w-full ${productFormik.touched.expiryDate && productFormik.errors.expiryDate ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập hạn sử dụng (ví dụ: 12/2025)"
                          value={productFormik.values.expiryDate}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.expiryDate && productFormik.errors.expiryDate && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.expiryDate)}</p>
                        )}
                      </div>

                      <div className="xl:col-span-6">
                        <label htmlFor="skinIssues" className="inline-block mb-2 text-base font-medium">
                          Vấn đề về da <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="skinIssues"
                          name="skinIssues"
                          className={`form-input w-full ${productFormik.touched.skinIssues && productFormik.errors.skinIssues ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Nhập vấn đề về da mà sản phẩm này giải quyết"
                          value={productFormik.values.skinIssues}
                          onChange={productFormik.handleChange}
                          onBlur={productFormik.handleBlur}
                        />
                        {productFormik.touched.skinIssues && productFormik.errors.skinIssues && (
                          <p className="mt-1 text-sm text-red-500">{String(productFormik.errors.skinIssues)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 gap-4">
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
                    >
                      Hủy
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateProduct()}
                      disabled={isSubmitting}
                      className={`text-white btn ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-custom-500 hover:text-white hover:bg-custom-600 focus:text-white focus:bg-custom-600'
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 animate-spin">
                            <i className="mdi mdi-loading"></i>
                          </span>
                          Đang cập nhật...
                        </>
                      ) : (
                        "Cập nhật sản phẩm"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}