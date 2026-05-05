from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import WishlistItem, Product, ProductImage

wishlist_bp = Blueprint("wishlist", __name__)


def _user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get("id")
    return identity


def _product_to_dict(product):
    primary = (
        ProductImage.query.filter_by(product_id=product.product_id, is_primary=True).first()
        or ProductImage.query.filter_by(product_id=product.product_id).first()
    )
    images = ProductImage.query.filter_by(product_id=product.product_id).all()
    return {
        "id": product.product_id,
        "product_id": product.product_id,
        "product_name": product.product_name,
        "product_description": product.product_description,
        "product_price": product.product_price,
        "stock_quantity": product.stock_quantity,
        "category_id": product.category_id,
        "image_url": primary.image_url if primary else None,
        "images": [
            {"image_url": img.image_url, "is_primary": img.is_primary} for img in images
        ],
    }


@wishlist_bp.route("", methods=["GET"])
@jwt_required()
def list_wishlist():
    uid = _user_id(get_jwt_identity())
    if not uid:
        return jsonify({"error": "Invalid user"}), 401
    rows = WishlistItem.query.filter_by(user_id=uid).order_by(WishlistItem.created_at.desc()).all()
    products = []
    for row in rows:
        if row.product:
            products.append(_product_to_dict(row.product))
    return jsonify({"items": products}), 200


@wishlist_bp.route("", methods=["POST"])
@jwt_required()
def add_wishlist_item():
    uid = _user_id(get_jwt_identity())
    if not uid:
        return jsonify({"error": "Invalid user"}), 401
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    existing = WishlistItem.query.filter_by(user_id=uid, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Already in wishlist", "item": _product_to_dict(product)}), 200
    row = WishlistItem(user_id=uid, product_id=product_id)
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Already in wishlist", "item": _product_to_dict(product)}), 200
    return jsonify({"message": "Added", "item": _product_to_dict(product)}), 201


@wishlist_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_wishlist_item(product_id):
    uid = _user_id(get_jwt_identity())
    if not uid:
        return jsonify({"error": "Invalid user"}), 401
    row = WishlistItem.query.filter_by(user_id=uid, product_id=product_id).first()
    if not row:
        return jsonify({"message": "Not in wishlist"}), 200
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200
