import stripe
import os
from flask import current_app
from datetime import datetime

# Initialize Stripe with the secret key from config
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeClient:
    def __init__(self):
        self.stripe = stripe
    
    def create_payment_intent(self, amount, currency='kes', metadata=None):
        """
        Create a payment intent for bank transfer
        """
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                payment_method_types=['card'],
                metadata=metadata or {},
                description="Furniture purchase payment"
            )
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'amount': amount,
                'currency': currency
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_bank_transfer_payment_intent(self, amount, currency='kes', metadata=None):
        """
        Create a payment intent specifically for bank transfer
        """
        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency=currency,
                payment_method_types=['card'],
                metadata=metadata or {},
                description="Bank transfer payment for furniture purchase",
                setup_future_usage='off_session'  # For future payments
            )
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'amount': amount,
                'currency': currency
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def confirm_payment_intent(self, payment_intent_id, payment_method_id=None):
        """
        Confirm a payment intent
        """
        try:
            if payment_method_id:
                payment_intent = stripe.PaymentIntent.confirm(
                    payment_intent_id,
                    payment_method=payment_method_id
                )
            else:
                payment_intent = stripe.PaymentIntent.confirm(payment_intent_id)
            
            return {
                'success': True,
                'payment_intent': payment_intent,
                'status': payment_intent.status
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def retrieve_payment_intent(self, payment_intent_id):
        """
        Retrieve a payment intent
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'success': True,
                'payment_intent': payment_intent,
                'status': payment_intent.status
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_refund(self, payment_intent_id, amount=None, reason='requested_by_customer'):
        """
        Create a refund for a payment
        """
        try:
            refund_data = {
                'payment_intent': payment_intent_id,
                'reason': reason
            }
            
            if amount:
                refund_data['amount'] = int(amount * 100)  # Convert to cents
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund.amount / 100,  # Convert back from cents
                'status': refund.status
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }

# Create a global instance
stripe_client = StripeClient()
