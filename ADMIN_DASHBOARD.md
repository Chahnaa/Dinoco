# Admin Dashboard with Analytics 📊

## Overview

The Admin Dashboard provides comprehensive analytics and management capabilities for administrators. It demonstrates system design principles, data aggregation, role-based access control, and real-time analytics.

---

## 1. System Architecture

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────┐
│         Authentication Layer            │
│  JWT Token → Verify → Extract Role     │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   Role Check          │
        │   admin vs user       │
        └───────────────────────┘
                    ↓
    ┌──────────────────────────────┐
    │  Admin-Only Endpoints        │
    │  - /api/admin/analytics      │
    │  - POST /api/movies          │
    │  - PUT /api/movies/:id       │
    │  - DELETE /api/movies/:id    │
    └──────────────────────────────┘
```

**Implementation:**

```python
@app.route("/api/admin/analytics", methods=["GET"])
@require_auth  # Step 1: Verify JWT token
@require_role('admin')  # Step 2: Verify admin role
def get_admin_analytics():
    # Only accessible to authenticated admins
    pass
```

---

## 2. Analytics Endpoints

### GET /api/admin/analytics

**Authorization Required:** Bearer token with `admin` role

**Response Structure:**

```json
{
  "overview": {
    "total_movies": 150,
    "total_users": 1250,
    "total_reviews": 3420,
    "active_reviewers_30d": 89,
    "movies_without_reviews": 12
  },
  "top_reviewed_movies": [
    {
      "movie_id": 42,
      "title": "The Shawshank Redemption",
      "poster_url": "/posters/shawshank.jpg",
      "review_count": 342,
      "avg_rating": 4.8
    }
  ],
  "top_rated_movies": [
    {
      "movie_id": 15,
      "title": "The Godfather",
      "poster_url": "/posters/godfather.jpg",
      "review_count": 256,
      "avg_rating": 4.9
    }
  ],
  "recent_reviews": [
    {
      "review_id": 1001,
      "rating": 5,
      "comment": "Masterpiece!",
      "review_date": "2026-02-13T10:30:00",
      "user_name": "Alice Johnson",
      "movie_title": "Inception"
    }
  ],
  "rating_distribution": [
    { "rating": 5, "count": 1520 },
    { "rating": 4, "count": 1100 },
    { "rating": 3, "count": 580 },
    { "rating": 2, "count": 150 },
    { "rating": 1, "count": 70 }
  ]
}
```

---

## 3. Data Aggregation Queries

### Top Reviewed Movies

**SQL Query:**

```sql
SELECT 
    m.movie_id, 
    m.title, 
    m.poster_url, 
    COUNT(r.review_id) as review_count,
    COALESCE(AVG(r.rating), 0) as avg_rating
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title, m.poster_url
ORDER BY review_count DESC
LIMIT 5
```

**Explanation:**
- `LEFT JOIN`: Include movies even with 0 reviews
- `COUNT(r.review_id)`: Number of reviews per movie
- `COALESCE(AVG(r.rating), 0)`: Average rating, defaults to 0 if no reviews
- `GROUP BY`: Aggregate by movie
- `ORDER BY review_count DESC`: Most reviewed first
- `LIMIT 5`: Top 5 only

**Time Complexity:** O(n log n) with index on `movie_id`

---

### Top Rated Movies

**SQL Query:**

```sql
SELECT 
    m.movie_id, 
    m.title, 
    m.poster_url,
    COUNT(r.review_id) as review_count,
    AVG(r.rating) as avg_rating
FROM movies m
INNER JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title, m.poster_url
HAVING COUNT(r.review_id) >= 3
ORDER BY avg_rating DESC
LIMIT 5
```

**Key Differences:**
- `INNER JOIN`: Only movies with reviews
- `HAVING COUNT(...) >= 3`: Minimum 3 reviews required (prevents single 5-star review from topping list)
- `ORDER BY avg_rating DESC`: Highest rated first

**Why minimum 3 reviews?**
- Prevents statistical anomalies (one 5-star review ≠ best movie)
- Ensures meaningful ranking
- Industry standard for "qualified" ratings

---

### Active Reviewers (30 Days)

**SQL Query:**

```sql
SELECT COUNT(DISTINCT user_id) as active_reviewers
FROM reviews
WHERE review_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

**Explanation:**
- `DISTINCT user_id`: Count unique users (not total reviews)
- `DATE_SUB(NOW(), INTERVAL 30 DAY)`: Last 30 days
- Use case: Track user engagement trends

---

### Movies Without Reviews

**SQL Query:**

```sql
SELECT COUNT(*) as movies_without_reviews
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id
WHERE r.review_id IS NULL
```

**Explanation:**
- `LEFT JOIN`: Include all movies
- `WHERE r.review_id IS NULL`: Filter movies with no matching reviews
- Use case: Identify content gaps for marketing campaigns

