from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import  jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from datetime import datetime
from extensions import db
from models import User, UserRole

# Blueprint Configuration
users_bp = Blueprint('auth', __name__)




# Utility function to retrieve the current logged-in user based on the JWT identity. and get the jwt_identity tokens
def _extract_user_id(identity):
    """Resolve user id from JWT identity (string, int, or legacy dict)."""
    if identity is None:
        return None
    if isinstance(identity, dict):
        identity = identity.get('id')
    if isinstance(identity, str) and identity.isdigit():
        return int(identity)
    return identity


def get_current_user():
    current_identity = get_jwt_identity()
    user_id = _extract_user_id(current_identity)
    if not user_id:
        return None
    return db.session.get(User, user_id)


def _resolve_user_role(user):
    """Return a valid UserRole for the user row."""
    if user.role in (UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.USER):
        return user.role
    if user.is_admin:
        return UserRole.ADMIN
    return UserRole.USER


def _is_admin_role(role):
    return role in (UserRole.ADMIN, UserRole.MANAGER)


def _serialize_user(user):
    role = _resolve_user_role(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "address": user.address,
        "is_active": bool(user.is_active),
        "is_admin": bool(user.is_admin) or _is_admin_role(role),
        "role": role.value,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@users_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected_route():

    user = get_current_user()
    if not user:
        # Handle case where user doesn't exist
        return jsonify({"message": "User not found"}), 404
    
    # Return a success response if user is valid
    return jsonify({
        "message": f"Welcome, {user.username}! You are authorized to access this route.",
        "is_admin": user.is_admin
        })


@users_bp.route("/refresh", methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    # Refresh token is required to generate new tokens
    current_identity = get_jwt_identity()
    user_id = _extract_user_id(current_identity)
    user = db.session.get(User, user_id) if user_id else None
    role = _resolve_user_role(user) if user else UserRole.USER
    is_admin_flag = _is_admin_role(role) or bool(user.is_admin) if user else False
    new_access_token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "role": role.value,
            "is_admin": is_admin_flag,
        },
    )
    return jsonify ({'access_token': new_access_token}), 200

@users_bp.route('/users', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    try:
        # Check if current user is admin
        current_user = get_current_user()
        if not current_user or not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters for pagination and filtering
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        # Build query
        query = User.query
        
        # Add search filter if provided
        if search:
            query = query.filter(
                User.username.contains(search) | 
                User.email.contains(search)
            )
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users = []
        for user in pagination.items:
            users.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        
        response = jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#####################################################################################USER LOGIN##################################################################################################
@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email or password"}), 401
    if user.is_active is False:
        return jsonify({"message": "Your account is inactive"}), 403

    # Update last_login timestamp and ensure admin role is set correctly
    try:
        user.last_login = datetime.utcnow()
        role = _resolve_user_role(user)
        # Keep `is_admin` and role in sync for legacy checks.
        user.is_admin = _is_admin_role(role)
        user.role = role
        db.session.commit()
    except Exception:
        db.session.rollback()
        role = _resolve_user_role(user)

    is_admin_flag = _is_admin_role(role) or bool(user.is_admin)
    additional_claims = {
        "role": role.value,
        "is_admin": is_admin_flag
    }

    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "message": "Login successful",
        "user": _serialize_user(user)
    }), 200   



#####################################################################################LOGOUT##################################################################################################
# @users_bp.route('/logout', methods=['POST'])
# @jwt_required()
# def logout():
#     """Record logout time for the user - temporarily disabled until migration is run"""
#     try:
#         current_user_id = get_jwt_identity()
#         if isinstance(current_user_id, dict):
#             user_id = current_user_id.get('id')
#         else:
#             user_id = current_user_id
#             
#         if not user_id:
#             return jsonify({"error": "Invalid user identity"}), 400
#             
#         user = User.query.get(user_id)
#         if not user:
#             return jsonify({"error": "User not found"}), 404
#             
#         # Record logout time
#         # user.last_logout = datetime.utcnow()  # Temporarily commented until migration is run
#         db.session.commit()
#         
#         return jsonify({"message": "Logout recorded successfully"}), 200
#         
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": f"Failed to record logout: {str(e)}"}), 500

