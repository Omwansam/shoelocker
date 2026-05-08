# Product Integration Setup Guide

## Overview
This guide explains how to set up and configure the seamless integration between the Shoe Locker frontend and backend for product management.

## Architecture Changes

### Backend (Flask)
- **Endpoints**: Located in `/api/products/*` routes
- **Response Format**: Includes all necessary fields (product_slug, brand, image, gallery, etc.)
- **Image Handling**: `/productimages/product/<id>` for image uploads
- **Features**: Best sellers, recent products, related products, full CRUD operations

### Frontend (React)
- **API Layer**: Centralized in `src/utils/api.js`
- **Configuration**: `src/config/api.js` for environment-specific settings
- **Hooks**: `src/hooks/useAdminProductAPI.js` for admin operations
- **Components**: ProductCard and ProductDetails work with backend data format

## Configuration

### Backend Setup (Flask)

1. **Ensure CORS is Enabled** (in `server/app.py`):
```python
from flask_cors import CORS
CORS(app)  # This is already configured
```

2. **Database Models** - Products table must have these fields:
```python
- product_slug (unique slug identifier)
- product_name
- brand
- storefront_category (men/women/kids)
- is_new (boolean)
- sizes (JSON array)
- product_description
- image (URL)
- hover_image (URL)
- gallery (JSON array of URLs)
- product_price (float)
- stock_quantity (integer)
- category_id (foreign key)
```

3. **ProductImage Model** - For storing product images:
```python
- image_id (primary key)
- product_id (foreign key)
- image_url (path)
- is_primary (boolean)
```

### Frontend Setup (React)

1. **API Configuration** (`src/config/api.js`):
```javascript
// For development (uses local backend)
const API_CONFIG_DEV = {
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  useMockAPI: false,
};

// For production (uses real backend)
const API_CONFIG_PROD = {
  baseURL: 'https://api.shoelocker.com',
  timeout: 10000,
  useMockAPI: false,
};
```

2. **Environment Variables** (`.env` file in `foot-locker/`):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_USE_MOCK_API=false
```

3. **Update for Production**:
- Change `VITE_API_BASE_URL` to your production backend URL
- Ensure proper HTTPS configuration

## API Endpoints

### GET Endpoints (Public)

1. **Get All Products**
```
GET /api/product?page=1&per_page=50&search=&sort_by=product_name&sort_order=asc
```
Response includes: pagination metadata and product array

2. **Get Best Sellers**
```
GET /api/bestsellers
```
Returns top 8 products by order count and rating

3. **Get Recent Products**
```
GET /api/recent?limit=8
GET /api/product/recent?limit=8
```
Returns newest products

4. **Get Single Product**
```
GET /api/product/<product_id>
```

5. **Get Related Products**
```
GET /api/related-products/<product_id>
```

### POST Endpoints (Admin Only - Requires JWT)

1. **Create Product**
```
POST /api/product
Content-Type: multipart/form-data

Fields:
- product_name (required)
- product_description (required)
- product_price (required)
- stock_quantity (required)
- category_id (required)
- brand
- storefront_category (men/women/kids)
- is_new (true/false)
- sizes (JSON array)
- image (URL)
- hover_image (URL)
- gallery (JSON array of URLs)
- images (multiple files for upload)
```

2. **Upload Product Image**
```
POST /productimages/product/<product_id>
Content-Type: multipart/form-data

Fields:
- image (file, required)
- is_primary (true/false)
```

### PUT Endpoints (Admin Only - Requires JWT)

1. **Update Product**
```
PUT /api/product/<product_id>
Content-Type: application/json or multipart/form-data

Fields: Same as create
```

### DELETE Endpoints (Admin Only - Requires JWT)

1. **Delete Product**
```
DELETE /api/product/<product_id>
```
Automatically deletes associated images

## Frontend Hooks

### useProducts
Fetches products from backend with fallback to mock data.
```javascript
const { products, loading, error, refetch } = useProducts();
```

### useAdminProductAPI
Admin operations for products.
```javascript
const {
  loading,
  error,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  fetchProducts,
  fetchProductById,
} = useAdminProductAPI();
```

## Data Transformation

The frontend transforms backend responses to match the component format:

**Backend → Frontend Mapping**:
```javascript
{
  product_id → product_id (keep)
  product_slug → id (used for routing)
  product_name → name
  brand → brand
  storefront_category → category
  is_new → isNew
  sizes → sizes
  product_description → description
  image → image
  hover_image → hoverImage
  gallery → gallery
  product_price → price
  stock_quantity → stock_quantity
  primary_image → primary_image
  all_images → all_images
}
```

## Admin Product Management

### AdminProducts Page (`src/pages/admin/AdminProducts.jsx`)
- Lists all products
- Filter by category and search
- View live and hidden products
- Access to edit/delete functions

### AdminProductForm (`src/pages/admin/AdminProductForm.jsx`)
- Create new products
- Edit existing products
- Upload product images
- Set product metadata

## Testing

### Mock API Mode
To temporarily use mock data without backend:
1. Set `useMockAPI: true` in `src/config/api.js`
2. Edit `src/data/products.js` for test data
3. Uses `src/utils/catalogStorage.js` for local storage

### Backend Testing
1. Start Flask backend: `python server/app.py`
2. Verify CORS headers: Check network tab for `Access-Control-Allow-Origin`
3. Test endpoints with Postman/curl
4. Check database for product records

### Frontend Testing
1. Check browser console for API errors
2. Network tab should show requests to `/api/product`
3. Verify response includes all required fields
4. Test pagination, search, and filtering

## Troubleshooting

### API Connection Issues
- **Problem**: "Failed to fetch products"
  - **Solution**: Verify backend is running on correct port
  - **Check**: `curl http://localhost:5000/api/product`

- **Problem**: CORS errors
  - **Solution**: Ensure `CORS(app)` in `server/app.py`
  - **Check**: Response headers include `Access-Control-Allow-Origin`

### Image Upload Issues
- **Problem**: Images not appearing
  - **Solution**: Verify `/static/uploads/` directory exists and is writable
  - **Check**: Backend logs for image save errors

- **Problem**: Image paths broken
  - **Solution**: Ensure `url_for('static', ...)` generates correct URLs
  - **Check**: Browser network tab for image request URLs

### Product Not Showing
- **Problem**: Products fetched but not displaying
  - **Solution**: Verify data transformation in `transformBackendProduct()`
  - **Check**: Console for missing required fields

## Performance Optimization

1. **Pagination**: Use `per_page` parameter to limit results
2. **Caching**: Implement Redis cache for bestsellers/recent
3. **Image Optimization**: Compress images before upload
4. **Lazy Loading**: Load related products on demand

## Security Considerations

1. **Authentication**: Ensure JWT tokens required for admin operations
2. **Authorization**: Verify user roles before allowing modifications
3. **Input Validation**: Sanitize all user inputs on backend
4. **Rate Limiting**: Implement rate limits on public endpoints
5. **HTTPS**: Use HTTPS in production

## Future Enhancements

1. **Search Improvement**: Implement full-text search with Elasticsearch
2. **Product Variants**: Support size/color variants in database
3. **Inventory Sync**: Real-time inventory updates
4. **Analytics**: Track product views and conversions
5. **Reviews**: Integrate product review system
