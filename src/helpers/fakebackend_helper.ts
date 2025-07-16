import apiHelper from "./api_helper";
import axios from "axios";
import * as url from "./url_helper";

// Create a custom APIClient class to replace the removed one
class APIClient {
  get = (url: string, params?: any) => {
    return axios.get(url, { params });
  };

  create = (url: string, data: any) => {
    return axios.post(url, data);
  };

  update = (url: string, data: any) => {
    return axios.patch(url, data);
  };

  put = (url: string, data: any) => {
    return axios.put(url, data);
  };

  delete = (url: string, config?: any) => {
    return axios.delete(url, config);
  };
}

const api = new APIClient();
// Gets the logged in user data from local session

// Gets the logged in user data from local session
export const getLoggedUser = () => {
  const user = localStorage.getItem("user");
  if (user) return JSON.parse(user);
  return null;
};

// is user is logged in
export const isUserAuthenticated = () => {
  return getLoggedUser() !== null;
};

// Register Method
export const postFakeRegister = (data: any) => api.create(url.POST_FAKE_REGISTER, data);

// Login Method
export const postFakeLogin = (data: any) => api.create(url.POST_FAKE_JWT_LOGIN, data);

// postForgetPwd
export const postFakeForgetPwd = (data: any) => api.create(url.POST_FAKE_PASSWORD_FORGET, data);

// Edit profile
export const postJwtProfile = (data: any) => api.create(url.POST_EDIT_JWT_PROFILE, data);

export const postFakeProfile = (data: any) => api.create(url.POST_EDIT_PROFILE, data);
// export const postFakeProfile = (data: any) => api.update(url.POST_EDIT_PROFILE + '/' + data.idx, data);

// Register Method
export const postJwtRegister = (url: any, data: any) => {
  return api.create(url, data)
    .catch((err: any) => {
      var message;
      if (err.response && err.response.status) {
        switch (err.response.status) {
          case 404:
            message = "Sorry! the page you are looking for could not be found";
            break;
          case 500:
            message = "Sorry! something went wrong, please contact our support team";
            break;
          case 401:
            message = "Invalid credentials";
            break;
          default:
            message = err[1];
            break;
        }
      }
      throw message;
    });
};
// Login Method
export const postJwtLogin = (data: any) => api.create(url.POST_FAKE_JWT_LOGIN, data);

// postForgetPwd
export const postJwtForgetPwd = (data: any) => api.create(url.POST_FAKE_JWT_PASSWORD_FORGET, data);

// postSocialLogin
export const postSocialLogin = (data: any) => api.create(url.SOCIAL_LOGIN, data);

// Chat
export const getChat = (roomId: any) => api.get(`${url.GET_CHAT}/${roomId}`, { params: { roomId } });
export const addChat = (data: any) => api.create(url.ADD_CHAT, data);
export const deleteChat = (data: any) => api.delete(url.DELETE_CHAT, { headers: { data } });
export const bookmarkChat = (data: any) => api.delete(url.BOOKMARK_CHAT, { headers: { data } });

// Mailbox
export const getMail = () => api.get(url.GET_MAIL, null);
export const deleteMail = (data: any) => api.delete(url.DELETE_MAIL, { headers: { data } });
export const unreadMail = (data: any) => api.delete(url.UNREAD_MAIL, { headers: { data } });
export const staredMail = (data: any) => api.delete(url.STARED_MAIL, { headers: { data } });
export const trashMail = (data: any) => api.delete(url.TRASH_MAIL, { headers: { data } });

// Calendar
export const getEvents = () => api.get(url.GET_EVENT, null);
export const addEvents = (data: any) => api.create(url.ADD_EVENT, data);
export const updateEvents = (data: any) => api.update(url.UPDATE_EVENT, data);
export const deleteEvents = (data: any) => api.delete(url.DELETE_EVENT, { headers: { data } });

// Category
export const getAllCategories = (params: { Page: number; PageSize: number }) =>
  api.get(url.GET_ALL_CATEGORIES, params);

export const createCategory = (data: any) =>
  api.create(url.CREATE_CATEGORY, data);

export const updateCategory = (id: string, data: any) =>
  api.update(`${url.UPDATE_CATEGORY}/${id}`, data);

