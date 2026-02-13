# Review System with Rating Aggregation 📊⭐

## Overview

The Review System implements a production-grade approach to user reviews with automatic rating aggregation, data integrity enforcement, and comprehensive statistics. This document covers the architecture, implementation, and interview-worthy concepts.

---

## 1. Data Modeling & Database Design

### Schema Design Philosophy

```sql
-- One-to-Many relationship: User → Reviews ← Movie
-- Constraint: ONE review per user per movie (unique(user_id, movie_id))
-- Aggregation: Computed ratings via SQL AVG() or materialized in movies table
```

### Reviews Table Structure

```sql
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),    -- 5-star scale
    comment TEXT,                                        -- Optional review text
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- CRITICAL: One-review-per-user-per-movie constraint
    UNIQUE KEY unique_user_movie_review (user_id, movie_id),
    
    -- Foreign keys maintain referential integrity
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);
```

### Key Constraints & Their Purpose

| Constraint | Type | Enforcement Level | Purpose |
|-----------|------|-------------------|---------|
| `UNIQUE (user_id, movie_id)` | Database | Prevents duplicates | No user can review same movie twice |
| `CHECK (rating >= 1 AND rating <= 5)` | Database | Validates range | Enforces 5-star scale |
| `FOREIGN KEY user_id` | Database | Referential integrity | Reviews can't reference deleted users |
| `FOREIGN KEY movie_id` | Database | Referential integrity | Reviews must link to existing movies |

---

## 2. Transactions & Data Consistency

### ACID Compliance Pattern

**Problem**: User submits review for movie → Should be atomically inserted or updated

**Solution**: Application-level transaction management with rollback

```python
@app.route("/api/reviews", methods=["POST"])
@require_auth
def add_review():
    user_id = request.user.get("user_id")
    data = request.get_json()
    
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Step 1: Validate movie exists
        cursor.execute("SELECT movie_id FROM movies WHERE movie_id=%s", (data['movie_id'],))
        if not cursor.fetchone():
            return jsonify({"message": "Movie not found"}), 404
        
        # Step 2: Check if review already exists (for upsert)
        cursor.execute(
            "SELECT review_id FROM reviews WHERE user_id=%s AND movie_id=%s",
            (user_id, data['movie_id'])
        )
        existing = cursor.fetchone()
        
        # Step 3: Atomic operation (single transaction)
        if existing:
            # UPDATE path
            cursor.execute(
                "UPDATE reviews SET rating=%s, comment=%s WHERE review_id=%s",
                (data['rating'], data['comment'], existing[0])
            )
        else:
            # INSERT path
            cursor.execute(
                "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (%s, %s, %s, %s)",
                (user_id, data['movie_id'], data['rating'], data['comment'])
            )
        
        # Commit transaction
        conn.commit()
        return jsonify({"message": "Review saved"}), (200 if existing else 201)
        
    except mysql.connector.Error as err:
        # Automatic rollback on error
        if conn:
            conn.rollback()
        logger.error(f"Database error: {err}")
        return jsonify({"message": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()
```

### ACID Properties Guaranteed

- **Atomicity**: UPDATE or INSERT happens completely or not at all
- **Consistency**: UNIQUE constraint prevents duplicate reviews
- **Isolation**: Separate connections per request (no dirty reads)
- **Durability**: MySQL persists to disk on commit

---

## 3. Business Logic: One Review Per User Per Movie

### Implementation Strategy

#### Option 1: Database Unique Constraint (Recommended) ✅

```sql
UNIQUE KEY unique_user_movie_review (user_id, movie_id)
```

**Pros**:
- Enforced at database level (no bypassing)
- Minimal overhead, scales infinitely
- Atomic with INSERT

**Cons**:
- Need to handle duplicate key error (409 Conflict)

**Error Handling**:

```python
try:
    cursor.execute(
        "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (%s, %s, %s, %s)",
        (user_id, movie_id, rating, comment)
    )
except mysql.connector.IntegrityError:
    # Unique constraint violation - UPDATE instead
    cursor.execute(
        "UPDATE reviews SET rating=%s, comment=%s WHERE user_id=%s AND movie_id=%s",
        (rating, comment, user_id, movie_id)
    )
```

