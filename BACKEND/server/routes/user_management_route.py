from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func, desc, asc
from datetime import datetime, timedelta
import csv
import io

from models import db, User, Order, OrderItem, Product, UserRole

user_management_bp = Blueprint('user_management', __name__)

def _extract_user(identity_value=None):
    """Resolve current user from JWT identity or claims. Accepts id/username/email/dict shapes."""
    try:
        identity = identity_value if identity_value is not None else get_jwt_identity()
        claims = {}
        try:
            claims = get_jwt() or {}
        except Exception:
            claims = {}

        if identity is None and not claims:
            return None

        # Candidates in order of preference
        candidates = []
        if isinstance(identity, dict):
            candidates.extend([
                identity.get('user_id'), identity.get('id'), identity.get('sub'),
                identity.get('username'), identity.get('email')
            ])
        else:
            candidates.append(identity)

        # Add from claims
        candidates.extend([
            claims.get('user_id'), claims.get('id'), claims.get('sub'),
            claims.get('username'), claims.get('email')
        ])

        # Try id lookups first
        for cand in candidates:
            try:
                if cand is None:
                    continue
                user_id = int(cand)
                user = User.query.get(user_id)
                if user:
                    return user
            except (TypeError, ValueError):
                continue

        # Try username/email
        for cand in candidates:
            if isinstance(cand, str):
                user = User.query.filter_by(username=cand).first()
                if user:
                    return user
                user = User.query.filter_by(email=cand).first()
                if user:
                    return user

        return None
    except Exception as e:
        print(f"Error extracting user: {e}")
        return None

def is_admin():
    """Check if current user has admin role via JWT claims or DB lookup."""
    try:
        # Check identity payload first (some setups put role in identity)
        identity = None
        try:
            identity = get_jwt_identity()
        except Exception:
            identity = None
        if isinstance(identity, dict):
            ident_role = identity.get('role') or identity.get('roles')
            if isinstance(ident_role, str) and ident_role.upper() == 'ADMIN':
                return True
            if isinstance(ident_role, (list, tuple)) and any(str(r).upper() == 'ADMIN' for r in ident_role):
                return True
            if identity.get('is_admin') is True:
                return True

        # Then, trust JWT claims if provided
        try:
            claims = get_jwt() or {}
        except Exception:
            claims = {}

        role_claim = claims.get('role') or claims.get('roles')
        if isinstance(role_claim, str) and role_claim.upper() == 'ADMIN':
            return True
        if isinstance(role_claim, (list, tuple)) and any(str(r).upper() == 'ADMIN' for r in role_claim):
            return True
        if claims.get('is_admin') is True:
            return True

        # Fallback to database role
        user = _extract_user()
        if not user:
            return False
        role_value = user.role
        if isinstance(role_value, UserRole):
            return role_value == UserRole.ADMIN
        if isinstance(role_value, str):
            return role_value.upper() == 'ADMIN'
        return False
    except Exception as e:
        print(f"Error checking admin status: {e}")
        return False

