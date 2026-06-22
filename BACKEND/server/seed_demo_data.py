#!/usr/bin/env python3
"""
Seed demo customers, orders, and payments for dashboard & analytics.
Run after seed_products.py so charts have realistic Kenya storefront data.

Usage:
  python seed_demo_data.py
  python seed_demo_data.py --force   # replace existing demo orders
"""

import argparse
import random
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from werkzeug.security import generate_password_hash
from app import app, db
from models import (
    User,
    UserRole,
    Product,
    Order,
    OrderItem,
    Payment,
    PaymentMethod,
    PaymentStatus,
    OrderStatus,
    DiscountType,
    ShippingStatus,
)

DEMO_CUSTOMERS = [
    ('wanjiku_m', 'wanjiku@example.ke', 'Wanjiku', 'Mwangi', 'Nairobi', 'Nairobi'),
    ('otieno_j', 'otieno@example.ke', 'James', 'Otieno', 'Kisumu', 'Kisumu'),
    ('amina_h', 'amina@example.ke', 'Amina', 'Hassan', 'Mombasa', 'Mombasa'),
    ('david_k', 'david@example.ke', 'David', 'Kipchoge', 'Eldoret', 'Uasin Gishu'),
    ('grace_n', 'grace@example.ke', 'Grace', 'Njeri', 'Nakuru', 'Nakuru'),
    ('brian_o', 'brian@example.ke', 'Brian', 'Ochieng', 'Nairobi', 'Nairobi'),
    ('faith_w', 'faith@example.ke', 'Faith', 'Wambui', 'Thika', 'Kiambu'),
    ('kevin_m', 'kevin@example.ke', 'Kevin', 'Mutua', 'Machakos', 'Machakos'),
]

PAYMENT_METHODS = ('mpesa', 'pay_on_delivery', 'mpesa', 'mpesa')
STATUS_WEIGHTS = [
    (OrderStatus.DELIVERED, 52),
    (OrderStatus.SHIPPED, 14),
    (OrderStatus.PROCESSING, 12),
    (OrderStatus.PENDING, 12),
    (OrderStatus.CANCELLED, 5),
    (OrderStatus.RETURNED, 5),
]


def _weighted_status():
    pool = []
    for status, weight in STATUS_WEIGHTS:
        pool.extend([status] * weight)
    return random.choice(pool)


def _payment_status_for_order(order_status, method):
    if order_status in (OrderStatus.CANCELLED, OrderStatus.RETURNED):
        return PaymentStatus.FAILED if method == 'mpesa' else PaymentStatus.PENDING
    if method == 'pay_on_delivery' and order_status != OrderStatus.DELIVERED:
        return PaymentStatus.PENDING
    if method == 'mpesa':
        return PaymentStatus.COMPLETED if order_status in (
            OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING
        ) else PaymentStatus.PENDING
    return PaymentStatus.COMPLETED


def _ensure_customers():
    customers = []
    password_hash = generate_password_hash('Demo@Customer2024!')
    for username, email, first, last, city, county in DEMO_CUSTOMERS:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                first_name=first,
                last_name=last,
                phone=f"+2547{random.randint(10000000, 99999999)}",
                address=f"{city}, {county}, Kenya",
                is_admin=False,
                role=UserRole.USER,
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()
        customers.append((user, city, county))
    db.session.commit()
    return customers


def _ensure_payment_method(user_id, card_type='mpesa'):
    pm = PaymentMethod.query.filter_by(user_id=user_id, card_type=card_type).first()
    if pm:
        return pm.payment_method_id
    pm = PaymentMethod(
        user_id=user_id,
        card_type=card_type,
        card_number='N/A',
        expiration_date='12/99',
        security_code='000',
        billing_address='Kenya',
    )
    db.session.add(pm)
    db.session.flush()
    return pm.payment_method_id


def _clear_demo_orders():
    OrderItem.query.delete()
    Payment.query.delete()
    Order.query.delete()
    db.session.commit()


def seed_demo_orders(force=False, order_count=90):
    with app.app_context():
        existing = Order.query.count()
        if existing > 0 and not force:
            print(f"Skipping demo orders — {existing} order(s) already in database.")
            print("Run with --force to replace demo order data.")
            return

        products = Product.query.all()
        if not products:
            print("No products found. Run seed_products.py first.")
            return

        if force and existing > 0:
            print("Removing existing orders for demo reseed…")
            _clear_demo_orders()

        customers = _ensure_customers()
        print(f"Seeding {order_count} demo orders across {len(customers)} customers…")

        now = datetime.now()
        created = 0

        for i in range(order_count):
            user, city, county = random.choice(customers)
            days_ago = random.randint(0, 89)
            hour = random.randint(8, 21)
            minute = random.choice([0, 15, 30, 45])
            order_date = now - timedelta(days=days_ago, hours=random.randint(0, 8))
            order_date = order_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

            status = _weighted_status()
            method = random.choice(PAYMENT_METHODS)
            line_count = random.randint(1, min(3, len(products)))
            chosen = random.sample(products, line_count)

            subtotal = 0.0
            for product in chosen:
                qty = random.randint(1, 2)
                price = float(product.product_price or 0)
                subtotal += price * qty

            shipping = 0.0 if subtotal >= 12000 else round(350 + 150 * line_count, 2)
            total = round(subtotal + shipping, 2)

            order = Order(
                user_id=user.id,
                total_amount=total,
                total_kes=total,
                order_status=status,
                status=status,
                order_date=order_date,
                shipping_address=f"{user.first_name} {user.last_name} · {user.phone} · {city}, {county}, Kenya",
                customer_name=f"{user.first_name} {user.last_name}",
                customer_phone=user.phone,
                customer_email=user.email,
                city=city,
                county=county,
                payment_method_label=method,
                payment_status=_payment_status_for_order(status, method),
                courier=random.choice(['G4S', 'Fargo', 'Pickup Mtaani', 'Bolt Send']) if status in (
                    OrderStatus.SHIPPED, OrderStatus.DELIVERED
                ) else None,
            )
            db.session.add(order)
            db.session.flush()

            for product in chosen:
                qty = random.randint(1, 2)
                price = float(product.product_price or 0)
                db.session.add(
                    OrderItem(
                        order_id=order.order_id,
                        product_id=product.product_id,
                        quantity=qty,
                        price=price,
                        size=random.choice(['8', '9', '10', 'OS']) if product else 'OS',
                        product_name_snapshot=product.product_name,
                        product_brand_snapshot=product.brand,
                        shipping_cost=f"{shipping:.2f}",
                        tax='0.00',
                        discount='0.00',
                        discount_type=DiscountType.REGULAR,
                        shipping_status=ShippingStatus.PENDING if status == OrderStatus.PENDING else ShippingStatus.SHIPPED,
                    )
                )

            pm_id = _ensure_payment_method(user.id, method)
            pay_status = _payment_status_for_order(status, method)
            db.session.add(
                Payment(
                    order_id=order.order_id,
                    user_id=user.id,
                    payment_amount=f"{total:.2f}",
                    transaction_id=f"demo-txn-{order.order_id}-{i:04d}",
                    payment_status=pay_status,
                    payment_method_id=pm_id,
                    payment_date=order_date,
                )
            )
            created += 1

        db.session.commit()
        print(f"Demo data ready: {created} orders, {len(customers)} customers, {len(products)} products in catalog.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Seed demo orders for dashboard analytics')
    parser.add_argument('--force', action='store_true', help='Replace existing orders')
    parser.add_argument('--count', type=int, default=90, help='Number of demo orders to create')
    args = parser.parse_args()
    seed_demo_orders(force=args.force, order_count=args.count)
