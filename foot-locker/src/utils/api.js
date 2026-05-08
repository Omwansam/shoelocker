import axios, { CanceledError } from 'axios';
import { mergeCatalogList } from './catalogStorage.js';
import API_CONFIG from '../config/api.js';

/** @param {AbortSignal | undefined} signal */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new CanceledError('Request aborted'));
      return;
    }
    const onAbort = () => {
      clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
      reject(new CanceledError('Request aborted'));
    };
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(undefined);
    }, ms);
    signal?.addEventListener('abort', onAbort);
  });
}

/**
 * Transform backend product format to frontend format
 * @param {any} product Backend product object
 * @returns {any} Frontend product object
 */
function transformBackendProduct(product) {
  return {
    id: product.product_slug || `prod-${product.product_id}`,
    product_id: product.product_id,
    name: product.product_name,
    brand: product.brand || '',
    category: product.storefront_category || 'men',
    price: product.product_price,
    isNew: product.is_new || false,
    sizes: product.sizes || [],
    description: product.product_description,
    image: product.image || (product.primary_image ? product.primary_image : ''),
    hoverImage: product.hover_image || '',
    gallery: product.gallery || (product.all_images ? product.all_images.map(img => img.image_url) : []),
    primary_image: product.primary_image,
    all_images: product.all_images || product.images || [],
    stock_quantity: product.stock_quantity || 0,
    category_id: product.category_id,
  };
}

/** Real backend API client */
export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Fallback mock adapter for when backend is unavailable */
async function mockApiAdapter(config) {
  const delayMs =
    typeof config.customDelayMs === 'number' ? config.customDelayMs : 420;
  await sleep(delayMs, config.signal);

  if (
    config.url === '/products' &&
    (!config.method || config.method.toLowerCase() === 'get')
  ) {
    const list = mergeCatalogList();
    /** @type {axios.AxiosResponse} */
    const response = {
      data: list,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {} /* mock */,
    };
    return response;
  }

  throw new axios.AxiosError('Not found', null, config);
}

/**
 * @param {{ signal?: AbortSignal; delayMs?: number }} [opts]
 * @returns {Promise<any[]>}
 */
export async function fetchProducts(opts = {}) {
  try {
    if (API_CONFIG.useMockAPI) {
      // Use mock API
      const mockConfig = {
        url: '/products',
        method: 'get',
        customDelayMs: opts.delayMs,
        signal: opts.signal,
      };
      const response = await mockApiAdapter(mockConfig);
      return response.data;
    }

    // Try real backend first
    const res = await api.get('/api/product', {
      params: {
        page: 1,
        per_page: 1000,
      },
      signal: opts.signal,
    });

    // Transform backend response
    if (res.data && res.data.products) {
      return res.data.products.map(transformBackendProduct);
    }
    return res.data || [];
  } catch (error) {
    console.warn('Backend API failed, falling back to mock data:', error.message);
    // Fallback to mock if backend fails
    return mergeCatalogList();
  }
}

/**
 * Get best-selling products
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any[]>}
 */
export async function fetchBestSellers(opts = {}) {
  try {
    const res = await api.get('/api/bestsellers', {
      signal: opts.signal,
    });
    return (res.data || []).map(transformBackendProduct);
  } catch (error) {
    console.warn('Failed to fetch bestsellers:', error.message);
    return [];
  }
}

/**
 * Get recent products
 * @param {{ limit?: number; signal?: AbortSignal }} [opts]
 * @returns {Promise<any[]>}
 */
export async function fetchRecentProducts(opts = {}) {
  try {
    const res = await api.get('/api/recent', {
      params: {
        limit: opts.limit || 8,
      },
      signal: opts.signal,
    });
    return (res.data || []).map(transformBackendProduct);
  } catch (error) {
    console.warn('Failed to fetch recent products:', error.message);
    return [];
  }
}

/**
 * Get single product by ID
 * @param {string|number} productId
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function fetchProductById(productId, opts = {}) {
  try {
    const res = await api.get(`/api/product/${productId}`, {
      signal: opts.signal,
    });
    return transformBackendProduct(res.data);
  } catch (error) {
    console.warn(`Failed to fetch product ${productId}:`, error.message);
    return null;
  }
}

/**
 * Get related products
 * @param {string|number} productId
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any[]>}
 */
export async function fetchRelatedProducts(productId, opts = {}) {
  try {
    const res = await api.get(`/api/related-products/${productId}`, {
      signal: opts.signal,
    });
    if (res.data && res.data.related_products) {
      return res.data.related_products.map(transformBackendProduct);
    }
    return [];
  } catch (error) {
    console.warn(`Failed to fetch related products for ${productId}:`, error.message);
    return [];
  }
}

/**
 * Create a new product (admin)
 * @param {FormData} formData
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function createProduct(formData, opts = {}) {
  try {
    const res = await api.post('/api/product', formData, {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
}

/**
 * Update product (admin)
 * @param {number} productId
 * @param {any} data
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function updateProduct(productId, data, opts = {}) {
  try {
    const res = await api.put(`/api/product/${productId}`, data, {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
}

/**
 * Delete product (admin)
 * @param {number} productId
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function deleteProduct(productId, opts = {}) {
  try {
    const res = await api.delete(`/api/product/${productId}`, {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
}

/**
 * Upload product image (admin)
 * @param {number} productId
 * @param {File} imageFile
 * @param {boolean} isPrimary
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function uploadProductImage(productId, imageFile, isPrimary = false, opts = {}) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('is_primary', isPrimary ? 'true' : 'false');

    const res = await api.post(`/productimages/product/${productId}`, formData, {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to upload product image:', error);
    throw error;
  }
}
