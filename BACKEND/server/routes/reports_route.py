from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, and_, extract
from datetime import datetime, timedelta
import csv
import io

from models import db, User, Order, OrderItem, Product, Category, Payment, PaymentMethod, OrderStatus, PaymentStatus
from utils.analytics_helpers import REVENUE_ORDER_STATUSES, ACTIVE_ORDER_STATUSES, fill_daily_sales

reports_bp = Blueprint('reports', __name__)

LOW_STOCK_THRESHOLD = 5


def _extract_user_id(identity):
    if identity is None:
        return None
    if isinstance(identity, dict):
        return identity.get('id') or identity.get('user_id')
    return identity


def is_admin():
    try:
        identity = get_jwt_identity()
        user_id = _extract_user_id(identity)
        user = User.query.get(user_id)
        return user and user.is_admin
    except Exception:
        return False


def _get_date_range(days):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def _status_value(status):
    if status is None:
        return 'unknown'
    return status.value if hasattr(status, 'value') else str(status)


@reports_bp.route('/admin/reports/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        total_sales = db.session.query(func.sum(Order.total_amount)).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).scalar() or 0

        total_orders = Order.query.filter(
            Order.order_date >= start_date,
            Order.order_status.in_(ACTIVE_ORDER_STATUSES),
        ).count()

        completed_orders = Order.query.filter(
            Order.order_date >= start_date,
            Order.order_status == OrderStatus.DELIVERED,
        ).count()

        daily_sales = db.session.query(
            func.date(Order.order_date).label('date'),
            func.sum(Order.total_amount).label('total'),
            func.count(Order.order_id).label('orders'),
        ).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(func.date(Order.order_date)).order_by(func.date(Order.order_date)).all()

        sales_rows = []
        for row in daily_sales:
            date_key = row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date)[:10]
            sales_rows.append({
                'date_key': date_key,
                'revenue': float(row.total or 0),
                'orders': int(row.orders or 0),
            })
        daily_trend = fill_daily_sales(sales_rows, start_date, end_date)

        category_sales = db.session.query(
            Category.category_name,
            func.sum(OrderItem.quantity * OrderItem.price).label('total'),
            func.sum(OrderItem.quantity).label('items'),
        ).select_from(Category).join(
            Product, Category.category_id == Product.category_id
        ).join(
            OrderItem, Product.product_id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.order_id
        ).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(Category.category_id).order_by(
            desc(func.sum(OrderItem.quantity * OrderItem.price))
        ).all()

        top_products = db.session.query(
            Product.product_name,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.price).label('total_revenue'),
        ).select_from(Product).join(
            OrderItem, Product.product_id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.order_id
        ).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(Product.product_id).order_by(
            desc(func.sum(OrderItem.quantity))
        ).limit(10).all()

        status_breakdown = db.session.query(
            Order.order_status,
            func.count(Order.order_id).label('count'),
        ).filter(
            Order.order_date >= start_date,
        ).group_by(Order.order_status).all()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days,
                },
                'summary': {
                    'total_sales': float(total_sales),
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0,
                    'average_order_value': float(total_sales / completed_orders) if completed_orders > 0 else 0,
                },
                'daily_trend': [
                    {
                        'date': row.get('date_key', row.get('date')),
                        'label': row.get('date', ''),
                        'total': row.get('revenue', 0),
                        'orders': row.get('orders', 0),
                    }
                    for row in daily_trend
                ],
                'category_sales': [
                    {
                        'category': cat.category_name,
                        'total': float(cat.total or 0),
                        'items': int(cat.items or 0),
                    }
                    for cat in category_sales
                ],
                'top_products': [
                    {
                        'product': prod.product_name,
                        'quantity': int(prod.total_quantity or 0),
                        'revenue': float(prod.total_revenue or 0),
                    }
                    for prod in top_products
                ],
                'status_breakdown': [
                    {'status': _status_value(row.order_status), 'count': row.count}
                    for row in status_breakdown
                ],
            },
        })
    except Exception as e:
        print(f'Error in get_sales_report: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@reports_bp.route('/admin/reports/inventory', methods=['GET'])
@jwt_required()
def get_inventory_report():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        total_products = Product.query.count()
        low_stock_products = Product.query.filter(
            Product.stock_quantity <= LOW_STOCK_THRESHOLD,
            Product.stock_quantity > 0,
        ).count()
        out_of_stock_products = Product.query.filter(Product.stock_quantity == 0).count()

        total_stock_value = db.session.query(
            func.sum(Product.stock_quantity * Product.product_price)
        ).scalar() or 0

        category_inventory = db.session.query(
            Category.category_name,
            func.count(Product.product_id).label('product_count'),
            func.sum(Product.stock_quantity).label('total_stock'),
            func.sum(Product.stock_quantity * Product.product_price).label('stock_value'),
        ).join(Product).group_by(Category.category_id).all()

        low_stock_list = db.session.query(
            Product.product_name,
            Product.stock_quantity,
            Product.product_price,
            Category.category_name,
        ).join(Category).filter(
            Product.stock_quantity <= LOW_STOCK_THRESHOLD,
        ).order_by(Product.stock_quantity).limit(20).all()

        days = request.args.get('days', 30, type=int)
        movement_start = datetime.now() - timedelta(days=days)
        recent_stock_movement = db.session.query(
            Product.product_name,
            func.sum(OrderItem.quantity).label('units_sold'),
        ).select_from(Product).join(
            OrderItem, Product.product_id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.order_id
        ).filter(
            Order.order_date >= movement_start,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(Product.product_id).order_by(
            desc(func.sum(OrderItem.quantity))
        ).limit(15).all()

        return jsonify({
            'success': True,
            'data': {
                'summary': {
                    'total_products': total_products,
                    'low_stock_products': low_stock_products,
                    'out_of_stock_products': out_of_stock_products,
                    'total_stock_value': float(total_stock_value),
                    'low_stock_threshold': LOW_STOCK_THRESHOLD,
                },
                'category_inventory': [
                    {
                        'category': cat.category_name,
                        'product_count': cat.product_count,
                        'total_stock': int(cat.total_stock or 0),
                        'stock_value': float(cat.stock_value or 0),
                    }
                    for cat in category_inventory
                ],
                'low_stock_products': [
                    {
                        'product': prod.product_name,
                        'current_stock': prod.stock_quantity,
                        'reorder_level': LOW_STOCK_THRESHOLD,
                        'price': float(prod.product_price),
                        'category': prod.category_name,
                    }
                    for prod in low_stock_list
                ],
                'top_movers': [
                    {
                        'product': mov.product_name,
                        'units_sold': int(mov.units_sold or 0),
                    }
                    for mov in recent_stock_movement
                ],
            },
        })
    except Exception as e:
        print(f'Error in get_inventory_report: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@reports_bp.route('/admin/reports/customers', methods=['GET'])
@jwt_required()
def get_customer_report():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        total_customers = User.query.filter(User.is_admin == False).count()
        new_customers = User.query.filter(
            User.is_admin == False,
            User.created_at >= start_date,
        ).count()

        customer_totals = db.session.query(
            User.id,
            func.sum(Order.total_amount).label('spent'),
        ).join(Order).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
            User.is_admin == False,
        ).group_by(User.id).all()

        high_value = sum(1 for row in customer_totals if float(row.spent or 0) >= 10000)
        medium_value = sum(1 for row in customer_totals if 5000 <= float(row.spent or 0) < 10000)
        low_value = sum(1 for row in customer_totals if float(row.spent or 0) < 5000)

        repeat_customers = sum(
            1 for row in db.session.query(
                User.id,
                func.count(Order.order_id).label('order_count'),
            ).join(Order).filter(
                Order.order_date >= start_date,
                User.is_admin == False,
            ).group_by(User.id).all()
            if row.order_count > 1
        )

        active_in_period = len(customer_totals)

        top_customers = db.session.query(
            User.username,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Order.order_id).label('order_count'),
            func.sum(Order.total_amount).label('total_spent'),
            func.avg(Order.total_amount).label('avg_order_value'),
        ).join(Order).filter(
            User.is_admin == False,
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(User.id).order_by(desc(func.sum(Order.total_amount))).limit(10).all()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days,
                },
                'summary': {
                    'total_customers': total_customers,
                    'new_customers': new_customers,
                    'active_customers': active_in_period,
                    'repeat_customers': repeat_customers,
                    'retention_rate': (repeat_customers / active_in_period * 100) if active_in_period > 0 else 0,
                },
                'customer_segments': [
                    {'segment': 'High Value (10k+)', 'count': high_value},
                    {'segment': 'Medium Value (5k–10k)', 'count': medium_value},
                    {'segment': 'Low Value (<5k)', 'count': low_value},
                ],
                'top_customers': [
                    {
                        'username': cust.username,
                        'name': f'{cust.first_name or ""} {cust.last_name or ""}'.strip() or cust.username,
                        'email': cust.email,
                        'order_count': cust.order_count,
                        'total_spent': float(cust.total_spent or 0),
                        'avg_order_value': float(cust.avg_order_value or 0),
                    }
                    for cust in top_customers
                ],
            },
        })
    except Exception as e:
        print(f'Error in get_customer_report: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@reports_bp.route('/admin/reports/financial', methods=['GET'])
@jwt_required()
def get_financial_report():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).scalar() or 0

        paid_orders = Order.query.filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).count()

        payment_methods = db.session.query(
            Order.payment_method_label,
            func.count(Order.order_id).label('count'),
            func.sum(Order.total_amount).label('total'),
        ).filter(
            Order.order_date >= start_date,
            Order.payment_method_label.isnot(None),
        ).group_by(Order.payment_method_label).order_by(
            desc(func.sum(Order.total_amount))
        ).all()

        payment_status = db.session.query(
            Order.payment_status,
            func.count(Order.order_id).label('count'),
            func.sum(Order.total_amount).label('total'),
        ).filter(
            Order.order_date >= start_date,
        ).group_by(Order.payment_status).all()

        monthly_revenue = db.session.query(
            extract('year', Order.order_date).label('year'),
            extract('month', Order.order_date).label('month'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.order_id).label('orders'),
        ).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).group_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date),
        ).order_by(
            extract('year', Order.order_date),
            extract('month', Order.order_date),
        ).all()

        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days,
                },
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_orders': paid_orders,
                    'average_order_value': float(total_revenue / paid_orders) if paid_orders > 0 else 0,
                },
                'payment_methods': [
                    {
                        'method': pm.payment_method_label or 'Unknown',
                        'count': pm.count,
                        'total': float(pm.total or 0),
                    }
                    for pm in payment_methods
                ],
                'payment_status': [
                    {
                        'status': _status_value(ps.payment_status),
                        'count': ps.count,
                        'total': float(ps.total or 0),
                    }
                    for ps in payment_status
                ],
                'monthly_trend': [
                    {
                        'year': int(mr.year),
                        'month': int(mr.month),
                        'label': month_names[int(mr.month) - 1] if 1 <= int(mr.month) <= 12 else str(mr.month),
                        'revenue': float(mr.revenue or 0),
                        'orders': mr.orders,
                    }
                    for mr in monthly_revenue
                ],
            },
        })
    except Exception as e:
        print(f'Error in get_financial_report: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@reports_bp.route('/admin/reports/export', methods=['GET'])
@jwt_required()
def export_report():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        report_type = request.args.get('type', 'sales')
        format_type = request.args.get('format', 'csv')
        days = request.args.get('days', 30, type=int)

        if format_type != 'csv':
            return jsonify({'error': 'Only CSV export is supported'}), 400

        start_date, end_date = _get_date_range(days)
        output = io.StringIO()
        writer = csv.writer(output)

        if report_type == 'sales':
            orders = db.session.query(
                Order.order_id,
                Order.order_date,
                Order.total_amount,
                Order.order_status,
                Order.payment_method_label,
                User.username,
                User.email,
            ).join(User).filter(
                Order.order_date >= start_date,
                Order.order_date <= end_date,
            ).order_by(desc(Order.order_date)).all()

            writer.writerow(['Order ID', 'Date', 'Total (KES)', 'Status', 'Payment', 'Customer', 'Email'])
            for order in orders:
                writer.writerow([
                    order.order_id,
                    order.order_date.isoformat() if order.order_date else '',
                    order.total_amount,
                    _status_value(order.order_status),
                    order.payment_method_label or '',
                    order.username,
                    order.email,
                ])

        elif report_type == 'inventory':
            products = db.session.query(
                Product.product_name,
                Product.stock_quantity,
                Product.product_price,
                Category.category_name,
            ).join(Category).order_by(Product.product_name).all()

            writer.writerow(['Product', 'Stock', 'Price (KES)', 'Category', 'Status'])
            for product in products:
                if product.stock_quantity == 0:
                    status = 'Out of stock'
                elif product.stock_quantity <= LOW_STOCK_THRESHOLD:
                    status = 'Low stock'
                else:
                    status = 'In stock'
                writer.writerow([
                    product.product_name,
                    product.stock_quantity,
                    product.product_price,
                    product.category_name,
                    status,
                ])

        elif report_type == 'customers':
            customers = db.session.query(
                User.username,
                User.email,
                User.first_name,
                User.last_name,
                User.created_at,
            ).filter(User.is_admin == False).order_by(User.created_at.desc()).all()

            writer.writerow(['Username', 'Email', 'First Name', 'Last Name', 'Joined'])
            for customer in customers:
                writer.writerow([
                    customer.username,
                    customer.email,
                    customer.first_name,
                    customer.last_name,
                    customer.created_at.isoformat() if customer.created_at else '',
                ])

        elif report_type == 'financial':
            orders = db.session.query(
                Order.order_id,
                Order.order_date,
                Order.total_amount,
                Order.payment_method_label,
                Order.payment_status,
                Order.order_status,
            ).filter(
                Order.order_date >= start_date,
                Order.order_status.in_(REVENUE_ORDER_STATUSES),
            ).order_by(desc(Order.order_date)).all()

            writer.writerow(['Order ID', 'Date', 'Amount (KES)', 'Payment Method', 'Payment Status', 'Order Status'])
            for order in orders:
                writer.writerow([
                    order.order_id,
                    order.order_date.isoformat() if order.order_date else '',
                    order.total_amount,
                    order.payment_method_label or '',
                    _status_value(order.payment_status),
                    _status_value(order.order_status),
                ])

        else:
            return jsonify({'error': 'Invalid report type'}), 400

        output.seek(0)
        return jsonify({
            'success': True,
            'data': output.getvalue(),
            'filename': f'{report_type}_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
        })
    except Exception as e:
        print(f'Error in export_report: {e}')
        return jsonify({'error': 'Internal server error'}), 500


@reports_bp.route('/admin/reports/dashboard', methods=['GET'])
@jwt_required()
def get_reports_dashboard():
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        days = request.args.get('days', 30, type=int)
        start_date, end_date = _get_date_range(days)

        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.order_date >= start_date,
            Order.order_status.in_(REVENUE_ORDER_STATUSES),
        ).scalar() or 0

        total_orders = Order.query.filter(
            Order.order_date >= start_date,
            Order.order_status.in_(ACTIVE_ORDER_STATUSES),
        ).count()

        new_customers = User.query.filter(
            User.is_admin == False,
            User.created_at >= start_date,
        ).count()

        low_stock_products = Product.query.filter(
            Product.stock_quantity <= LOW_STOCK_THRESHOLD,
        ).count()

        delivered_orders = Order.query.filter(
            Order.order_date >= start_date,
            Order.order_status == OrderStatus.DELIVERED,
        ).count()

        return jsonify({
            'success': True,
            'data': {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days,
                },
                'quick_stats': {
                    'total_revenue': float(total_revenue),
                    'total_orders': total_orders,
                    'delivered_orders': delivered_orders,
                    'new_customers': new_customers,
                    'low_stock_products': low_stock_products,
                    'average_order_value': float(total_revenue / delivered_orders) if delivered_orders > 0 else 0,
                },
            },
        })
    except Exception as e:
        print(f'Error in get_reports_dashboard: {e}')
        return jsonify({'error': 'Internal server error'}), 500
