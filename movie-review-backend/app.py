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

def ensure_decision_trace_schema():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS decision_traces (
                trace_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                movie_id INT NOT NULL,
                trace_path JSON NOT NULL,
                trace_summary VARCHAR(255),
                decision_source ENUM('search', 'filter', 'trending', 'recommendation', 'browse', 'direct') DEFAULT 'browse',
                num_steps INT,
                time_spent_seconds INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (movie_id),
                INDEX (decision_source),
                INDEX (created_at),
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
                FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()
    except mysql.connector.Error:
        logger.exception("Failed to migrate decision_traces schema")
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
ensure_decision_trace_schema()


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
@require_auth
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
@require_auth
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
@require_auth
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
@require_auth
def add_review():
    """Create or update a review. One review per user per movie."""
    data = request.json or {}
    user_id = request.user.get("user_id")
    movie_id = data.get("movie_id")
    rating = data.get("rating")
    comment = data.get("comment", "")
    
    if not all([user_id, movie_id, rating]):
        return jsonify({"message": "user_id, movie_id, and rating required"}), 400
    
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({"message": "rating must be between 1 and 5"}), 400
    except (ValueError, TypeError):
        return jsonify({"message": "rating must be a number"}), 400
    
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Check if movie exists
        cursor.execute("SELECT movie_id FROM movies WHERE movie_id=%s", (movie_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Movie not found"}), 404
        
        # Check if user already reviewed this movie
        cursor.execute(
            "SELECT review_id FROM reviews WHERE user_id=%s AND movie_id=%s",
            (user_id, movie_id)
        )
        existing_review = cursor.fetchone()
        
        if existing_review:
            # Update existing review
            cursor.execute(
                "UPDATE reviews SET rating=%s, comment=%s, review_date=NOW() WHERE user_id=%s AND movie_id=%s",
                (rating, comment, user_id, movie_id)
            )
        else:
            # Create new review
            cursor.execute(
                "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (%s,%s,%s,%s)",
                (user_id, movie_id, rating, comment)
            )
        
        conn.commit()
        
        return jsonify({
            "message": "Review updated successfully" if existing_review else "Review added successfully",
            "user_id": user_id,
            "movie_id": movie_id,
            "rating": rating
        }), 200 if existing_review else 201
        
    except mysql.connector.Error as e:
        logger.exception("Failed to add/update review: %s", str(e))
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


@app.route("/api/admin/analytics", methods=["GET"])
@require_auth
@require_role('admin')
def get_admin_analytics():
    """Get comprehensive admin analytics data."""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Top 5 most reviewed movies
        cursor.execute("""
            SELECT m.movie_id, m.title, m.poster_url, 
                   COUNT(r.review_id) as review_count,
                   COALESCE(AVG(r.rating), 0) as avg_rating
            FROM movies m
            LEFT JOIN reviews r ON m.movie_id = r.movie_id
            GROUP BY m.movie_id, m.title, m.poster_url
            ORDER BY review_count DESC
            LIMIT 5
        """)
        top_reviewed_movies = cursor.fetchall()
        
        # Top 5 highest rated movies (minimum 3 reviews)
        cursor.execute("""
            SELECT m.movie_id, m.title, m.poster_url,
                   COUNT(r.review_id) as review_count,
                   AVG(r.rating) as avg_rating
            FROM movies m
            INNER JOIN reviews r ON m.movie_id = r.movie_id
            GROUP BY m.movie_id, m.title, m.poster_url
            HAVING COUNT(r.review_id) >= 3
            ORDER BY avg_rating DESC
            LIMIT 5
        """)
        top_rated_movies = cursor.fetchall()
        
        # Recent reviews (last 10)
        cursor.execute("""
            SELECT r.review_id, r.rating, r.comment, r.review_date,
                   u.name as user_name, m.title as movie_title
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN movies m ON r.movie_id = m.movie_id
            ORDER BY r.review_date DESC
            LIMIT 10
        """)
        recent_reviews = cursor.fetchall()
        
        # User activity stats
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as active_reviewers
            FROM reviews
            WHERE review_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        active_reviewers = cursor.fetchone()["active_reviewers"]
        
        # Rating distribution
        cursor.execute("""
            SELECT rating, COUNT(*) as count
            FROM reviews
            GROUP BY rating
            ORDER BY rating DESC
        """)
        rating_distribution = cursor.fetchall()
        
        # Movies without reviews
        cursor.execute("""
            SELECT COUNT(*) as movies_without_reviews
            FROM movies m
            LEFT JOIN reviews r ON m.movie_id = r.movie_id
            WHERE r.review_id IS NULL
        """)
        movies_without_reviews = cursor.fetchone()["movies_without_reviews"]
        
        # Total stats
        cursor.execute("SELECT COUNT(*) AS total_movies FROM movies")
        total_movies = cursor.fetchone()["total_movies"]
        cursor.execute("SELECT COUNT(*) AS total_users FROM users")
        total_users = cursor.fetchone()["total_users"]
        cursor.execute("SELECT COUNT(*) AS total_reviews FROM reviews")
        total_reviews = cursor.fetchone()["total_reviews"]
        
        return jsonify({
            "overview": {
                "total_movies": total_movies,
                "total_users": total_users,
                "total_reviews": total_reviews,
                "active_reviewers_30d": active_reviewers,
                "movies_without_reviews": movies_without_reviews
            },
            "top_reviewed_movies": top_reviewed_movies,
            "top_rated_movies": top_rated_movies,
            "recent_reviews": recent_reviews,
            "rating_distribution": rating_distribution
        })
        
    except mysql.connector.Error as e:
        logger.exception("Failed to fetch admin analytics")
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
            "SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id=u.user_id WHERE movie_id=%s ORDER BY r.review_date DESC",
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


@app.route("/api/reviews/movie/<int:movie_id>/user/<int:user_id>", methods=["GET"])
def get_user_review_for_movie(movie_id, user_id):
    """Get a specific user's review for a movie."""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM reviews WHERE movie_id=%s AND user_id=%s",
            (movie_id, user_id)
        )
        review = cursor.fetchone()
        return jsonify(review) if review else jsonify({"message": "Review not found"}), (200 if review else 404)
    except mysql.connector.Error:
        logger.exception("Failed to fetch review for movie_id=%s, user_id=%s", movie_id, user_id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/reviews/movie/<int:movie_id>/stats", methods=["GET"])
def get_movie_rating_stats(movie_id):
    """Get aggregated rating statistics for a movie."""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get average rating and review count
        cursor.execute(
            """
            SELECT 
                COUNT(*) as review_count,
                AVG(rating) as avg_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating,
                ROUND(AVG(rating), 1) as avg_rating_rounded
            FROM reviews 
            WHERE movie_id=%s
            """,
            (movie_id,)
        )
        stats = cursor.fetchone()
        
        # Return proper response even if no reviews
        return jsonify({
            "review_count": stats["review_count"] or 0,
            "avg_rating": float(stats["avg_rating"]) if stats["avg_rating"] else 0,
            "avg_rating_rounded": float(stats["avg_rating_rounded"]) if stats["avg_rating_rounded"] else 0,
            "min_rating": stats["min_rating"],
            "max_rating": stats["max_rating"]
        })
    except mysql.connector.Error as err:
        logger.exception("Failed to fetch rating stats for movie_id=%s", movie_id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/reviews/user", methods=["GET"])
@require_auth
def get_user_reviews():
    """Get all reviews by the authenticated user."""
    user_id = request.user.get("user_id")
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT r.*, m.title FROM reviews r JOIN movies m ON r.movie_id=m.movie_id WHERE r.user_id=%s ORDER BY r.review_date DESC",
            (user_id,)
        )
        reviews = cursor.fetchall()
        return jsonify(reviews)
    except mysql.connector.Error:
        logger.exception("Failed to fetch reviews for user_id=%s", user_id)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/recommendations", methods=["GET"])
@require_auth
def get_recommendations():
    """
    Rule-based recommendation engine.
    
    Algorithm:
    1. Analyze user's review history (genres watched, ratings given)
    2. Find preferred genres (genres with avg rating >= 4)
    3. Recommend unwatched movies from preferred genres
    4. Fallback to trending movies (most reviewed + high rated)
    5. Return top 10 recommendations
    """
    user_id = request.user.get("user_id")
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Step 1: Get user's review history with genre preferences
        cursor.execute("""
            SELECT m.genre, AVG(r.rating) as avg_rating, COUNT(*) as watch_count
            FROM reviews r
            JOIN movies m ON r.movie_id = m.movie_id
            WHERE r.user_id = %s AND m.genre IS NOT NULL
            GROUP BY m.genre
            HAVING AVG(r.rating) >= 4.0
            ORDER BY avg_rating DESC, watch_count DESC
        """, (user_id,))
        preferred_genres = cursor.fetchall()
        
        # Step 2: Get movies user has already reviewed (to exclude) + get user's top-rated movies
        cursor.execute("""
            SELECT r.movie_id, m.title, r.rating, m.genre
            FROM reviews r
            JOIN movies m ON r.movie_id = m.movie_id
            WHERE r.user_id = %s
            ORDER BY r.rating DESC, r.created_at DESC
        """, (user_id,))
        user_reviews = cursor.fetchall()
        watched_movie_ids = [row['movie_id'] for row in user_reviews]
        top_rated_movies = [r for r in user_reviews if r['rating'] >= 4.5][:3]  # Top 3 highly rated
        
        recommendations = []
        
        # Step 3: Recommend from preferred genres (genre-based filtering)
        if preferred_genres:
            genre_list = [g['genre'] for g in preferred_genres[:3]]  # Top 3 genres
            placeholders = ','.join(['%s'] * len(genre_list))
            exclude_placeholders = ','.join(['%s'] * len(watched_movie_ids)) if watched_movie_ids else '0'
            
            query = f"""
                SELECT m.*, 
                       COALESCE(AVG(r.rating), 0) as avg_rating,
                       COUNT(r.review_id) as review_count
                FROM movies m
                LEFT JOIN reviews r ON m.movie_id = r.movie_id
                WHERE m.genre IN ({placeholders})
                  AND m.movie_id NOT IN ({exclude_placeholders})
                GROUP BY m.movie_id
                ORDER BY avg_rating DESC, review_count DESC
                LIMIT 10
            """
            cursor.execute(query, genre_list + watched_movie_ids)
            recommendations = cursor.fetchall()
        
        # Step 4: Fallback to trending movies if not enough genre recommendations
        if len(recommendations) < 10:
            exclude_placeholders = ','.join(['%s'] * len(watched_movie_ids)) if watched_movie_ids else '0'
            
            cursor.execute(f"""
                SELECT m.*,
                       AVG(r.rating) as avg_rating,
                       COUNT(r.review_id) as review_count
                FROM movies m
                INNER JOIN reviews r ON m.movie_id = r.movie_id
                WHERE m.movie_id NOT IN ({exclude_placeholders})
                GROUP BY m.movie_id
                HAVING COUNT(r.review_id) >= 3 AND AVG(r.rating) >= 4.0
                ORDER BY review_count DESC, avg_rating DESC
                LIMIT %s
            """, watched_movie_ids + [10 - len(recommendations)])
            
            trending = cursor.fetchall()
            recommendations.extend(trending)
        
        # Step 5: If still not enough, recommend highest-rated movies
        if len(recommendations) < 10:
            exclude_all = list(set([r['movie_id'] for r in recommendations] + watched_movie_ids))
            exclude_placeholders = ','.join(['%s'] * len(exclude_all)) if exclude_all else '0'
            
            cursor.execute(f"""
                SELECT m.*,
                       COALESCE(AVG(r.rating), 0) as avg_rating,
                       COUNT(r.review_id) as review_count
                FROM movies m
                LEFT JOIN reviews r ON m.movie_id = r.movie_id
                WHERE m.movie_id NOT IN ({exclude_placeholders})
                GROUP BY m.movie_id
                ORDER BY avg_rating DESC, m.release_year DESC
              EXPLAINABLE recommendation reason for each movie (XAI)
        for movie in recommendations:
            reason = ""
            explanation_type = ""
            
            # Check if movie is from preferred genre
            if preferred_genres and movie.get('genre') in [g['genre'] for g in preferred_genres]:
                genre_info = next((g for g in preferred_genres if g['genre'] == movie['genre']), None)
                if genre_info:
                    reason = f"You rated {int(genre_info['watch_count'])} {movie['genre']} movies highly (avg {genre_info['avg_rating']:.1f}⭐)"
                    explanation_type = "genre_preference"
            
            # Check if similar to top-rated movies
            elif top_rated_movies and movie.get('genre'):
                similar_top = [m for m in top_rated_movies if m.get('genre') == movie.get('genre')]
                if similar_top:
                    reason = f"Similar to '{similar_top[0]['title']}' which you rated {similar_top[0]['rating']:.1f}⭐"
                    explanation_type = "similar_to_liked"
            
            # Trending with high engagement
            elif movie.get('review_count', 0) >= 5 and movie.get('avg_rating', 0) >= 4.0:
                reason = f"Trending: {int(movie['review_count'])} reviews with {movie['avg_rating']:.1f}⭐ rating"
                explanation_type = "trending"
            
            # High rating
            elif movie.get('avg_rating', 0) >= 4.0:
                reason = f"Highly rated by critics ({movie['avg_rating']:.1f}⭐)"
                explanation_type = "high_rated"
            
            # Fallback
            else:
                reason = "Recommended for you"
                explanation_type = "general"
            
            movie['recommendation_reason'] = reason
            movie['explanation_type'] = explanation_type
            if preferred_genres and movie.get('genre') in [g['genre'] for g in preferred_genres]:
                movie['recommendation_reason'] = f"Based on your love for {movie['genre']}"
            elif movie.get('review_count', 0) >= 5:
                movie['recommendation_reason'] = "Trending now"
            else:
                movie['recommendation_reason'] = "Highly rated"
        
        return jsonify({
            "recommendations": recommendations[:10],
            "preferred_genres": [g['genre'] for g in preferred_genres],
            "algorithm": "rule-based",
            "user_watch_count": len(watched_movie_ids)
        })
        
    except mysql.connector.Error as e:
        logger.exception("Failed to generate recommendations for user_id=%s", user_id)
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

@app.route("/api/trust-heatmap/<int:movie_id>", methods=["GET"])
def get_trust_heatmap(movie_id):
    """Get trust heatmap data: rating consistency and reviewer credibility"""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get all reviews for this movie
        cursor.execute(
            """
            SELECT r.rating, r.user_id, u.username, COUNT(ur.review_id) as user_review_count
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN reviews ur ON u.user_id = ur.user_id
            WHERE r.movie_id = %s
            GROUP BY r.review_id, r.user_id
            ORDER BY r.review_date DESC
            """,
            (movie_id,)
        )
        
        reviews = cursor.fetchall()
        
        if not reviews:
            return jsonify({
                "rating_consistency": 0,
                "reviewer_credibility": 0,
                "trust_score": 0,
                "review_count": 0,
                "average_rating": 0
            }), 200
        
        ratings = [float(r['rating']) for r in reviews]
        
        # 1. CONSISTENCY: Calculate standard deviation and convert to 0-100 score
        # Lower std dev = higher consistency
        import statistics
        avg_rating = statistics.mean(ratings)
        if len(ratings) > 1:
            std_dev = statistics.stdev(ratings)
            # Max reasonable std dev is ~2 (full range), convert to 0-100
            consistency = max(0, 100 - (std_dev * 25))
        else:
            consistency = 100  # Single review = perfect consistency
        
        # 2. CREDIBILITY: Based on reviewer activity and rating patterns
        # Reviewers with more reviews are more credible
        credibility_scores = []
        for review in reviews:
            review_count = review['user_review_count']
            # More reviews = higher credibility (1-10 reviews = 40-100 points)
            activity_score = min(100, 30 + (review_count * 7))
            
            # Rating proximity to average (within 0.5 = better)
            deviation = abs(float(review['rating']) - avg_rating)
            proximity_score = max(0, 100 - (deviation * 40))
            
            # Combined credibility
            credibility = (activity_score * 0.6) + (proximity_score * 0.4)
            credibility_scores.append(credibility)
        
        avg_credibility = statistics.mean(credibility_scores) if credibility_scores else 0
        
        # 3. TRUST SCORE: Weighted average
        trust_score = (consistency * 0.4) + (avg_credibility * 0.6)
        
        return jsonify({
            "rating_consistency": round(consistency, 1),
            "reviewer_credibility": round(avg_credibility, 1),
            "trust_score": round(trust_score, 1),
            "review_count": len(reviews),
            "average_rating": round(avg_rating, 2),
            "rating_distribution": {
                "min": min(ratings),
                "max": max(ratings),
                "std_dev": round(statistics.stdev(ratings), 2) if len(ratings) > 1 else 0
            }
        }), 200
        
    except Exception as e:
        logger.exception("Failed to get trust heatmap for movie_id=%s: %s", movie_id, e)
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/decision-trace", methods=["POST"])
def record_decision_trace():
    """Record a decision trace: how user navigated to a movie"""
    import json as json_lib
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        movie_id = data.get("movie_id")
        trace_path = data.get("trace_path", [])  # List of steps
        decision_source = data.get("decision_source", "browse")  # search, filter, trending, recommendation, browse, direct
        time_spent = data.get("time_spent_seconds", 0)
        
        if not movie_id or not trace_path:
            return jsonify({"message": "Missing required fields"}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate human-readable trace summary
        trace_summary = " → ".join(trace_path[:5])  # First 5 steps
        
        cursor.execute(
            """
            INSERT INTO decision_traces 
            (user_id, movie_id, trace_path, trace_summary, decision_source, num_steps, time_spent_seconds)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, movie_id, json_lib.dumps(trace_path), trace_summary, 
             decision_source, len(trace_path), time_spent)
        )
        conn.commit()
        trace_id = cursor.lastrowid
        conn.close()
        
        logger.info(f"Recorded decision trace {trace_id} for movie {movie_id} via {decision_source}")
        return jsonify({
            "trace_id": trace_id,
            "trace_summary": trace_summary,
            "decision_source": decision_source
        }), 201
        
    except Exception as e:
        logger.exception("Failed to record decision trace: %s", e)
        return jsonify({"message": "Internal server error"}), 500


@app.route("/api/decision-trace/<int:movie_id>", methods=["GET"])
def get_movie_decision_traces(movie_id):
    """Get all decision traces for a movie with analytics"""
    import json as json_lib
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get all traces for this movie
        cursor.execute(
            """
            SELECT trace_id, user_id, trace_path, trace_summary, decision_source, 
                   num_steps, time_spent_seconds, created_at
            FROM decision_traces
            WHERE movie_id = %s
            ORDER BY created_at DESC
            LIMIT 100
            """,
            (movie_id,)
        )
        
        traces = cursor.fetchall()
        
        # Parse JSON paths and aggregate analytics
        parsed_traces = []
        decision_sources = {}
        avg_steps = 0
        
        for trace in traces:
            trace['trace_path'] = json_lib.loads(trace['trace_path'])
            parsed_traces.append(trace)
            
            source = trace['decision_source']
            decision_sources[source] = decision_sources.get(source, 0) + 1
            avg_steps += trace['num_steps']
        
        avg_steps = avg_steps / len(traces) if traces else 0
        
        # Find most common decision path
        path_frequencies = {}
        for trace in parsed_traces:
            path_key = " → ".join(trace['trace_path'][:4])
            path_frequencies[path_key] = path_frequencies.get(path_key, 0) + 1
        
        most_common_path = max(path_frequencies, key=path_frequencies.get) if path_frequencies else None
        
        conn.close()
        
        return jsonify({
            "total_traces": len(traces),
            "traces": parsed_traces[:10],  # Return latest 10
            "analytics": {
                "decision_sources": decision_sources,
                "average_steps": round(avg_steps, 1),
                "most_common_path": most_common_path,
                "path_distribution": path_frequencies
            }
        }), 200
        
    except Exception as e:
        logger.exception("Failed to get decision traces for movie %s: %s", movie_id, e)
        return jsonify({"message": "Internal server error"}), 500


@app.route("/api/user/decision-traces", methods=["GET"])
@require_auth
def get_user_decision_traces():
    """Get user's decision traces for behavioral analysis"""
    try:
        user_id = request.user.get('user_id')
        limit = request.args.get('limit', 20, type=int)
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT dt.trace_id, dt.movie_id, m.title, dt.trace_path, dt.trace_summary, 
                   dt.decision_source, dt.num_steps, dt.time_spent_seconds, dt.created_at
            FROM decision_traces dt
            JOIN movies m ON dt.movie_id = m.movie_id
            WHERE dt.user_id = %s
            ORDER BY dt.created_at DESC
            LIMIT %s
            """,
            (user_id, limit)
        )
        
        traces = cursor.fetchall()
        
        # Parse JSON and generate analytics
        import json as json_lib
        parsed_traces = []
        decision_behavior = {
            'search': 0, 'filter': 0, 'trending': 0, 
            'recommendation': 0, 'browse': 0, 'direct': 0
        }
        avg_steps_taken = 0
        
        for trace in traces:
            trace['trace_path'] = json_lib.loads(trace['trace_path'])
            parsed_traces.append(trace)
            decision_behavior[trace['decision_source']] += 1
            avg_steps_taken += trace['num_steps']
        
        avg_steps_taken = avg_steps_taken / len(traces) if traces else 0
        
        # Identify user's preferred decision method
        preferred_source = max(decision_behavior, key=decision_behavior.get)
        
        conn.close()
        
        return jsonify({
            "traces": parsed_traces,
            "user_behavior": {
                "total_traces": len(traces),
                "decision_methods": decision_behavior,
                "preferred_method": preferred_source,
                "average_decision_steps": round(avg_steps_taken, 1)
            }
        }), 200
        
    except Exception as e:
        logger.exception("Failed to get user decision traces: %s", e)
        return jsonify({"message": "Internal server error"}), 500


@app.route("/api/explain-algorithm/<int:movie_id>", methods=["GET"])
def explain_algorithm(movie_id):
    """Explain why a movie is being shown - transparency in recommendations"""
    try:
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                payload = verify_jwt_token(token)
                if payload:
                    user_id = payload.get('user_id')
            except:
                pass
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Get movie details
        cursor.execute(
            "SELECT title, genre, avg_rating, review_count FROM movies WHERE movie_id = %s",
            (movie_id,)
        )
        movie = cursor.fetchone()
        
        if not movie:
            conn.close()
            return jsonify({"message": "Movie not found"}), 404
        
        explanation = {
            "movie": {
                "id": movie_id,
                "title": movie['title'],
                "genre": movie['genre'],
                "rating": float(movie['avg_rating']) if movie['avg_rating'] else 0,
                "review_count": movie['review_count']
            },
            "factors": {
                "personalization": [],
                "filters": [],
                "popularity": [],
                "trending": []
            },
            "scores": {
                "personalization_score": 0,
                "filter_match_score": 0,
                "popularity_score": 0,
                "overall_score": 0
            }
        }
        
        # 1. PERSONALIZATION FACTORS (if user logged in)
        if user_id:
            cursor.execute(
                """
                SELECT r.rating, m.genre FROM reviews r
                JOIN movies m ON r.movie_id = m.movie_id
                WHERE r.user_id = %s AND r.rating >= 4.0
                ORDER BY r.review_date DESC LIMIT 10
                """,
                (user_id,)
            )
            liked_movies = cursor.fetchall()
            
            if liked_movies:
                genre_matches = sum(1 for m in liked_movies if m['genre'] == movie['genre'])
                personalization_score = (genre_matches / len(liked_movies) * 100)
                
                if genre_matches > 0:
                    explanation["factors"]["personalization"].append({
                        "reason": "Genre Match",
                        "description": f"You rated {genre_matches} {movie['genre']} movies highly",
                        "weight": "40%",
                        "emoji": "🎬"
                    })
                
                explanation["scores"]["personalization_score"] = round(personalization_score, 1)
        
        # 2. FILTER MATCHING
        filter_matches = []
        
        if movie['avg_rating'] >= 4.5:
            filter_matches.append({
                "filter": "High Rated",
                "criteria": "Rating ≥ 4.5⭐",
                "met": True,
                "value": f"{movie['avg_rating']:.1f}⭐",
                "emoji": "⭐"
            })
        
        if movie['avg_rating'] >= 4.0:
            filter_matches.append({
                "filter": "Quality Threshold",
                "criteria": "Rating ≥ 4.0⭐",
                "met": True,
                "value": f"{movie['avg_rating']:.1f}⭐",
                "emoji": "✅"
            })
        
        if movie['review_count'] >= 50:
            filter_matches.append({
                "filter": "Community Consensus",
                "criteria": "≥50 verified reviews",
                "met": True,
                "value": f"{movie['review_count']} reviews",
                "emoji": "👥"
            })
        
        explanation["factors"]["filters"] = filter_matches
        filter_score = (len(filter_matches) / 3 * 100) if filter_matches else 0
        explanation["scores"]["filter_match_score"] = round(filter_score, 1)
        
        # 3. POPULARITY METRICS
        cursor.execute(
            "SELECT COUNT(*) as total FROM movies WHERE avg_rating <= %s",
            (movie['avg_rating'],)
        )
        total_movies = cursor.fetchone()['total']
        cursor.execute("SELECT COUNT(*) as count FROM movies")
        all_movies_count = cursor.fetchone()['count']
        
        percentile = (total_movies / all_movies_count * 100) if all_movies_count > 0 else 0
        
        explanation["factors"]["popularity"] = [
            {
                "metric": "Rating Percentile",
                "value": f"Top {100 - percentile:.0f}%",
                "description": f"Higher rated than {percentile:.0f}% of movies",
                "emoji": "📊"
            },
            {
                "metric": "Review Volume",
                "value": f"{movie['review_count']} reviews",
                "description": "Indicator of community engagement",
                "emoji": "💬"
            },
            {
                "metric": "Average Rating",
                "value": f"{movie['avg_rating']:.1f}/5.0",
                "description": "Community consensus score",
                "emoji": "⭐"
            }
        ]
        
        popularity_score = (percentile + (min(movie['review_count'], 100) / 100 * 50)) / 2
        explanation["scores"]["popularity_score"] = round(popularity_score, 1)
        
        # 4. TRENDING INDICATORS
        cursor.execute(
            """
            SELECT COUNT(*) as recent_reviews FROM reviews
            WHERE movie_id = %s AND review_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            """,
            (movie_id,)
        )
        recent_reviews = cursor.fetchone()['recent_reviews']
        
        if recent_reviews > 5:
            explanation["factors"]["trending"].append({
                "indicator": "Recent Activity",
                "value": f"{recent_reviews} reviews in last 7 days",
                "emoji": "📈"
            })
        
        # 5. OVERALL SCORE
        overall_score = (
            (explanation["scores"]["personalization_score"] * 0.4) +
            (explanation["scores"]["filter_match_score"] * 0.3) +
            (explanation["scores"]["popularity_score"] * 0.3)
        )
        explanation["scores"]["overall_score"] = round(overall_score, 1)
        
        explanation["summary"] = (
            f"This movie is shown because it scores {overall_score:.0f}/100 based on "
            f"popularity ({explanation['scores']['popularity_score']:.0f}%), "
            f"quality filters ({explanation['scores']['filter_match_score']:.0f}%), "
            f"and " + ("your preferences" if user_id and explanation["scores"]["personalization_score"] > 0 else "recommendations") + "."
        )
        
        conn.close()
        
        return jsonify(explanation), 200
        
    except Exception as e:
        logger.exception("Failed to explain algorithm for movie %s: %s", movie_id, e)
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
