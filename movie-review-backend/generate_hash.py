from werkzeug.security import generate_password_hash
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "user": os.getenv("DB_USER", "movieuser"),
    "password": os.getenv("DB_PASSWORD", "StrongPassword!"),
    "database": os.getenv("DB_NAME", "movie_review_db"),
}

password = "Admin@123456"
hashed = generate_password_hash(password)
print(f"Hashed password: {hashed}")

# Update the admin user with the correct hash
try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET password=%s WHERE email=%s",
        (hashed, "admin@dinoco.local")
    )
    conn.commit()
    print("Admin password updated successfully!")
except Exception as e:
    print(f"Error updating admin password: {e}")
finally:
    if conn:
        conn.close()