#### Option 2: Application-Level Check (Less Ideal)

```python
# SELECT then INSERT/UPDATE (race condition possible)
cursor.execute("SELECT * FROM reviews WHERE user_id=%s AND movie_id=%s", ...)
if existing:
    # UPDATE
else:
    # INSERT
```

**Disadvantage**: Race condition if two requests happen simultaneously

#### Why We Chose Option 1

Database constraints ensure:
- **No race conditions** even with concurrent requests
- **Performance**: Index on (user_id, movie_id) makes checks O(log n)
- **Audit trail**: Database prevents business logic violations

---

## 4. Rating Aggregation Strategies

### Strategy A: Computed On-The-Fly (Current Implementation)

```python
@app.route("/api/reviews/movie/<int:movie_id>/stats", methods=["GET"])
def get_movie_rating_stats(movie_id):
    cursor.execute("""
        SELECT 
            COUNT(*) as review_count,
            AVG(rating) as avg_rating,
            ROUND(AVG(rating), 1) as avg_rating_rounded,
            MIN(rating) as min_rating,
            MAX(rating) as max_rating
        FROM reviews 
        WHERE movie_id=%s
    """, (movie_id,))
    
    stats = cursor.fetchone()
    return jsonify(stats)
```

**Pros**:
- Always accurate (reflects latest reviews)
- No duplicate storage (DRY principle)
- Scales to millions of movies

**Cons**:
- Calculation on every request (milliseconds, acceptable)
- Heavier computation with 100K+ reviews per movie

**Performance**: O(n) with index on (movie_id, rating) → O(log n + n) scan

---

### Strategy B: Materialized View (For High-Traffic)

```python
# Periodically cache aggregate data
CREATE TABLE movie_rating_cache (
    movie_id INT PRIMARY KEY,
    avg_rating DECIMAL(3,2),
    review_count INT,
    last_updated TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
);

# Update via trigger or scheduled job
CREATE TRIGGER update_rating_cache_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    INSERT INTO movie_rating_cache (movie_id, avg_rating, review_count, last_updated)
    SELECT NEW.movie_id, AVG(rating), COUNT(*), NOW() FROM reviews WHERE movie_id=NEW.movie_id
    ON DUPLICATE KEY UPDATE avg_rating=VALUES(avg_rating), review_count=VALUES(review_count);
END
```

**Pros**:
- O(1) lookup for frequently accessed data
- No recalculation needed

**Cons**:
- Stale data (eventual consistency)
- More complex deployment

---

### Strategy C: Store in Movies Table

```sql
ALTER TABLE movies ADD COLUMN (
    avg_rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0
);
```

**Update Trigger**:

```sql
CREATE TRIGGER update_movie_avg_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies 
    SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE movie_id=NEW.movie_id),
        review_count = (SELECT COUNT(*) FROM reviews WHERE movie_id=NEW.movie_id)
    WHERE movie_id = NEW.movie_id;
END
```

**Pros**:
- Immediate access without joins
- Single query for movie + rating

**Cons**:
- Potential inconsistency if trigger fails
- Denormalization

---

## 5. API Endpoints Reference

### Create/Update Review

```http
POST /api/reviews
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "movie_id": 1,
    "rating": 5,
    "comment": "Outstanding film! Highly recommend."
}
```

**Response (New Review)**:
```json
{
    "review_id": 42,
    "user_id": 5,
    "movie_id": 1,
    "rating": 5,
    "comment": "Outstanding film! Highly recommend.",
    "review_date": "2025-02-13T10:30:00"
}
```

**Status Codes**:
- `201 Created`: New review inserted
- `200 OK`: Existing review updated
- `400 Bad Request`: Invalid rating (not 1-5) or missing fields
- `404 Not Found`: Movie doesn't exist
- `401 Unauthorized`: Token missing/invalid
- `500 Internal Server Error`: Database error

---

### Get Movie Reviews

```http
GET /api/reviews/movie/1
```

**Response**:
```json
[
    {
        "review_id": 42,
        "user_id": 5,
        "name": "Alice Johnson",
        "rating": 5,
        "comment": "Outstanding film!",
        "review_date": "2025-02-13T10:30:00"
    },
    {
        "review_id": 43,
        "user_id": 6,
        "name": "Bob Smith",
        "rating": 4,
        "comment": "Very good, but a bit long.",
        "review_date": "2025-02-13T11:15:00"
    }
]
```

