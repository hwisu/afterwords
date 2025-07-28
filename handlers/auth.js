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

import { renderLoginPage } from '../views/templates.js';

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
  
  if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
    // Create auth token
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    // Store token
    await env.DB.prepare('INSERT INTO auth_tokens (token, created_at) VALUES (?, ?)').bind(token, now).run();
    
    // Create response with redirect and set cookie header
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`
      }
    });
  } else {
    // Failed login
    return new Response(await renderLoginPage('아이디 또는 비밀번호가 올바르지 않습니다.'), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }
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

export { checkAuth, handleLogin, handleLoginPost, handleLogout, getUserByUsername };
