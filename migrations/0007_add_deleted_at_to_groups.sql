-- Add deleted_at column to groups table for soft delete support
ALTER TABLE groups ADD COLUMN deleted_at TEXT;
