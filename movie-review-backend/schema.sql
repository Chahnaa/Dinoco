-- Create database and tables for Movie Review
CREATE DATABASE IF NOT EXISTS movie_review_db;
USE movie_review_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user'
);

-- Movies Table
CREATE TABLE IF NOT EXISTS movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    genre VARCHAR(50),
    language VARCHAR(30),
    release_year YEAR,
    duration_minutes INT,
    poster_url VARCHAR(255),
    description TEXT
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    movie_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_movie_review (user_id, movie_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);

-- =============================================
-- OPTIMIZED INDEXES FOR PERFORMANCE
-- =============================================

-- Search optimization: Index on movie title
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);

-- Filter optimization: Indexes on genre and release_year
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON movies(release_year);
CREATE INDEX IF NOT EXISTS idx_movies_language ON movies(language);

-- Sorting optimization: Composite index for rating queries
CREATE INDEX IF NOT EXISTS idx_reviews_movie_rating ON reviews(movie_id, rating);

-- Join optimization: Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Performance: Recent movies and reviews
CREATE INDEX IF NOT EXISTS idx_movies_id ON movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