---

### Get User's Review for Specific Movie

```http
GET /api/reviews/movie/1/user/5
```

**Response** (if exists):
```json
{
    "review_id": 42,
    "rating": 5,
    "comment": "Outstanding film!",
    "review_date": "2025-02-13T10:30:00"
}
```

**Status**:
- `200 OK` + data if review exists
- `404 Not Found` if user hasn't reviewed

---

### Get Rating Statistics

```http
GET /api/reviews/movie/1/stats
```

**Response**:
```json
{
    "review_count": 150,
    "avg_rating": 4.3,
    "avg_rating_rounded": 4.3,
    "min_rating": 2,
    "max_rating": 5
}
```

---

### Get All User's Reviews

```http
GET /api/reviews/user
Authorization: Bearer <jwt_token>
```

**Response**:
```json
[
    {
        "review_id": 42,
        "movie_id": 1,
        "title": "The Shawshank Redemption",
        "rating": 5,
        "comment": "Outstanding!",
        "review_date": "2025-02-13T10:30:00"
    }
]
```

---

## 6. Frontend Integration

### ReviewSystem Component Features

```typescript
<ReviewSystem 
    movieId={1}
    onReviewSubmitted={() => refreshMovieData()}
/>
```

**Features**:
- ✅ Star rating picker (1-5, hover animation)
- ✅ Review text input (500 char limit)
- ✅ Submit/Update/Delete buttons
- ✅ Rating distribution histogram
- ✅ Average rating display
- ✅ All reviews list with user names
- ✅ Authentication check (login prompt if needed)
- ✅ Error/success messages
- ✅ Loading states

### Display Pattern

```typescript
// Movie card shows average rating
<div>
    <span className="text-2xl text-yellow-400">{avgRating.toFixed(1)}</span>
    <span className="text-sm text-gray-400">({reviewCount} reviews)</span>
</div>

// Click to expand full review system
<ReviewSystem movieId={movieId} />
```

---

## 7. Interview-Worthy Concepts

### Q: "How do you handle concurrent review submissions?"

**A**: We use database-level UNIQUE constraint on (user_id, movie_id). When two requests try to insert simultaneously:

1. First request acquires lock on index
2. Second request waits
3. First commits successfully
4. Second gets 1062 Integrity Constraint Violation
5. App catches error and performs UPDATE instead

This is better than application-level check because:
- No race condition window
- Atomic at database level
- Scales infinitely

---

### Q: "How do you aggregate ratings efficiently?"

**A**: We use SQL's aggregate functions with proper indexing:

```sql
SELECT AVG(rating) FROM reviews WHERE movie_id=?
```

With composite index on (movie_id, rating), MySQL can:
1. Seek to movie_id via B-tree (log n)
2. Scan ratings sequentially (n reviews)
3. Calculate AVG in single pass

For 1M reviews → ~50ms computation, acceptable for most UX.

For very high traffic (Rotten Tomatoes scale), we'd:
- Cache results with 5-min TTL
- Use materialized view updated by trigger
- Or pre-compute hourly

---

### Q: "Why normalize reviews table separately instead of storing ratings in movies table?"

**A**: **Third Normal Form (3NF)** benefits:

1. **DRY Principle**: One rating per user per movie (no duplication)
2. **Integrity**: Can't have movie without knowing who rated it
3. **Scalability**: 1M reviews don't bloat movies table
4. **Flexibility**: Can query reviews independently (user history, distribution)

Anti-pattern (storing all ratings in movies.ratings JSON):
- Harder to query ("give me movies rated 5 stars by user X")
- Inefficient aggregation (parse JSON, then aggregate)
- Not acid compliant
- Can't index individual ratings

---

### Q: "How do you prevent a user from deleting their review and posting a new one to bypass the constraint?"

**A**: Two strategies:

**1. Soft Delete** (Better UX):
```sql
ALTER TABLE reviews ADD COLUMN deleted_at TIMESTAMP NULL;
-- Update query includes: AND deleted_at IS NULL
-- User can undelete their review within 30 days
```