#####################################################################################ADMIN ROLE UPDATE##################################################################################################
@users_bp.route('/admin/update-role', methods=['POST'])
@jwt_required()
def update_admin_role():
    """Update admin user role - for fixing existing admin users"""
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "Authentication required"}), 401
        current_role = _resolve_user_role(current_user)
        if not _is_admin_role(current_role):
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json() or {}
        email = data.get('email')
        new_role_raw = (data.get('role') or 'admin').strip().lower()
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update role
        if new_role_raw == 'admin':
            user.role = UserRole.ADMIN
            user.is_admin = True
        elif new_role_raw == 'manager':
            user.role = UserRole.MANAGER
            user.is_admin = True
        elif new_role_raw == 'staff':
            user.role = UserRole.STAFF
            user.is_admin = False
        else:
            user.role = UserRole.USER
            user.is_admin = False
            
        db.session.commit()
        
        return jsonify({
            "message": f"User role updated to {user.role.value}",
            "user": _serialize_user(user)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update role: {str(e)}"}), 500

#####################################################################################USER REGISTRATION##################################################################################################
@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400

    requested_role = str(data.get('role') or '').strip().upper()
    if data.get('is_admin') or requested_role in ('ADMIN', 'MANAGER', 'STAFF'):
        return jsonify({"error": "Admin accounts cannot be created via registration"}), 403

    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']
    first_name = (data.get('first_name') or '').strip() or None
    last_name = (data.get('last_name') or '').strip() or None
    phone = (data.get('phone') or '').strip() or None
    address = (data.get('address') or '').strip() or None

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    password_hash = generate_password_hash(password)

    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        address=address,
        is_admin=False,
        role=UserRole.USER,
        is_active=True,
    )
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created successfully", "user": _serialize_user(user)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "An error occurred while creating the user", "details": str(e)}), 500


@users_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": _serialize_user(user)}), 200


@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    if 'first_name' in data:
        user.first_name = (data.get('first_name') or '').strip() or None
    if 'last_name' in data:
        user.last_name = (data.get('last_name') or '').strip() or None
    if 'phone' in data:
        user.phone = (data.get('phone') or '').strip() or None
    if 'address' in data:
        user.address = (data.get('address') or '').strip() or None

    if 'password' in data and data['password']:
        new_password = data['password']
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        user.password_hash = generate_password_hash(new_password)

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated", "user": _serialize_user(user)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile", "details": str(e)}), 500

@users_bp.route('/admin/customers', methods=['GET'])
@jwt_required()
def get_customers():
    """Admin endpoint to get all customers with filtering and pagination"""
    try:
        # Check if current user is admin
        current_user = get_current_user()
        if not current_user or not current_user.is_admin:
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
            from datetime import datetime, timedelta
            from models import Order
            thirty_days_ago = datetime.now() - timedelta(days=30)
            active_user_ids = db.session.query(Order.user_id).filter(
                Order.order_date >= thirty_days_ago
            ).distinct().subquery()
            query = query.filter(User.id.in_(active_user_ids))
        elif status_filter == 'inactive':
            # Users with no orders or old orders
            from datetime import datetime, timedelta
            from models import Order
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
            # Get customer statistics
            from models import Order, Payment
            order_count = Order.query.filter_by(user_id=user.id).count()
            total_spent = db.session.query(db.func.sum(Order.total_amount)).filter(
                Order.user_id == user.id,
                Order.order_status == 'COMPLETED'
            ).scalar() or 0
            
            last_order = Order.query.filter_by(user_id=user.id).order_by(
                Order.order_date.desc()
            ).first()
            
            customer_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'order_count': order_count,
                'total_spent': float(total_spent),
                'last_order_date': last_order.order_date.isoformat() if last_order else None,
                'status': 'active' if order_count > 0 else 'inactive'
            }
            customers.append(customer_data)
        
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
        return jsonify({'error': str(e)}), 500

@users_bp.route('/admin/customers/stats', methods=['GET'])
@jwt_required()
def get_customer_stats():
    """Admin endpoint to get customer statistics"""
    try:
        # Check if current user is admin
        current_user = get_current_user()
        if not current_user or not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        from models import Order
        from datetime import datetime, timedelta
        
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
            User.created_at >= from_date
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
            Order.order_status == 'COMPLETED'
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

@users_bp.route('/admin/customers/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_details(customer_id):
    """Admin endpoint to get detailed customer information"""
    try:
        # Check if current user is admin
        current_user = get_current_user()
        if not current_user or not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(customer_id)
        if not user:
            return jsonify({'error': 'Customer not found'}), 404
        
        if user.is_admin:
            return jsonify({'error': 'Cannot view admin user details'}), 403
        
        # Get customer orders
        from models import Order, OrderItem, Product
        orders = Order.query.filter_by(user_id=user.id).order_by(
            Order.order_date.desc()
        ).all()
        
        orders_data = []
        for order in orders:
            order_items = []
            for item in order.order_items:
                product = Product.query.get(item.product_id)
                order_items.append({
                    'product_id': item.product_id,
                    'product_name': product.product_name if product else 'Unknown Product',
                    'quantity': item.quantity,
                    'price': item.price,
                    'shipping_status': item.shipping_status.value if item.shipping_status else None
                })
            
            orders_data.append({
                'order_id': order.order_id,
                'order_date': order.order_date.isoformat() if order.order_date else None,
                'total_amount': order.total_amount,
                'order_status': order.order_status.value if order.order_status else None,
                'shipping_address': order.shipping_address,
                'items': order_items
            })
        
        # Get payment methods
        payment_methods = []
        for pm in user.payment_method:
            payment_methods.append({
                'id': pm.payment_method_id,
                'card_type': pm.card_type,
                'card_number': pm.card_number[-4:],  # Only show last 4 digits
                'expiration_date': pm.expiration_date
            })
        
        customer_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'total_orders': len(orders),
            'total_spent': sum(order.total_amount for order in orders if order.order_status == 'COMPLETED'),
            'orders': orders_data,
            'payment_methods': payment_methods
        }
        
        return jsonify(customer_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500