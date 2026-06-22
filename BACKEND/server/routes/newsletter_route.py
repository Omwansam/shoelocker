from flask import Blueprint, request, jsonify
from extensions import db
from models import NewsletterSubscriber
import re

newsletter_bp = Blueprint('newsletter', __name__)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


@newsletter_bp.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email or not EMAIL_RE.match(email):
        return jsonify({'error': 'A valid email address is required'}), 400

    existing = NewsletterSubscriber.query.filter_by(email=email).first()
    if existing:
        if existing.is_active:
            return jsonify({'message': 'You are already subscribed'}), 200
        existing.is_active = True
        db.session.commit()
        return jsonify({'message': 'Subscription reactivated'}), 200

    subscriber = NewsletterSubscriber(
        email=email,
        is_active=True,
        is_verified=False,
        ip_address=request.remote_addr,
    )
    db.session.add(subscriber)
    db.session.commit()
    return jsonify({'message': 'Subscribed successfully'}), 201
