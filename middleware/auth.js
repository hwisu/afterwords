import bcrypt from 'bcryptjs';

export async function getUserFromRequest(request, env) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;

  const cookies = Object.fromEntries(
    cookie.split(';').map(c => {
      const [key, value] = c.trim().split('=');
      return [key, decodeURIComponent(value)];
    })
  );

  const sessionToken = cookies.session;
  if (!sessionToken) return null;

  const user = await env.DB.prepare(
    `SELECT id, username, email FROM users WHERE session_token = ?`
  )
    .bind(sessionToken)
    .first();

  return user;
}

export async function isUserGroupMember(env, userId, groupId) {
  const membership = await env.DB.prepare(
    `SELECT 1 FROM group_members 
     WHERE user_id = ? AND group_id = ?`
  )
    .bind(userId, groupId)
    .first();

  return !!membership;
}

export async function isUserGroupAdmin(env, userId, groupId) {
  const admin = await env.DB.prepare(
    `SELECT user_id FROM group_admins 
     WHERE user_id = ? AND group_id = ?`
  )
    .bind(userId, groupId)
    .first();

  return admin !== null;
}

export async function verifyGroupAccess(env, userId, groupId) {
  const membership = await env.DB.prepare(
    `SELECT user_id FROM group_members 
     WHERE user_id = ? AND group_id = ?`
  )
    .bind(userId, groupId)
    .first();

  if (!membership) {
    return {
      hasAccess: false,
      isAdmin: false
    };
  }

  // Check if user is admin
  const isAdmin = await isUserGroupAdmin(env, userId, groupId);
  
  return {
    hasAccess: true,
    isAdmin: isAdmin
  };
}