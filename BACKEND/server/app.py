from flask import Flask, send_from_directory, make_response, jsonify, request
from config import Config
from extensions import db, migrate, jwt
from flask_cors import CORS
from models import User
from flask_jwt_extended import JWTManager
from routes.users_route import users_bp
from routes.products_route import product_bp
from routes.productImage_route import product_image_bp
from routes.billing_route import billing_bp
from routes.category_route import category_bp
from routes.analytics_route import analytics_bp
from routes.customers_route import customers_bp
from routes.dashboard_route import dashboard_bp
from routes.suppliers_route import suppliers_bp
from routes.reports_route import reports_bp
from routes.user_management_route import user_management_bp

from routes.blog_route import blog_bp
from routes.cart_route import cart_bp
from routes.order_route import order_bp
from routes.payment_route import payment_bp
from routes.payment_methods import payment_methods_bp
from routes.social_media_route import social_media_bp
from routes.stripe_route import stripe_bp
from routes.settings_route import settings_bp
from routes.shipping_route import shipping_bp
from routes.wishlist_route import wishlist_bp

import os

app = Flask(__name__)

app.config.from_object(Config)

CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "supports_credentials": True,
            "max_age": 3600
        }
    }
)
db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)

# JWT Error Handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    response = jsonify({"error": "Token has expired"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print('[JWT] invalid_token_callback called', {
        'error': error,
        'authorization': request.headers.get('Authorization')
    })
    response = jsonify({"error": "Invalid token"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print('[JWT] missing_token_callback called', {
        'error': error,
        'authorization': request.headers.get('Authorization')
    })
    response = jsonify({"error": "Authorization token is required"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return response, 401

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    response = jsonify({"error": "Fresh token required"})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, 401




#Create a Route

@app.route('/')
def home():
    return 'Hello, World!'

# Serve static files (uploads)
@app.route('/static/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory('static/uploads', filename)

  
@app.after_request
def apply_cors_headers(response):
    response.headers.setdefault('Access-Control-Allow-Origin', '*')
    response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

app.register_blueprint(billing_bp, url_prefix = '/billing')
app.register_blueprint(category_bp,url_prefix = '/categories')
app.register_blueprint(analytics_bp, url_prefix = '/analytics')
app.register_blueprint(customers_bp, url_prefix = '/customers')
app.register_blueprint(dashboard_bp, url_prefix = '/dashboard')
app.register_blueprint(suppliers_bp, url_prefix = '/suppliers')
app.register_blueprint(reports_bp, url_prefix = '/reports')
app.register_blueprint(user_management_bp, url_prefix = '/user-management')

app.register_blueprint(blog_bp, url_prefix = '/blog')
app.register_blueprint(cart_bp, url_prefix = '/cart')
app.register_blueprint(order_bp, url_prefix = '/orders')

# Register all payment blueprints
app.register_blueprint(payment_bp, url_prefix = '/payments')
app.register_blueprint(payment_methods_bp, url_prefix = '/methods')
app.register_blueprint(social_media_bp, url_prefix = '/social')
app.register_blueprint(stripe_bp, url_prefix = '/stripe')

# Register settings blueprint
app.register_blueprint(settings_bp, url_prefix = '/settings')

# Register shipping blueprint (prefix defined inside shipping blueprint)
app.register_blueprint(shipping_bp)
app.register_blueprint(wishlist_bp, url_prefix='/wishlist')

# Register auth, products, and product images blueprints
app.register_blueprint(users_bp, url_prefix='/auth')
app.register_blueprint(product_bp, url_prefix='/api')
app.register_blueprint(product_image_bp, url_prefix='/productimages')

if __name__ == '__main__':
    app.run(debug=True, port=5000)