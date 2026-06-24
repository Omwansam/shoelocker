#!/usr/bin/env python3
"""
Seed storefront content (retail stores, reward tiers, support articles).

Creates the backing tables if they do not exist and populates them with the
content that previously lived hard-coded in the React storefront pages.

Run once:  pipenv run python server/seed_storefront.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
from models import Store, RewardTier, SupportArticle, StorefrontBrand
from legal_documents import LEGAL_ARTICLE_ROWS, LEGAL_SLUGS


STORES = [
    dict(name='ShoeLocker Two Rivers', street='Two Rivers Mall, Limuru Road',
         city='Nairobi', county='Nairobi', postcode='00619', phone='+254 722 555 014',
         opening_hours='Mon–Sun 9:00–20:00 EAT', pickup_available=True, sort_order=1),
    dict(name='ShoeLocker Sarit Centre', street='Sarit Centre, Westlands',
         city='Nairobi', county='Nairobi', postcode='00623', phone='+254 733 555 018',
         opening_hours='Mon–Sun 9:00–20:00 EAT', pickup_available=True, sort_order=2),
    dict(name='ShoeLocker Nyali', street='Nyali Road, near City Mall',
         city='Mombasa', county='Mombasa', postcode='80100', phone='+254 711 555 021',
         opening_hours='Mon–Sun 9:00–21:00 EAT', pickup_available=True, sort_order=3),
    dict(name='ShoeLocker Mega City', street='Mega City Mall, Oginga Odinga Rd',
         city='Kisumu', county='Kisumu', postcode='40100', phone='+254 725 555 009',
         opening_hours='Mon–Sun 9:00–20:00 EAT', pickup_available=True, sort_order=4),
    dict(name='ShoeLocker Nakuru Westside', street='Westside Mall, Kenyatta Ave',
         city='Nakuru', county='Nakuru', postcode='20100', phone='+254 700 555 033',
         opening_hours='Mon–Sun 9:00–20:00 EAT', pickup_available=True, sort_order=5),
]

REWARD_TIERS = [
    dict(name='Kickoff', min_spend_kes=0, points_multiplier=1.0, sort_order=1,
         perks=[
             'Earn 1 Kickback point for every KSh 100 spent online',
             'Member-only drop alerts via SMS for +254 numbers',
             'Birthday bonus points each year',
         ]),
    dict(name='Baller', min_spend_kes=25000, points_multiplier=1.25, sort_order=2,
         perks=[
             '1.25x points on every order',
             'Early access to limited Nairobi drops',
             'Free standard nationwide courier on orders over KSh 8,000',
         ]),
    dict(name='Hall of Fame', min_spend_kes=75000, points_multiplier=1.5, sort_order=3,
         perks=[
             '1.5x points on every order',
             'Free nationwide courier on every order',
             'Priority store pickup and dedicated support line',
         ]),
]

SUPPORT_ARTICLES = [
    dict(slug='contact', title='Contact us', category='help', sort_order=1,
         body='Reach the ShoeLocker care desk at hello@shoelocker.ke or visit a retail '
              'location. EAT hours — typical reply same business day on Nairobi time.'),
    dict(slug='orders', title='Order status', category='help', sort_order=2,
         body='Track orders from your account after checkout. Confirmation details are '
              'sent when order emails are enabled in store settings.'),
    dict(slug='shipping', title='Shipping info', category='help', sort_order=3,
         body='ShoeLocker dispatches from Nairobi with same-day handoff to couriers when '
              'stock is on-hand. Nairobi & Kiambu metro: 1–2 business days. Coast & western '
              'towns: 2–4 business days. Remote counties: up to 5 business days. All prices '
              'are in KES inclusive of VAT where applicable.'),
    dict(slug='pickup', title='Store pickup', category='help', sort_order=4,
         body='Order online and collect at Two Rivers, Sarit, Nyali, Kisumu Mega, or Nakuru '
              'Westside during mall hours. Bring your order ID and national ID or passport '
              'for verification.'),
    dict(slug='returns', title='Returns & exchanges', category='policy', sort_order=5,
         body='Unworn pairs in original box with tags may be exchanged within 14 days '
              'in-store (Nairobi branches) or returned within 30 days nationwide via our '
              'courier network. M-Pesa refunds follow when payment rails are connected.'),
    dict(slug='about', title='About ShoeLocker', category='company', sort_order=6,
         body='ShoeLocker is a Kenya-first sneaker retailer blending global brands with '
              'local service — flagship web experience, nationwide delivery, and mall stores '
              'you can walk into.'),
    dict(slug='careers', title='Careers', category='company', sort_order=7,
         body='We hire bold merchandisers and engineers. Email your CV to careers@shoelocker.ke '
              'and tell us which store or team you want to join.'),
    dict(slug='affiliates', title='Affiliates', category='company', sort_order=8,
         body='Content creators and campus reps can partner with ShoeLocker for tracked links '
              'and commission on qualifying sales. Email partners@shoelocker.ke with your '
              'audience and social handles to apply.'),
    dict(slug='gift-cards', title='Gift cards', category='help', sort_order=9,
         body='Digital gift cards can be redeemed online and in participating stores once '
              'payments go live.'),
] + LEGAL_ARTICLE_ROWS


STOREFRONT_BRANDS = [
    dict(
        slug='nike', label='Nike', catalog_brand='Nike', is_featured=True, featured_order=1,
        tagline='Just do it — performance & street', accent_color='#e60012',
        image_url='https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
        wall_order=0,
    ),
    dict(
        slug='jordan', label='Jordan', catalog_brand='Nike', is_featured=True, featured_order=2,
        tagline='Flight heritage & court DNA', accent_color='#f97316',
        image_url='https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200',
        wall_order=0,
    ),
    dict(
        slug='adidas', label='adidas', catalog_brand='adidas', is_featured=True, featured_order=3,
        tagline='Three stripes — sport to sidewalk', accent_color='#2563eb',
        image_url='https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=85',
        wall_order=0,
    ),
    dict(
        slug='puma', label='PUMA', catalog_brand='Puma', is_featured=False, wall_order=1,
        image_url='https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='new-balance', label='New Balance', catalog_brand='New Balance', is_featured=False, wall_order=2,
        image_url='https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='asics', label='ASICS', catalog_brand='ASICS', is_featured=False, wall_order=3,
        image_url='https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='converse', label='Converse', catalog_brand='Converse', is_featured=False, wall_order=4,
        image_url='https://images.unsplash.com/photo-1491553895911-ef5dbc77145a?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='reebok', label='Reebok', catalog_brand='Reebok', is_featured=False, wall_order=5,
        image_url='https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='vans', label='Vans', catalog_brand='Vans', is_featured=False, wall_order=6,
        image_url='https://images.unsplash.com/photo-1525966222134-fcfa99b8d953?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='fila', label='Fila', catalog_brand='Fila', is_featured=False, wall_order=7,
        image_url='https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='under-armour', label='Under Armour', catalog_brand='Under Armour', is_featured=False, wall_order=8,
        image_url='https://images.unsplash.com/photo-1600185365926-3a7ce9cdb9bb?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='saucony', label='Saucony', catalog_brand='Saucony', is_featured=False, wall_order=9,
        image_url='https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='on-running', label='On', catalog_brand='On', is_featured=False, wall_order=10,
        image_url='https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=900',
    ),
    dict(
        slug='hoka', label='HOKA', catalog_brand='HOKA', is_featured=False, wall_order=11,
        image_url='https://images.unsplash.com/photo-1605348532760-675c11b08c1b?auto=format&fit=crop&w=900&q=85',
    ),
    dict(
        slug='salomon', label='Salomon', catalog_brand='Salomon', is_featured=False, wall_order=12,
        image_url='https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=900',
    ),
    dict(
        slug='skechers', label='Skechers', catalog_brand='Skechers', is_featured=False, wall_order=13,
        image_url='https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85',
    ),
]


def seed():
    db.create_all()

    if Store.query.count() == 0:
        db.session.add_all([Store(**s) for s in STORES])
        print(f"Seeded {len(STORES)} stores.")
    else:
        print(f"Stores already present ({Store.query.count()}); skipping.")

    if RewardTier.query.count() == 0:
        db.session.add_all([RewardTier(**t) for t in REWARD_TIERS])
        print(f"Seeded {len(REWARD_TIERS)} reward tiers.")
    else:
        print(f"Reward tiers already present ({RewardTier.query.count()}); skipping.")

    if SupportArticle.query.count() == 0:
        db.session.add_all([SupportArticle(**a) for a in SUPPORT_ARTICLES])
        print(f"Seeded {len(SUPPORT_ARTICLES)} support articles.")
    else:
        existing_slugs = {a.slug for a in SupportArticle.query.all()}
        added = 0
        for row in SUPPORT_ARTICLES:
            if row['slug'] not in existing_slugs:
                db.session.add(SupportArticle(**row))
                added += 1
        if added:
            print(f"Added {added} new support article(s).")
        else:
            print(f"Support articles up to date ({SupportArticle.query.count()}).")

    legal_by_slug = {row['slug']: row for row in LEGAL_ARTICLE_ROWS}
    refreshed = 0
    for slug in LEGAL_SLUGS:
        row = legal_by_slug[slug]
        article = SupportArticle.query.filter_by(slug=slug).first()
        if article:
            article.title = row['title']
            article.category = row['category']
            article.sort_order = row['sort_order']
            article.body = row['body']
            refreshed += 1
        else:
            db.session.add(SupportArticle(**row))
            refreshed += 1
    if refreshed:
        print(f"Legal documents synced ({refreshed}).")

    if StorefrontBrand.query.count() == 0:
        db.session.add_all([StorefrontBrand(**b) for b in STOREFRONT_BRANDS])
        print(f"Seeded {len(STOREFRONT_BRANDS)} storefront brands.")
    else:
        existing = {b.slug for b in StorefrontBrand.query.all()}
        added = 0
        for row in STOREFRONT_BRANDS:
            if row['slug'] not in existing:
                db.session.add(StorefrontBrand(**row))
                added += 1
        if added:
            print(f"Added {added} new storefront brand(s).")
        else:
            print(f"Storefront brands up to date ({StorefrontBrand.query.count()}).")

    db.session.commit()
    print("Storefront content seeding complete.")


if __name__ == '__main__':
    with app.app_context():
        seed()
