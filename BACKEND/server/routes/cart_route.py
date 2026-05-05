from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import ShoppingCart, CartItem, Product, ProductImage


#Blueprint Configuration
cart_bp = Blueprint('cart', __name__)

#########################################################################################################

def update_cart_total(cart):
    """Helper function to update cart total price"""
    cart_items = CartItem.query.filter_by(shopping_cart_id=cart.shopping_cart_id).all()
    total = sum(float(item.price) * item.quantity for item in cart_items)
    cart.total_price = f"{total:.2f}"
    cart.shopping_quantity = sum(item.quantity for item in cart_items)
    cart.updated_at = db.func.current_timestamp()

    db.session.commit()

####################################################################################################################




@cart_bp.route('',methods=['GET'])
@jwt_required()
def get_cart():
    """Get the shopping cart for current user"""
    identity = get_jwt_identity()
    user_id = identity.get('id') if isinstance(identity, dict) else identity
    cart = ShoppingCart.query.filter_by(user_id=user_id).first()

    if not cart:
        response = jsonify({
            'message': 'Your cart is empty',
            'shopping_cart_id': None,
            'user_id': user_id,
            'total_price': "0.00",
            'items_count': 0,
            'created_at': None,
            'updated_at': None,
            'items': []
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200
    
    cart_items = []
    for item in cart.cart_items:
        product = Product.query.get(item.product_id)
        if not product:
            continue
            
        primary_image = ProductImage.query.filter_by(
            product_id=product.product_id,
            is_primary=True
        ).first()
        
        image_url = primary_image.image_url if primary_image else None
        
        cart_items.append({
            'cart_item_id': item.cart_item_id,
            'product_id': product.product_id,
            'product_name': product.product_name,
            'description': product.product_description,
            'price': item.price,
            'quantity': item.quantity,
            'image_url': image_url,
            'stock_available': product.stock_quantity,
            'added_at': item.added_at.isoformat() if item.added_at else None,
            'max_allowed': min(product.stock_quantity, 10)  # Example limit
        })
    
    response = jsonify({
        'shopping_cart_id': cart.shopping_cart_id,
        'user_id': cart.user_id,
        'total_price': cart.total_price,
        'items_count': cart.shopping_quantity,
        'created_at': cart.created_at.isoformat() if cart.created_at else None,
        'updated_at': cart.updated_at.isoformat() if cart.updated_at else None,
        'items': cart_items
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, 200
    
####################################################################################################################################################

@cart_bp.route('/items', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add an item to the shopping cart"""
    try:
        identity = get_jwt_identity()
        user_id = identity.get('id') if isinstance(identity, dict) else identity
        data = request.get_json()
        
        if not data or 'product_id' not in data:
            response = jsonify({"error": "Product ID is required"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        try:
            product_id = int(data['product_id'])
            quantity = int(data.get('quantity', 1))
        except (ValueError, TypeError):
            response = jsonify({"error": "Invalid product ID or quantity"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        if quantity <= 0:
            response = jsonify({"error": "Quantity must be at least 1"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        product = Product.query.get(product_id)
        if not product:
            response = jsonify({"error": "Product not found"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 404
        
        if product.stock_quantity < quantity:
            response = jsonify({
                "error": "Not enough stock available",
                "stock_available": product.stock_quantity
            })
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        # Get or create cart
        cart = ShoppingCart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = ShoppingCart(
                user_id=user_id,
                total_price="0.00",
                shopping_quantity=0
            )
            db.session.add(cart)
            db.session.flush()
        
        # Check if product already in cart
        existing_item = CartItem.query.filter_by(
            shopping_cart_id=cart.shopping_cart_id,
            product_id=product_id
        ).first()
        
        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if product.stock_quantity < new_quantity:
                response = jsonify({
                    "error": "Adding this quantity would exceed available stock",
                    "current_in_cart": existing_item.quantity,
                    "stock_available": product.stock_quantity
                })
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response, 400
            existing_item.quantity = new_quantity
        else:
            new_item = CartItem(
                shopping_cart_id=cart.shopping_cart_id,
                product_id=product_id,
                price=f"{product.product_price:.2f}",
                quantity=quantity
            )
            db.session.add(new_item)
        
        update_cart_total(cart)
        
        response = jsonify({
            "message": "Item added to cart successfully",
            "cart_total": cart.total_price,
            "items_count": cart.shopping_quantity
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 201
        
    except Exception as e:
        db.session.rollback()
        response = jsonify({"error": "Internal server error"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

########################################################################################################################

@cart_bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """Update quantity of a cart item"""
    identity = get_jwt_identity()
    user_id = identity.get('id') if isinstance(identity, dict) else identity
    data = request.get_json()
    
    if not data or 'quantity' not in data:
        return jsonify({"error": "Quantity is required"}), 400
    
    try:
        quantity = int(data['quantity'])
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid quantity"}), 400
    
    if quantity <= 0:
        return jsonify({"error": "Quantity must be at least 1"}), 400
    
    cart = ShoppingCart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "Shopping cart not found"}), 404
    
    item = CartItem.query.filter_by(
        cart_item_id=item_id,
        shopping_cart_id=cart.shopping_cart_id
    ).first()
    
    if not item:
        return jsonify({"error": "Item not found in your cart"}), 404
    
    product = Product.query.get(item.product_id)
    if not product:
        return jsonify({"error": "Associated product not found"}), 404
    
    if product.stock_quantity < quantity:
        return jsonify({
            "error": "Not enough stock available",
            "stock_available": product.stock_quantity
        }), 400
    
    item.quantity = quantity
    item.added_at = db.func.current_timestamp()
    update_cart_total(cart)
    db.session.commit()
    
    return jsonify({
        "message": "Cart item updated successfully",
        "new_quantity": quantity,
        "item_total": f"{float(item.price) * quantity:.2f}",
        "cart_total": cart.total_price
    }), 200

############################################################################################################################


@cart_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove an item from the shopping cart"""

    identity = get_jwt_identity()
    user_id = identity.get('id') if isinstance(identity, dict) else identity

    cart = ShoppingCart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "Shopping cart not found"}), 404

    item = CartItem.query.filter_by(
        cart_item_id=item_id,
        shopping_cart_id=cart.shopping_cart_id
    ).first()

    if not item:
        return jsonify({"error": "Item not found in cart"}), 404

    db.session.delete(item)
    update_cart_total(cart)

    db.session.commit()

    return jsonify({
        "message": "Item removed from cart successfully",
        "cart_total": cart.total_price,
        "items_count": cart.shopping_quantity
    }), 200

#######################################################################################################################################

@cart_bp.route('', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear all items from the shopping cart"""
    identity = get_jwt_identity()
    user_id = identity.get('id') if isinstance(identity, dict) else identity
    
    cart = ShoppingCart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "Shopping cart not found"}), 404
    
    # More efficient than individual deletes
    CartItem.query.filter_by(shopping_cart_id=cart.shopping_cart_id).delete()
    cart.total_price = "0.00"
    cart.shopping_quantity = 0
    cart.updated_at = db.func.current_timestamp()
    db.session.commit()
    
    return jsonify({
        "message": "Cart cleared successfully",
        "items_removed": cart.shopping_quantity
    }), 200
