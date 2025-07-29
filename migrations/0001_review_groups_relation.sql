-- Migration to add review_groups relation table
-- This separates review ownership from group association

-- Create new relation table for reviews and groups
CREATE TABLE IF NOT EXISTS review_groups (
  review_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  shared_at TEXT NOT NULL,
  PRIMARY KEY (review_id, group_id),
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_groups_review_id ON review_groups(review_id);
CREATE INDEX IF NOT EXISTS idx_review_groups_group_id ON review_groups(group_id);

-- Migrate existing data
-- Copy all reviews with group_id to the new relation table
INSERT INTO review_groups (review_id, group_id, shared_at)
SELECT id, group_id, created_at
FROM reviews
WHERE group_id IS NOT NULL;

-- Create new reviews table without group_id
CREATE TABLE reviews_new (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TEXT NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Copy all data to new table
INSERT INTO reviews_new (id, book_id, review, rating, created_at, user_id)
SELECT id, book_id, review, rating, created_at, user_id
FROM reviews;

-- Drop old table and rename new one
DROP TABLE reviews;
ALTER TABLE reviews_new RENAME TO reviews;

-- Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);

-- Add deleted_at column to groups for soft delete
ALTER TABLE groups ADD COLUMN deleted_at TEXT;