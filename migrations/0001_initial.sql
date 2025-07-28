-- Create reviews table
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- Create index for faster queries by book
CREATE INDEX idx_reviews_book ON reviews(title, author);

-- Create auth_tokens table
CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- Create groups table
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Create group_members table (many-to-many relationship)
CREATE TABLE group_members (
  group_id TEXT NOT NULL,
  username TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (group_id, username),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create group_books table (many-to-many relationship)
CREATE TABLE group_books (
  group_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (group_id, book_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
