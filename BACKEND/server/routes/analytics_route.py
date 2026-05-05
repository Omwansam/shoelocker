#!/usr/bin/env python3
"""
Analytics routes for admin dashboard
Provides comprehensive analytics data for charts and graphs
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models import db, Order, OrderItem, Product, User, Payment, Category
from sqlalchemy import func, desc, and_, extract
from datetime import datetime, timedelta
import calendar

analytics_bp = Blueprint('analytics', __name__)

def _extract_user_id(identity):
    """Extract user ID from JWT identity"""
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id')
    return identity

def _format_date(date_obj):
    """Safely format date object or string"""
    if hasattr(date_obj, 'strftime'):
        return date_obj.strftime('%Y-%m-%d')
    else:
        return str(date_obj)

def is_admin():
    """Check if current user is admin"""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        user = User.query.get(user_id)
        return user and user.is_admin
    except:
        return False

@analytics_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Get comprehensive dashboard analytics"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Basic counts
        total_orders = Order.query.filter(
            Order.order_date >= start_date
        ).count()
        
        total_revenue = db.session.query(
            func.sum(Order.total_amount)
        ).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).scalar() or 0
        
        total_customers = User.query.filter(
            User.is_admin == False
        ).count()
        
        total_products = Product.query.count()
        
        # Sales trend data
        sales_trend = db.session.query(
            func.date(Order.order_date).label('date'),
            func.count(Order.order_id).label('orders'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.order_date >= start_date
        ).group_by(
            func.date(Order.order_date)
        ).order_by(
            func.date(Order.order_date)
        ).all()
        
        sales_data = []
        for item in sales_trend:
            # Handle both string and datetime objects
            if hasattr(item.date, 'strftime'):
                date_str = item.date.strftime('%Y-%m-%d')
            else:
                date_str = str(item.date)
            
            sales_data.append({
                'date': date_str,
                'orders': item.orders,
                'revenue': float(item.revenue or 0)
            })
        
        # Top selling products
        top_products = db.session.query(
            Product.product_id,
            Product.product_name,
            Product.product_price,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.quantity * func.cast(OrderItem.price, db.Float)).label('total_revenue')
        ).select_from(Product).join(OrderItem, Product.product_id == OrderItem.product_id).join(Order, OrderItem.order_id == Order.order_id).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Product.product_id).order_by(
            desc(func.sum(OrderItem.quantity))
        ).limit(10).all()
        
        top_products_data = []
        for product in top_products:
            top_products_data.append({
                'id': product.product_id,
                'name': product.product_name,
                'price': float(product.product_price),
                'total_sold': int(product.total_sold),
                'total_revenue': float(product.total_revenue or 0)
            })
        
        # Category performance
        category_performance = db.session.query(
            Category.category_name,
            func.count(Order.order_id).label('orders'),
            func.sum(Order.total_amount).label('revenue')
        ).select_from(Category).join(Product, Category.category_id == Product.category_id).join(OrderItem, Product.product_id == OrderItem.product_id).join(Order, OrderItem.order_id == Order.order_id).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Category.category_id).order_by(
            desc(func.sum(Order.total_amount))
        ).all()
        
        category_data = []
        for category in category_performance:
            category_data.append({
                'name': category.category_name,
                'orders': category.orders,
                'revenue': float(category.revenue or 0)
            })
        
        # Customer segments - simplified approach without complex case statements
        high_value_customers = db.session.query(
            func.count(User.id).label('count')
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(User.id).having(
            func.sum(Order.total_amount) >= 1000
        ).count()
        
        medium_value_customers = db.session.query(
            func.count(User.id).label('count')
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(User.id).having(
            func.sum(Order.total_amount) >= 500,
            func.sum(Order.total_amount) < 1000
        ).count()
        
        low_value_customers = db.session.query(
            func.count(User.id).label('count')
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(User.id).having(
            func.sum(Order.total_amount) < 500
        ).count()
        
        segment_data = [
            {'segment': 'High Value', 'count': high_value_customers},
            {'segment': 'Medium Value', 'count': medium_value_customers},
            {'segment': 'Low Value', 'count': low_value_customers}
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'total_orders': total_orders,
                    'total_revenue': float(total_revenue),
                    'total_customers': total_customers,
                    'total_products': total_products
                },
                'sales_trend': sales_data,
                'top_products': top_products_data,
                'category_performance': category_data,
                'customer_segments': segment_data
            }
        })
        
    except Exception as e:
        print(f"Error in dashboard analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch dashboard analytics'
        }), 500

@analytics_bp.route('/admin/sales-analytics', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    """Get detailed sales analytics"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Monthly sales breakdown
        monthly_sales = db.session.query(
            extract('year', Order.order_date).label('year'),
            extract('month', Order.order_date).label('month'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.order_id).label('orders')
        ).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date)
        ).order_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date)
        ).all()
        
        monthly_data = []
        for item in monthly_sales:
            month_name = calendar.month_name[int(item.month)]
            monthly_data.append({
                'month': month_name,
                'revenue': float(item.revenue or 0),
                'orders': item.orders
            })
        
        # Daily sales for the last 30 days
        daily_sales = db.session.query(
            func.date(Order.order_date).label('date'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.order_id).label('orders')
        ).filter(
            Order.order_date >= start_date
        ).group_by(
            func.date(Order.order_date)
        ).order_by(
            func.date(Order.order_date)
        ).all()
        
        daily_data = []
        for item in daily_sales:
            daily_data.append({
                'date': _format_date(item.date),
                'revenue': float(item.revenue or 0),
                'orders': item.orders
            })
        
        # Sales by status
        status_sales = db.session.query(
            Order.order_status,
            func.count(Order.order_id).label('count'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.order_date >= start_date
        ).group_by(Order.order_status).all()
        
        status_data = []
        for item in status_sales:
            status_data.append({
                'status': str(item.order_status),
                'count': item.count,
                'revenue': float(item.revenue or 0)
            })
        
        # Average order value trend
        aov_trend = db.session.query(
            func.date(Order.order_date).label('date'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(
            func.date(Order.order_date)
        ).order_by(
            func.date(Order.order_date)
        ).all()
        
        aov_data = []
        for item in aov_trend:
            aov_data.append({
                'date': _format_date(item.date),
                'avg_order_value': float(item.avg_order_value or 0)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'monthly_sales': monthly_data,
                'daily_sales': daily_data,
                'status_sales': status_data,
                'aov_trend': aov_data
            }
        })
        
    except Exception as e:
        print(f"Error in sales analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch sales analytics'
        }), 500

@analytics_bp.route('/admin/customer-analytics', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    """Get customer behavior analytics"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Customer acquisition trend - using order dates instead of user creation
        customer_acquisition = db.session.query(
            func.date(Order.order_date).label('date'),
            func.count(User.id).label('new_customers')
        ).join(Order).filter(
            Order.order_date >= start_date,
            User.is_admin == False
        ).group_by(
            func.date(Order.order_date)
        ).order_by(
            func.date(Order.order_date)
        ).all()
        
        acquisition_data = []
        for item in customer_acquisition:
            acquisition_data.append({
                'date': _format_date(item.date),
                'new_customers': item.new_customers
            })
        
        # Customer lifetime value
        customer_lifetime = db.session.query(
            User.id,
            User.username,
            func.count(Order.order_id).label('total_orders'),
            func.sum(Order.total_amount).label('total_spent'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(User.id).order_by(
            desc(func.sum(Order.total_amount))
        ).limit(20).all()
        
        lifetime_data = []
        for customer in customer_lifetime:
            lifetime_data.append({
                'id': customer.id,
                'username': customer.username,
                'total_orders': customer.total_orders,
                'total_spent': float(customer.total_spent or 0),
                'avg_order_value': float(customer.avg_order_value or 0)
            })
        
        # Repeat customer rate
        repeat_customers = db.session.query(
            func.count(User.id).label('repeat_customers')
        ).select_from(User).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(User.id).having(
            func.count(Order.order_id) > 1
        ).count()
        
        total_customers = db.session.query(
            func.count(User.id)
        ).select_from(User).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).count()
        
        repeat_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'customer_acquisition': acquisition_data,
                'customer_lifetime': lifetime_data,
                'repeat_customer_rate': round(repeat_rate, 2)
            }
        })
        
    except Exception as e:
        print(f"Error in customer analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch customer analytics'
        }), 500

@analytics_bp.route('/admin/product-analytics', methods=['GET'])
@jwt_required()
def get_product_analytics():
    """Get product performance analytics"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Product performance by category
        category_performance = db.session.query(
            Category.category_name,
            func.count(Product.product_id).label('product_count'),
            func.sum(OrderItem.quantity).label('units_sold'),
            func.sum(OrderItem.quantity * func.cast(OrderItem.price, db.Float)).label('revenue')
        ).select_from(Category).join(Product, Category.category_id == Product.category_id).join(OrderItem, Product.product_id == OrderItem.product_id).join(Order, OrderItem.order_id == Order.order_id).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Category.category_id).order_by(
            desc(func.sum(OrderItem.quantity * func.cast(OrderItem.price, db.Float)))
        ).all()
        
        category_data = []
        for category in category_performance:
            category_data.append({
                'name': category.name,
                'product_count': category.product_count,
                'units_sold': int(category.units_sold or 0),
                'revenue': float(category.revenue or 0)
            })
        
        # Top performing products
        top_products = db.session.query(
            Product.product_id,
            Product.product_name,
            Product.product_price,
            Product.category_id,
            func.sum(OrderItem.quantity).label('units_sold'),
            func.sum(OrderItem.quantity * func.cast(OrderItem.price, db.Float)).label('revenue')
        ).select_from(Product).join(OrderItem, Product.product_id == OrderItem.product_id).join(Order, OrderItem.order_id == Order.order_id).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Product.product_id).order_by(
            desc(func.sum(OrderItem.quantity * func.cast(OrderItem.price, db.Float)))
        ).limit(15).all()
        
        product_data = []
        for product in top_products:
            product_data.append({
                'id': product.product_id,
                'name': product.product_name,
                'price': float(product.product_price),
                'category_id': product.category_id,
                'units_sold': int(product.units_sold or 0),
                'revenue': float(product.revenue or 0)
            })
        
        # Inventory turnover
        inventory_turnover = db.session.query(
            Product.product_id,
            Product.product_name,
            Product.stock_quantity,
            func.sum(OrderItem.quantity).label('sold_quantity')
        ).select_from(Product).join(OrderItem, Product.product_id == OrderItem.product_id).join(Order, OrderItem.order_id == Order.order_id).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Product.product_id).order_by(
            desc(func.sum(OrderItem.quantity))
        ).limit(20).all()
        
        turnover_data = []
        for product in inventory_turnover:
            turnover_ratio = (product.sold_quantity / product.stock_quantity * 100) if product.stock_quantity > 0 else 0
            turnover_data.append({
                'id': product.product_id,
                'name': product.product_name,
                'stock_quantity': product.stock_quantity,
                'sold_quantity': int(product.sold_quantity or 0),
                'turnover_ratio': round(turnover_ratio, 2)
            })
        
        return jsonify({
            'success': True,
            'data': {
                'category_performance': category_data,
                'top_products': product_data,
                'inventory_turnover': turnover_data
            }
        })
        
    except Exception as e:
        print(f"Error in product analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch product analytics'
        }), 500

