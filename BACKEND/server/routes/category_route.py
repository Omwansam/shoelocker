from flask import Blueprint, request, jsonify
from models import Category, Product
from extensions import db
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case
from datetime import datetime

# Blueprint Configuration
category_bp = Blueprint('categories', __name__)

#####################################################################################################################################################################

# --------------------------
# ADMIN CATEGORY MANAGEMENT
# --------------------------

###########################################################################################################################################################
@category_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category (Admin Only)"""

    data = request.get_json()

    # Validation in category
    if not data.get('category_name'):
        return jsonify({'message': 'Category name is required'}), 400
    if len(data['category_name']) > 100:
        return jsonify({'message': 'Category name too long (max 100 chars)'}), 400
    
    try:
        
        new_category = Category(
            category_name = data['category_name'].strip(),
            category_description = data.get('category_description', '').strip()
        )
        db.session.add(new_category)
        db.session.commit()

        return jsonify({
            'success' : True,
            'category': {
                'category_id': new_category.category_id,
                'category_name': new_category.category_name,
                'category_description': new_category.category_description
            },
            'message' : 'Category created successfully'
        }), 200
    
    except IntegrityError:
        db.session.rollback()
    return jsonify({'message': 'Category name already exists'}), 409

###########################################################################################################################################################


#Update a category details
@category_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update a category (Admin Only)"""
    category = Category.query.get_or_404(category_id)
    data  = request.get_json()

    if 'category_name' in data:
        if not data['category_name']:
            return jsonify({
                'error': 'Category name cannot be empty'
            }), 400
        category.category_name = data['category_name'].strip()

    if'category_description' in data:
        category.category_description = data['category_description'].strip()

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'category': {
                'category_id': category.category_id,
                'category_name':category.category_name,
                'category_description':category.category_description
            },
            'message': 'Category updated successfully'
        }), 200
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Category name already exists'}), 409   


#################################################################################################################################################

# Delete a category
@category_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete a category (Admin only)"""
    category = Category.query.get_or_404(category_id)

    #prevent deletion of category if category has  products
    if category.products.count() > 0:
        return jsonify({
            'success': False,
            'message' : 'Cannot delete category with products'
        }), 400
    
    db.session.delete(category)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Category deleted successfully'
    }), 200


##############################################################################################################################################

# --------------------------
# PUBLIC CATEGORY ENDPOINTS 
# --------------------------

########################################################################################################################################
# Get all categories
@category_bp.route('', methods=['GET'])
def get_all_categories():
    """Get all categories for navigation menu"""
    categories = Category.query.order_by(Category.category_name).all()

    return jsonify([{
        'category_id': category.category_id,
        'category_name': category.category_name,
        'category_description': category.category_description,
        'products': [{
            'product_id': product.product_id,
            'product_name': product.product_name,
            'product_description': product.product_description,
            'product_price': float(product.product_price),
            'stock_quantity': product.stock_quantity,
            'images': [img.image_url for img in product.images] if product.images else []
        } for product in category.products]
    } for category in categories]), 200


###################################################################################################################################################################

# Get a specific category by ID
@category_bp.route('/<int:category_id>', methods=['GET'])
def get_category_details(category_id):
    """Get category details with paginated products"""

    # Get the category or 404
    category = Category.query.get_or_404(category_id)

    # Base query for products in this category
    products_query = Product.query.filter_by(category_id=category_id)

    # Pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    sort_by = request.args.get('sort_by', 'name')

    

    # Apply price filters
    if min_price is not None:
        products_query = products_query.filter(Product.product_price >= min_price)
    if max_price is not None:
        products_query = products_query.filter(Product.product_price <= max_price)

    # Apply sorting
    if sort_by == 'price_asc':
        products_query = products_query.order_by(Product.product_price.asc())
    elif sort_by == 'price_desc':
        products_query = products_query.order_by(Product.product_price.desc())
    else:
        products_query = products_query.order_by(Product.product_name.asc())

    # Apply pagination
    paginated_products = products_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'category': {
            'category_id': category.category_id,
            'category_name': category.category_name,
            'category_description': category.category_description
        },
        'products': [{
            'product_id': product.product_id,
            'product_name': product.product_name,
            'product_description': product.product_description,
            'product_price': float(product.product_price),
            'stock_quantity': product.stock_quantity,
            'images': [img.image_url for img in product.images] if product.images else []
        } for product in paginated_products.items],
        'pagination': {
            'total': paginated_products.total,
            'pages': paginated_products.pages,
            'current_page': paginated_products.page,
            'per_page': paginated_products.per_page
        },
        'filters': {
            'min_price': min_price,
            'max_price': max_price,
            'sort_by': sort_by
        }
    }), 200

######################################################################################################################################################

@category_bp.route('/stats', methods=['GET'])
def get_category_stats():
    """Get statistics about categories and products"""
    # Count products per category
    stats = db.session.query(
        Category.category_id,
        Category.category_name,
        func.count(Product.product_id).label('product_count'),
        func.sum(Product.stock_quantity).label('total_stock'),
        func.avg(Product.product_price).label('avg_price'),
        func.min(Product.product_price).label('min_price'),
        func.max(Product.product_price).label('max_price')
    ).join(Product, isouter=True
    ).group_by(Category.category_id).all()

    # Format results
    result = [{
        'category_id': s.category_id,
        'category_name': s.category_name,
        'product_count': s.product_count or 0,
        'total_stock': s.total_stock or 0,
        'avg_price': float(s.avg_price) if s.avg_price else 0,
        'min_price': float(s.min_price) if s.min_price else 0,
        'max_price': float(s.max_price) if s.max_price else 0
    } for s in stats]
    
    return jsonify({
        'success': True,
        'stats': result,
        'timestamp': datetime.utcnow().isoformat()
    }), 200

#############################################################################################################################################################

# Search categories

@category_bp.route('/search', methods=['GET'])
def search_categories():
    """Search categories by name"""
    query = request.args.get('q', '').strip()


    if not query or len(query) < 2:
        return jsonify({
            'success': False,
            'error': 'Search query must be at least 2 characters'
        }), 400
    
    categories = Category.query.filter(
        Category.category_name.ilike(f'%{query}%')
    ).order_by(
        case(
            [(Category.category_name.ilike(f'%{query}%'), 0)],
            else_=1
        ),
        Category.category_name.asc()
    ).limit(10).all()

    return jsonify({
        'success': True,
        'results': [{
            'category': {
                'category_id': category.category_id,
                'category_name': category.category_name,
                'category_description': category.category_description
            }
        } for category in categories]
    }), 200


######################################################################################################################################################################



