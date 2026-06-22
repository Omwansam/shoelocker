"""Shared helpers for dashboard and analytics queries."""

from datetime import timedelta

from models import OrderStatus

# Orders that count toward revenue / category charts
REVENUE_ORDER_STATUSES = (
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.PROCESSING,
)

# Orders included in order-volume charts (exclude cancelled/returned)
ACTIVE_ORDER_STATUSES = (
    OrderStatus.DELIVERED,
    OrderStatus.SHIPPED,
    OrderStatus.PROCESSING,
    OrderStatus.PENDING,
)


def fill_daily_sales(rows, start_date, end_date):
    """Fill missing days with zero revenue/orders for continuous chart data."""
    by_date = {}
    for row in rows or []:
        key = row.get('date_key') or row.get('date')
        if hasattr(key, 'isoformat'):
            key = key.isoformat()[:10]
        else:
            key = str(key)[:10]
        by_date[key] = row

    filled = []
    cursor = start_date.date() if hasattr(start_date, 'date') else start_date
    end = end_date.date() if hasattr(end_date, 'date') else end_date
    while cursor <= end:
        key = cursor.isoformat()
        existing = by_date.get(key, {})
        filled.append({
            'date': cursor.strftime('%b %d'),
            'date_key': key,
            'revenue': float(existing.get('revenue', 0) or 0),
            'orders': int(existing.get('orders', 0) or 0),
            'customers': int(existing.get('customers', 0) or 0),
            'profit': float(existing.get('revenue', 0) or 0) * 0.3,
        })
        cursor += timedelta(days=1)
    return filled
