// Database schema interfaces

export interface User {
  id: string;
  username: string;
  password_hash: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  page_count: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  book_id: string;
  review: string;
  rating: number;
  created_at: string;
  user_id: string;
  group_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface GroupAdmin {
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface GroupBook {
  group_id: string;
  book_id: string;
  added_at: string;
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  max_uses: number;
  uses_count: number;
}

export interface GeneralInvitation {
  id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  max_uses: number;
  uses_count: number;
}

export interface AuthToken {
  token: string;
  user_id: string | null;
  created_at: string;
  expires_at: string | null;
}