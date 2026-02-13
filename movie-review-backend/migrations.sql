-- Database Migrations for Review System with Rating Aggregation
-- Run these migrations to enforce data integrity and optimize queries

-- ============================================================================
-- PHASE 1: Add Unique Constraint (One Review Per User Per Movie)
-- ============================================================================
-- This prevents duplicate reviews and enforces business logic at database level

ALTER TABLE reviews ADD UNIQUE KEY unique_user_movie_review (user_id, movie_id);

-- ============================================================================
-- PHASE 2: Add Review Date Index (For Sorting Latest Reviews)
-- ============================================================================

ALTER TABLE reviews ADD KEY idx_reviews_date (review_date DESC);

-- ============================================================================
-- PHASE 3: Add Composite Index (Movie + Rating for Aggregation Queries)
-- ============================================================================
-- Optimizes: AVG(rating) GROUP BY movie_id queries

ALTER TABLE reviews ADD KEY idx_reviews_movie_date (movie_id, review_date DESC);

-- ============================================================================
-- PHASE 4: Add Column for Tracking Rating Changes
-- ============================================================================
-- Optional: Track when reviews were last modified (useful for auditing)

ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- TRIGGER: Auto-Update Movie Average Rating (Optional - Performance Optimization)
-- ============================================================================
-- Uncomment to use triggers for automatic rating aggregation
-- NOTE: Can also compute on-the-fly; this is for performance if you have many reviews

/*
DELIMITER //

CREATE TRIGGER update_avg_rating_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies 
    SET avg_rating = (
        SELECT AVG(rating) FROM reviews WHERE movie_id = NEW.movie_id
    )
    WHERE movie_id = NEW.movie_id;
END//

CREATE TRIGGER update_avg_rating_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies 
    SET avg_rating = (
        SELECT AVG(rating) FROM reviews WHERE movie_id = NEW.movie_id
    )
    WHERE movie_id = NEW.movie_id;
END//

CREATE TRIGGER update_avg_rating_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies 
    SET avg_rating = (
        SELECT AVG(rating) FROM reviews WHERE movie_id = OLD.movie_id
    )
    WHERE movie_id = OLD.movie_id;
END//

DELIMITER ;
*/

-- ============================================================================
-- Verify Constraints Are In Place
-- ============================================================================
-- SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_NAME='reviews' AND CONSTRAINT_NAME LIKE 'unique%';
