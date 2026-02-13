from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import logging
from datetime import datetime, timedelta
import secrets
import smtplib
from email.message import EmailMessage
from functools import wraps
import jwt

load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logger = logging.getLogger("movie-review-backend")
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(LOG_LEVEL)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "user": os.getenv("DB_USER", "movieuser"),
    "password": os.getenv("DB_PASSWORD", "StrongPassword!"),
    "database": os.getenv("DB_NAME", "movie_review_db"),
}

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
CORS(app)


def create_jwt_token(user_id, email, role):
    """Create a JWT token for authenticated users."""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token and return payload if valid."""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token required'}), 401
        
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    return decorated

def require_role(*roles):
    """Decorator to require specific roles."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if request.user.get('role') not in roles:
                return jsonify({'message': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def ensure_movie_schema():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            ALTER TABLE movies
            ADD COLUMN IF NOT EXISTS duration_minutes INT,
            ADD COLUMN IF NOT EXISTS poster_url VARCHAR(255),
            ADD COLUMN IF NOT EXISTS description TEXT
            """
        )
        conn.commit()
    except mysql.connector.Error:
        logger.exception("Failed to migrate movies schema")
    finally:
        if conn:
            conn.close()


def ensure_auth_schema():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS login_otps (
                otp_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                consumed TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (expires_at)
            )
            """
        )
        conn.commit()
    except mysql.connector.Error:
        logger.exception("Failed to migrate auth schema")
    finally:
        if conn:
            conn.close()
def get_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        logger.exception("Failed to get DB connection")
        raise


ensure_movie_schema()
ensure_auth_schema()


def send_otp_email(to_email, code):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@dinoco.local")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    # Always log the OTP code for debugging
    logger.warning("🔐 OTP CODE FOR %s: %s", to_email, code)

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.warning("SMTP not configured. OTP for %s: %s", to_email, code)
        return False

    msg = EmailMessage()
    msg["Subject"] = "Dinoco login verification code"
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg.set_content(
        f"Your Dinoco verification code is {code}. It expires in 10 minutes."
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return False


def issue_login_otp(user_id, email):
    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = generate_password_hash(code)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE login_otps SET consumed=1 WHERE user_id=%s",
            (user_id,),
        )
        cursor.execute(
            "INSERT INTO login_otps (user_id, code_hash, expires_at) VALUES (%s,%s,%s)",
            (user_id, code_hash, expires_at),
        )
        conn.commit()
    finally:
        if conn:
            conn.close()

    smtp_sent = send_otp_email(email, code)
    return code if not smtp_sent else None


@app.route("/")
def home():
    return "Movie Review Backend Running!"


@app.route("/api/register", methods=["POST"])
def register():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    if not name or not email or not password:
        return jsonify({"message": "name, email and password required"}), 400

    hashed = generate_password_hash(password)
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s,%s,%s)",
            (name, email, hashed),
        )
        conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except mysql.connector.IntegrityError:
        logger.info("Attempt to register existing email: %s", email)
        return jsonify({"message": "Email already registered"}), 400
    except mysql.connector.Error:
        logger.exception("Database error during register")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"message": "email and password required"}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        if user and check_password_hash(user["password"], password):
            dev_code = issue_login_otp(user["user_id"], user["email"])
            payload = {
                "message": "OTP sent",
                "otp_required": True,
                "email": user["email"],
            }
            # Always return dev_otp in development
            if os.getenv("FLASK_ENV") == "development" or dev_code:
                payload["dev_otp"] = dev_code if dev_code else "Check console"
            return jsonify(payload)
        return jsonify({"message": "Invalid credentials"}), 401
    except mysql.connector.Error:
        logger.exception("Database error during login for %s", email)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/login/verify-otp", methods=["POST"])
def verify_login_otp():
    data = request.json or {}
    email = data.get("email")
    code = data.get("code")
    if not email or not code:
        return jsonify({"message": "email and code required"}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "Invalid credentials"}), 401

        cursor.execute(
            """
            SELECT * FROM login_otps
            WHERE user_id=%s AND consumed=0 AND expires_at > %s
            ORDER BY created_at DESC LIMIT 1
            """,
            (user["user_id"], datetime.utcnow()),
        )
        otp = cursor.fetchone()
        if not otp or not check_password_hash(otp["code_hash"], code):
            return jsonify({"message": "Invalid or expired code"}), 401

        cursor.execute("UPDATE login_otps SET consumed=1 WHERE otp_id=%s", (otp["otp_id"],))
        conn.commit()

        # Create JWT token
        token = create_jwt_token(user["user_id"], user["email"], user["role"])
        user.pop("password", None)
        return jsonify({"message": "Login successful", "user": user, "token": token})
    except mysql.connector.Error:
        logger.exception("Database error during OTP verify for %s", email)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/movies", methods=["GET"])