@user_management_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with pagination and filtering"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', '').strip()
        status_filter = request.args.get('status', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = User.query
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        # Apply role filter
        if role_filter:
            try:
                role = UserRole(role_filter)
                query = query.filter(User.role == role)
            except ValueError:
                pass
        
        # Apply status filter
        if status_filter:
            if status_filter == 'active':
                query = query.filter(User.is_active == True)
            elif status_filter == 'inactive':
                query = query.filter(User.is_active == False)
        
        # Apply sorting
        if hasattr(User, sort_by):
            sort_column = getattr(User, sort_by)
            if sort_order == 'asc':
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(desc(User.created_at))
        
        # Get paginated results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users = pagination.items
        # Backfill last_login with current DB time for NULLs
        from datetime import datetime
        touched = False
        for u in users:
            if u.last_login is None:
                u.last_login = datetime.utcnow()
                touched = True
        if touched:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        
        # Format user data
        users_data = []
        for user in users:
            # Get user statistics
            total_orders = Order.query.filter_by(user_id=user.id).count()
            total_spent = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter_by(user_id=user.id).scalar() or 0
            
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': str(user.role),
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': (user.last_login or datetime.utcnow()).isoformat(),
                # 'last_logout': user.last_logout.isoformat() if user.last_logout else None,  # Temporarily commented until migration is run
                'total_orders': total_orders,
                'total_spent': float(total_spent),
                'phone': getattr(user, 'phone', None),
                'address': getattr(user, 'address', None)
            }
            users_data.append(user_data)
        
        return jsonify({
            'users': users_data,
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
        print(f"Error getting users: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user by ID"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user statistics
        total_orders = Order.query.filter_by(user_id=user.id).count()
        total_spent = db.session.query(func.coalesce(func.sum(Order.total_amount), 0)).filter_by(user_id=user.id).scalar() or 0
        
        # Get recent orders
        recent_orders = Order.query.filter_by(user_id=user.id).order_by(desc(Order.order_date)).limit(5).all()
        recent_orders_data = []
        for order in recent_orders:
            order_data = {
                'id': order.order_id,
                'order_date': order.order_date.isoformat() if order.order_date else None,
                'total_amount': float(order.total_amount),
                'status': str(order.status),
                'payment_status': str(order.payment_status)
            }
            recent_orders_data.append(order_data)
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': str(user.role),
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            # 'last_logout': user.last_logout.isoformat() if user.last_logout else None,  # Temporarily commented until migration is run
            'phone': getattr(user, 'phone', None),
            'address': getattr(user, 'address', None),
            'total_orders': total_orders,
            'total_spent': float(total_spent),
            'recent_orders': recent_orders_data
        }
        
        return jsonify(user_data), 200
        
    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Validate role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],  # This should be hashed in the User model
            role=role,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            is_active=data.get('is_active', True),
            phone=data.get('phone'),
            address=data.get('address')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': new_user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Admins are not allowed to alter users' login credentials
        if any(k in data for k in ('username', 'email', 'password', 'password_hash')):
            return jsonify({'error': 'Modifying login credentials is not allowed via this endpoint'}), 400
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        if 'role' in data:
            try:
                role = UserRole(data['role'])
                user.role = role
            except ValueError:
                return jsonify({'error': 'Invalid role'}), 400
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'address' in data:
            user.address = data['address']
        
        db.session.commit()
        
        return jsonify({'message': 'User updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has orders
        has_orders = Order.query.filter_by(user_id=user.id).first() is not None
        if has_orders:
            return jsonify({'error': 'Cannot delete user with existing orders'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting user: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/<int:user_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_user_status(user_id):
    """Toggle user active/inactive status"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = not user.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error toggling user status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/<int:user_id>/reset-password', methods=['PUT'])
@jwt_required()
def reset_user_password(user_id):
    """Reset user password"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_password = data.get('new_password')
        
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
        
        # Update password (this should be hashed in the User model)
        user.password = new_password
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error resetting password: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Total users
        total_users = User.query.count()
        
        # Active users
        active_users = User.query.filter_by(is_active=True).count()
        
        # Users by role
        users_by_role = db.session.query(
            User.role, 
            func.count(User.id)
        ).group_by(User.role).all()
        
        role_stats = {}
        for role, count in users_by_role:
            role_stats[str(role)] = count
        
        # New users in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        # Users with orders
        users_with_orders = db.session.query(
            func.count(func.distinct(Order.user_id))
        ).scalar() or 0
        
        # Top users by spending
        top_spenders = db.session.query(
            User.username,
            func.coalesce(func.sum(Order.total_amount), 0).label('total_spent')
        ).join(Order, User.id == Order.user_id).group_by(User.id, User.username).order_by(
            desc(func.coalesce(func.sum(Order.total_amount), 0))
        ).limit(5).all()
        
        top_spenders_data = []
        for username, total_spent in top_spenders:
            top_spenders_data.append({
                'username': username,
                'total_spent': float(total_spent)
            })
        
        return jsonify({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'users_by_role': role_stats,
            'new_users_30_days': new_users,
            'users_with_orders': users_with_orders,
            'top_spenders': top_spenders_data
        }), 200
        
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@user_management_bp.route('/admin/users/export', methods=['GET'])
@jwt_required()
def export_users():
    """Export users to CSV"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all users
        users = User.query.all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Username', 'Email', 'First Name', 'Last Name', 
            'Role', 'Status', 'Created At', 'Last Login', 'Phone', 'Address'  # Last Logout temporarily removed until migration is run
        ])
        
        # Write data
        for user in users:
            writer.writerow([
                user.id,
                user.username,
                user.email,
                user.first_name or '',
                user.last_name or '',
                str(user.role),
                'Active' if user.is_active else 'Inactive',
                user.created_at.isoformat() if user.created_at else '',
                user.last_login.isoformat() if user.last_login else '',
        # user.last_logout.isoformat() if user.last_logout else '',  # Temporarily commented until migration is run
                user.phone or '',
                user.address or ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'csv_data': output.getvalue()
        }), 200
        
    except Exception as e:
        print(f"Error exporting users: {e}")
        return jsonify({'error': 'Internal server error'}), 500
