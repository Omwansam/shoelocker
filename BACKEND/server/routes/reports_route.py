from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, asc, extract, case, and_
from datetime import datetime, timedelta
import csv
import io
import json

from models import db, User, Order, OrderItem, Product, Category, Payment, PaymentMethod, OrderStatus, PaymentStatus, ShippingStatus, UserRole

reports_bp = Blueprint('reports', __name__)

def _extract_user_id():
    """Extract user ID from JWT token"""
    try:
        current_user = get_jwt_identity()
        if isinstance(current_user, dict):
            return current_user.get('user_id')
        return current_user
    except Exception as e:
        print(f"Error extracting user ID: {str(e)}")
        return None

def is_admin():
    """Check if current user is admin"""
    try:
        user_id = _extract_user_id()
        if not user_id:
            return False
        
        user = User.query.get(user_id)
        if not user:
            return False
        
        return user.role == UserRole.ADMIN
    except Exception as e:
        print(f"Error checking admin status: {str(e)}")
        return False

def _get_date_range(days):
    """Get date range for reports"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date

@reports_bp.route('/admin/reports/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    """Get sales report with various metrics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        # Sales metrics
        total_sales = db.session.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).scalar() or 0

        total_orders = db.session.query(func.count(Order.order_id)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).scalar() or 0

        completed_orders = db.session.query(func.count(Order.order_id)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).scalar() or 0

        # Daily sales trend
        daily_sales = db.session.query(
            func.date(Order.order_date).label('date'),
            func.sum(Order.total_amount).label('total'),
            func.count(Order.order_id).label('orders')
        ).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).group_by(func.date(Order.order_date)).order_by(func.date(Order.order_date)).all()

        # Sales by category
        category_sales = db.session.query(
            Category.category_name,
            func.sum(OrderItem.price * OrderItem.quantity).label('total'),
            func.count(OrderItem.order_item_id).label('items')
        ).join(Product).join(OrderItem).join(Order).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).group_by(Category.category_name).order_by(desc(func.sum(OrderItem.price * OrderItem.quantity))).all()

        # Top selling products
        top_products = db.session.query(
            Product.product_name,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.price * OrderItem.quantity).label('total_revenue')
        ).join(OrderItem).join(Order).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).group_by(Product.product_name).order_by(desc(func.sum(OrderItem.quantity))).limit(10).all()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'summary': {
                    'total_sales': float(total_sales),
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0,
                    'average_order_value': float(total_sales / completed_orders) if completed_orders > 0 else 0
                },
                'daily_trend': [
                    {
                        'date': daily.date.isoformat(),
                        'total': float(daily.total),
                        'orders': daily.orders
                    }
                    for daily in daily_sales
                ],
                'category_sales': [
                    {
                        'category': cat.category_name,
                        'total': float(cat.total),
                        'items': cat.items
                    }
                    for cat in category_sales
                ],
                'top_products': [
                    {
                        'product': prod.product_name,
                        'quantity': prod.total_quantity,
                        'revenue': float(prod.total_revenue)
                    }
                    for prod in top_products
                ]
            }
        })

    except Exception as e:
        print(f"Error in get_sales_report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/admin/reports/inventory', methods=['GET'])
@jwt_required()
def get_inventory_report():
    """Get inventory report with stock levels and movement"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        # Current inventory status
        total_products = Product.query.count()
        low_stock_products = Product.query.filter(Product.stock_quantity <= Product.reorder_level).count()
        out_of_stock_products = Product.query.filter(Product.stock_quantity == 0).count()

        # Stock value
        total_stock_value = db.session.query(
            func.sum(Product.stock_quantity * Product.price)
        ).scalar() or 0

        # Products by category
        category_inventory = db.session.query(
            Category.category_name,
            func.count(Product.product_id).label('product_count'),
            func.sum(Product.stock_quantity).label('total_stock'),
            func.sum(Product.stock_quantity * Product.price).label('stock_value')
        ).join(Product).group_by(Category.category_name).all()

        # Low stock products
        low_stock_list = db.session.query(
            Product.product_name,
            Product.stock_quantity,
            Product.reorder_level,
            Product.price,
            Category.category_name
        ).join(Category).filter(
            Product.stock_quantity <= Product.reorder_level
        ).order_by(Product.stock_quantity).limit(20).all()

        # Stock movement (recent orders)
        recent_stock_movement = db.session.query(
            Product.product_name,
            func.sum(OrderItem.quantity).label('units_sold'),
            func.date(Order.order_date).label('date')
        ).join(OrderItem).join(Order).filter(
            Order.order_date >= datetime.utcnow() - timedelta(days=30)
        ).group_by(Product.product_name, func.date(Order.order_date)).order_by(
            desc(func.date(Order.order_date))
        ).limit(50).all()

        return jsonify({
            'success': True,
            'data': {
                'summary': {
                    'total_products': total_products,
                    'low_stock_products': low_stock_products,
                    'out_of_stock_products': out_of_stock_products,
                    'total_stock_value': float(total_stock_value)
                },
                'category_inventory': [
                    {
                        'category': cat.category_name,
                        'product_count': cat.product_count,
                        'total_stock': cat.total_stock,
                        'stock_value': float(cat.stock_value)
                    }
                    for cat in category_inventory
                ],
                'low_stock_products': [
                    {
                        'product': prod.product_name,
                        'current_stock': prod.stock_quantity,
                        'reorder_level': prod.reorder_level,
                        'price': float(prod.price),
                        'category': prod.category_name
                    }
                    for prod in low_stock_list
                ],
                'stock_movement': [
                    {
                        'product': mov.product_name,
                        'units_sold': mov.units_sold,
                        'date': mov.date.isoformat()
                    }
                    for mov in recent_stock_movement
                ]
            }
        })

    except Exception as e:
        print(f"Error in get_inventory_report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/admin/reports/customers', methods=['GET'])
@jwt_required()
def get_customer_report():
    """Get customer report with demographics and behavior"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        # Customer metrics
        total_customers = User.query.filter(User.role == UserRole.CUSTOMER).count()
        new_customers = User.query.filter(
            and_(
                User.role == UserRole.CUSTOMER,
                User.created_at >= start_date
            )
        ).count()

        # Customer segments
        customer_segments = db.session.query(
            case(
                (func.sum(Order.total_amount) >= 1000, 'High Value'),
                (func.sum(Order.total_amount) >= 500, 'Medium Value'),
                else_='Low Value'
            ).label('segment'),
            func.count(User.id).label('count')
        ).join(Order).filter(
            and_(
                User.role == UserRole.CUSTOMER,
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).group_by(
            case(
                (func.sum(Order.total_amount) >= 1000, 'High Value'),
                (func.sum(Order.total_amount) >= 500, 'Medium Value'),
                else_='Low Value'
            )
        ).all()

        # Top customers
        top_customers = db.session.query(
            User.username,
            User.first_name,
            User.last_name,
            func.count(Order.order_id).label('order_count'),
            func.sum(Order.total_amount).label('total_spent'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).join(Order).filter(
            and_(
                User.role == UserRole.CUSTOMER,
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).group_by(User.id).order_by(desc(func.sum(Order.total_amount))).limit(10).all()

        # Customer retention
        repeat_customers = db.session.query(
            func.count(User.id)
        ).select_from(User).join(Order).filter(
            and_(
                User.role == UserRole.CUSTOMER,
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).group_by(User.id).having(func.count(Order.order_id) > 1).count()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'summary': {
                    'total_customers': total_customers,
                    'new_customers': new_customers,
                    'repeat_customers': repeat_customers,
                    'retention_rate': (repeat_customers / total_customers * 100) if total_customers > 0 else 0
                },
                'customer_segments': [
                    {
                        'segment': seg.segment,
                        'count': seg.count
                    }
                    for seg in customer_segments
                ],
                'top_customers': [
                    {
                        'username': cust.username,
                        'name': f"{cust.first_name} {cust.last_name}",
                        'order_count': cust.order_count,
                        'total_spent': float(cust.total_spent),
                        'avg_order_value': float(cust.avg_order_value)
                    }
                    for cust in top_customers
                ]
            }
        })

    except Exception as e:
        print(f"Error in get_customer_report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/admin/reports/financial', methods=['GET'])
@jwt_required()
def get_financial_report():
    """Get financial report with revenue, costs, and profitability"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        # Revenue metrics
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).scalar() or 0

        # Payment analysis
        payment_methods = db.session.query(
            PaymentMethod.method_name,
            func.count(Payment.payment_id).label('count'),
            func.sum(Payment.amount).label('total')
        ).join(Payment).join(Order).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).group_by(PaymentMethod.method_name).all()

        # Payment status distribution
        payment_status = db.session.query(
            Payment.payment_status,
            func.count(Payment.payment_id).label('count'),
            func.sum(Payment.amount).label('total')
        ).filter(
            Payment.created_at >= start_date
        ).group_by(Payment.payment_status).all()

        # Monthly revenue trend
        monthly_revenue = db.session.query(
            extract('year', Order.order_date).label('year'),
            extract('month', Order.order_date).label('month'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.order_id).label('orders')
        ).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).group_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date)
        ).order_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date)
        ).all()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_orders': db.session.query(func.count(Order.order_id)).filter(
                        and_(
                            Order.order_date >= start_date,
                            Order.order_date <= end_date,
                            Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
                        )
                    ).scalar() or 0
                },
                'payment_methods': [
                    {
                        'method': pm.method_name,
                        'count': pm.count,
                        'total': float(pm.total)
                    }
                    for pm in payment_methods
                ],
                'payment_status': [
                    {
                        'status': ps.payment_status.value if ps.payment_status else 'unknown',
                        'count': ps.count,
                        'total': float(ps.total)
                    }
                    for ps in payment_status
                ],
                'monthly_trend': [
                    {
                        'year': int(mr.year),
                        'month': int(mr.month),
                        'revenue': float(mr.revenue),
                        'orders': mr.orders
                    }
                    for mr in monthly_revenue
                ]
            }
        })

    except Exception as e:
        print(f"Error in get_financial_report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/admin/reports/export', methods=['GET'])
@jwt_required()
def export_report():
    """Export report data"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        report_type = request.args.get('type', 'sales')
        format_type = request.args.get('format', 'csv')
        days = request.args.get('days', 30, type=int)
        
        if format_type != 'csv':
            return jsonify({'error': 'Only CSV export is supported'}), 400

        start_date, end_date = _get_date_range(days)
        
        if report_type == 'sales':
            # Export sales data
            orders = db.session.query(
                Order.order_id,
                Order.order_date,
                Order.total_amount,
                Order.order_status,
                User.username,
                User.email
            ).join(User).filter(
                and_(
                    Order.order_date >= start_date,
                    Order.order_date <= end_date
                )
            ).all()

            output = io.StringIO()
            writer = csv.writer(output)
            
            writer.writerow(['Order ID', 'Date', 'Total Amount', 'Status', 'Customer', 'Email'])
            for order in orders:
                writer.writerow([
                    order.order_id,
                    order.order_date.isoformat(),
                    order.total_amount,
                    order.order_status.value if order.order_status else '',
                    order.username,
                    order.email
                ])

        elif report_type == 'inventory':
            # Export inventory data
            products = db.session.query(
                Product.product_name,
                Product.stock_quantity,
                Product.price,
                Category.category_name,
                Product.reorder_level
            ).join(Category).all()

            output = io.StringIO()
            writer = csv.writer(output)
            
            writer.writerow(['Product', 'Stock', 'Price', 'Category', 'Reorder Level'])
            for product in products:
                writer.writerow([
                    product.product_name,
                    product.stock_quantity,
                    product.price,
                    product.category_name,
                    product.reorder_level
                ])

        elif report_type == 'customers':
            # Export customer data
            customers = db.session.query(
                User.username,
                User.email,
                User.first_name,
                User.last_name,
                User.created_at
            ).filter(User.role == UserRole.CUSTOMER).all()

            output = io.StringIO()
            writer = csv.writer(output)
            
            writer.writerow(['Username', 'Email', 'First Name', 'Last Name', 'Created At'])
            for customer in customers:
                writer.writerow([
                    customer.username,
                    customer.email,
                    customer.first_name,
                    customer.last_name,
                    customer.created_at.isoformat() if customer.created_at else ''
                ])

        else:
            return jsonify({'error': 'Invalid report type'}), 400

        output.seek(0)
        
        return jsonify({
            'success': True,
            'data': output.getvalue(),
            'filename': f'{report_type}_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        })

    except Exception as e:
        print(f"Error in export_report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@reports_bp.route('/admin/reports/dashboard', methods=['GET'])
@jwt_required()
def get_reports_dashboard():
    """Get comprehensive reports dashboard data"""
    try:
        if not is_admin():
            return jsonify({'error': 'Unauthorized access'}), 401

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        # Quick stats
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        ).scalar() or 0

        total_orders = db.session.query(func.count(Order.order_id)).filter(
            and_(
                Order.order_date >= start_date,
                Order.order_date <= end_date
            )
        ).scalar() or 0

        total_customers = db.session.query(func.count(User.id)).filter(
            and_(
                User.role == UserRole.CUSTOMER,
                User.created_at >= start_date
            )
        ).scalar() or 0

        low_stock_products = Product.query.filter(Product.stock_quantity <= Product.reorder_level).count()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                },
                'quick_stats': {
                    'total_revenue': float(total_revenue),
                    'total_orders': total_orders,
                    'new_customers': total_customers,
                    'low_stock_products': low_stock_products
                }
            }
        })

    except Exception as e:
        print(f"Error in get_reports_dashboard: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
