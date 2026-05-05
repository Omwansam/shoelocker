from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from extensions import db
from models import User, Order, OrderItem, Product, PaymentMethod
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError

customers_bp = Blueprint('customers', __name__)

# Utility function to retrieve the current logged-in user based on the JWT identity
def _extract_user_id(identity):
    """Support both int identity and dict identity with {'id': ...}."""
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity

def get_current_user():
    current_identity = get_jwt_identity()
    user_id = _extract_user_id(current_identity)
    if not user_id:
        return None
    return db.session.get(User, user_id)

def is_admin():
    """Check if current user is admin"""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        user = User.query.get(user_id)
        return user and user.is_admin
    except:
        return False

@customers_bp.route('/admin/customers', methods=['GET'])
@jwt_required()
def get_customers():
    """Admin endpoint to get all customers with filtering and pagination"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters for pagination and filtering
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status_filter = request.args.get('status', '')
        
        # Build query - only get non-admin users
        query = User.query.filter(User.is_admin == False)
        
        # Add search filter if provided
        if search:
            query = query.filter(
                db.or_(
                    User.username.contains(search),
                    User.email.contains(search)
                )
            )
        
        # Add status filter if provided
        if status_filter == 'active':
            # Users with recent activity (orders in last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            active_user_ids = db.session.query(Order.user_id).filter(
                Order.order_date >= thirty_days_ago
            ).distinct().subquery()
            query = query.filter(User.id.in_(active_user_ids))
        elif status_filter == 'inactive':
            # Users with no orders or old orders
            thirty_days_ago = datetime.now() - timedelta(days=30)
            active_user_ids = db.session.query(Order.user_id).filter(
                Order.order_date >= thirty_days_ago
            ).distinct().subquery()
            query = query.filter(~User.id.in_(active_user_ids))
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        customers = []
        for user in pagination.items:
            try:
                # Get customer statistics
                order_count = Order.query.filter_by(user_id=user.id).count()
                
                # Get total spent safely
                total_spent_result = db.session.query(db.func.sum(Order.total_amount)).filter(
                    Order.user_id == user.id,
                    Order.order_status == 'delivered'
                ).scalar()
                total_spent = float(total_spent_result) if total_spent_result else 0.0
                
                # Get last order safely
                last_order = Order.query.filter_by(user_id=user.id).order_by(
                    Order.order_date.desc()
                ).first()
                
                customer_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'created_at': None,  # User model doesn't have created_at
                    'order_count': order_count,
                    'total_spent': total_spent,
                    'last_order_date': last_order.order_date.isoformat() if last_order and last_order.order_date else None,
                    'status': 'active' if order_count > 0 else 'inactive'
                }
                customers.append(customer_data)
            except Exception as user_error:
                print(f"Error processing user {user.id}: {user_error}")
                # Continue with other users
                continue
        
        return jsonify({
            'customers': customers,
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
        print(f"Error in get_customers: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/customers/stats', methods=['GET'])
@jwt_required()
def get_customer_stats():
    """Admin endpoint to get customer statistics"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        from_date = datetime.now() - timedelta(days=days)
        
        # Get all customers (non-admin users)
        total_customers = User.query.filter(User.is_admin == False).count()
        
        # Get customers with orders in date range
        active_customers = db.session.query(Order.user_id).filter(
            Order.order_date >= from_date
        ).distinct().count()
        
        # Get new customers in date range
        new_customers = User.query.filter(
            User.is_admin == False,
            getattr(User, 'created_at', None) >= from_date if hasattr(User, 'created_at') else True
        ).count()
        
        # Get top customers by spending
        top_customers = db.session.query(
            User.id,
            User.username,
            User.email,
            db.func.sum(Order.total_amount).label('total_spent'),
            db.func.count(Order.order_id).label('order_count')
        ).join(Order).filter(
            User.is_admin == False,
            Order.order_status == 'delivered'
        ).group_by(User.id).order_by(
            db.func.sum(Order.total_amount).desc()
        ).limit(10).all()
        
        top_customers_data = []
        for customer in top_customers:
            top_customers_data.append({
                'id': customer.id,
                'username': customer.username,
                'email': customer.email,
                'total_spent': float(customer.total_spent),
                'order_count': customer.order_count
            })
        
        return jsonify({
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_customers': new_customers,
            'inactive_customers': total_customers - active_customers,
            'top_customers': top_customers_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/customers/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_details(customer_id):
    """Admin endpoint to get detailed customer information"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(customer_id)
        if not user:
            return jsonify({'error': 'Customer not found'}), 404
        
        if user.is_admin:
            return jsonify({'error': 'Cannot view admin user details'}), 403
        
        # Get customer orders safely
        try:
            orders = Order.query.filter_by(user_id=user.id).order_by(
                Order.order_date.desc()
            ).all()
            
            orders_data = []
            for order in orders:
                try:
                    order_items = []
                    for item in order.order_items:
                        try:
                            product = Product.query.get(item.product_id)
                            order_items.append({
                                'product_id': item.product_id,
                                'product_name': product.product_name if product else 'Unknown Product',
                                'quantity': item.quantity,
                                'price': item.price,
                                'shipping_status': item.shipping_status.value if item.shipping_status else None
                            })
                        except Exception as item_error:
                            print(f"Error processing order item {item.order_item_id}: {item_error}")
                            continue
                    
                    orders_data.append({
                        'order_id': order.order_id,
                        'order_date': order.order_date.isoformat() if order.order_date else None,
                        'total_amount': order.total_amount,
                        'order_status': order.order_status.value if order.order_status else None,
                        'shipping_address': order.shipping_address,
                        'items': order_items
                    })
                except Exception as order_error:
                    print(f"Error processing order {order.order_id}: {order_error}")
                    continue
        except Exception as orders_error:
            print(f"Error getting orders: {orders_error}")
            orders_data = []
        
        # Get payment methods safely
        try:
            payment_methods = []
            for pm in user.payment_method:
                try:
                    payment_methods.append({
                        'id': pm.payment_method_id,
                        'card_type': pm.card_type,
                        'card_number': pm.card_number[-4:] if pm.card_number else '****',  # Only show last 4 digits
                        'expiration_date': pm.expiration_date
                    })
                except Exception as pm_error:
                    print(f"Error processing payment method {pm.payment_method_id}: {pm_error}")
                    continue
        except Exception as pm_error:
            print(f"Error getting payment methods: {pm_error}")
            payment_methods = []
        
        customer_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': None,  # User model doesn't have created_at
            'total_orders': len(orders_data),
            'total_spent': sum(order.get('total_amount', 0) for order in orders_data if order.get('order_status') == 'delivered'),
            'orders': orders_data,
            'payment_methods': payment_methods
        }
        
        return jsonify(customer_data), 200
        
    except Exception as e:
        print(f"Error in get_customer_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/customers/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Admin endpoint to update customer information"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(customer_id)
        if not user:
            return jsonify({'error': 'Customer not found'}), 404
        
        if user.is_admin:
            return jsonify({'error': 'Cannot modify admin user'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Customer updated successfully',
            'customer_id': customer_id
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/customers/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Admin endpoint to delete a customer"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(customer_id)
        if not user:
            return jsonify({'error': 'Customer not found'}), 404
        
        if user.is_admin:
            return jsonify({'error': 'Cannot delete admin user'}), 403
        
        # Check if customer has orders
        order_count = Order.query.filter_by(user_id=user.id).count()
        if order_count > 0:
            return jsonify({
                'error': f'Cannot delete customer with {order_count} orders. Please handle orders first.'
            }), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Customer deleted successfully',
            'customer_id': customer_id
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/customers/bulk-action', methods=['POST'])
@jwt_required()
def bulk_customer_action():
    """Admin endpoint for bulk customer actions"""
    try:
        # Check if current user is admin
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        customer_ids = data.get('customer_ids', [])
        action = data.get('action', '')
        
        if not customer_ids:
            return jsonify({'error': 'No customer IDs provided'}), 400
        
        if action not in ['activate', 'deactivate', 'delete']:
            return jsonify({'error': 'Invalid action'}), 400
        
        customers = User.query.filter(
            User.id.in_(customer_ids),
            User.is_admin == False
        ).all()
        
        if action == 'delete':
            # Check if any customers have orders
            for customer in customers:
                order_count = Order.query.filter_by(user_id=customer.id).count()
                if order_count > 0:
                    return jsonify({
                        'error': f'Customer {customer.username} has {order_count} orders and cannot be deleted'
                    }), 400
            
            for customer in customers:
                db.session.delete(customer)
        elif action == 'activate':
            # Mark customers as active (this could be implemented with a status field)
            pass
        elif action == 'deactivate':
            # Mark customers as inactive (this could be implemented with a status field)
            pass
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bulk action {action} completed successfully',
            'affected_customers': len(customers)
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/admin/test', methods=['GET'])
def test_customers():
    """Test endpoint to debug customer route issues"""
    try:
        # Simple test without complex queries
        user_count = User.query.filter(User.is_admin == False).count()
        return jsonify({
            'message': 'Customers route is working',
            'user_count': user_count,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

@customers_bp.route('/admin/debug', methods=['GET'])
def debug_customers():
    """Debug endpoint to test basic functionality"""
    try:
        # Test basic database connection
        user_count = User.query.count()
        admin_count = User.query.filter(User.is_admin == True).count()
        customer_count = User.query.filter(User.is_admin == False).count()
        
        # Test basic order query
        order_count = Order.query.count()
        
        return jsonify({
            'message': 'Debug endpoint working',
            'total_users': user_count,
            'admin_users': admin_count,
            'customer_users': customer_count,
            'total_orders': order_count,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500