export const deleteCategory = (id: string) =>
  api.delete(`${url.DELETE_CATEGORY}/${id}`, { headers: { data: id } });

// User

// Promotion
export const getAllPromotions = (params: { Page: number; PageSize: number }) =>
  api.get(url.GET_ALL_PROMOTIONS, params);

export const createPromotion = (data: any) =>
  api.create(url.CREATE_PROMOTION, data);

export const updatePromotion = (id: string, data: any) =>
  api.update(`${url.UPDATE_PROMOTION}/${id}`, data);

export const deletePromotion = (id: string) =>
  api.delete(`${url.DELETE_PROMOTION}/${id}`, { headers: { data: id } });

// Variation
export const getAllVariations = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_VARIATIONS, params);

export const createVariation = (data: any) =>
  api.create(url.CREATE_VARIATION, data);

export const updateVariation = (id: string, data: any) =>
  api.update(`${url.UPDATE_VARIATION}/${id}`, data);

export const deleteVariation = (id: string) =>
  api.delete(`${url.DELETE_VARIATION}/${id}`, { headers: { data: id } });

// Variation Option
export const getAllVariationOptions = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_VARIATION_OPTION, params);
export const createVariationOption = (data: any) =>
  api.create(url.CREATE_VARIATION_OPTION, data);
export const updateVariationOption = (id: string, data: any) =>
  api.update(`${url.UPDATE_VARIATION_OPTION}/${id}`, data);
export const deleteVariationOption = (id: string) =>
  api.delete(`${url.DELETE_VARIATION_OPTION}/${id}`, { headers: { data: id } });

// Product Status
export const getAllProductStatus = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_PRODUCT_STATUS, params);

export const createProductStatus = (data: any) =>
  api.create(url.CREATE_PRODUCT_STATUS, data);

export const updateProductStatus = (id: string, data: any) =>
  api.update(`${url.UPDATE_PRODUCT_STATUS}/${id}`, data);

export const deleteProductStatus = (id: string) =>
  api.delete(`${url.DELETE_PRODUCT_STATUES}/${id}`, { headers: { data: id } });
// Product Category
export const getAllProductCategories = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_PRODUCT_CATEGORIES, params);

export const createProductCategory = (data: any) =>
  api.create(url.CREATE_PRODUCT_CATEGORIES, data);

export const updateProductCategory = (id: string, data: any) =>
  api.update(`${url.UPDATE_PRODUCT_CATEGORIES}/${id}`, data);

export const deleteProductCategory = (id: string) =>
  api.delete(`${url.DELETE_PRODUCT_CATEGORIES}/${id}`, { headers: { data: id } });
// Blog
export const getAllBlogs = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_BLOGS, params);

export const createBlog = (data: any) =>
  api.create(url.CREATE_BLOG, data);

export const updateBlog = (id: string, data: any) =>
  api.update(`${url.UPDATE_BLOG}/${id}`, data);

export const deleteBlog = (id: string) =>
  api.delete(`${url.DELETE_BLOG}/${id}`, { headers: { data: id } });

export const getBlogById = (id: string) => api.get(`${url.GET_BLOG_BY_ID}/${id}`, null)

// Migrate to FireBase
export const migrateToFireBase = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  return api.create(url.MIGRATE_TO_FIRE_BASE, formData);
};

// Payment Method
export const getAllPaymentMethods = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_PAYMENT_METHODS, params);

export const createPaymentMethod = (data: any) =>
  api.create(url.CREATE_PAYMENT_METHOD, data);

export const updatePaymentMethod = (id: string, data: any) =>
  api.update(`${url.UPDATE_PAYMENT_METHOD}/${id}`, data);

export const deletePaymentMethod = (id: string) =>
  api.delete(`${url.DELETE_PAYMENT_METHOD}/${id}`, { headers: { data: id } });

// Skin Type
export const getAllSkinTypes = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_SKIN_TYPES, params);

export const createSkinType = (data: any) =>
  api.create(url.CREATE_SKIN_TYPE, data);

export const updateSkinType = (id: string, data: any) =>
  api.update(`${url.UPDATE_SKIN_TYPE}/${id}`, data);

export const deleteSkinType = (id: string) =>
  api.delete(`${url.DELETE_SKIN_TYPE}/${id}`, { headers: { data: id } });

