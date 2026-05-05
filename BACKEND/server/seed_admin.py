#!/usr/bin/env python3
"""
Seed script to create an admin user for ShoeLocker backend.
Run this script once to initialize the admin account.
"""

import sys
import os

# Add the current directory to the path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db
from models import User, UserRole
from werkzeug.security import generate_password_hash

def create_admin_user():
    """Create the admin user if it doesn't exist."""
    admin_email = "ops@shoelocker.ke"
    admin_password = "Admin@ShoeLocker2024!"  # Strong password
    admin_username = "admin"

    # Check if admin user already exists
    existing_user = User.query.filter_by(email=admin_email).first()
    if existing_user:
        print(f"Admin user with email {admin_email} already exists.")
        return

    # Create the admin user
    password_hash = generate_password_hash(admin_password)
    admin_user = User(
        username=admin_username,
        email=admin_email,
        password_hash=password_hash,
        first_name="Admin",
        last_name="User",
        is_admin=True,
        role=UserRole.ADMIN,
        is_active=True
    )

    try:
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        print("Please change the password after first login.")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating admin user: {str(e)}")

if __name__ == "__main__":
    with app.app_context():
        create_admin_user()
