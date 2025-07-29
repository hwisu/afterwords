-- Add email field to users table for authentication and password recovery
ALTER TABLE users ADD COLUMN email TEXT;

-- Create unique index on email (case-insensitive)
CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email));

-- Update existing users to have NULL email (they can add it later)
-- No action needed as new column defaults to NULL