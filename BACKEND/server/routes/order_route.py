from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import (ShoppingCart, CartItem, Order, OrderItem, Product, 
                   User, OrderStatus, ShippingStatus, DiscountType, 
                   ProductImage, Payment, PaymentStatus, RefundStatus, Refund, Coupon)
from sqlalchemy.exc import SQLAlchemyError

order_bp = Blueprint('order', __name__)


def _extract_user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity


@order_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_orders():
    """Orders for the authenticated customer (account portal)."""
    user_id = _extract_user_id(get_jwt_identity())
    if not user_id:
        return jsonify({"error": "Invalid user"}), 401
    orders = (
        Order.query.filter_by(user_id=user_id)
        .order_by(Order.order_date.desc())
        .limit(100)
        .all()
    )
    out = []
    for order in orders:
        items = []
        for oi in order.order_items or []:
            prod = oi.product
            items.append(
                {
                    "product_id": oi.product_id,
                    "name": prod.product_name if prod else "",
                    "quantity": oi.quantity,
                    "price": float(oi.price) if oi.price is not None else 0,
                }
            )
        out.append(
            {
                "order_id": order.order_id,
                "id": f"ORD-{order.order_id}",
                "date": order.order_date.isoformat() if order.order_date else None,
                "status": order.order_status.value if order.order_status else None,
                "total": float(order.total_amount) if order.total_amount is not None else 0,
                "items": items,
                "shipping_address": order.shipping_address,
            }
        )
    return jsonify({"orders": out}), 200


def is_admin():
    """Check if current user is admin"""
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        user = User.query.get(user_id)
        return user and user.is_admin
    except:
        return False

def calculate_shipping_cost(items, address):
    """Calculate shipping cost based on items and address"""
    # Simplified calculation - in reality would use shipping API
    base_cost = 5.00  # base shipping
    per_item = 1.50   # per item cost
    return f"{base_cost + (per_item * len(items)):.2f}"

def apply_coupon(coupon_code, order_amount):
    """Apply coupon discount to order amount"""
    coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
    if not coupon:
        return None, "Invalid coupon code"
    
    if coupon.valid_from > datetime.now():
        return None, "Coupon not yet valid"
    
    if coupon.valid_to and coupon.valid_to < datetime.now():
        return None, "Coupon has expired"
    
    if coupon.min_order_amount and order_amount < coupon.min_order_amount:
        return None, f"Minimum order amount not met (${coupon.min_order_amount} required)"
    
    if coupon.discount_type == DiscountType.PERCENTAGE:
        discount = (order_amount * coupon.discount_value) / 100
    else:  # Fixed amount
        discount = coupon.discount_value
    
    # Ensure discount doesn't exceed max discount if set
    if coupon.max_discount_amount and discount > coupon.max_discount_amount:
        discount = coupon.max_discount_amount
    
    return discount, "Coupon applied successfully"

