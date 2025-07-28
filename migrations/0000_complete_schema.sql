-- Complete database schema for book-reviews-worker
-- This consolidates all previous migrations into a single file

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TEXT NOT NULL
);

-- Books table with ISBN uniqueness
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  page_count INTEGER,
  created_at TEXT NOT NULL
);

-- Create unique index on ISBN (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;

-- Reviews table with foreign keys and group support
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TEXT NOT NULL,
  user_id TEXT NOT NULL,
  group_id TEXT,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Ensure one review per user per book per group (or null group)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews(user_id, book_id, group_id);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Group admins table
CREATE TABLE IF NOT EXISTS group_admins (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Group books table
CREATE TABLE IF NOT EXISTS group_books (
  group_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (group_id, book_id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Group invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_uses INTEGER DEFAULT 10,
  uses_count INTEGER DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- General invitations table for user signup
CREATE TABLE IF NOT EXISTS general_invitations (
  id TEXT PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_uses INTEGER DEFAULT 10,
  uses_count INTEGER DEFAULT 0,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Auth tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_group_id ON reviews(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_code ON group_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_general_invitations_code ON general_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
