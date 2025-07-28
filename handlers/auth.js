// Simple authentication configuration
const AUTH_CONFIG = {
  username: 'admin',
  password: 'password'
};

// Get user by username
async function getUserByUsername(env, username) {
  const result = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?').bind(username).first();
  return result;
}

// Check if user is authenticated
async function checkAuth(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return false;
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, value] = cookie.trim().split('=');
      return [key, value];
    })
  );
  
  if (!cookies.auth_token) return false;
  
  // Verify token
  const token = cookies.auth_token;
  const result = await env.DB.prepare('SELECT token FROM auth_tokens WHERE token = ?').bind(token).first();
  return result !== null;
}

// Get user from auth token
async function getUserFromToken(token, env) {
  if (!token) return null;
  
  const tokenResult = await env.DB.prepare(`
    SELECT u.* FROM auth_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token = ?
  `).bind(token).first();
  
  return tokenResult;
}

import { renderLoginPage, renderSignupPage } from '../views/auth.js';

// Simple password hashing (in production, use bcrypt or similar)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Generate auth token
function generateAuthToken() {
  return crypto.randomUUID();
}

// Handle login page
async function handleLogin(env) {
  return new Response(await renderLoginPage(), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle login form submission
async function handleLoginPost(request, env) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  
  // Get user from database
  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  
  if (user) {
    // Hash the provided password
    const hashedPassword = await hashPassword(password);
    
    // Check if password matches
    if (hashedPassword === user.password_hash) {
      // Create auth token
      const token = crypto.randomUUID();
      const now = new Date().toISOString();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Store token with user_id
      await env.DB.prepare('INSERT INTO auth_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(token, user.id, now, expires).run();
      
      // Create response with redirect and set cookie header
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Max-Age=${30 * 24 * 60 * 60}`
        }
      });
    }
  }
  
  // Failed login
  return new Response(await renderLoginPage('아이디 또는 비밀번호가 올바르지 않습니다.'), {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle logout
async function handleLogout() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login',
      'Set-Cookie': 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
    }
  });
}

// Handle signup page
async function handleSignup(request, env) {
  const url = new URL(request.url);
  const inviteCode = url.searchParams.get('invite');
  const inviteType = url.searchParams.get('type');
  
  if (!inviteCode) {
    return new Response('초대 코드가 필요합니다.', { status: 400 });
  }
  
  // Verify invitation is valid
  let invitation;
  if (inviteType === 'group') {
    invitation = await env.DB.prepare(`
      SELECT i.*, g.name as group_name
      FROM group_invitations i
      JOIN groups g ON i.group_id = g.id
      WHERE i.invite_code = ?
    `).bind(inviteCode).first();
  } else {
    invitation = await env.DB.prepare(
      'SELECT * FROM general_invitations WHERE invite_code = ?'
    ).bind(inviteCode).first();
  }
  
  if (!invitation) {
    return new Response('유효하지 않은 초대 코드입니다.', { status: 404 });
  }
  
  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return new Response('만료된 초대 코드입니다.', { status: 410 });
  }
  
  // Check if max uses reached
  if (invitation.uses_count >= invitation.max_uses) {
    return new Response('사용 횟수가 초과된 초대 코드입니다.', { status: 410 });
  }
  
  const html = await renderSignupPage(inviteCode, inviteType, invitation);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle signup form submission
async function handleSignupPost(request, env) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  const passwordConfirm = formData.get('password_confirm');
  const inviteCode = formData.get('invite_code');
  const inviteType = formData.get('invite_type');
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    const html = await renderSignupPage(inviteCode, inviteType, null, '비밀번호가 일치하지 않습니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Validate password requirements
  if (password.length < 6) {
    const html = await renderSignupPage(inviteCode, inviteType, null, '비밀번호는 최소 6자 이상이어야 합니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  if (password.length > 50) {
    const html = await renderSignupPage(inviteCode, inviteType, null, '비밀번호는 50자를 초과할 수 없습니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Check for at least one number and one letter
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    const html = await renderSignupPage(inviteCode, inviteType, null, '비밀번호는 숫자와 문자를 모두 포함해야 합니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Check if username already exists
  const existingUser = await getUserByUsername(env, username);
  if (existingUser) {
    const html = await renderSignupPage(inviteCode, inviteType, null, '이미 사용 중인 아이디입니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Create user
  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  await env.DB.prepare(
    'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(userId, username, hashedPassword).run();
  
  // Update invitation usage
  if (inviteType === 'group') {
    await env.DB.prepare(
      'UPDATE group_invitations SET uses_count = uses_count + 1 WHERE invite_code = ?'
    ).bind(inviteCode).run();
    
    // Get group ID and add user to group
    const invitation = await env.DB.prepare(
      'SELECT group_id FROM group_invitations WHERE invite_code = ?'
    ).bind(inviteCode).first();
    
    if (invitation) {
      await env.DB.prepare(
        'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, datetime("now"))'
      ).bind(invitation.group_id, userId).run();
    }
  } else {
    await env.DB.prepare(
      'UPDATE general_invitations SET uses_count = uses_count + 1 WHERE invite_code = ?'
    ).bind(inviteCode).run();
  }
  
  // Create auth token
  const token = generateAuthToken();
  await env.DB.prepare(
    'INSERT INTO auth_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, userId, new Date().toISOString(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()).run();
  
  // Set cookie and redirect
  return new Response('', {
    status: 303,
    headers: {
      'Location': '/',
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Max-Age=${30 * 24 * 60 * 60}`
    }
  });
}

export { checkAuth, handleLogin, handleLoginPost, handleLogout, getUserByUsername, handleSignup, handleSignupPost, getUserFromToken };