// Cancel Reason
export const getAllCancelReasons = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_CANCEL_REASONS, params);

export const createCancelReason = (data: any) =>
  api.create(url.CREATE_CANCEL_REASON, data);

export const updateCancelReason = (id: string, data: any) =>
  api.update(`${url.UPDATE_CANCEL_REASON}/${id}`, data);

export const deleteCancelReason = (id: string) =>
  api.delete(`${url.DELETE_CANCEL_REASON}/${id}`, { headers: { data: id } });



// Product
export const getAllProducts = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_PRODUCTS, params);

export const createProduct = (data: any) =>
  api.create(url.CREATE_PRODUCT, data);

export const updateProduct = (id: string, data: any) =>
  api.update(`${url.UPDATE_PRODUCT}/${id}`, data);

export const deleteProduct = (id: string) =>
  api.delete(`${url.DELETE_PRODUCT}/${id}`, { headers: { data: id } });

// reply
export const createReply = (data: any) =>
  api.create(url.CREATE_REPLY, data);

export const updateReply = (id: string, data: any) =>
  api.update(`${url.UPDATE_REPLY}/${id}`, data);

export const deleteReply = (id: string) =>
  api.delete(`${url.DELETE_REPLY}/${id}`, { headers: { data: id } });

// Country
export const getAllCountries = () =>
  api.get(url.GET_ALL_COUNTRIES, null);

// Brand
export const getAllBrands = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_BRANDS, params);

export const createBrand = (data: any) =>
  api.create(url.CREATE_BRAND, data);

export const updateBrand = (id: string, data: any) =>
  api.update(`${url.UPDATE_BRAND}/${id}`, data);

export const deleteBrand = (id: string) =>
  api.delete(`${url.DELETE_BRAND}/${id}`, { headers: { data: id } });

// Voucher
export const getAllVouchers = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_VOUCHERS, params);

export const createVoucher = (data: any) =>
  api.create(url.CREATE_VOUCHER, data);

export const updateVoucher = (id: string, data: any) =>
  api.update(`${url.UPDATE_VOUCHER}/${id}`, data);

export const deleteVoucher = (id: string) =>
  api.delete(`${url.DELETE_VOUCHER}/${id}`);

// Users
// List View
export const getAllUsers = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_USERS, params);
export const createUser = (data: any) => api.create(url.CREATE_USER, data);
export const updateUser = (id: string, data: any) => api.update(`${url.UPDATE_USER}/${id}`, data);
export const deleteUser = (id: string) => api.delete(`${url.DELETE_USER}/${id}`, { headers: { data: id } });

// Role
export const getAllRoles = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_ROLES, params);

export const createRole = (data: any) =>
  api.create(url.CREATE_ROLE, data);

export const updateRole = (id: string, data: any) =>
  api.update(`${url.UPDATE_ROLE}/${id}`, data);

export const deleteRole = (id: string) =>
  api.delete(`${url.DELETE_ROLE}/${id}`);

// Orders
export const getAllOrders = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_ORDERS, params);

export const createOrder = (data: any) =>
  api.create(url.CREATE_ORDERS, data);

export const updateOrder = (id: string, data: any) =>
  api.update(`${url.UPDATE_ORDERS}/${id}`, data);

export const deleteOrder = (id: string) =>
  api.delete(`${url.DELETE_ORDERS}/${id}`, { headers: { data: id } });

export const getOrderById = (id: string) =>
  api.get(`${url.GET_ORDER_BY_ID}/${id}`, null);

export const changeOrderStatus = (id: string, newStatus: string) =>
  api.update(`${url.CHANGE_ORDER_STATUS}/${id}/status?newStatus=${newStatus}`, null);

// Quiz Set
export const getAllQuizSets = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_QUIZ_SETS, params);

export const createQuizSets = (data: any) =>
  api.create(url.CREATE_QUIZ_SETS, data);

export const updateQuizSets = (id: string, data: any) =>
  api.update(`${url.UPDATE_QUIZ_SETS}/${id}`, data);

export const deleteQuizSets = (id: string) =>
  api.delete(`${url.DELETE_QUIZ_SETS}/${id}`, { headers: { data: id } });

