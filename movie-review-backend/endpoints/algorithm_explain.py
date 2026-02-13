"""
Algorithm Explanation Endpoints
Provides transparency into why movies are recommended/shown to users
"""

def explain_recommendation(user_id, movie_id, db_config):
    """
    Generate comprehensive explanation for why a movie is shown to user
    Returns: filters, popularity, personalization factors
    """
    import mysql.connector
    import json
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Get movie details
        cursor.execute(
            "SELECT title, genre, avg_rating, review_count FROM movies WHERE movie_id = %s",
            (movie_id,)
        )
        movie = cursor.fetchone()
        
        if not movie:
            conn.close()
            return None
        
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
        
        # 2. PERSONALIZATION FACTORS
        if user_id:
            # Get user's rated movies
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
            
            # Check genre match
            genre_matches = sum(1 for m in liked_movies if m['genre'] == movie['genre'])
            personalization_score = (genre_matches / len(liked_movies) * 100) if liked_movies else 0
            
            if genre_matches > 0:
                explanation["factors"]["personalization"].append({
                    "reason": f"Genre Match",
                    "description": f"You highly rated {genre_matches} {movie['genre']} movies",
                    "weight": "40%"
                })
            
            # Check similar highly-rated movies
            cursor.execute(
                """
                SELECT COUNT(*) as count FROM reviews r
                JOIN movies m ON r.movie_id = m.movie_id
                WHERE r.user_id = %s AND m.genre = %s AND r.rating >= 4.0
                """,
                (user_id, movie['genre'])
            )
            similar_count = cursor.fetchone()['count']
            
            if similar_count > 0:
                explanation["factors"]["personalization"].append({
                    "reason": "Similar to Your Favorites",
                    "description": f"Matches {similar_count} of your highly-rated movies",
                    "weight": "30%"
                })
            
            explanation["scores"]["personalization_score"] = round(personalization_score, 1)
        
        # 3. FILTER MATCHING
        # Check if movie matches common discovery filters
        filter_matches = []
        
        if movie['avg_rating'] >= 4.5:
            filter_matches.append({
                "filter": "High Rated",
                "criteria": "Rating ≥ 4.5⭐",
                "met": True,
                "value": f"{movie['avg_rating']:.1f}⭐"
            })
        
        if movie['review_count'] >= 50:
            filter_matches.append({
                "filter": "Popular",
                "criteria": "≥50 reviews",
                "met": True,
                "value": f"{movie['review_count']} reviews"
            })
        
        explanation["factors"]["filters"] = filter_matches
        filter_score = (len(filter_matches) / 3 * 100) if filter_matches else 0
        explanation["scores"]["filter_match_score"] = round(filter_score, 1)
        
        # 4. POPULARITY METRICS
        # Get percentile ranking
        cursor.execute(
            "SELECT COUNT(*) as total FROM movies WHERE avg_rating <= %s",
            (movie['avg_rating'],)
        )
        total_movies = cursor.fetchone()['total']
        cursor.execute("SELECT COUNT(*) as count FROM movies")
        all_movies = cursor.fetchone()['count']
        
        percentile = (total_movies / all_movies * 100) if all_movies > 0 else 0
        
        explanation["factors"]["popularity"] = [
            {
                "metric": "Rating Percentile",
                "value": f"Top {100 - percentile:.0f}%",
                "description": f"Higher rated than {percentile:.0f}% of all movies"
            },
            {
                "metric": "Review Volume",
                "value": f"{movie['review_count']} reviews",
                "description": "Community engagement indicator"
            },
            {
                "metric": "Average Rating",
                "value": f"{movie['avg_rating']:.1f}/5.0",
                "description": "Community consensus score"
            }
        ]
        
        popularity_score = (percentile + (min(movie['review_count'], 100) / 100 * 50)) / 2
        explanation["scores"]["popularity_score"] = round(popularity_score, 1)
        
        # 5. TRENDING INDICATORS
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
        
        # 6. OVERALL SCORE
        overall_score = (
            (explanation["scores"]["personalization_score"] * 0.4) +
            (explanation["scores"]["filter_match_score"] * 0.3) +
            (explanation["scores"]["popularity_score"] * 0.3)
        )
        explanation["scores"]["overall_score"] = round(overall_score, 1)
        
        conn.close()
        return explanation
        
    except Exception as e:
        conn.close()
        raise e