@order_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """Enhanced checkout process with coupon support"""
    identity = get_jwt_identity()
    user_id = _extract_user_id(identity)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['shipping_address', 'payment_method']
    missing = [f for f in required_fields if f not in data or data.get(f) in (None, '')]
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing": missing,
            "required": required_fields
        }), 400
    
    # Get user and cart
    cart = ShoppingCart.query.filter_by(user_id=user_id).first()
    
    if not cart or not cart.cart_items:
        return jsonify({"error": "Your cart is empty"}), 400
    
    # Validate cart items
    unavailable_items = []
    for item in cart.cart_items:
        product = Product.query.get(item.product_id)
        available_qty = int(product.stock_quantity or 0) if product else 0
        if not product or available_qty < item.quantity:
            unavailable_items.append({
                "product_id": item.product_id,
                "requested": item.quantity,
                "available": available_qty
            })
    
    if unavailable_items:
        return jsonify({
            "error": "Some items are no longer available",
            "unavailable_items": unavailable_items
        }), 400
    
    try:
        # Calculate subtotal (fallback if cart.total_price is missing or zero)
        try:
            subtotal_val = float(cart.total_price or 0)
        except Exception:
            subtotal_val = 0.0
        if subtotal_val <= 0:
            subtotal_val = sum(float(ci.price) * ci.quantity for ci in cart.cart_items)
        subtotal = float(f"{subtotal_val:.2f}")
        shipping_cost = calculate_shipping_cost(cart.cart_items, data['shipping_address'])
        discount = 0.0
        coupon_code = data.get('coupon_code')
        
        # Apply coupon if provided
        if coupon_code:
            coupon_discount, message = apply_coupon(coupon_code, subtotal)
            if coupon_discount is None:
                return jsonify({"error": message}), 400
            discount = coupon_discount
        
        # Calculate total
        total_amount = subtotal + float(shipping_cost) - discount
        
        # Create order
        new_order = Order(
            user_id=user_id,
            total_amount=total_amount,
            order_status=OrderStatus.PENDING,
            shipping_address=data['shipping_address']
        )
        db.session.add(new_order)
        db.session.flush()
        
        # Create order items
        for cart_item in cart.cart_items:
            product = Product.query.get(cart_item.product_id)
            
            order_item = OrderItem(
                order_id=new_order.order_id,
                product_id=product.product_id,
                quantity=cart_item.quantity,
                price=cart_item.price,
                shipping_cost=shipping_cost,
                tax="0.00",
                discount=str(discount),
                discount_type=DiscountType.COUPON if coupon_code else DiscountType.REGULAR,
                shipping_status=ShippingStatus.PENDING
            )
            db.session.add(order_item)
            
            # Update inventory
            product.stock_quantity -= cart_item.quantity
        
        # Process payment
        # Create payment to match current Payment model schema
        payment_method = data.get('payment_method', 'mpesa')
        
        # Set payment status based on payment method
        if payment_method == 'mpesa':
            payment_status = PaymentStatus.PENDING  # Will be updated when payment is confirmed
        else:
            payment_status = PaymentStatus.COMPLETED  # For bank transfer, mark as completed
            
        payment = Payment(
            order_id=new_order.order_id,
            user_id=user_id,
            payment_amount=f"{total_amount:.2f}",
            transaction_id=f"txn_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            payment_status=payment_status,
            payment_method_id=1,  # Default to 1 for now
            payment_date=db.func.current_timestamp()
        )
        db.session.add(payment)
        
        # Clear cart
        CartItem.query.filter_by(shopping_cart_id=cart.shopping_cart_id).delete()
        cart.total_price = "0.00"
        cart.shopping_quantity = 0
        
        # Mark coupon as used if applicable
        if coupon_code:
            coupon = Coupon.query.filter_by(code=coupon_code).first()
            if coupon and coupon.usage_limit:
                coupon.usage_limit -= 1
                if coupon.usage_limit <= 0:
                    coupon.is_active = False
        
        db.session.commit()
        
        return jsonify({
            "message": "Order placed successfully",
            "order_id": new_order.order_id,
            "subtotal": f"{subtotal:.2f}",
            "shipping_cost": shipping_cost,
            "discount": f"{discount:.2f}",
            "total_amount": f"{total_amount:.2f}",
            "coupon_applied": bool(coupon_code),
            "payment_method": payment_method,
            "payment_status": payment_status.value
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error during checkout", "details": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Checkout failed", "details": str(e)}), 500

