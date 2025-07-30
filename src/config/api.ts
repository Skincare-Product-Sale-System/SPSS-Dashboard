// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:5041/api",
  // Uncomment the line below and comment the line above when deploying to production
  // BASE_URL: "https://spssapi-hxfzbchrcafgd2hg.southeastasia-01.azurewebsites.net/api",
};
// Helper function to get full endpoint URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default API_CONFIG; 