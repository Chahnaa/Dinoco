import mysql.connector
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
import secrets
import string

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "user": os.getenv("DB_USER", "movieuser"),
    "password": os.getenv("DB_PASSWORD", "StrongPassword!"),
    "database": os.getenv("DB_NAME", "movie_review_db"),
}

# Generate a test OTP
test_otp = ''.join(secrets.choice(string.digits) for _ in range(6))
test_hash = generate_password_hash(test_otp)

print(f"TEST OTP: {test_otp}")
print(f"Hash: {test_hash}")

# Update the database with this OTP
try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get admin user ID
    cursor.execute("SELECT user_id FROM users WHERE email='admin@dinoco.local'")
    user = cursor.fetchone()
    if not user:
        print("Admin user not found!")
    else:
        user_id = user[0]
        
        # Clear old OTPs
        cursor.execute("DELETE FROM login_otps WHERE user_id=%s", (user_id,))
        
        # Insert new test OTP
        cursor.execute(
            "INSERT INTO login_otps (user_id, code_hash, expires_at) VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 15 MINUTE))",
            (user_id, test_hash)
        )
        conn.commit()
        print(f"\nTest OTP saved to database!")
        print(f"Use this code for admin login: {test_otp}")

except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        conn.close()
