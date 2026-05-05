from flask import Blueprint, request, jsonify, current_app
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Order, Payment, PaymentStatus, User
from utils.stripe_client import stripe_client
import stripe
import os

stripe_bp = Blueprint('stripe', __name__)

def _extract_user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity

@stripe_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    """
    Create a Stripe payment intent for bank transfer
    """
    identity = get_jwt_identity()
    user_id = _extract_user_id(identity)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'order_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        amount = float(data['amount'])
        order_id = data['order_id']
        
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
        
        # Verify order belongs to user
        order = Order.query.filter_by(order_id=order_id, user_id=user_id).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Create metadata for the payment intent
        metadata = {
            'order_id': str(order_id),
            'user_id': str(user_id),
            'order_total': str(order.total_amount)
        }
        
        # Create payment intent
        result = stripe_client.create_bank_transfer_payment_intent(
            amount=amount,
            currency='kes',
            metadata=metadata
        )
        
        if result['success']:
            # Update payment record with Stripe payment intent ID
            payment = Payment.query.filter_by(order_id=order_id).first()
            if payment:
                payment.transaction_id = result['payment_intent_id']
                payment.payment_status = PaymentStatus.PENDING
                db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_intent_id': result['payment_intent_id'],
                'client_secret': result['client_secret'],
                'amount': result['amount']
            }), 200
        else:
            return jsonify({"error": result['error']}), 400
            
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400
    except Exception as e:
        return jsonify({"error": f"Payment intent creation failed: {str(e)}"}), 500

@stripe_bp.route('/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment():
    """
    Confirm a Stripe payment
    """
    identity = get_jwt_identity()
    user_id = _extract_user_id(identity)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['payment_intent_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        payment_intent_id = data['payment_intent_id']
        
        # Retrieve payment intent from Stripe
        result = stripe_client.retrieve_payment_intent(payment_intent_id)
        
        if not result['success']:
            return jsonify({"error": result['error']}), 400
        
        payment_intent = result['payment_intent']
        
        # Verify the payment intent belongs to the user
        if payment_intent.metadata.get('user_id') != str(user_id):
            return jsonify({"error": "Payment intent does not belong to user"}), 403
        
        # Update payment status based on Stripe status
        order_id = payment_intent.metadata.get('order_id')
        payment = Payment.query.filter_by(order_id=order_id).first()
        
        if payment:
            if payment_intent.status == 'succeeded':
                payment.payment_status = PaymentStatus.COMPLETED
                # Update order status if needed
                order = Order.query.get(order_id)
                if order:
                    order.order_status = 'confirmed'  # You might want to use an enum here
            elif payment_intent.status == 'requires_payment_method':
                payment.payment_status = PaymentStatus.FAILED
            elif payment_intent.status == 'canceled':
                payment.payment_status = PaymentStatus.CANCELLED
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'payment_intent_id': payment_intent_id,
            'status': payment_intent.status,
            'amount': payment_intent.amount / 100  # Convert from cents
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Payment confirmation failed: {str(e)}"}), 500

@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhooks for payment status updates
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({"error": "Invalid signature"}), 400
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_success(payment_intent)
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_failure(payment_intent)
    
    return jsonify({"success": True}), 200

def handle_payment_success(payment_intent):
    """
    Handle successful payment
    """
    try:
        order_id = payment_intent.metadata.get('order_id')
        if order_id:
            payment = Payment.query.filter_by(order_id=order_id).first()
            if payment:
                payment.payment_status = PaymentStatus.COMPLETED
                db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error handling payment success: {str(e)}")

def handle_payment_failure(payment_intent):
    """
    Handle failed payment
    """
    try:
        order_id = payment_intent.metadata.get('order_id')
        if order_id:
            payment = Payment.query.filter_by(order_id=order_id).first()
            if payment:
                payment.payment_status = PaymentStatus.FAILED
                db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error handling payment failure: {str(e)}")

@stripe_bp.route('/refund', methods=['POST'])
@jwt_required()
def create_refund():
    """
    Create a refund for a payment
    """
    identity = get_jwt_identity()
    user_id = _extract_user_id(identity)
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['payment_intent_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        payment_intent_id = data['payment_intent_id']
        amount = data.get('amount')  # Optional, if not provided, full refund
        reason = data.get('reason', 'requested_by_customer')
        
        # Verify the payment belongs to the user
        payment = Payment.query.filter_by(transaction_id=payment_intent_id).first()
        if not payment or payment.user_id != user_id:
            return jsonify({"error": "Payment not found or unauthorized"}), 404
        
        # Create refund
        result = stripe_client.create_refund(
            payment_intent_id=payment_intent_id,
            amount=amount,
            reason=reason
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'refund_id': result['refund_id'],
                'amount': result['amount'],
                'status': result['status']
            }), 200
        else:
            return jsonify({"error": result['error']}), 400
            
    except Exception as e:
        return jsonify({"error": f"Refund creation failed: {str(e)}"}), 500
