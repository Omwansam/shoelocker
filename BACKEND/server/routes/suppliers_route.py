from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func, desc, asc
from datetime import datetime, timedelta
import csv
import io

from models import db, User, Supplier, Product, Order, OrderItem, UserRole

suppliers_bp = Blueprint('suppliers', __name__)

def _extract_user(identity_value=None):
    """Resolve current user from JWT identity or claims. Accepts id/username/email/dict shapes."""
    try:
        identity = identity_value if identity_value is not None else get_jwt_identity()
        
        if identity is None:
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
        try:
            claims = get_jwt() or {}
            candidates.extend([
                claims.get('user_id'), claims.get('id'), claims.get('sub'),
                claims.get('username'), claims.get('email')
            ])
        except Exception:
            pass

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
        # Check JWT claims first (most reliable)
        try:
            claims = get_jwt() or {}
            role_claim = claims.get('role')
            is_admin_claim = claims.get('is_admin')
            
            if role_claim and str(role_claim).upper() == 'ADMIN':
                return True
            if is_admin_claim is True:
                return True
        except Exception:
            pass

        # Fallback to database lookup
        user = _extract_user()
        if not user:
            return False
            
        # Check user role
        if hasattr(user, 'role'):
            if isinstance(user.role, UserRole):
                return user.role == UserRole.ADMIN
            elif isinstance(user.role, str):
                return user.role.upper() == 'ADMIN'
        
        # Check is_admin field
        if hasattr(user, 'is_admin'):
            return user.is_admin is True
            
        return False
    except Exception as e:
        print(f"Error checking admin status: {e}")
        return False

