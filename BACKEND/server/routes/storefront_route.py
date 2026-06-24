from functools import wraps
import os
import re

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from extensions import db
from models import Store, RewardTier, SupportArticle, StorefrontBrand, User, Order, OrderStatus
from sqlalchemy import func

storefront_bp = Blueprint('storefront', __name__)

# Customer-facing loyalty math: 1 point per KES spent / POINTS_DIVISOR.
POINTS_DIVISOR = 100


def _extract_user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        identity = get_jwt_identity()
        user_id = identity.get('id') if isinstance(identity, dict) else identity
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)

    return decorated


def _allowed_image(filename):
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'webp', 'gif'})


def _save_brand_image(file, slug):
    if not file or not _allowed_image(file.filename):
        return None
    basename = secure_filename(file.filename.rsplit('.', 1)[0]) or 'brand'
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"brand_{slug}_{basename}.{ext}"
    folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    file.save(path)
    return f"uploads/{filename}"


@storefront_bp.route('/stores', methods=['GET'])
def list_stores():
    """Public list of active retail branches for the store locator."""
    stores = (
        Store.query.filter_by(is_active=True)
        .order_by(Store.sort_order.asc(), Store.name.asc())
        .all()
    )
    return jsonify({'stores': [s.to_dict() for s in stores]}), 200


@storefront_bp.route('/rewards', methods=['GET'])
@jwt_required(optional=True)
def get_rewards():
    """Public reward program info. Includes the caller's points/tier when authed."""
    tiers = (
        RewardTier.query.filter_by(is_active=True)
        .order_by(RewardTier.sort_order.asc(), RewardTier.min_spend_kes.asc())
        .all()
    )
    tier_dicts = [t.to_dict() for t in tiers]

    program = {
        'program_name': 'Kickback Rewards',
        'points_per_kes': round(1 / POINTS_DIVISOR, 4),
        'points_divisor': POINTS_DIVISOR,
        'tiers': tier_dicts,
    }

    member = None
    user_id = _extract_user_id(get_jwt_identity())
    if user_id:
        user = User.query.get(user_id)
        if user:
            total_spent = (
                db.session.query(func.coalesce(func.sum(Order.total_amount), 0.0))
                .filter(Order.user_id == user_id)
                .filter(Order.order_status != OrderStatus.CANCELLED)
                .scalar()
            ) or 0.0
            points = int(total_spent // POINTS_DIVISOR)

            current_tier = None
            next_tier = None
            for tier in tier_dicts:
                if total_spent >= tier['min_spend_kes']:
                    current_tier = tier
                elif next_tier is None:
                    next_tier = tier

            member = {
                'first_name': user.first_name,
                'total_spent_kes': round(float(total_spent), 2),
                'points': points,
                'current_tier': current_tier['name'] if current_tier else (tier_dicts[0]['name'] if tier_dicts else None),
                'next_tier': next_tier['name'] if next_tier else None,
                'spend_to_next_tier_kes': round(next_tier['min_spend_kes'] - total_spent, 2) if next_tier else 0,
            }

    return jsonify({'program': program, 'member': member}), 200


@storefront_bp.route('/support', methods=['GET'])
def list_support_articles():
    """Public help & policy content for the support page."""
    articles = (
        SupportArticle.query.filter_by(is_active=True)
        .order_by(SupportArticle.sort_order.asc(), SupportArticle.title.asc())
        .all()
    )
    return jsonify({'articles': [a.to_dict() for a in articles]}), 200


@storefront_bp.route('/support/<string:slug>', methods=['GET'])
def get_support_article(slug):
    """Single help, policy, or company article for dedicated storefront pages."""
    article = SupportArticle.query.filter_by(slug=slug, is_active=True).first()
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    return jsonify({'article': article.to_dict()}), 200


@storefront_bp.route('/brands', methods=['GET'])
def list_brands():
    """Public homepage brand cards and shoe-icon wall tiles."""
    rows = (
        StorefrontBrand.query.filter_by(is_active=True)
        .order_by(
            StorefrontBrand.is_featured.desc(),
            StorefrontBrand.featured_order.asc().nullslast(),
            StorefrontBrand.wall_order.asc(),
            StorefrontBrand.label.asc(),
        )
        .all()
    )
    featured_rows = [b for b in rows if b.is_featured]
    featured_rows.sort(key=lambda b: (b.featured_order is None, b.featured_order or 0))
    featured = [b.to_public_dict() for b in featured_rows[:3]]
    wall = [b.to_public_dict() for b in rows if not b.is_featured]
    return jsonify({'featured': featured[:3], 'wall': wall}), 200


@storefront_bp.route('/admin/brands', methods=['GET'])
@jwt_required()
@admin_required
def admin_list_brands():
    rows = StorefrontBrand.query.order_by(
        StorefrontBrand.is_featured.desc(),
        StorefrontBrand.featured_order.asc().nullslast(),
        StorefrontBrand.wall_order.asc(),
        StorefrontBrand.label.asc(),
    ).all()
    return jsonify({'brands': [b.to_admin_dict() for b in rows]}), 200


@storefront_bp.route('/admin/brands/<int:brand_id>', methods=['PUT'])
@jwt_required()
@admin_required
def admin_update_brand(brand_id):
    brand = StorefrontBrand.query.get_or_404(brand_id)
    data = request.get_json(silent=True) or {}

    if 'label' in data:
        brand.label = str(data['label']).strip() or brand.label
    if 'catalogBrand' in data:
        brand.catalog_brand = str(data['catalogBrand']).strip() or brand.catalog_brand
    if 'tagline' in data:
        brand.tagline = data['tagline']
    if 'accent' in data:
        brand.accent_color = data['accent']
    if 'image' in data:
        brand.image_url = data['image']
    if 'isFeatured' in data:
        brand.is_featured = bool(data['isFeatured'])
    if 'featuredOrder' in data:
        brand.featured_order = data['featuredOrder']
    if 'wallOrder' in data:
        brand.wall_order = int(data['wallOrder'] or 0)
    if 'isActive' in data:
        brand.is_active = bool(data['isActive'])

    db.session.commit()
    return jsonify({'brand': brand.to_admin_dict()}), 200


@storefront_bp.route('/admin/brands/<int:brand_id>/image', methods=['POST'])
@jwt_required()
@admin_required
def admin_upload_brand_image(brand_id):
    brand = StorefrontBrand.query.get_or_404(brand_id)
    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image file provided'}), 400

    saved = _save_brand_image(file, brand.slug)
    if not saved:
        return jsonify({'error': 'Invalid image file'}), 400

    brand.image_url = saved
    db.session.commit()
    return jsonify({'brand': brand.to_admin_dict()}), 200
