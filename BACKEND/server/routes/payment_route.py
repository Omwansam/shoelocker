from flask import Blueprint, request, jsonify, current_app
from extensions import db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging

from models import Order, PaymentStatus, Payment, PaymentResponse, Transaction
from utils.daraja_client import initiate_stk_push, get_mpesa_access_token

# Blueprint Configuration
payment_bp = Blueprint('payment', __name__)
logger = logging.getLogger(__name__)


def _extract_user_id(identity):
    """Extract user ID from JWT identity"""
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity
@payment_bp.route('/mpesa/status/<string:checkout_request_id>', methods=['GET'])
@jwt_required()
def mpesa_status(checkout_request_id):
    """
    Get payment status by checkout request ID.
    Used by frontend to poll for payment completion.
    """
    try:
        # Handle mock checkout IDs for testing
        if checkout_request_id.startswith('ws_CO_'):
            return jsonify({
                "status": "COMPLETED",
                "payment_id": None,
                "mock": True,
                "message": "Mock payment completed"
            }), 200
        
        # Find payment by checkout request ID
        payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
        if not payment:
            logger.warning(f"Payment not found for checkout_request_id: {checkout_request_id}")
            return jsonify({"status": "NOT_FOUND", "message": "Payment not found"}), 404

        # Map payment status to string
        status_map = {
            PaymentStatus.PENDING: "PENDING",
            PaymentStatus.COMPLETED: "COMPLETED", 
            PaymentStatus.SUCCESS: "COMPLETED",
            PaymentStatus.FAILED: "FAILED",
            PaymentStatus.EXPIRED: "FAILED"
        }
        
        status = status_map.get(payment.payment_status, "PENDING")
        
        return jsonify({
            "status": status,
            "payment_id": payment.payment_id,
            "order_id": payment.order_id,
            "amount": payment.payment_amount,
            "payment_date": payment.payment_date.isoformat() if payment.payment_date else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500



@payment_bp.route('/mpesa/stkpush', methods=['POST'])
@jwt_required()
def mpesa_stk_push():
    """
    Initiate M-Pesa STK Push payment using official Safaricom Daraja API.
    
    Required JSON:
    {
        "phone_number": "2547XXXXXXXX" or "0712345678",
        "order_id": 123,
        "amount": 1000
    }
    
    Returns:
    {
        "message": "STK Push initiated successfully",
        "checkout_request_id": "ws_CO_...",
        "merchant_request_id": "m-pesa-...",
        "payment_id": 123
    }
    """
    identity = get_jwt_identity()
    user_id = _extract_user_id(identity)
    data = request.get_json()
    
    logger.info(f"M-Pesa STK Push request received from user {user_id}: {data}")
    
    # Validate input
    required_fields = ['phone_number', 'order_id', 'amount']
    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        logger.error(f"Missing required fields: {missing_fields}")
        return jsonify({
            "error": "Missing required fields",
            "missing": missing_fields,
            "required": required_fields
        }), 400
    
    # Validate amount
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount format"}), 400
    
    # Verify order belongs to user
    order = Order.query.filter_by(order_id=data['order_id'], user_id=user_id).first()
    if not order:
        logger.error(f"Order {data['order_id']} not found for user {user_id}")
        return jsonify({"error": "Order not found"}), 404
    
    # Check if order already has a completed payment
    if order.payment and order.payment.payment_status not in [PaymentStatus.PENDING, PaymentStatus.FAILED]:
        return jsonify({
            "error": "Order already has a completed payment",
            "current_status": order.payment.payment_status.value
        }), 400
    
    # Check M-Pesa configuration
    consumer_key = current_app.config.get('MPESA_CONSUMER_KEY')
    consumer_secret = current_app.config.get('MPESA_CONSUMER_SECRET')
    
    if not consumer_key or not consumer_secret or consumer_key == 'your-consumer-key-here':
        # Return mock response for testing without real credentials
        logger.warning("M-Pesa credentials not configured, returning mock response")
        mock_checkout_id = f"ws_CO_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        mock_merchant_id = f"m-pesa-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return jsonify({
            "message": "STK Push initiated successfully (MOCK - credentials not configured)",
            "checkout_request_id": mock_checkout_id,
            "merchant_request_id": mock_merchant_id,
            "payment_id": None,
            "mock": True
        }), 200
    
    # Initiate real STK Push
    try:
        logger.info(f"Initiating STK push for order {data['order_id']} with amount {data['amount']}")
        response, status_code = initiate_stk_push(
            phone_number=data['phone_number'],
            amount=data['amount'],
            order_id=data['order_id'],
            description=f"Payment for order {data['order_id']}"
        )
        
        logger.info(f"STK push response: {response}, status: {status_code}")
        
        if status_code != 200:
            logger.error(f"STK push failed with status {status_code}: {response}")
            return jsonify(response), status_code
        
        # Create or update payment record if STK Push was successful
        checkout_request_id = response.get('CheckoutRequestID')
        merchant_request_id = response.get('MerchantRequestID')
        
        if order.payment:
            payment = order.payment
            payment.payment_amount = str(amount)
            payment.transaction_id = checkout_request_id
            payment.payment_status = PaymentStatus.PENDING
        else:
            payment = Payment(
                order_id=data['order_id'],
                user_id=user_id,
                payment_amount=str(amount),
                transaction_id=checkout_request_id,
                payment_status=PaymentStatus.PENDING,
                payment_method_id=1  # M-Pesa payment method ID
            )
            db.session.add(payment)
            db.session.flush()  # Get payment ID

        # Create Transaction record
        transaction = Transaction(
            transaction_id=merchant_request_id,
            amount=amount,
            phone_number=data['phone_number'],
            status='PENDING',
            payment_id=payment.payment_id,
            user_id=user_id
        )
        db.session.add(transaction)

        try:
            db.session.commit()
            logger.info(f"Payment record created successfully: payment_id={payment.payment_id}")
            
            return jsonify({
                "message": "STK Push initiated successfully",
                "checkout_request_id": checkout_request_id,
                "merchant_request_id": merchant_request_id,
                "payment_id": payment.payment_id,
                "order_id": data['order_id']
            }), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error: {str(e)}")
            return jsonify({"error": "Failed to save payment details"}), 500
            
    except Exception as e:
        logger.error(f"STK push initiation failed: {str(e)}")
        return jsonify({"error": "Failed to initiate STK push"}), 500
    


######################################################################################################################################################################################

@payment_bp.route('/test-mpesa-config', methods=['GET'])
def test_mpesa_config():
    """
    Test endpoint to verify M-Pesa configuration and connectivity.
    Tests OAuth token generation with Safaricom API.
    """
    try:
        # Check if all required environment variables are set
        required_vars = [
            'MPESA_CONSUMER_KEY',
            'MPESA_CONSUMER_SECRET', 
            'MPESA_SHORTCODE',
            'MPESA_PASSKEY',


            'MPESA_CALLBACK_URL',
            'MPESA_ENVIRONMENT'
        ]
        
        missing_vars = []
        config_values = {}
        
        for var in required_vars:
            value = current_app.config.get(var)
            if not value:
                missing_vars.append(var)
            else:
                # Mask sensitive values
                if 'KEY' in var or 'SECRET' in var or 'PASSKEY' in var:
                    config_values[var] = value[:10] + "..." if len(value) > 10 else "***"
                else:
                    config_values[var] = value
        
        if missing_vars:
            return jsonify({
                "success": False,
                "error": f"Missing required environment variables: {', '.join(missing_vars)}",
                "missing_vars": missing_vars,
                "config": config_values
            }), 400
        
        # Test access token generation with Safaricom
        try:
            access_token = get_mpesa_access_token()
            
            return jsonify({
                "success": True,
                "message": "M-Pesa configuration is working and connected to Safaricom API",
                "access_token": access_token[:20] + "..." if access_token else None,
                "config": config_values,
                "api_urls": {
                    "auth_url": current_app.config.get('DARAJA_AUTH_URL'),
                    "stk_push_url": current_app.config.get('DARAJA_STK_PUSH_URL'),
                    "environment": current_app.config.get('MPESA_ENVIRONMENT')
                }
            }), 200
            
        except Exception as token_error:
            logger.error(f"Access token generation failed: {str(token_error)}")
            return jsonify({
                "success": False,
                "error": f"Failed to get access token: {str(token_error)}",
                "config": config_values,
                "api_urls": {
                    "auth_url": current_app.config.get('DARAJA_AUTH_URL'),
                    "stk_push_url": current_app.config.get('DARAJA_STK_PUSH_URL'),
                    "environment": current_app.config.get('MPESA_ENVIRONMENT')
                }
            }), 500
        
    except Exception as e:
        logger.error(f"M-Pesa config test failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "config": {
                "auth_url": current_app.config.get('DARAJA_AUTH_URL'),
                "stk_push_url": current_app.config.get('DARAJA_STK_PUSH_URL'),
                "environment": current_app.config.get('MPESA_ENVIRONMENT')
            }
        }), 500

