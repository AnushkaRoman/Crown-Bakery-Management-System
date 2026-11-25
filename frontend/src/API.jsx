
import axios from "axios";

// Get backend API URL from Vercel environment variables
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Remove trailing slashes to prevent double slashes in API requests
const API = axios.create({
  baseURL: API_URL.replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically to protected API requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("crumbco-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle API response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default API;
