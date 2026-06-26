/**
 * API Configuration for the Shoe Locker application
 * Configure the backend API base URL here
 * Uses import.meta.env for Vite environment variables
 */

// Development configuration
const API_CONFIG_DEV = {
  baseURL: 'http://localhost:5000',
  timeout: 10000,
};

// Production configuration  
const API_CONFIG_PROD = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.danzykicks.com',
  timeout: 10000,
};

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
const API_CONFIG = isDevelopment ? API_CONFIG_DEV : API_CONFIG_PROD;

export default API_CONFIG;