@analytics_bp.route('/admin/financial-analytics', methods=['GET'])
@jwt_required()
def get_financial_analytics():
    """Get financial performance analytics"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Revenue growth
        revenue_growth = db.session.query(
            func.date(Order.order_date).label('date'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(
            func.date(Order.order_date)
        ).order_by(
            func.date(Order.order_date)
        ).all()
        
        growth_data = []
        for item in revenue_growth:
            growth_data.append({
                'date': _format_date(item.date),
                'revenue': float(item.revenue or 0)
            })
        
        # Profit margins (assuming cost is 60% of price for demo)
        profit_data = []
        total_revenue = 0
        total_cost = 0
        
        for item in revenue_growth:
            revenue = float(item.revenue or 0)
            cost = revenue * 0.6  # Demo assumption
            profit = revenue - cost
            total_revenue += revenue
            total_cost += cost
            
            profit_data.append({
                'date': _format_date(item.date),
                'revenue': revenue,
                'cost': cost,
                'profit': profit,
                'margin': round((profit / revenue * 100), 2) if revenue > 0 else 0
            })
        
        # Payment method distribution
        payment_methods = db.session.query(
            Payment.payment_status,
            func.count(Payment.payment_id).label('count'),
            func.sum(Payment.payment_amount).label('total_amount')
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status == 'delivered'
        ).group_by(Payment.payment_status).all()
        
        payment_data = []
        for method in payment_methods:
            payment_data.append({
                'method': str(method.payment_status),
                'count': method.count,
                'total_amount': float(method.total_amount or 0)
            })
        
        # Key metrics
        metrics = {
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'total_profit': total_revenue - total_cost,
            'profit_margin': round(((total_revenue - total_cost) / total_revenue * 100), 2) if total_revenue > 0 else 0,
            'avg_daily_revenue': round(total_revenue / days, 2) if days > 0 else 0
        }
        
        return jsonify({
            'success': True,
            'data': {
                'revenue_growth': growth_data,
                'profit_analysis': profit_data,
                'payment_methods': payment_data,
                'key_metrics': metrics
            }
        })
        
    except Exception as e:
        print(f"Error in financial analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch financial analytics'
        }), 500

@analytics_bp.route('/admin/real-time', methods=['GET'])
@jwt_required()
def get_real_time_analytics():
    """Get real-time analytics data"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Today's stats
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_orders = Order.query.filter(
            Order.order_date >= today_start,
            Order.order_date <= today_end
        ).count()
        
        today_revenue = db.session.query(
            func.sum(Order.total_amount)
        ).filter(
            Order.order_date >= today_start,
            Order.order_date <= today_end,
            Order.order_status == 'delivered'
        ).scalar() or 0
        
        today_customers = User.query.filter(
            User.is_admin == False
        ).count()
        
        # Current month stats
        current_month = datetime.now().replace(day=1)
        month_orders = Order.query.filter(
            Order.order_date >= current_month
        ).count()
        
        month_revenue = db.session.query(
            func.sum(Order.total_amount)
        ).filter(
            Order.order_date >= current_month,
            Order.order_status == 'delivered'
        ).scalar() or 0
        
        # Pending orders
        pending_orders = Order.query.filter(
            Order.order_status == 'pending'
        ).count()
        
        # Low stock products
        low_stock_products = Product.query.filter(
            Product.stock_quantity <= 10
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'today': {
                    'orders': today_orders,
                    'revenue': float(today_revenue),
                    'customers': today_customers
                },
                'month': {
                    'orders': month_orders,
                    'revenue': float(month_revenue)
                },
                'alerts': {
                    'pending_orders': pending_orders,
                    'low_stock_products': low_stock_products
                }
            }
        })
        
    except Exception as e:
        print(f"Error in real-time analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch real-time analytics'
        }), 500
