from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserShippingInformation, User
from datetime import datetime

shipping_bp = Blueprint('shipping', __name__, url_prefix='/shipping')

def _extract_user_id(identity):
    """Extract user ID from JWT identity"""
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity

@shipping_bp.route('/save', methods=['POST'])
@jwt_required()
def save_shipping_information():
    """Save user's shipping information for future use"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'first_name', 'last_name', 'country', 'street_address',
            'city', 'province', 'zip_code', 'phone', 'email'
        ]
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Check if user wants to set this as default
        is_default = data.get('is_default', False)
        
        # If setting as default, unset other default addresses
        if is_default:
            UserShippingInformation.query.filter_by(
                user_id=user_id, 
                is_default=True
            ).update({'is_default': False})
        
        # Create new shipping information
        shipping_info = UserShippingInformation(
            user_id=user_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            company_name=data.get('company_name'),
            country=data['country'],
            street_address=data['street_address'],
            city=data['city'],
            province=data['province'],
            zip_code=data['zip_code'],
            phone=data['phone'],
            email=data['email'],
            additional_info=data.get('additional_info'),
            is_default=is_default
        )
        
        db.session.add(shipping_info)
        db.session.commit()
        
        return jsonify({
            "message": "Shipping information saved successfully",
            "shipping_info": shipping_info.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save shipping information: {str(e)}"}), 500

@shipping_bp.route('/get', methods=['GET'])
@jwt_required()
def get_shipping_information():
    """Get user's saved shipping information"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        # Get all shipping information for the user
        shipping_infos = UserShippingInformation.query.filter_by(user_id=user_id).order_by(
            UserShippingInformation.is_default.desc(),
            UserShippingInformation.updated_at.desc()
        ).all()
        
        return jsonify({
            "shipping_infos": [info.to_dict() for info in shipping_infos]
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve shipping information: {str(e)}"}), 500

@shipping_bp.route('/default', methods=['GET'])
@jwt_required()
def get_default_shipping_information():
    """Get user's default shipping information"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        # Get default shipping information
        default_shipping = UserShippingInformation.query.filter_by(
            user_id=user_id, 
            is_default=True
        ).first()
        
        if not default_shipping:
            # If no default, get the most recent one
            default_shipping = UserShippingInformation.query.filter_by(
                user_id=user_id
            ).order_by(UserShippingInformation.updated_at.desc()).first()
        
        if default_shipping:
            return jsonify({
                "shipping_info": default_shipping.to_dict()
            }), 200
        else:
            return jsonify({
                "message": "No shipping information found"
            }), 404
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve default shipping information: {str(e)}"}), 500

@shipping_bp.route('/update/<int:shipping_id>', methods=['PUT'])
@jwt_required()
def update_shipping_information(shipping_id):
    """Update specific shipping information"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        shipping_info = UserShippingInformation.query.filter_by(
            id=shipping_id, 
            user_id=user_id
        ).first()
        
        if not shipping_info:
            return jsonify({"error": "Shipping information not found"}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'first_name' in data:
            shipping_info.first_name = data['first_name']
        if 'last_name' in data:
            shipping_info.last_name = data['last_name']
        if 'company_name' in data:
            shipping_info.company_name = data['company_name']
        if 'country' in data:
            shipping_info.country = data['country']
        if 'street_address' in data:
            shipping_info.street_address = data['street_address']
        if 'city' in data:
            shipping_info.city = data['city']
        if 'province' in data:
            shipping_info.province = data['province']
        if 'zip_code' in data:
            shipping_info.zip_code = data['zip_code']
        if 'phone' in data:
            shipping_info.phone = data['phone']
        if 'email' in data:
            shipping_info.email = data['email']
        if 'additional_info' in data:
            shipping_info.additional_info = data['additional_info']
        
        # Handle default setting
        if 'is_default' in data and data['is_default']:
            # Unset other default addresses
            UserShippingInformation.query.filter_by(
                user_id=user_id, 
                is_default=True
            ).update({'is_default': False})
            shipping_info.is_default = True
        
        shipping_info.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Shipping information updated successfully",
            "shipping_info": shipping_info.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update shipping information: {str(e)}"}), 500

@shipping_bp.route('/delete/<int:shipping_id>', methods=['DELETE'])
@jwt_required()
def delete_shipping_information(shipping_id):
    """Delete specific shipping information"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        shipping_info = UserShippingInformation.query.filter_by(
            id=shipping_id, 
            user_id=user_id
        ).first()
        
        if not shipping_info:
            return jsonify({"error": "Shipping information not found"}), 404
        
        db.session.delete(shipping_info)
        db.session.commit()
        
        return jsonify({
            "message": "Shipping information deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete shipping information: {str(e)}"}), 500

@shipping_bp.route('/set-default/<int:shipping_id>', methods=['PUT'])
@jwt_required()
def set_default_shipping_information(shipping_id):
    """Set a specific shipping information as default"""
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        
        if not user_id:
            return jsonify({"error": "User not authenticated"}), 401
        
        shipping_info = UserShippingInformation.query.filter_by(
            id=shipping_id, 
            user_id=user_id
        ).first()
        
        if not shipping_info:
            return jsonify({"error": "Shipping information not found"}), 404
        
        # Unset other default addresses
        UserShippingInformation.query.filter_by(
            user_id=user_id, 
            is_default=True
        ).update({'is_default': False})
        
        # Set this one as default
        shipping_info.is_default = True
        shipping_info.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Default shipping information updated successfully",
            "shipping_info": shipping_info.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to set default shipping information: {str(e)}"}), 500
