import axios, { CanceledError } from 'axios';
import { mergeCatalogList } from './catalogStorage.js';
import API_CONFIG from '../config/api.js';
import { clearAuthStorage } from './authApi.js';

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
    productType: product.product_type || 'shoes',
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
});

// Request interceptor: Add JWT token to authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle token expiration on protected routes only
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicRead =
        url.includes('/api/product') ||
        url.includes('/api/bestsellers') ||
        url.includes('/api/recent') ||
        url.includes('/api/related-products') ||
        url.includes('/categories');
      if (!isPublicRead) {
        clearAuthStorage();
      }
    }
    return Promise.reject(error);
  },
);

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
      const mockConfig = {
        url: '/products',
        method: 'get',
        customDelayMs: opts.delayMs,
        signal: opts.signal,
      };
      const response = await mockApiAdapter(mockConfig);
      return response.data;
    }

    const params = {
      page: opts.page || 1,
      per_page: opts.perPage || 1000,
    };
    if (opts.productType) params.product_type = opts.productType;
    if (opts.storefrontCategory) params.storefront_category = opts.storefrontCategory;
    if (opts.search) params.search = opts.search;

    const res = await api.get('/api/product', {
      params,
      signal: opts.signal,
    });

    if (res.data && res.data.products) {
      return res.data.products.map(transformBackendProduct);
    }
    return res.data || [];
  } catch (error) {
    if (opts.throwOnError) throw error;
    console.warn('Backend API failed, falling back to mock data:', error.message);
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
 * Gemini vision: suggest product fields from a photo (admin)
 * @param {File} imageFile
 * @param {{ hint?: string, signal?: AbortSignal }} [opts]
 */
export async function fetchProductAiSuggest(imageFile, opts = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (opts.hint) formData.append('hint', opts.hint);
  const res = await api.post('/api/admin/products/ai-suggest', formData, {
    signal: opts.signal,
  });
  return res.data;
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

/**
 * Fetch comprehensive admin dashboard overview
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function fetchAdminDashboardOverview(opts = {}) {
  try {
    const res = await api.get('/dashboard/admin/overview', {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch admin dashboard overview:', error);
    throw error;
  }
}

/**
 * Fetch admin orders list with filtering and search
 * @param {any} params
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function fetchAdminOrders(params = {}, opts = {}) {
  try {
    const res = await api.get('/orders/admin/all', {
      params,
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch admin orders:', error);
    throw error;
  }
}

/**
 * Update order status (admin)
 * @param {number|string} orderId
 * @param {string} status
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function updateAdminOrderStatus(orderId, status, opts = {}) {
  try {
    const res = await api.put(`/orders/admin/${orderId}/status`, { status }, {
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error(`Failed to update order status for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Fetch CRM admin customers
 * @param {any} params
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function fetchAdminCustomers(params = {}, opts = {}) {
  try {
    const res = await api.get('/customers/admin/customers', {
      params,
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch admin customers:', error);
    throw error;
  }
}

/**
 * Fetch admin analytics data
 * @param {any} params
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function fetchAdminAnalytics(params = {}, opts = {}) {
  try {
    const res = await api.get('/analytics/admin/dashboard', {
      params,
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch admin analytics:', error);
    throw error;
  }
}

/**
 * Export admin CSV report
 * @param {string} type - 'sales', 'inventory', 'customers'
 * @param {number} days
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<any>}
 */
export async function exportAdminReport(type = 'sales', days = 30, opts = {}) {
  try {
    const res = await api.get('/reports/admin/reports/export', {
      params: { type, format: 'csv', days },
      signal: opts.signal,
    });
    return res.data;
  } catch (error) {
    console.error(`Failed to export admin report of type ${type}:`, error);
    throw error;
  }
}

/** @param {number} days @param {{ signal?: AbortSignal }} [opts] */
export async function fetchReportsDashboard(days = 30, opts = {}) {
  const res = await api.get('/reports/admin/reports/dashboard', { params: { days }, signal: opts.signal });
  return res.data;
}

/** @param {number} days @param {{ signal?: AbortSignal }} [opts] */
export async function fetchSalesReport(days = 30, opts = {}) {
  const res = await api.get('/reports/admin/reports/sales', { params: { days }, signal: opts.signal });
  return res.data;
}

/** @param {number} days @param {{ signal?: AbortSignal }} [opts] */
export async function fetchInventoryReport(days = 30, opts = {}) {
  const res = await api.get('/reports/admin/reports/inventory', { params: { days }, signal: opts.signal });
  return res.data;
}

/** @param {number} days @param {{ signal?: AbortSignal }} [opts] */
export async function fetchCustomerReport(days = 30, opts = {}) {
  const res = await api.get('/reports/admin/reports/customers', { params: { days }, signal: opts.signal });
  return res.data;
}

/** @param {number} days @param {{ signal?: AbortSignal }} [opts] */
export async function fetchFinancialReport(days = 30, opts = {}) {
  const res = await api.get('/reports/admin/reports/financial', { params: { days }, signal: opts.signal });
  return res.data;
}

/**
 * Fetch single admin order detail
 * @param {number|string} orderId
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function fetchAdminOrderById(orderId, opts = {}) {
  const res = await api.get(`/orders/admin/${orderId}`, { signal: opts.signal });
  return res.data;
}

/**
 * Fetch current user's orders
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function fetchMyOrders(opts = {}) {
  const res = await api.get('/orders/me', { signal: opts.signal });
  return res.data?.orders || [];
}

/**
 * Place checkout order
 * @param {{ shipping_address: string, payment_method?: string, coupon_code?: string }} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function checkoutOrder(payload, opts = {}) {
  const res = await api.post('/orders/checkout', payload, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchCart(opts = {}) {
  const res = await api.get('/cart', { signal: opts.signal });
  return res.data;
}

/**
 * @param {{ product_id: number, quantity?: number, size?: string, image_url?: string }} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function addCartItem(payload, opts = {}) {
  const res = await api.post('/cart/items', payload, { signal: opts.signal });
  return res.data;
}

/** @param {number} itemId @param {number} quantity @param {{ signal?: AbortSignal }} [opts] */
export async function updateCartItem(itemId, quantity, opts = {}) {
  const res = await api.put(`/cart/items/${itemId}`, { quantity }, { signal: opts.signal });
  return res.data;
}

/** @param {number} itemId @param {{ signal?: AbortSignal }} [opts] */
export async function removeCartItem(itemId, opts = {}) {
  const res = await api.delete(`/cart/items/${itemId}`, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function clearServerCart(opts = {}) {
  try {
    const res = await api.delete('/cart', { signal: opts.signal });
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) return { message: 'No cart' };
    throw error;
  }
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchWishlist(opts = {}) {
  const res = await api.get('/wishlist', { signal: opts.signal });
  return (res.data?.items || []).map((p) =>
    transformBackendProduct({
      ...p,
      product_slug: p.product_slug || `prod-${p.product_id}`,
      image: p.image_url,
    }),
  );
}

/** @param {number} productId @param {{ signal?: AbortSignal }} [opts] */
export async function addWishlistItem(productId, opts = {}) {
  const res = await api.post('/wishlist', { product_id: productId }, { signal: opts.signal });
  return res.data;
}

/** @param {number} productId @param {{ signal?: AbortSignal }} [opts] */
export async function removeWishlistItem(productId, opts = {}) {
  const res = await api.delete(`/wishlist/${productId}`, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchOrderStats(days = 30, opts = {}) {
  const res = await api.get('/orders/admin/stats', { params: { days }, signal: opts.signal });
  return res.data;
}

/** Map server cart items to frontend line items */
export function mapServerCartItems(serverItems) {
  return (serverItems || []).map((item) => {
    const slug = item.product_slug || `prod-${item.product_id}`;
    const size = item.size || 'OS';
    return {
      lineId: `${slug}::${size}`,
      productId: slug,
      backendProductId: item.product_id,
      serverCartItemId: item.cart_item_id,
      size,
      qty: item.quantity,
      snapshot: {
        name: item.product_name,
        brand: item.brand || '',
        price: parseFloat(item.price) || 0,
        image: item.image_url || '',
      },
    };
  });
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function loadPersistedCart(opts = {}) {
  const data = await fetchCart(opts);
  return mapServerCartItems(data.items);
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchAdminCoupons(opts = {}) {
  const res = await api.get('/orders/coupons', { signal: opts.signal });
  return res.data?.coupons || [];
}

/**
 * @param {any} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function createCoupon(payload, opts = {}) {
  const res = await api.post('/orders/coupons', payload, { signal: opts.signal });
  return res.data;
}

/**
 * @param {number} couponId
 * @param {any} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function updateCoupon(couponId, payload, opts = {}) {
  const res = await api.put(`/orders/coupons/${couponId}`, payload, { signal: opts.signal });
  return res.data;
}

/** @param {number} couponId @param {{ signal?: AbortSignal }} [opts] */
export async function deleteCoupon(couponId, opts = {}) {
  const res = await api.delete(`/orders/coupons/${couponId}`, { signal: opts.signal });
  return res.data;
}

/** @param {string} code @param {{ signal?: AbortSignal }} [opts] */
export async function validateCoupon(code, opts = {}) {
  const res = await api.post('/orders/coupons/validate', { code }, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchAdminSettings(opts = {}) {
  const res = await api.get('/settings/admin/settings', { signal: opts.signal });
  return res.data;
}

/**
 * @param {Array<{ category: string, setting_key: string, value: any }>} updates
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function bulkUpdateSettings(updates, opts = {}) {
  const res = await api.put('/settings/admin/settings/bulk-update', { updates }, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchStoreSettings(opts = {}) {
  const res = await api.get('/settings/store', { signal: opts.signal });
  return res.data?.settings || {};
}

/** @param {string} [couponCode] @param {{ signal?: AbortSignal }} [opts] */
export async function previewCheckout(couponCode, opts = {}) {
  const res = await api.post(
    '/orders/checkout/preview',
    couponCode ? { coupon_code: couponCode } : {},
    { signal: opts.signal },
  );
  return res.data;
}

/** @param {number} orderId @param {{ signal?: AbortSignal }} [opts] */
export async function fetchMyOrder(orderId, opts = {}) {
  const res = await api.get(`/orders/me/${orderId}`, { signal: opts.signal });
  return res.data?.order;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchProfile(opts = {}) {
  const res = await api.get('/auth/me', { signal: opts.signal });
  return res.data?.user;
}

/**
 * @param {{ first_name?: string, last_name?: string, phone?: string, address?: string, password?: string }} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function updateProfile(payload, opts = {}) {
  const res = await api.put('/auth/me', payload, { signal: opts.signal });
  return res.data;
}

/** @param {{ signal?: AbortSignal }} [opts] */
export async function fetchSavedAddresses(opts = {}) {
  const res = await api.get('/shipping/get', { signal: opts.signal });
  return res.data?.shipping_infos || [];
}

/** @param {Record<string, unknown>} payload @param {{ signal?: AbortSignal }} [opts] */
export async function saveAddress(payload, opts = {}) {
  const res = await api.post('/shipping/save', payload, { signal: opts.signal });
  return res.data;
}

/** @param {number} addressId @param {{ signal?: AbortSignal }} [opts] */
export async function deleteAddress(addressId, opts = {}) {
  const res = await api.delete(`/shipping/delete/${addressId}`, { signal: opts.signal });
  return res.data;
}

/** @param {string} email @param {{ signal?: AbortSignal }} [opts] */
export async function subscribeNewsletter(email, opts = {}) {
  const res = await api.post('/newsletter/subscribe', { email }, { signal: opts.signal });
  return res.data;
}

/** @param {number} productId @param {{ signal?: AbortSignal }} [opts] */
export async function fetchProductReviews(productId, opts = {}) {
  const res = await api.get(`/reviews/product/${productId}`, { signal: opts.signal });
  return res.data;
}

/**
 * @param {number} productId
 * @param {{ rating: number, review_text: string }} payload
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function submitProductReview(productId, payload, opts = {}) {
  const res = await api.post(`/reviews/product/${productId}`, payload, { signal: opts.signal });
  return res.data;
}

/** @param {number} orderId @param {string} reason @param {{ signal?: AbortSignal }} [opts] */
export async function requestOrderReturn(orderId, reason, opts = {}) {
  const res = await api.post(`/orders/${orderId}/return`, { reason }, { signal: opts.signal });
  return res.data;
}
