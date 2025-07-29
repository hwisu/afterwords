import bcrypt from 'bcryptjs';

/**
 * Generate a secure reset token
 */
function generateResetToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle password reset request page
 */
export async function handlePasswordResetRequest(request, env) {
  const html = await renderPasswordResetRequestPage();
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Handle password reset request form submission
 */
export async function handlePasswordResetRequestPost(request, env) {
  const formData = await request.formData();
  const email = formData.get('email');
  
  // Find user by email
  const user = await env.DB.prepare(
    'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?)'
  ).bind(email).first();
  
  // Always show success message to prevent email enumeration
  const successMessage = '이메일이 등록되어 있다면, 비밀번호 재설정 링크를 보내드렸습니다.';
  
  if (user && user.email) {
    // Generate reset token
    const token = generateResetToken();
    const tokenId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    
    // Save token to database
    await env.DB.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tokenId, user.id, token, expiresAt, createdAt).run();
    
    // Generate reset link
    const resetLink = new URL(`/password-reset/${token}`, request.url).toString();
    
    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetLink, user.username, env);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }
  
  // Always return success page
  const html = await renderPasswordResetRequestPage(successMessage);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Handle password reset form page (with token)
 */
export async function handlePasswordResetPage(token, request, env) {
  // Verify token is valid
  const tokenData = await env.DB.prepare(`
    SELECT * FROM password_reset_tokens 
    WHERE token = ? AND used_at IS NULL
  `).bind(token).first();
  
  if (!tokenData) {
    return new Response('유효하지 않은 링크입니다.', { status: 404 });
  }
  
  // Check if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return new Response('만료된 링크입니다. 다시 요청해주세요.', { status: 410 });
  }
  
  const html = await renderPasswordResetPage(token);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Handle password reset form submission
 */
export async function handlePasswordResetPost(token, request, env) {
  const formData = await request.formData();
  const password = formData.get('password');
  const passwordConfirm = formData.get('password_confirm');
  
  // Verify token
  const tokenData = await env.DB.prepare(`
    SELECT * FROM password_reset_tokens 
    WHERE token = ? AND used_at IS NULL
  `).bind(token).first();
  
  if (!tokenData) {
    return new Response('유효하지 않은 링크입니다.', { status: 404 });
  }
  
  // Check if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return new Response('만료된 링크입니다. 다시 요청해주세요.', { status: 410 });
  }
  
  // Validate passwords match
  if (password !== passwordConfirm) {
    const html = await renderPasswordResetPage(token, '비밀번호가 일치하지 않습니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Validate password requirements
  if (password.length < 6) {
    const html = await renderPasswordResetPage(token, '비밀번호는 최소 6자 이상이어야 합니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  if (password.length > 50) {
    const html = await renderPasswordResetPage(token, '비밀번호는 50자를 초과할 수 없습니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    const html = await renderPasswordResetPage(token, '비밀번호는 숫자와 문자를 모두 포함해야 합니다.');
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 400
    });
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Update user password
  await env.DB.prepare(
    'UPDATE users SET password_hash = ? WHERE id = ?'
  ).bind(hashedPassword, tokenData.user_id).run();
  
  // Mark token as used
  await env.DB.prepare(
    'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?'
  ).bind(new Date().toISOString(), tokenData.id).run();
  
  // Redirect to login with success message
  return Response.redirect(new URL('/login?reset=success', request.url), 303);
}