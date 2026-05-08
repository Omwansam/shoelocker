# Quick Start Guide - Product Integration

Get your integrated product system running in 5 minutes!

## Step 1: Setup Backend (2 minutes)

```bash
cd BACKEND

# Create virtual environment (if needed)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r Pipfile  # or: pipenv install

# Start backend server
python server/app.py
```

✅ Backend running on `http://localhost:5000`

## Step 2: Setup Frontend (2 minutes)

```bash
cd foot-locker

# Create .env file
cp .env.example .env

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running on `http://localhost:5173`

## Step 3: Verify Connection (1 minute)

### Option A: Check in Browser
1. Open `http://localhost:5173`
2. Open Developer Tools (F12)
3. Go to Network tab
4. You should see requests to `/api/product`
5. Responses should include products

### Option B: Check via Terminal
```bash
# Test backend is responding
curl http://localhost:5000/api/product

# Expected: JSON array of products
```

## Step 4: Add Sample Products (Optional)

### Using Admin Panel
1. Login to admin at `/admin/login`
2. Go to Products section
3. Click "Add product"
4. Fill in details and upload images
5. Click Save

### Using API (curl)
```bash
curl -X POST http://localhost:5000/api/product \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "product_name=Nike Air Max" \
  -F "product_description=Premium shoe" \
  -F "product_price=22500" \
  -F "stock_quantity=50" \
  -F "category_id=1" \
  -F "brand=Nike" \
  -F "storefront_category=men"
```

## Done! 🎉

Your product system is now:
- ✅ Frontend → Backend connected
- ✅ Products loading from database
- ✅ Admin panel ready for management
- ✅ Images uploading and displaying
- ✅ Search and filtering working
- ✅ Real-time data synchronization

## Common Issues

### "Cannot GET /api/product"
Backend not running. Run: `python server/app.py`

### "Failed to fetch"
Backend URL wrong. Check `src/config/api.js`

### "No products showing"
No products in database. Add some via admin panel or API.

### "Images not loading"
Check `/static/uploads/` folder exists on backend.

### "CORS Error"
Backend CORS not configured. Verify `CORS(app)` in `server/app.py`

## Next Steps

1. **Customize**: Update product fields as needed
2. **Style**: Adjust CSS for your brand
3. **Deploy**: Follow PRODUCT_INTEGRATION_SETUP.md
4. **Optimize**: Implement caching and CDN
5. **Scale**: Add more features as needed

## Documentation

- 📖 **Setup Guide**: `PRODUCT_INTEGRATION_SETUP.md`
- 🔍 **Verification**: `PRODUCT_INTEGRATION_VERIFICATION.md`  
- 📝 **Summary**: `PRODUCT_INTEGRATION_SUMMARY.md`

## Support

**Issue**: Check browser console for errors
**Question**: Review documentation files above
**Bug**: Check network tab for API responses

---

You're all set! Happy shipping 🚀
