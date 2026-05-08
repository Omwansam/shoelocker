import { useCallback, useState } from 'react';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchProducts,
  fetchProductById,
} from '../utils/api.js';

/**
 * Hook for admin product API operations
 */
export function useAdminProductAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateProduct = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createProduct(formData);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to create product';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateProduct = useCallback(async (productId, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateProduct(productId, data);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to update product';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteProduct = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await deleteProduct(productId);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to delete product';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUploadImage = useCallback(async (productId, imageFile, isPrimary = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await uploadProductImage(productId, imageFile, isPrimary);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to upload image';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetchProducts = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({ signal });
      return result;
    } catch (err) {
      const message = err.message || 'Failed to fetch products';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetchProductById = useCallback(async (productId, signal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProductById(productId, { signal });
      return result;
    } catch (err) {
      const message = err.message || 'Failed to fetch product';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createProduct: handleCreateProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    uploadImage: handleUploadImage,
    fetchProducts: handleFetchProducts,
    fetchProductById: handleFetchProductById,
  };
}