export const setQuizSetAsDefault = (id: string) =>
  api.update(`${url.SET_QUIZ_SETS_DEFAULT}/set-default/${id}`, { isDefault: true });

// Quiz Questions
export const getAllQuizQuestions = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_QUIZ_QUESTIONS, params);

export const createQuizQuestion = (data: any) =>
  api.create(url.CREATE_QUIZ_QUESTIONS, data);

export const updateQuizQuestion = (id: string, data: any) =>
  api.update(`${url.UPDATE_QUIZ_QUESTIONS}/${id}`, data);

export const deleteQuizQuestion = (id: string) =>
  api.delete(`${url.DELETE_QUIZ_QUESTIONS}/${id}`, { headers: { data: id } });

export const getQuizQuestionByQuizSetId = (id: string) =>
  api.get(`${url.GET_QUIZ_QUESTION_BY_QUIZ_SET_ID}/by-quiz-set/${id}`);

// New APIs for quiz questions by quiz set ID
export const createQuizQuestionByQuizSetId = (setId: string, data: any) =>
  api.create(`${url.CREATE_QUIZ_QUESTION_BY_QUIZ_SET_ID}/by-quiz-set/${setId}`, data);

export const updateQuizQuestionByQuizSetId = (setId: string, questionId: string, data: any) =>
  api.update(`${url.UPDATE_QUIZ_QUESTION_BY_QUIZ_SET_ID}/by-quiz-set/${setId}/${questionId}`, data);

export const deleteQuizQuestionByQuizSetId = (setId: string, questionId: string) =>
  api.delete(`${url.DELETE_QUIZ_QUESTION_BY_QUIZ_SET_ID}/by-quiz-set/${setId}/${questionId}`);

// Quiz Options
export const getAllQuizOptions = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_QUIZ_OPTIONS, params);

export const createQuizOption = (data: any) =>
  api.create(url.CREATE_QUIZ_OPTIONS, data);

export const updateQuizOption = (id: string, data: any) =>
  api.update(`${url.UPDATE_QUIZ_OPTIONS}/${id}`, data);

export const deleteQuizOption = (id: string) =>
  api.delete(`${url.DELETE_QUIZ_OPTIONS}/${id}`, { headers: { data: id } });

export const getQuizOptionByQuizQuestionId = (id: string) =>
  api.get(`${url.GET_QUIZ_OPTION_BY_QUIZ_QUESTION_ID}/by-quiz-question/${id}`);

// New APIs for quiz options by question ID
export const createQuizOptionByQuestionId = (questionId: string, data: any) =>
  api.create(`${url.CREATE_QUIZ_OPTION_BY_QUIZ_QUESTION_ID}/by-quiz-question/${questionId}`, data);

export const updateQuizOptionByQuestionId = (questionId: string, optionId: string, data: any) =>
  api.update(`${url.UPDATE_QUIZ_OPTION_BY_QUIZ_QUESTION_ID}/by-quiz-question/${questionId}/${optionId}`, data);

export const deleteQuizOptionByQuestionId = (questionId: string, optionId: string) =>
  api.delete(`${url.DELETE_QUIZ_OPTION_BY_QUIZ_QUESTION_ID}/by-quiz-question/${questionId}/${optionId}`, { headers: { data: optionId } });



// Sellers
export const getSellers = () => api.get(url.GET_SELLERS, null);
export const addSellers = (data: any) => api.create(url.ADD_SELLERS, data);
export const updateSellers = (data: any) => api.update(url.UPDATE_SELLERS, data);
export const deleteSellers = (data: any) => api.delete(url.DELETE_SELLERS, { headers: { data } });

// Review
export const getAllReviews = (params: { pageNumber: number; pageSize: number }) =>
  api.get(url.GET_ALL_REVIEWS, params);

export const createReview = (data: any) =>
  api.create(url.ADD_REVIEW, data);

export const updateReview = (id: string, data: any) =>
  api.update(`${url.UPDATE_REVIEW}/${id}`, data);

export const deleteReview = (id: string) =>
  api.delete(`${url.DELETE_REVIEW}/${id}`, { headers: { data: id } });

// Get Product by ID
export const getProductById = (id: string) =>
  api.get(`${url.GET_PRODUCT_BY_ID}/${id}`, null);