@payment_bp.route('/callback', methods=['POST'])
def payment_callback():
    """
    Handle M-Pesa STK Push callback from Safaricom.
    This endpoint receives asynchronous notifications about payment status.
    """
    try:
        callback_data = request.get_json()
        logger.info(f"Received M-Pesa callback: {json.dumps(callback_data, indent=2)}")
        
        # Validate callback structure
        if not callback_data or 'Body' not in callback_data or 'stkCallback' not in callback_data['Body']:
            logger.error("Invalid callback structure received")
            return jsonify({"ResultCode": 1, "ResultDesc": "Invalid callback structure"}), 400

        stk_callback = callback_data['Body']['stkCallback']
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        logger.info(f"Processing callback: ResultCode={result_code}, CheckoutRequestID={checkout_request_id}")

        # Find the related payment
        payment = Payment.query.filter_by(transaction_id=checkout_request_id).first()
        if not payment:
            logger.error(f"Payment not found for checkout_request_id: {checkout_request_id}")
            return jsonify({"ResultCode": 1, "ResultDesc": "Payment not found"}), 404

        # Save the raw callback response
        payment_response = PaymentResponse(
            response_code=str(result_code),
            response_description=result_desc,
            merchant_request_id=merchant_request_id,
            checkout_request_id=checkout_request_id,
            result_code=str(result_code),
            result_description=result_desc,
            raw_callback=callback_data,
            payment_id=payment.payment_id
        )
        db.session.add(payment_response)

        # Process payment result
        if str(result_code) == '0':
            # Payment successful
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            payment_details = {
                'amount': None,
                'mpesa_receipt': None,
                'phone_number': None,
                'transaction_date': None
            }

            # Extract payment details from callback metadata
            for item in callback_metadata:
                name = item.get('Name')
                value = item.get('Value')
                if name == 'Amount':
                    payment_details['amount'] = value
                elif name == 'MpesaReceiptNumber':
                    payment_details['mpesa_receipt'] = value
                elif name == 'PhoneNumber':
                    payment_details['phone_number'] = value
                elif name == 'TransactionDate':
                    payment_details['transaction_date'] = value

            logger.info(f"Payment successful. Details: {payment_details}")

            # Update payment status
            payment.payment_status = PaymentStatus.COMPLETED
            payment.payment_date = datetime.now()

            # Update transaction record
            transaction = Transaction.query.filter_by(transaction_id=merchant_request_id).first()
            if transaction:
                transaction.status = 'COMPLETED'
                transaction.mpesa_receipt_number = payment_details['mpesa_receipt']
                if payment_details['amount']:
                    transaction.amount = payment_details['amount']
                    
            # Update order status to processing
            if payment.order:
                payment.order.order_status = 'processing'
                
        else:
            # Payment failed
            logger.warning(f"Payment failed: {result_desc}")
            payment.payment_status = PaymentStatus.FAILED
            
            # Update transaction record
            transaction = Transaction.query.filter_by(transaction_id=merchant_request_id).first()
            if transaction:
                transaction.status = 'FAILED'

        db.session.commit()
        logger.info(f"Callback processed successfully for payment {payment.payment_id}")
        
        return jsonify({
            "ResultCode": 0,
            "ResultDesc": "Callback processed successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error processing callback: {str(e)}", exc_info=True)
        return jsonify({
            "ResultCode": 1,
            "ResultDesc": f"Error processing callback: {str(e)}"
        }), 500