@order_bp.route('/<int:order_id>/return', methods=['POST'])
@jwt_required()
def request_return(order_id):
    """Request a return for an order or specific items"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    order = Order.query.filter_by(order_id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    # Validate order can be returned
    if order.order_status != OrderStatus.DELIVERED:
        return jsonify({
            "error": "Only delivered orders can be returned",
            "current_status": order.order_status.value
        }), 400
    
    # Check if return already exists
    existing_return = Refund.query.filter_by(order_id=order_id).first()
    if existing_return:
        return jsonify({
            "error": "Return already requested",
            "return_status": existing_return.status.value
        }), 400
    
    try:
        # Create return request
        refund = Refund(
            order_id=order_id,
            user_id=user_id,
            reason=data.get('reason', ''),
            status=RefundStatus.REQUESTED,
            requested_at=db.func.current_timestamp()
        )
        db.session.add(refund)
        
        # If specific items are specified, add them to return
        if 'items' in data:
            for item_data in data['items']:
                item = next((i for i in order.order_items 
                           if i.order_item_id == item_data['order_item_id']), None)
                if item:
                    item.refund_requested = True
                    item.refund_reason = item_data.get('reason', '')
        
        db.session.commit()
        
        return jsonify({
            "message": "Return request submitted successfully",
            "return_id": refund.refund_id,
            "status": refund.status.value
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Failed to process return request", "details": str(e)}), 500

@order_bp.route('/admin/returns/<int:return_id>/process', methods=['POST'])
@jwt_required()
def process_return(return_id):
    """Admin endpoint to process a return request"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json()
    refund = Refund.query.get(return_id)
    
    if not refund:
        return jsonify({"error": "Return request not found"}), 404
    
    if refund.status != RefundStatus.REQUESTED:
        return jsonify({
            "error": "Return request has already been processed",
            "current_status": refund.status.value
        }), 400
    
    try:
        # Update return status
        action = data.get('action', 'approve').lower()
        
        if action == 'approve':
            refund.status = RefundStatus.APPROVED
            refund.processed_at = db.func.current_timestamp()
            refund.admin_notes = data.get('notes', '')
            
            # Process refund payment
            order = refund.order
            if order.payment:
                order.payment.status = PaymentStatus.REFUNDED
                order.payment.refund_date = db.func.current_timestamp()
            
            # Restock items if applicable
            if data.get('restock', True):
                for item in order.order_items:
                    if item.refund_requested:
                        product = Product.query.get(item.product_id)
                        if product:
                            product.stock_quantity += item.quantity
            
            # Update order status
            order.order_status = OrderStatus.RETURNED
            
        elif action == 'reject':
            refund.status = RefundStatus.REJECTED
            refund.admin_notes = data.get('notes', 'Rejected by admin')
        else:
            return jsonify({"error": "Invalid action"}), 400
        
        db.session.commit()
        
        return jsonify({
            "message": f"Return request {action}ed",
            "return_id": refund.refund_id,
            "status": refund.status.value,
            "amount_refunded": refund.order.total_amount if action == 'approve' else 0
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Failed to process return", "details": str(e)}), 500

@order_bp.route('/coupons', methods=['POST'])
@jwt_required()
def create_coupon():
    """Admin endpoint to create a new coupon"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json()
    required_fields = ['code', 'discount_type', 'discount_value']
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        coupon = Coupon(
            code=data['code'],
            discount_type=DiscountType(data['discount_type']),
            discount_value=data['discount_value'],
            is_active=data.get('is_active', True),
            valid_from=data.get('valid_from', datetime.now()),
            valid_to=data.get('valid_to'),
            min_order_amount=data.get('min_order_amount'),
            max_discount_amount=data.get('max_discount_amount'),
            usage_limit=data.get('usage_limit')
        )
        db.session.add(coupon)
        db.session.commit()
        
        return jsonify({
            "message": "Coupon created successfully",
            "coupon_id": coupon.coupon_id,
            "code": coupon.code
        }), 201
        
    except ValueError as e:
        return jsonify({"error": "Invalid discount type"}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create coupon", "details": str(e)}), 500

@order_bp.route('/coupons/validate', methods=['POST'])
def validate_coupon():
    """Validate a coupon code"""
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({"error": "Coupon code is required"}), 400
    
    coupon = Coupon.query.filter_by(code=data['code'], is_active=True).first()
    if not coupon:
        return jsonify({"valid": False, "message": "Invalid coupon code"}), 200
    
    # Check validity dates
    current_time = datetime.now()
    if coupon.valid_from > current_time:
        return jsonify({
            "valid": False,
            "message": f"Coupon not valid until {coupon.valid_from}"
        }), 200
    
    if coupon.valid_to and coupon.valid_to < current_time:
        return jsonify({
            "valid": False,
            "message": "Coupon has expired"
        }), 200
    
    # Check usage limit
    if coupon.usage_limit is not None and coupon.usage_limit <= 0:
        return jsonify({
            "valid": False,
            "message": "Coupon usage limit reached"
        }), 200
    
    return jsonify({
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type.value,
        "discount_value": str(coupon.discount_value),
        "min_order_amount": str(coupon.min_order_amount) if coupon.min_order_amount else None,
        "max_discount_amount": str(coupon.max_discount_amount) if coupon.max_discount_amount else None
    }), 200

@order_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_orders():
    """Admin endpoint to get all orders with filtering and pagination"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status', '')
        search = request.args.get('search', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # Build query
        query = Order.query
        
        # Apply filters
        if status_filter:
            query = query.filter(Order.order_status == OrderStatus(status_filter))
        
        if search:
            # Search by order ID, user email, or username
            query = query.join(User).filter(
                db.or_(
                    Order.order_id == search if search.isdigit() else False,
                    User.email.contains(search),
                    User.username.contains(search)
                )
            )
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Order.order_date >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Order.order_date <= to_date)
            except ValueError:
                pass
        
        # Order by most recent first
        query = query.order_by(Order.order_date.desc())
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        orders = []
        for order in pagination.items:
            order_data = {
                'order_id': order.order_id,
                'order_date': order.order_date.isoformat() if order.order_date else None,
                'total_amount': order.total_amount,
                'order_status': order.order_status.value if order.order_status else None,
                'shipping_address': order.shipping_address,
                'user': {
                    'id': order.user.id if order.user else None,
                    'username': order.user.username if order.user else None,
                    'email': order.user.email if order.user else None
                },
                'items_count': len(order.order_items) if order.order_items else 0,
                'payment_status': order.payment.payment_status.value if order.payment else None,
                'shipping_status': order.order_items[0].shipping_status.value if order.order_items else None
            }
            orders.append(order_data)
        
        return jsonify({
            'orders': orders,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch orders", "details": str(e)}), 500

@order_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_order_stats():
    """Admin endpoint to get order statistics"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        from_date = datetime.now() - timedelta(days=days)
        
        # Get orders in date range
        orders = Order.query.filter(Order.order_date >= from_date).all()
        
        # Calculate statistics
        total_orders = len(orders)
        total_revenue = sum(order.total_amount for order in orders)
        pending_orders = len([o for o in orders if o.order_status == OrderStatus.PENDING])
        completed_orders = len([o for o in orders if o.order_status == OrderStatus.DELIVERED])
        cancelled_orders = len([o for o in orders if o.order_status == OrderStatus.CANCELLED])
        
        # Get status distribution
        status_counts = {}
        for order in orders:
            status = order.order_status.value if order.order_status else 'unknown'
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Get daily revenue for chart
        daily_revenue = {}
        for order in orders:
            date_str = order.order_date.strftime('%Y-%m-%d') if order.order_date else 'unknown'
            daily_revenue[date_str] = daily_revenue.get(date_str, 0) + order.total_amount
        
        return jsonify({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'status_distribution': status_counts,
            'daily_revenue': daily_revenue,
            'average_order_value': total_revenue / total_orders if total_orders > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch order stats", "details": str(e)}), 500

@order_bp.route('/admin/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Admin endpoint to update order status"""
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({"error": "Status is required"}), 400
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Update order status
        order.order_status = OrderStatus(new_status)
        
        # Update shipping status for all items
        for item in order.order_items:
            if new_status == 'delivered':
                item.shipping_status = ShippingStatus.DELIVERED
            elif new_status == 'shipped':
                item.shipping_status = ShippingStatus.SHIPPED
            elif new_status == 'processing':
                item.shipping_status = ShippingStatus.PENDING
        
        db.session.commit()
        
        return jsonify({
            "message": "Order status updated successfully",
            "order_id": order_id,
            "new_status": new_status
        }), 200
        
    except ValueError as e:
        return jsonify({"error": "Invalid status value"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update order status", "details": str(e)}), 500