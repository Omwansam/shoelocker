from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import PaymentMethod

payment_methods_bp = Blueprint('payment_methods', __name__)

@payment_methods_bp.route('', methods=['POST'])
@jwt_required()
def add_payment_method():
    """
    Add a payment method for the user
    Required JSON for card:
    {
        "card_type": "visa",
        "card_number": "4242424242424242",
        "expiration_date": "12/25",
        "security_code": "123",
        "billing_address": "123 Main St"
    }
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['card_type', 'card_number', 'expiration_date', 'security_code', 'billing_address']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # In a real application, you would tokenize the card with Stripe or another processor
        # Here we just store the details (in production, never store raw card details)
        
        payment_method = PaymentMethod(
            user_id=user_id,
            card_type=data['card_type'],
            card_number=data['card_number'][-4:],  # Store only last 4 digits
            expiration_date=data['expiration_date'],
            security_code=data['security_code'],  # In production, don't store this
            billing_address=data['billing_address']
        )
        db.session.add(payment_method)
        db.session.commit()
        
        return jsonify({
            "message": "Payment method added successfully",
            "payment_method_id": payment_method.payment_method_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add payment method: {str(e)}"}), 500

@payment_methods_bp.route('', methods=['GET'])
@jwt_required()
def get_payment_methods():
    """Get user's payment methods"""
    user_id = get_jwt_identity()
    
    payment_methods = PaymentMethod.query.filter_by(user_id=user_id).all()
    
    methods = []
    for method in payment_methods:
        methods.append({
            "payment_method_id": method.payment_method_id,
            "card_type": method.card_type,
            "card_number": f"**** **** **** {method.card_number}",
            "expiration_date": method.expiration_date,
            "billing_address": method.billing_address
        })
    
    return jsonify({"payment_methods": methods}), 200