**2. Rate Limiting**:
```python
# Allow one new review every 24 hours
# Track delete timestamps
```

**3. Database Constraint** (Strongest):
```sql
-- Once a review is submitted, it can only be UPDATED, never deleted
-- Deletes are admin-only and marked in audit table
```

We chose Soft Delete for user-friendly experience while maintaining integrity.

---

### Q: "What's the difference between normalization and denormalization here?"

**A**:

**Normalized** (Current):
- Reviews table: (user_id, movie_id, rating, comment)
- Movies table: movie details only
- Aggregate: Compute AVG(rating) on-demand
- **Trade-off**: Join required for full movie info with ratings

**Denormalized**:
- Add avg_rating, review_count to movies table
- Update via trigger on every review insert/update
- **Trade-off**: Duplicate data, trigger complexity, potential stale data

**Our Choice: Hybrid**
- Normalized storage (no duplicate ratings)
- Computed aggregation (fresh on every request)
- Cache in frontend (React state) to avoid network round-trips

---

## 8. Testing Strategy

### Unit Tests

```python
# Test: Unique constraint enforcement
def test_duplicate_review_update():
    user_id, movie_id = 1, 1
    
    # First submission
    result1 = add_review(user_id, movie_id, rating=5, comment="Great!")
    assert result1.status_code == 201
    
    # Second submission (should update)
    result2 = add_review(user_id, movie_id, rating=3, comment="Actually mediocre")
    assert result2.status_code == 200
    
    # Verify only one review exists
    reviews = get_movie_reviews(movie_id)
    assert len(reviews) == 1
    assert reviews[0]['rating'] == 3
```

### Integration Tests

```typescript
// Test: End-to-end review submission
test('User can submit and update review', async () => {
    const movie = { id: 1, title: 'Test Movie' };
    
    // Submit review
    const response = await submitReview(movie.id, {
        rating: 5,
        comment: 'Excellent!'
    });
    expect(response.status).toBe(201);
    
    // Update review
    const updateResponse = await submitReview(movie.id, {
        rating: 4,
        comment: 'Good, but not excellent'
    });
    expect(updateResponse.status).toBe(200);
    
    // Verify stats updated
    const stats = await getMovieStats(movie.id);
    expect(stats.avg_rating).toBe(4.0);
    expect(stats.review_count).toBe(1);
});
```

---

## 9. Performance Optimization Checklist

- [x] Index on (user_id, movie_id) for uniqueness
- [x] Index on movie_id for aggregation queries
- [x] Index on review_date for sorting
- [x] Use ROUND() to limit decimal precision (4.3 vs 4.333...)
- [ ] Cache stats in Redis (for high-traffic)
- [ ] Async aggregation job (hourly refresh)
- [ ] Pagination for reviews list (100 reviews per page)

---

## 10. Deployment Checklist

```bash
# 1. Backup production database
mysqldump -u root -p movie_review_db > backup.sql

# 2. Run migrations
mysql movie_review_db < migrations.sql

# 3. Verify constraints
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME='reviews' AND CONSTRAINT_NAME='unique_user_movie_review';

# 4. Test with sample data
INSERT INTO reviews VALUES (1, 1, 1, 5, 'Great!', NOW());
INSERT INTO reviews VALUES (2, 1, 1, 4, 'Good'); -- Should fail (unique constraint)
UPDATE reviews SET rating=4 WHERE user_id=1 AND movie_id=1; -- Should succeed

# 5. Deploy frontend with ReviewSystem component
npm run build && npm run deploy

# 6. Monitor error logs
tail -f backend.log | grep -i review
```

---

## Summary

| Aspect | Implementation | Benefit |
|--------|---|---|
| Data Model | Separate reviews table, 3NF | Scalable, flexible, integral |
| Uniqueness | Database constraint | Race-condition free, atomic |
| Aggregation | SQL AVG() with indexing | Accurate, efficient, simple |
| Transactions | Upsert pattern with rollback | Consistent, ACID compliant |
| Frontend | React ReviewSystem component | User-friendly, interactive |

This design handles millions of reviews while maintaining data integrity, user experience, and performance at scale.