def get_movies():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT m.*, COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(r.review_id) AS review_count
            FROM movies m
            LEFT JOIN reviews r ON m.movie_id = r.movie_id
            GROUP BY m.movie_id
            ORDER BY m.movie_id DESC
            """
        )
        movies = cursor.fetchall()
        return jsonify(movies)
    except mysql.connector.Error:
        logger.exception("Failed to fetch movies")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/movies/<int:id>", methods=["GET"])
def get_movie(id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT m.*, COALESCE(AVG(r.rating), 0) AS avg_rating,
                   COUNT(r.review_id) AS review_count
            FROM movies m
            LEFT JOIN reviews r ON m.movie_id = r.movie_id
            WHERE m.movie_id=%s
            GROUP BY m.movie_id
            """,
            (id,),
        )
        movie = cursor.fetchone()
        if not movie:
            return jsonify({"message": "Movie not found"}), 404
        return jsonify(movie)
    except mysql.connector.Error:
        logger.exception("Failed to fetch movie id=%s", id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/movies", methods=["POST"])
@require_role('admin')
def add_movie():
    data = request.json or {}
    title = data.get("title")
    if not title:
        return jsonify({"message": "title required"}), 400
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO movies (title, genre, language, release_year, duration_minutes, poster_url, description)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                data.get("title"),
                data.get("genre"),
                data.get("language"),
                data.get("release_year"),
                data.get("duration_minutes"),
                data.get("poster_url"),
                data.get("description"),
            ),
        )
        conn.commit()
        return jsonify({"message": "Movie added successfully"}), 201
    except mysql.connector.Error:
        logger.exception("Failed to add movie: %s", data)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/movies/<int:id>", methods=["PUT"])
@require_role('admin')
def update_movie(id):
    data = request.json or {}
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE movies
            SET title=%s, genre=%s, language=%s, release_year=%s,
                duration_minutes=%s, poster_url=%s, description=%s
            WHERE movie_id=%s
            """,
            (
                data.get("title"),
                data.get("genre"),
                data.get("language"),
                data.get("release_year"),
                data.get("duration_minutes"),
                data.get("poster_url"),
                data.get("description"),
                id,
            ),
        )
        conn.commit()
        return jsonify({"message": "Movie updated successfully"})
    except mysql.connector.Error:
        logger.exception("Failed to update movie id=%s", id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/movies/<int:id>", methods=["DELETE"])
@require_role('admin')
def delete_movie(id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM movies WHERE movie_id=%s", (id,))
        conn.commit()
        return jsonify({"message": "Movie deleted successfully"})
    except mysql.connector.Error:
        logger.exception("Failed to delete movie id=%s", id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/reviews", methods=["POST"])
def add_review():
    data = request.json or {}
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (%s,%s,%s,%s)",
            (data.get("user_id"), data.get("movie_id"), data.get("rating"), data.get("comment")),
        )
        conn.commit()
        return jsonify({"message": "Review added successfully"}), 201
    except mysql.connector.Error:
        logger.exception("Failed to add review: %s", data)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total_movies FROM movies")
        total_movies = cursor.fetchone()["total_movies"]
        cursor.execute("SELECT COUNT(*) AS total_users FROM users")
        total_users = cursor.fetchone()["total_users"]
        cursor.execute("SELECT COUNT(*) AS total_reviews FROM reviews")
        total_reviews = cursor.fetchone()["total_reviews"]
        return jsonify(
            {
                "total_movies": total_movies,
                "total_users": total_users,
                "total_reviews": total_reviews,
            }
        )
    except mysql.connector.Error:
        logger.exception("Failed to fetch stats")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/reviews/movie/<int:movie_id>", methods=["GET"])
def get_movie_reviews(movie_id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id=u.user_id WHERE movie_id=%s",
            (movie_id,),
        )
        reviews = cursor.fetchall()
        return jsonify(reviews)
    except mysql.connector.Error:
        logger.exception("Failed to fetch reviews for movie_id=%s", movie_id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    # Register a generic error handler to log unexpected exceptions
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.exception("Unhandled exception: %s", e)
        return jsonify({"message": "Internal server error"}), 500

@app.route("/api/proxy-image", methods=["GET"])
def proxy_image():
    """Proxy image requests to avoid CORS issues"""
    import requests
    url = request.args.get("url")
    if not url:
        return jsonify({"message": "Missing url parameter"}), 400
    
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.content, 200, {
            "Content-Type": response.headers.get("Content-Type", "image/jpeg"),
            "Cache-Control": "max-age=86400"
        }
    except Exception as e:
        logger.exception("Failed to proxy image from %s: %s", url, e)
        return jsonify({"message": "Failed to fetch image"}), 500


if __name__ == "__main__":
    # Register a generic error handler to log unexpected exceptions
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.exception("Unhandled exception: %s", e)
        return jsonify({"message": "Internal server error"}), 500

    debug_flag = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=debug_flag)
