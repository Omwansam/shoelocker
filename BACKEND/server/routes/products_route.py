from flask import Blueprint, request, jsonify,url_for, current_app
from utils.images import save_product_image, delete_image_file
from models import Product, ProductImage, OrderItem, Review, Category
from flask_jwt_extended import jwt_required
import os
from sqlalchemy import func, desc
from datetime import datetime

from extensions import db

# Blueprint Configuration
product_bp = Blueprint('products', __name__)

MAX_IMAGES_PER_PRODUCT = 10 

# Get best sellers (products with most orders and highest ratings) - Using different path to avoid conflicts
@product_bp.route('/bestsellers', methods=['GET'])
def get_best_sellers():
    """Retrieve best selling products based on order frequency and ratings."""
    try:
        # Get products with their order counts and average ratings
        best_sellers = db.session.query(
            Product,
            func.count(OrderItem.order_item_id).label('order_count'),
            func.avg(Review.rating).label('avg_rating')
        ).outerjoin(OrderItem, Product.product_id == OrderItem.product_id)\
         .outerjoin(Review, Product.product_id == Review.product_id)\
         .group_by(Product.product_id)\
         .order_by(desc('order_count'), desc('avg_rating'))\
         .limit(8)\
         .all()
        
        result = []
        for product, order_count, avg_rating in best_sellers:
            # Get primary image for the product
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': product.product_price,
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'order_count': order_count or 0,
                'avg_rating': float(avg_rating) if avg_rating else 0.0,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'all_images': [{
                    'image_id': img.image_id,
                    'image_url': url_for('static', filename=img.image_url, _external=True),
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            result.append(product_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching best sellers: {str(e)}'}), 500

# Get recent products (newest first)
@product_bp.route('/recent', methods=['GET'])
def get_recent_products():
    """Retrieve the most recently added products."""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Get products ordered by creation date (newest first)
        recent_products = Product.query.order_by(desc(Product.created_at)).limit(limit).all()
        
        result = []
        for product in recent_products:
            # Get primary image for the product
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': product.product_price,
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'all_images': [{
                    'image_id': img.image_id,
                    'image_url': url_for('static', filename=img.image_url, _external=True),
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            result.append(product_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching recent products: {str(e)}'}), 500

# Get recent products (alternative route for frontend compatibility)
@product_bp.route('/product/recent', methods=['GET'])
def get_recent_products_alt():
    """Retrieve the most recently added products (alternative route)."""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Get products ordered by creation date (newest first)
        recent_products = Product.query.order_by(desc(Product.created_at)).limit(limit).all()
        
        result = []
        for product in recent_products:
            # Get primary image for the product
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': product.product_price,
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'all_images': [{
                    'image_id': img.image_id,
                    'image_url': url_for('static', filename=img.image_url, _external=True),
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            result.append(product_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching recent products: {str(e)}'}), 500

# Create a new product with images
@product_bp.route('/product', methods=['POST'])
@jwt_required()
def create_product():
    """Create a product and upload images via product_images route."""

    
    if not request.content_type.startswith('multipart/form-data'):
        return jsonify({'error': 'Content-Type must be multipart/form-data'}), 400
    

    data = request.form
    files = request.files.getlist('images')
    
    new_product = Product(
        product_name=data.get('product_name'),
        product_description=data.get('product_description'),
        product_price=float(data.get('product_price', 0)),  # Convert to float
        stock_quantity=int(data.get('stock_quantity', 0)),  # Convert to int
        category_id=int(data.get('category_id', 0))
    )
    db.session.add(new_product)
    db.session.commit()
    
    # Process images
    if files:
        for idx, img in enumerate(files[:MAX_IMAGES_PER_PRODUCT]):  # Limit number of images
            if img.filename == '':
                continue
                
            image_path = save_product_image(img, new_product.product_id)
            if image_path:
                is_primary = (idx == 0)  # First image becomes primary
                new_image = ProductImage(
                    image_url=image_path,
                    is_primary=is_primary,
                    product_id=new_product.product_id
                )
                db.session.add(new_image)
        
        db.session.commit()

    return jsonify({
        'message': 'Product created successfully',
        'product_id': new_product.product_id,
        'image_count': min(len(files), MAX_IMAGES_PER_PRODUCT)
    }), 201

# Get all products
@product_bp.route('/product', methods=['GET', 'OPTIONS'])
def get_products():
    """Retrieve all products along with their images."""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    try:
        # Get query parameters for filtering and pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        sort_by = request.args.get('sort_by', 'product_name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Build query
        query = Product.query
        
        # Apply filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if search:
            query = query.filter(
                Product.product_name.ilike(f'%{search}%') |
                Product.product_description.ilike(f'%{search}%')
            )
        
        if status:
            if status == 'out_of_stock':
                query = query.filter(Product.stock_quantity == 0)
            elif status == 'low_stock':
                query = query.filter(Product.stock_quantity <= 5, Product.stock_quantity > 0)
            elif status == 'in_stock':
                query = query.filter(Product.stock_quantity > 5)
        
        # Apply sorting
        if sort_by == 'product_price':
            if sort_order == 'desc':
                query = query.order_by(Product.product_price.desc())
            else:
                query = query.order_by(Product.product_price.asc())
        elif sort_by == 'stock_quantity':
            if sort_order == 'desc':
                query = query.order_by(Product.stock_quantity.desc())
            else:
                query = query.order_by(Product.stock_quantity.asc())
        elif sort_by == 'created_at':
            if sort_order == 'desc':
                query = query.order_by(Product.created_at.desc())
            else:
                query = query.order_by(Product.created_at.asc())
        else:  # default sort by name
            if sort_order == 'desc':
                query = query.order_by(Product.product_name.desc())
            else:
                query = query.order_by(Product.product_name.asc())
        
        # Apply pagination
        paginated_products = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Format response
        products_data = []
        for product in paginated_products.items:
            # Get primary image
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            # Get category name
            category_name = None
            if product.category_id:
                category = Category.query.get(product.category_id)
                category_name = category.category_name if category else None
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': float(product.product_price),
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'category_name': category_name,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'updated_at': product.updated_at.isoformat() if product.updated_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'images': [{
                    'image_id': img.image_id, 
                    'image_url': url_for('static', filename=img.image_url, _external=True), 
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            products_data.append(product_data)
        
        response = jsonify({
            'products': products_data,
            'pagination': {
                'total': paginated_products.total,
                'pages': paginated_products.pages,
                'current_page': paginated_products.page,
                'per_page': paginated_products.per_page,
                'has_next': paginated_products.has_next,
                'has_prev': paginated_products.has_prev
            }
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching products: {str(e)}'}), 500

# Get related products by category - Simple route
@product_bp.route('/related-products/<int:product_id>', methods=['GET', 'OPTIONS'])
def get_related_products_simple(product_id):
    """Simple route for related products to avoid CORS issues."""
    print(f"🔍 Simple related products route called for product_id: {product_id}, method: {request.method}")
    
    if request.method == 'OPTIONS':
        print("📡 Handling OPTIONS request (simple route)")
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response, 200
    
    try:
        print(f"🔍 Processing GET request for product_id: {product_id} (simple route)")
        # Get the current product to find its category
        current_product = Product.query.get(product_id)
        if not current_product:
            return jsonify({"error": "Product not found"}), 404
        
        # Get related products from the same category (excluding the current product)
        related_products = Product.query.filter(
            Product.category_id == current_product.category_id,
            Product.product_id != product_id
        ).limit(4).all()
        
        # If we don't have enough products in the same category, get some from other categories
        if len(related_products) < 4:
            additional_products = Product.query.filter(
                Product.product_id != product_id,
                Product.product_id.notin_([p.product_id for p in related_products])
            ).limit(4 - len(related_products)).all()
            related_products.extend(additional_products)
        
        # Format response
        products_data = []
        for product in related_products:
            # Get primary image
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            # Get category name
            category_name = None
            if product.category_id:
                category = Category.query.get(product.category_id)
                category_name = category.category_name if category else None
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': float(product.product_price),
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'category_name': category_name,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'images': [{
                    'image_id': img.image_id, 
                    'image_url': url_for('static', filename=img.image_url, _external=True), 
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            products_data.append(product_data)
        
        response = jsonify({
            'related_products': products_data,
            'total_related': len(products_data)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        
        print(f"✅ Returning {len(products_data)} related products (simple route)")
        return response, 200
        
    except Exception as e:
        print(f"❌ Error in simple related products route: {str(e)}")
        return jsonify({'error': f'Error fetching related products: {str(e)}'}), 500

# Get related products by category
@product_bp.route('/<int:product_id>/related', methods=['GET', 'OPTIONS'])
def get_related_products(product_id):
    """Get related products based on the same category as the given product."""
    print(f"🔍 Related products route called for product_id: {product_id}, method: {request.method}")
    
    if request.method == 'OPTIONS':
        print("📡 Handling OPTIONS request")
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response, 200
    
    try:
        print(f"🔍 Processing GET request for product_id: {product_id}")
        # Get the current product to find its category
        current_product = Product.query.get(product_id)
        if not current_product:
            return jsonify({"error": "Product not found"}), 404
        
        # Get related products from the same category (excluding the current product)
        related_products = Product.query.filter(
            Product.category_id == current_product.category_id,
            Product.product_id != product_id
        ).limit(4).all()
        
        # If we don't have enough products in the same category, get some from other categories
        if len(related_products) < 4:
            additional_products = Product.query.filter(
                Product.product_id != product_id,
                Product.product_id.notin_([p.product_id for p in related_products])
            ).limit(4 - len(related_products)).all()
            related_products.extend(additional_products)
        
        # Format response
        products_data = []
        for product in related_products:
            # Get primary image
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            # Get category name
            category_name = None
            if product.category_id:
                category = Category.query.get(product.category_id)
                category_name = category.category_name if category else None
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': float(product.product_price),
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'category_name': category_name,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'images': [{
                    'image_id': img.image_id, 
                    'image_url': url_for('static', filename=img.image_url, _external=True), 
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            products_data.append(product_data)
        
        response = jsonify({
            'related_products': products_data,
            'total_related': len(products_data)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        
        print(f"✅ Returning {len(products_data)} related products")
        return response, 200
        
    except Exception as e:
        print(f"❌ Error in related products route: {str(e)}")
        return jsonify({'error': f'Error fetching related products: {str(e)}'}), 500

# Get a specific product by ID
@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Retrieve a specific product by ID and its images."""
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({
        'product_id': product.product_id,
        'product_name': product.product_name,
        'product_description': product.product_description,
        'product_price': product.product_price,
        'stock_quantity': product.stock_quantity,
        'category_id': product.category_id,
        'images': [
            {
                'image_id': img.image_id,
                'image_url': url_for('static', filename=img.image_url, _external=True),
                'is_primary': img.is_primary
            } for img in product.images
        ]
    }), 200

# Get products by category name/slug
@product_bp.route('/product/category/<category_slug>', methods=['GET'])
def get_products_by_category(category_slug):
    """Retrieve products by category name/slug."""
    try:
        # Map category slugs to category names
        category_mapping = {
            'sofas': 'Sofas & Couches',
            'beds': 'Beds & Bedroom',
            'chairs': 'Chairs & Seating',
            'tables': 'Tables & Desks',
            'lighting': 'Lighting',
            'rugs': 'Rugs & Carpets',
            'dining': 'Dining Room',
            'office': 'Office Furniture',
            'outdoor': 'Outdoor',
            'storage': 'Storage'
        }
        
        # Get category name from slug
        category_name = category_mapping.get(category_slug)
        if not category_name:
            return jsonify({"error": "Category not found"}), 404
        
        # Find category by name
        category = Category.query.filter_by(category_name=category_name).first()
        if not category:
            return jsonify({"error": "Category not found"}), 404
        
        # Get products in this category
        products = Product.query.filter_by(category_id=category.category_id).all()
        
        # Format response
        products_data = []
        for product in products:
            # Get primary image
            primary_image = ProductImage.query.filter_by(
                product_id=product.product_id, 
                is_primary=True
            ).first()
            
            product_data = {
                'product_id': product.product_id,
                'product_name': product.product_name,
                'product_description': product.product_description,
                'product_price': float(product.product_price),
                'stock_quantity': product.stock_quantity,
                'category_id': product.category_id,
                'category_name': category.category_name,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'updated_at': product.updated_at.isoformat() if product.updated_at else None,
                'primary_image': url_for('static', filename=primary_image.image_url, _external=True) if primary_image else None,
                'images': [{
                    'image_id': img.image_id, 
                    'image_url': url_for('static', filename=img.image_url, _external=True), 
                    'is_primary': img.is_primary
                } for img in product.images]
            }
            products_data.append(product_data)
        
        response = jsonify({
            'products': products_data,
            'category': {
                'category_id': category.category_id,
                'category_name': category.category_name,
                'category_description': category.category_description
            },
            'total_products': len(products_data)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching products by category: {str(e)}'}), 500

# Update a product
@product_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update a product's details."""
    product = Product.query.get_or_404(product_id)
    
    # Handle both JSON and FormData
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        files = request.files.getlist('images')
        
        # Update product details
        product.product_name = data.get('product_name', product.product_name)
        product.product_description = data.get('product_description', product.product_description)
        product.product_price = float(data.get('product_price', product.product_price))
        product.stock_quantity = int(data.get('stock_quantity', product.stock_quantity))
        product.category_id = int(data.get('category_id', product.category_id))
        
        # Process new images if any
        if files:
            current_count = ProductImage.query.filter_by(product_id=product_id).count()
            for idx, img in enumerate(files[:MAX_IMAGES_PER_PRODUCT - current_count]):
                if img.filename == '':
                    continue
                    
                image_path = save_product_image(img, product_id)
                if image_path:
                    is_primary = (idx == 0 and current_count == 0)  # Primary if first image and no existing images
                    new_image = ProductImage(
                        image_url=image_path,
                        is_primary=is_primary,
                        product_id=product_id
                    )
                    db.session.add(new_image)
    else:
        data = request.get_json()
        product.product_name = data.get('product_name', product.product_name)
        product.product_description = data.get('product_description', product.product_description)
        product.product_price = data.get('product_price', product.product_price)
        product.stock_quantity = data.get('stock_quantity', product.stock_quantity)
        product.category_id = data.get('category_id', product.category_id)
    
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'}), 200

# Delete a product and its images
@product_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product and all its images."""
    product = Product.query.get_or_404(product_id)

    # Delete associated images from database
    images = ProductImage.query.filter_by(product_id=product_id).all()
    for img in images:
        
        try:
            delete_image_file(img.image_url)
        except Exception as e:
            current_app.logger.error(f"Failed to delete image {img.image_url}: {str(e)}")

    # Delete db records
    ProductImage.query.filter_by(product_id=product_id).delete()
    db.session.delete(product)
    db.session.commit()

    return jsonify({
        'message': 'Product and all associated images deleted',
        'deleted_images': len(images)
    }), 200


# Upload Multiple product images

@product_bp.route('/<int:product_id>/images', methods=['POST'])
@jwt_required()
def add_product_images(product_id):
    """Upload multiple images for a product."""
    product = Product.query.get_or_404(product_id)

    current_count = ProductImage.query.filter_by(product_id=product_id).count()
    if current_count >= MAX_IMAGES_PER_PRODUCT:
        return jsonify({'error': f'Maximum {MAX_IMAGES_PER_PRODUCT} images per product reached'}), 400

    if 'images' not in request.files:
        return jsonify({'message': 'No images provided'}), 400
    
    images = request.files.getlist('images')
    if not images or all(img.filename == '' for img in images):
        return jsonify({'error': 'No valid images selected'}), 400
    
    primary_image_id = request.form.get('primary_image_id')
    new_primary_set =False

    

    # Process new images
    uploaded_count = 0
    for img in images[:MAX_IMAGES_PER_PRODUCT - current_count]:  # Stay within limit
        if img.filename == '':
            continue 

        # Save image to file and update database record
        image_path = save_product_image(img, product_id)
        if not image_path:
            continue

        # Check if this should be the new primary image
        is_primary = False
        if primary_image_id == 'new' and not new_primary_set:
            is_primary = True
            new_primary_set = True
            
        # Create image record
        new_image = ProductImage(
            image_url=image_path,
            is_primary=is_primary,
            product_id=product_id
        )
        db.session.add(new_image)
        uploaded_count += 1
        
        # If setting as primary, unset any existing primary
        if is_primary:
            ProductImage.query.filter(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True
            ).update({'is_primary': False})
            
    db.session.commit()
    
    return jsonify({
        'message': f'{len(images)} images added to product',
        'product_id': product_id,
        'new_image_count': uploaded_count,
        'total_images': current_count + uploaded_count
    }), 201


# Admin-specific routes for product management

@product_bp.route('/admin/stats', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_product_stats():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    """Get product statistics for admin dashboard"""
    try:
        from sqlalchemy import func
        
        # Get basic counts
        total_products = Product.query.count()
        out_of_stock = Product.query.filter(Product.stock_quantity == 0).count()
        low_stock = Product.query.filter(Product.stock_quantity <= 5, Product.stock_quantity > 0).count()
        in_stock = Product.query.filter(Product.stock_quantity > 5).count()
        
        # Get total inventory value
        total_value = db.session.query(func.sum(Product.product_price * Product.stock_quantity)).scalar() or 0
        
        # Get average price
        avg_price = db.session.query(func.avg(Product.product_price)).scalar() or 0
        
        # Get products by category
        category_stats = db.session.query(
            Category.category_name,
            func.count(Product.product_id).label('count')
        ).join(Product, isouter=True).group_by(Category.category_id).all()
        
        response = jsonify({
            'total_products': total_products,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
            'in_stock': in_stock,
            'total_value': float(total_value),
            'average_price': float(avg_price),
            'category_distribution': [
                {'category': cat, 'count': count} 
                for cat, count in category_stats
            ]
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching product stats: {str(e)}'}), 500


@product_bp.route('/admin/bulk-update', methods=['PUT', 'OPTIONS'])
@jwt_required()
def bulk_update_products():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT,OPTIONS')
        return response, 200
    """Bulk update products (admin only)"""
    try:
        data = request.get_json()
        product_ids = data.get('product_ids', [])
        updates = data.get('updates', {})
        
        if not product_ids:
            return jsonify({'error': 'No product IDs provided'}), 400
        
        # Update products
        updated_count = 0
        for product_id in product_ids:
            product = Product.query.get(product_id)
            if product:
                for field, value in updates.items():
                    if hasattr(product, field):
                        setattr(product, field, value)
                updated_count += 1
        
        db.session.commit()
        
        response = jsonify({
            'message': f'Successfully updated {updated_count} products',
            'updated_count': updated_count
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT,OPTIONS')
        return response, 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error in bulk update: {str(e)}'}), 500


@product_bp.route('/admin/bulk-delete', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def bulk_delete_products():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
        return response, 200
    """Bulk delete products (admin only)"""
    try:
        data = request.get_json()
        product_ids = data.get('product_ids', [])
        
        if not product_ids:
            return jsonify({'error': 'No product IDs provided'}), 400
        
        # Delete products and their images
        deleted_count = 0
        for product_id in product_ids:
            product = Product.query.get(product_id)
            if product:
                # Delete associated images
                images = ProductImage.query.filter_by(product_id=product_id).all()
                for img in images:
                    try:
                        delete_image_file(img.image_url)
                    except Exception as e:
                        current_app.logger.error(f"Failed to delete image {img.image_url}: {str(e)}")
                
                # Delete image records
                ProductImage.query.filter_by(product_id=product_id).delete()
                
                # Delete product
                db.session.delete(product)
                deleted_count += 1
        
        db.session.commit()
        
        response = jsonify({
            'message': f'Successfully deleted {deleted_count} products',
            'deleted_count': deleted_count
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
        return response, 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error in bulk delete: {str(e)}'}), 500


@product_bp.route('/admin/export', methods=['GET', 'OPTIONS'])
@jwt_required()
def export_products():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    """Export products to CSV (admin only)"""
    try:
        products = Product.query.all()
        
        csv_data = []
        for product in products:
            category_name = None
            if product.category_id:
                category = Category.query.get(product.category_id)
                category_name = category.category_name if category else None
            
            csv_data.append({
                'ID': product.product_id,
                'Name': product.product_name,
                'Description': product.product_description,
                'Price': product.product_price,
                'Stock': product.stock_quantity,
                'Category': category_name,
                'Created': product.created_at.isoformat() if product.created_at else '',
                'Updated': product.updated_at.isoformat() if product.updated_at else ''
            })
        
        response = jsonify({
            'csv_data': csv_data,
            'filename': f'products_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
        
    except Exception as e:
        return jsonify({'error': f'Error exporting products: {str(e)}'}), 500