@suppliers_bp.route('/admin/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    """Get all suppliers with pagination and filtering"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        status = request.args.get('status', '')
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')

        # Build query
        query = Supplier.query

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Supplier.name.ilike(search_term),
                    Supplier.contact_person.ilike(search_term),
                    Supplier.email.ilike(search_term)
                )
            )

        if category:
            query = query.filter(Supplier.category == category)

        if status:
            query = query.filter(Supplier.status == status)

        # Apply sorting
        if hasattr(Supplier, sort_by):
            sort_column = getattr(Supplier, sort_by)
            if sort_order == 'desc':
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(Supplier.name)

        # Get paginated results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )

        suppliers = []
        for supplier in pagination.items:
            # Get supplier statistics
            products_count = Product.query.filter_by(supplier_id=supplier.supplier_id).count()
            orders_count = db.session.query(Order).join(OrderItem).join(Product).filter(
                Product.supplier_id == supplier.supplier_id
            ).distinct(Order.order_id).count()
            
            total_spent = db.session.query(func.sum(OrderItem.price * OrderItem.quantity)).join(
                Product
            ).filter(Product.supplier_id == supplier.supplier_id).scalar() or 0

            suppliers.append({
                'id': supplier.supplier_id,
                'name': supplier.name,
                'category': supplier.category,
                'contact_person': supplier.contact_person,
                'email': supplier.email,
                'phone': supplier.phone,
                'address': supplier.address,
                'website': supplier.website,
                'rating': float(supplier.rating) if supplier.rating else 0.0,
                'products': products_count,
                'orders': orders_count,
                'total_spent': float(total_spent),
                'status': supplier.status,
                'last_order': supplier.last_order_date.isoformat() if supplier.last_order_date else None,
                'notes': supplier.notes,
                'created_at': supplier.created_at.isoformat() if supplier.created_at else None,
                'updated_at': supplier.updated_at.isoformat() if supplier.updated_at else None
            })

        return jsonify({
            'suppliers': suppliers,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })

    except Exception as e:
        print(f"Error in get_suppliers: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers/<int:supplier_id>', methods=['GET'])
@jwt_required()
def get_supplier(supplier_id):
    """Get supplier by ID"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404

        # Get supplier statistics
        products_count = Product.query.filter_by(supplier_id=supplier.supplier_id).count()
        orders_count = db.session.query(Order).join(OrderItem).join(Product).filter(
            Product.supplier_id == supplier.supplier_id
        ).distinct(Order.order_id).count()
        
        total_spent = db.session.query(func.sum(OrderItem.price * OrderItem.quantity)).join(
            Product
        ).filter(Product.supplier_id == supplier.supplier_id).scalar() or 0

        supplier_data = {
            'id': supplier.supplier_id,
            'name': supplier.name,
            'category': supplier.category,
            'contact_person': supplier.contact_person,
            'email': supplier.email,
            'phone': supplier.phone,
            'address': supplier.address,
            'website': supplier.website,
            'rating': float(supplier.rating) if supplier.rating else 0.0,
            'products': products_count,
            'orders': orders_count,
            'total_spent': float(total_spent),
            'status': supplier.status,
            'last_order': supplier.last_order_date.isoformat() if supplier.last_order_date else None,
            'notes': supplier.notes,
            'created_at': supplier.created_at.isoformat() if supplier.created_at else None,
            'updated_at': supplier.updated_at.isoformat() if supplier.updated_at else None
        }

        return jsonify(supplier_data)

    except Exception as e:
        print(f"Error in get_supplier: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers', methods=['POST'])
@jwt_required()
def create_supplier():
    """Create new supplier"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category', 'contact_person', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check if supplier with same email already exists
        existing_supplier = Supplier.query.filter_by(email=data['email']).first()
        if existing_supplier:
            return jsonify({'error': 'Supplier with this email already exists'}), 409

        # Create new supplier
        new_supplier = Supplier(
            name=data['name'],
            category=data['category'],
            contact_person=data['contact_person'],
            email=data['email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            website=data.get('website', ''),
            notes=data.get('notes', ''),
            status='active',
            rating=0.0
        )

        db.session.add(new_supplier)
        db.session.commit()

        return jsonify({
            'message': 'Supplier created successfully',
            'id': new_supplier.supplier_id,
            'name': new_supplier.name,
            'email': new_supplier.email
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in create_supplier: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(supplier_id):
    """Update supplier"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404

        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            supplier.name = data['name']
        if 'category' in data:
            supplier.category = data['category']
        if 'contact_person' in data:
            supplier.contact_person = data['contact_person']
        if 'email' in data:
            # Check if email is already taken by another supplier
            existing_supplier = Supplier.query.filter(
                Supplier.email == data['email'],
                Supplier.supplier_id != supplier_id
            ).first()
            if existing_supplier:
                return jsonify({'error': 'Email already taken by another supplier'}), 409
            supplier.email = data['email']
        if 'phone' in data:
            supplier.phone = data['phone']
        if 'address' in data:
            supplier.address = data['address']
        if 'website' in data:
            supplier.website = data['website']
        if 'notes' in data:
            supplier.notes = data['notes']
        if 'status' in data:
            supplier.status = data['status']
        if 'rating' in data:
            supplier.rating = data['rating']

        supplier.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Supplier updated successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in update_supplier: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    """Delete supplier"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404

        # Check if supplier has associated products
        products_count = Product.query.filter_by(supplier_id=supplier_id).count()
        if products_count > 0:
            return jsonify({
                'error': f'Cannot delete supplier. {products_count} products are associated with this supplier.'
            }), 400

        db.session.delete(supplier)
        db.session.commit()

        return jsonify({
            'message': 'Supplier deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_supplier: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers/stats', methods=['GET'])
@jwt_required()
def get_supplier_stats():
    """Get supplier statistics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        # Total suppliers
        total_suppliers = Supplier.query.count()
        active_suppliers = Supplier.query.filter_by(status='active').count()
        inactive_suppliers = Supplier.query.filter_by(status='inactive').count()

        # Suppliers by category
        category_stats = db.session.query(
            Supplier.category,
            func.count(Supplier.supplier_id).label('count')
        ).group_by(Supplier.category).all()

        # Top rated suppliers
        top_rated = db.session.query(
            Supplier.supplier_id,
            Supplier.name,
            Supplier.rating
        ).filter(
            Supplier.rating > 0
        ).order_by(desc(Supplier.rating)).limit(5).all()

        # Recent suppliers
        recent_suppliers = db.session.query(
            Supplier.supplier_id,
            Supplier.name,
            Supplier.created_at
        ).order_by(desc(Supplier.created_at)).limit(5).all()

        return jsonify({
            'total_suppliers': total_suppliers,
            'active_suppliers': active_suppliers,
            'inactive_suppliers': inactive_suppliers,
            'category_distribution': [
                {'category': cat, 'count': count} 
                for cat, count in category_stats
            ],
            'top_rated': [
                {'id': s.supplier_id, 'name': s.name, 'rating': float(s.rating)}
                for s in top_rated
            ],
            'recent_suppliers': [
                {'id': s.supplier_id, 'name': s.name, 'created_at': s.created_at.isoformat()}
                for s in recent_suppliers
            ]
        })

    except Exception as e:
        print(f"Error in get_supplier_stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@suppliers_bp.route('/admin/suppliers/export', methods=['GET'])
@jwt_required()
def export_suppliers():
    """Export suppliers data"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        format_type = request.args.get('format', 'csv')
        
        if format_type != 'csv':
            return jsonify({'error': 'Only CSV export is supported'}), 400

        # Get all suppliers
        suppliers = Supplier.query.all()
        
        # Create CSV data
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Name', 'Category', 'Contact Person', 'Email', 'Phone',
            'Address', 'Website', 'Rating', 'Status', 'Notes', 'Created At'
        ])
        
        # Write data
        for supplier in suppliers:
            writer.writerow([
                supplier.supplier_id,
                supplier.name,
                supplier.category,
                supplier.contact_person,
                supplier.email,
                supplier.phone,
                supplier.address,
                supplier.website,
                supplier.rating,
                supplier.status,
                supplier.notes,
                supplier.created_at.isoformat() if supplier.created_at else ''
            ])
        
        output.seek(0)
        
        return jsonify({
            'csv_data': output.getvalue(),
            'filename': f'suppliers_export_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
        })

    except Exception as e:
        print(f"Error in export_suppliers: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
