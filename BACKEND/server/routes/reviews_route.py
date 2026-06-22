from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Review, Product, User, Order, OrderStatus, OrderItem
from sqlalchemy import func

reviews_bp = Blueprint('reviews', __name__)


def _extract_user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity


def _serialize_review(review):
    user = review.user
    return {
        'review_id': review.review_id,
        'rating': review.rating,
        'review_text': review.review_text,
        'created_at': review.created_at.isoformat() if review.created_at else None,
        'user': {
            'id': user.id if user else None,
            'username': user.username if user else 'Customer',
        },
    }


@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def list_product_reviews(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    reviews = (
        Review.query.filter_by(product_id=product_id)
        .order_by(Review.created_at.desc())
        .limit(50)
        .all()
    )
    avg = db.session.query(func.avg(Review.rating)).filter_by(product_id=product_id).scalar()
    return jsonify({
        'reviews': [_serialize_review(r) for r in reviews],
        'average_rating': round(float(avg), 1) if avg else None,
        'count': len(reviews),
    }), 200


@reviews_bp.route('/product/<int:product_id>', methods=['POST'])
@jwt_required()
def create_product_review(product_id):
    user_id = _extract_user_id(get_jwt_identity())
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json() or {}
    rating = data.get('rating')
    review_text = (data.get('review_text') or '').strip()
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    if len(review_text) < 10:
        return jsonify({'error': 'Review must be at least 10 characters'}), 400

    purchased = (
        db.session.query(OrderItem)
        .join(Order)
        .filter(Order.user_id == user_id, OrderItem.product_id == product_id)
        .filter(Order.order_status.in_([
            OrderStatus.DELIVERED,
            OrderStatus.SHIPPED,
            OrderStatus.PROCESSING,
        ]))
        .first()
    )
    if not purchased:
        return jsonify({'error': 'You can only review products you have ordered'}), 403

    existing = Review.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        existing.rating = rating
        existing.review_text = review_text
        db.session.commit()
        return jsonify({'message': 'Review updated', 'review': _serialize_review(existing)}), 200

    review = Review(user_id=user_id, product_id=product_id, rating=rating, review_text=review_text)
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review submitted', 'review': _serialize_review(review)}), 201
