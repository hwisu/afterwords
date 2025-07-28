-- Create books table
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Create index on title and author for better search performance
CREATE INDEX idx_books_title_author ON books(title, author);

-- Add book_id column to reviews table
ALTER TABLE reviews ADD COLUMN book_id TEXT;

-- Update existing reviews to have a book_id
-- First, ensure all books from reviews exist in the books table
INSERT INTO books (id, title, author, created_at)
SELECT DISTINCT hex(randomblob(16)), title, author, datetime('now')
FROM reviews
WHERE NOT EXISTS (
  SELECT 1 FROM books b WHERE b.title = reviews.title AND b.author = reviews.author
);

-- Then update reviews with the corresponding book_id
UPDATE reviews
SET book_id = (
  SELECT b.id FROM books b WHERE b.title = reviews.title AND b.author = reviews.author
);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Remove title and author columns from reviews table as they are now in books table
-- This requires creating a new table and copying data
CREATE TABLE reviews_new (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO reviews_new (id, book_id, review, rating, created_at, user_id)
SELECT id, book_id, review, rating, created_at, user_id FROM reviews;

DROP TABLE reviews;
ALTER TABLE reviews_new RENAME TO reviews;