---

### Rating Distribution

**SQL Query:**

```sql
SELECT rating, COUNT(*) as count
FROM reviews
GROUP BY rating
ORDER BY rating DESC
```

**Explanation:**
- Groups reviews by rating (1-5)
- Counts how many reviews for each rating
- Used to generate histogram/distribution chart

**Visualization:**

```
5★ ████████████████████ 1520 (44%)
4★ ███████████████      1100 (32%)
3★ ████████             580  (17%)
2★ ██                   150  (4%)
1★ █                    70   (2%)
```

---

## 4. Frontend Implementation

### Component Structure

```tsx
const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  
  useEffect(() => {
    getAdminAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(err => console.error(err))
  }, [])
  
  return (
    <div>
      {/* Overview Stats */}
      <StatsCards data={analytics?.overview} />
      
      {/* Top Movies */}
      <TopReviewedMovies movies={analytics?.top_reviewed_movies} />
      <TopRatedMovies movies={analytics?.top_rated_movies} />
      
      {/* Rating Distribution */}
      <RatingDistribution data={analytics?.rating_distribution} />
      
      {/* Recent Activity */}
      <RecentReviews reviews={analytics?.recent_reviews} />
      
      {/* Movie Management */}
      <MovieCRUD />
    </div>
  )
}
```

---

## 5. Security Considerations

### Decorator Order (Critical!)

```python
# CORRECT ✅
@app.route("/api/admin/analytics")
@require_auth  # First: Verify token
@require_role('admin')  # Second: Check role
def get_admin_analytics():
    pass

# WRONG ❌
@app.route("/api/admin/analytics")
@require_role('admin')  # This runs first but request.user doesn't exist yet!
@require_auth
def get_admin_analytics():
    pass
```

**Why order matters:**
1. `@require_auth` extracts user info from JWT and attaches to `request.user`
2. `@require_role('admin')` reads `request.user.role` to verify
3. Reversing order causes `AttributeError: 'Request' object has no attribute 'user'`

---

### Token-Based Authorization

**Flow:**

```
1. Admin logs in → Receives JWT token with role='admin'
2. Frontend stores token in localStorage
3. Admin navigates to /admin-dashboard
4. Frontend calls GET /api/admin/analytics with Authorization header
5. Backend verifies token → Extracts role → Allows/Denies access
```

**Token Payload:**

```json
{
  "user_id": 1,
  "email": "admin@dinoco.com",
  "role": "admin",
  "exp": 1739448000
}
```

---

## 6. Performance Optimization

### Index Strategy

```sql
-- For top reviewed movies query
CREATE INDEX idx_reviews_movie_id ON reviews(movie_id);

-- For rating aggregation
CREATE INDEX idx_reviews_movie_rating ON reviews(movie_id, rating);

-- For recent reviews
CREATE INDEX idx_reviews_date ON reviews(review_date DESC);

-- For active users query
CREATE INDEX idx_reviews_user_date ON reviews(user_id, review_date);
```

**Impact:**
- Without indexes: O(n) scan through all reviews
- With indexes: O(log n) lookup + O(k) group aggregation
- For 1M reviews: ~15ms with index vs ~500ms without

---

### Caching Strategy (Optional)

For high-traffic applications:

```python
from functools import lru_cache
import time

@lru_cache(maxsize=1)
def get_cached_analytics():
    # Cache for 5 minutes
    cache_key = int(time.time() / 300)  # Changes every 5 minutes
    return fetch_analytics_from_db()

@app.route("/api/admin/analytics")
@require_auth
@require_role('admin')
def get_admin_analytics():
    data = get_cached_analytics()
    return jsonify(data)
```

**Trade-offs:**
- Pros: Reduces database load, faster response
- Cons: Stale data (up to 5 minutes old)
- Use case: Analytics don't need real-time precision

---

## 7. Interview-Worthy Concepts

### Q: "Why use GROUP BY instead of multiple queries?"

**A:** Efficiency and atomicity.

**Inefficient approach** (N+1 queries):

```python
movies = db.query("SELECT * FROM movies")
for movie in movies:
    count = db.query("SELECT COUNT(*) FROM reviews WHERE movie_id=%s", movie.id)
    avg = db.query("SELECT AVG(rating) FROM reviews WHERE movie_id=%s", movie.id)
```

**Efficient approach** (1 query):

```sql
SELECT m.*, COUNT(r.review_id), AVG(r.rating)
FROM movies m
LEFT JOIN reviews r ON m.movie_id = r.movie_id
GROUP BY m.movie_id
```

**Benefits:**
- Single database round-trip
- Atomically consistent data
- Scales to millions of rows

---

### Q: "How do you prevent unauthorized access to admin endpoints?"

**A:** Multi-layer security:

1. **Backend:** JWT verification + role check (decorators)
2. **Frontend:** Conditional routing (PrivateRoute component)
3. **Network:** CORS configuration (only allow trusted origins)
4. **Database:** Role stored in users table, not in token (token references DB)

**Defense in depth:** Even if frontend is bypassed, backend rejects invalid tokens.

---

### Q: "What if two admins delete the same movie simultaneously?"

**A:** Database-level transaction isolation handles this.

```python
@app.route("/api/movies/<int:id>", methods=["DELETE"])
@require_auth
@require_role('admin')
def delete_movie(id):
    conn = get_db()
    cursor = conn.cursor()
    
    # MySQL default isolation level: REPEATABLE READ
    cursor.execute("DELETE FROM movies WHERE movie_id=%s", (id,))
    
    if cursor.rowcount == 0:
        return jsonify({"message": "Movie not found"}), 404
    
    conn.commit()
    return jsonify({"message": "Movie deleted"})
```

**What happens:**
1. Admin A starts transaction, locks movie row
2. Admin B tries to delete, waits for lock
3. Admin A commits, movie deleted
4. Admin B's DELETE finds 0 rows, returns 404

**ACID compliance ensures consistency.**

---

### Q: "How would you scale this to 1M+ movies?"

**A:** Pagination + Async Loading

**Backend:**

```python
@app.route("/api/admin/analytics")
def get_admin_analytics():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    # Only fetch paginated results
    cursor.execute("""
        SELECT ... FROM movies
        LIMIT %s OFFSET %s
    """, (per_page, (page - 1) * per_page))
    
    return jsonify({
        "movies": cursor.fetchall(),
        "page": page,
        "total_pages": math.ceil(total_movies / per_page)
    })
```

**Frontend:**

```tsx
const [page, setPage] = useState(1)

useEffect(() => {
    getAdminAnalytics({ page })
        .then(res => setMovies(res.data.movies))
}, [page])
```

**Additional optimizations:**
- Database read replicas for analytics queries
- Redis cache for frequently accessed stats
- Lazy loading charts (load on scroll)

---

## 8. Testing Scenarios

### Unit Tests

```python
def test_admin_analytics_requires_auth():
    response = client.get('/api/admin/analytics')
    assert response.status_code == 401

def test_admin_analytics_requires_admin_role():
    user_token = create_jwt_token(user_id=1, role='user')
    response = client.get('/api/admin/analytics', 
                         headers={'Authorization': f'Bearer {user_token}'})
    assert response.status_code == 403

def test_admin_analytics_returns_data():
    admin_token = create_jwt_token(user_id=2, role='admin')
    response = client.get('/api/admin/analytics',
                         headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert 'overview' in response.json
    assert 'top_reviewed_movies' in response.json
```

---

### Integration Tests

```typescript
test('AdminDashboard displays analytics', async () => {
    // Mock admin login
    localStorage.setItem('token', 'valid-admin-token')
    
    // Mount component
    render(<AdminDashboard />)
    
    // Wait for data to load
    await waitFor(() => {
        expect(screen.getByText(/Total Movies/i)).toBeInTheDocument()
        expect(screen.getByText(/Active Reviewers/i)).toBeInTheDocument()
    })
})
```

---

## 9. Feature Comparison

| Feature | Basic Stats | Admin Analytics |
|---------|-------------|-----------------|
| Total counts | ✅ | ✅ |
| Top movies by reviews | ❌ | ✅ |
| Top movies by rating | ❌ | ✅ |
| Recent activity | ❌ | ✅ |
| Rating distribution | ❌ | ✅ |
| Active user tracking | ❌ | ✅ |
| Movies without reviews | ❌ | ✅ |
| Role protection | ❌ | ✅ |
| Single endpoint | ❌ | ✅ |

---

## 10. Real-World Applications

**Netflix Admin Dashboard:**
- Top watched shows (similar to top reviewed)
- Average watch time (similar to avg rating)
- User engagement metrics (similar to active reviewers)

**Amazon Seller Central:**
- Product reviews analytics
- Rating distribution
- Review velocity (reviews per day)

**Rotten Tomatoes:**
- Top rated movies
- Tomatometer score distribution
- Critic vs audience ratings

---

## Summary

The Admin Dashboard demonstrates:

✅ **System Design:** Separation of admin/user concerns with RBAC  
✅ **Data Aggregation:** Complex SQL queries with GROUP BY, HAVING, JOINs  
✅ **Backend Optimization:** Single analytics endpoint reduces API calls  
✅ **Security:** JWT verification + role-based decorators  
✅ **Performance:** Strategic indexing for sub-second analytics  
✅ **Scalability:** Pagination-ready architecture  
✅ **Real-time Insights:** Recent reviews, active users, distribution charts  

**Interview Impact:**
- Shows understanding of admin vs user workflows
- Demonstrates SQL aggregation proficiency
- Proves security-first mindset
- Highlights performance optimization skills
