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

import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/email-resend.js';

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Generate auth token
function generateAuthToken() {
  return crypto.randomUUID();
}

// Handle login form submission
async function handleLoginPost(c) {
  const formData = await c.req.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  const env = c.env;
  
  // Get user from database
  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  
  if (user) {
    // Check if password matches using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (passwordMatch) {
      // Create auth token
      const token = crypto.randomUUID();
      const now = new Date().toISOString();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Store token with user_id
      await env.DB.prepare('INSERT INTO auth_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(token, user.id, now, expires).run();
      
      // Create response with JSON and set cookie header
      return new Response(JSON.stringify({ success: true, redirect: '/' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
        }
      });
    }
  }
  
  // Failed login
  return new Response(JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle logout
async function handleLogout() {
  return new Response('', {
    status: 302,
    headers: {
      'Location': '/login',
      'Set-Cookie': 'auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  });
}


// Handle signup form submission
async function handleSignupPost(c) {
  const formData = await c.req.formData();
  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');
  const env = c.env;
  const passwordConfirm = formData.get('password_confirm');
  const inviteCode = formData.get('invite_code');
  const inviteType = formData.get('invite_type');
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    return new Response(JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Validate password requirements
  if (password.length < 6) {
    return new Response(JSON.stringify({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  if (password.length > 50) {
    return new Response(JSON.stringify({ error: '비밀번호는 50자를 초과할 수 없습니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Check for at least one number and one letter
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    return new Response(JSON.stringify({ error: '비밀번호는 숫자와 문자를 모두 포함해야 합니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: '유효한 이메일 주소를 입력해주세요.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Check if username already exists
  const existingUser = await getUserByUsername(env, username);
  if (existingUser) {
    return new Response(JSON.stringify({ error: '이미 사용 중인 아이디입니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Check if email already exists
  const existingEmail = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first();
  if (existingEmail) {
    return new Response(JSON.stringify({ error: '이미 사용 중인 이메일입니다.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
  
  // Create user
  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);
  await env.DB.prepare(
    'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
  ).bind(userId, username, email, hashedPassword).run();
  
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
  
  // Send welcome email (don't wait for it)
  sendWelcomeEmail(email, username, env).catch(err => {
    console.error('Failed to send welcome email:', err);
  });
  
  // Set cookie and redirect
  return new Response('', {
    status: 303,
    headers: {
      'Location': '/',
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`
    }
  });
}

export { checkAuth, handleLoginPost, handleLogout, getUserByUsername, handleSignupPost, getUserFromToken };
