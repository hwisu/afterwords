-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL, -- ISO 8601 with timezone
  end_time TEXT NOT NULL,   -- ISO 8601 with timezone
  location_type TEXT NOT NULL CHECK (location_type IN ('offline', 'online')),
  location_name TEXT,       -- e.g., "스타벅스 강남점" or "Zoom"
  location_address TEXT,    -- for offline meetings
  online_url TEXT,          -- for online meetings, required if location_type = 'online'
  max_participants INTEGER,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  CHECK (
    (location_type = 'offline' AND location_address IS NOT NULL) OR
    (location_type = 'online' AND online_url IS NOT NULL)
  )
);

-- Create meeting requirements table (extensible design)
CREATE TABLE IF NOT EXISTS meeting_requirements (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'book_review', 'payment', 'photo_verification', etc.
  requirement_data TEXT NOT NULL, -- JSON data for flexibility
  display_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Create meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TEXT NOT NULL,
  attended_at TEXT,
  cancelled_at TEXT,
  PRIMARY KEY (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create meeting requirement fulfillments table
CREATE TABLE IF NOT EXISTS meeting_requirement_fulfillments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  fulfilled_at TEXT NOT NULL,
  fulfillment_data TEXT, -- JSON data for storing proof/details
  verified_by TEXT,
  verified_at TEXT,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (requirement_id) REFERENCES meeting_requirements(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id),
  UNIQUE(requirement_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_group_id ON meetings(group_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meeting_requirements_meeting_id ON meeting_requirements(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_status ON meeting_participants(status);
CREATE INDEX IF NOT EXISTS idx_meeting_requirement_fulfillments_user_id ON meeting_requirement_fulfillments(user_id);