-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

-- Insert the existing admin user
INSERT INTO users (id, username, created_at) VALUES ('user_001', 'admin', datetime('now'));

-- Add user_id column to reviews table
ALTER TABLE reviews ADD COLUMN user_id TEXT;

-- Update existing reviews to point to the admin user
UPDATE reviews SET user_id = 'user_001';

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Since SQLite doesn't support adding foreign key constraints to existing tables,
-- we'll ensure the column exists and create a new table with the constraint if needed
-- The user_id column was already added and populated, so we'll leave it as-is
-- Foreign key enforcement will be handled at the application level for existing data

-- Create index on user_id for better performance
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
