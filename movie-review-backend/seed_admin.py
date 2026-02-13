#!/usr/bin/env python3
"""Seed an admin user into the database."""
import mysql.connector
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "user": os.getenv("DB_USER", "movieuser"),
    "password": os.getenv("DB_PASSWORD", "StrongPassword!"),
    "database": os.getenv("DB_NAME", "movie_review_db"),
}

ADMIN_EMAIL = "admin@dinoco.local"
ADMIN_PASSWORD = "Admin@123456"
ADMIN_NAME = "Admin"

def seed_admin():
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Check if admin exists
        cursor.execute("SELECT * FROM users WHERE email=%s", (ADMIN_EMAIL,))
        existing = cursor.fetchone()
        
        if existing:
            if existing['role'] == 'admin':
                print(f"✓ Admin user already exists: {ADMIN_EMAIL}")
                return
            else:
                # Upgrade existing user to admin
                cursor.execute("UPDATE users SET role='admin' WHERE email=%s", (ADMIN_EMAIL,))
                conn.commit()
                print(f"✓ Upgraded {ADMIN_EMAIL} to admin")
                return
        
        # Create new admin
        hashed_password = generate_password_hash(ADMIN_PASSWORD)
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, 'admin')",
            (ADMIN_NAME, ADMIN_EMAIL, hashed_password)
        )
        conn.commit()
        print(f"✓ Admin user created successfully!")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        
    except mysql.connector.Error as e:
        print(f"✗ Database error: {e}")
        exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_admin()
