#!/usr/bin/env python3
"""
Seed script to populate the ShoeLocker backend with the initial prototype products.
Run this script once to initialize the catalog.
"""

import sys
import os

# Add the current directory to the path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
from models import Product, Category

# Raw seed data matching the original mock catalog
SEED_PRODUCTS = [
  {
    "id": "nk-air-max-270",
    "name": "Air Max 270",
    "brand": "Nike",
    "price": 23999,
    "category": "men",
    "isNew": True,
    "sizes": ["7", "7.5", "8", "8.5", "9", "9.5", "10", "11"],
    "description": "Big Air underfoot and a stretchy inner sleeve create a sock-like fit with striking style.",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "ad-ultraboost-light",
    "name": "Ultraboost Light",
    "brand": "adidas",
    "price": 28999,
    "category": "men",
    "isNew": False,
    "sizes": ["7", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
    "description": "Responsive Boost midsole with Linear Energy Push for energized strides all day.",
    "image": "https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "pm-rs-x",
    "name": "RS-X Reinvention",
    "brand": "Puma",
    "price": 17499,
    "category": "women",
    "isNew": False,
    "sizes": ["5", "5.5", "6", "6.5", "7", "7.5", "8"],
    "description": "Chunky tooling and bold overlays bring ’90s track DNA into a modern lifestyle silhouette.",
    "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "jm-997h",
    "name": "997H Essentials",
    "brand": "New Balance",
    "price": 15499,
    "category": "men",
    "isNew": True,
    "sizes": ["7", "7.5", "8", "8.5", "9", "10", "10.5"],
    "description": "Heritage-inspired lines with plush foam for everyday comfort.",
    "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "nk-dunk-low",
    "name": "Dunk Low Retro",
    "brand": "Nike",
    "price": 18499,
    "category": "women",
    "isNew": True,
    "sizes": ["5", "6", "6.5", "7", "7.5", "8", "9"],
    "description": "Court DNA with padded low-cut collar for comfort on and off the hardwood.",
    "image": "https://images.unsplash.com/photo-1595950653106-6c79ebd73435?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1595950653106-6c79ebd73435?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "ad-campus-00s",
    "name": "Campus 00s",
    "brand": "adidas",
    "price": 17499,
    "category": "kids",
    "isNew": False,
    "sizes": ["3.5Y", "4Y", "5Y", "5.5Y", "6Y", "7Y"],
    "description": "Soft suede upper with exaggerated proportions tuned for playgrounds and sidewalks.",
    "image": "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "as-gel-kayano",
    "name": "GEL-Kayano Legacy",
    "brand": "ASICS",
    "price": 24999,
    "category": "men",
    "isNew": False,
    "sizes": ["7", "8", "8.5", "9", "9.5", "10", "11"],
    "description": "Stability and GEL cushioning for smooth transitions from warmup to cooldown.",
    "image": "https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1578608718682-7399c4f7d6d4?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578608718682-7399c4f7d6d4?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "cv-chuck70",
    "name": "Chuck 70 High",
    "brand": "Converse",
    "price": 13999,
    "category": "women",
    "isNew": False,
    "sizes": ["5", "6", "6.5", "7", "7.5", "8"],
    "description": "Premium canvas with vintage details and vulcanized sole for stacked style.",
    "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1571077226622-5479d7e7d6e3?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571077226622-5479d7e7d6e3?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "nk-blazer-mid",
    "name": "Blazer Mid ’77",
    "brand": "Nike",
    "price": 16499,
    "category": "kids",
    "isNew": True,
    "sizes": ["3.5Y", "4Y", "4.5Y", "5Y", "6Y"],
    "description": "Throwback hoops look with autoclave construction and grippy rubber outsole.",
    "image": "https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "rb-club-c",
    "name": "Club C Grounds UK",
    "brand": "Reebok",
    "price": 13499,
    "category": "men",
    "isNew": False,
    "sizes": ["7", "7.5", "8", "9", "9.5", "10"],
    "description": "Soft garment leather keeps the OG tennis profile refreshingly simple.",
    "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "vl-old-skool",
    "name": "Old Skool",
    "brand": "Vans",
    "price": 11999,
    "category": "women",
    "isNew": False,
    "sizes": ["5", "6", "6.5", "7", "7.5", "8", "8.5"],
    "description": "Iconic side stripe and durable suede/canvas mix for everyday wear.",
    "image": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "pm-suede-classic",
    "name": "Suede Classic XXl",
    "brand": "Puma",
    "price": 12499,
    "category": "kids",
    "isNew": False,
    "sizes": ["3.5Y", "4Y", "5Y", "6Y"],
    "description": "Soft suede heritage upper with tonal formstrip branding.",
    "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "nk-vapormax",
    "name": "Air VaporMax Flyknit 3",
    "brand": "Nike",
    "price": 33999,
    "category": "men",
    "isNew": True,
    "sizes": ["7", "8", "8.5", "9", "9.5", "10", "11", "12"],
    "description": "Flyknit upper meets full-length Air for a futuristic ride.",
    "image": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    "id": "ad-samba-og",
    "name": "Samba OG",
    "brand": "adidas",
    "price": 15499,
    "category": "women",
    "isNew": True,
    "sizes": ["5", "5.5", "6", "6.5", "7", "7.5", "8", "9"],
    "description": "Indoor-soccer roots meet street staples with supple leather and suede.",
    "image": "https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=900&q=80",
    "hoverImage": "https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=900&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=1200&q=80",
    ],
  },
]

def seed_products():
    """Seed categories and products if they don't already exist."""
    print("Starting product seed process...")
    
    # 1. Ensure Categories exist
    cat_map = {}
    for cat_name in ['men', 'women', 'kids']:
        cat = Category.query.filter_by(name=cat_name).first()
        if not cat:
            cat = Category(
                name=cat_name,
                category_name=cat_name,
                category_description=f"{cat_name.capitalize()}'s collection"
            )
            db.session.add(cat)
            db.session.commit()
            print(f"Created category: {cat_name}")
        cat_map[cat_name] = cat.category_id

    # 2. Add products
    added_count = 0
    for p_data in SEED_PRODUCTS:
        # Check if product exists by slug
        existing = Product.query.filter_by(product_slug=p_data['id']).first()
        if existing:
            continue
            
        new_product = Product(
            product_slug=p_data['id'],
            product_name=p_data['name'],
            brand=p_data['brand'],
            storefront_category=p_data['category'],
            product_price=float(p_data['price']),
            is_new=p_data['isNew'],
            sizes=p_data['sizes'],
            product_description=p_data['description'],
            image=p_data['image'],
            hover_image=p_data['hoverImage'],
            gallery=p_data['gallery'],
            stock_quantity=24,  # Arbitrary default stock
            category_id=cat_map.get(p_data['category'], 1)
        )
        db.session.add(new_product)
        added_count += 1

    try:
        db.session.commit()
        if added_count > 0:
            print(f"Successfully seeded {added_count} products!")
        else:
            print("All seed products already exist. No new products added.")
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding products: {str(e)}")

if __name__ == "__main__":
    with app.app_context():
        seed_products()
