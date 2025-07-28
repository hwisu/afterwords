import { getUserByUsername, getUserFromToken } from './auth.js';
import { renderInvitationPage } from '../views/invitations.js';

// Generate a random 6-character invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create group invitation
async function createGroupInvitation(groupId, request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check if user is admin of the group
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isAdmin) {
      // If group_admins table doesn't exist or user is not admin, check if they're a member
      const isMember = await env.DB.prepare(
        'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
      ).bind(groupId, user.id).first();
      
      if (!isMember) {
        return new Response('권한이 없습니다.', { status: 403 });
      }
    }
  } catch (e) {
    // Fallback to checking membership only
    const isMember = await env.DB.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isMember) {
      return new Response('권한이 없습니다.', { status: 403 });
    }
  }
  
  // Generate unique invite code
  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = await env.DB.prepare(
      'SELECT 1 FROM group_invitations WHERE invite_code = ?'
    ).bind(inviteCode).first();
    if (!existing) break;
    attempts++;
  } while (attempts < 10);
  
  if (attempts >= 10) {
    return new Response('초대 코드 생성에 실패했습니다.', { status: 500 });
  }
  
  // Create invitation (expires in 7 days, max 10 uses)
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await env.DB.prepare(`
    INSERT INTO group_invitations (id, group_id, invite_code, created_by, created_at, expires_at, max_uses, uses_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, groupId, inviteCode, user.id, createdAt, expiresAt, 10, 0).run();
  
  // Return the invite link
  const inviteUrl = new URL(`/invite/${inviteCode}`, request.url).toString();
  return new Response(JSON.stringify({ 
    code: inviteCode, 
    url: inviteUrl,
    expires_at: expiresAt 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle invitation acceptance
async function acceptGroupInvitation(inviteCode, request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  if (!token) {
    // No auth token, redirect to signup
    const redirectUrl = new URL('/signup', request.url);
    redirectUrl.searchParams.set('invite', inviteCode);
    redirectUrl.searchParams.set('type', 'group');
    return Response.redirect(redirectUrl, 303);
  }
  
  const tokenResult = await env.DB.prepare('SELECT * FROM auth_tokens WHERE token = ?').bind(token).first();
  if (!tokenResult) {
    // Invalid token, redirect to signup
    const redirectUrl = new URL('/signup', request.url);
    redirectUrl.searchParams.set('invite', inviteCode);
    redirectUrl.searchParams.set('type', 'group');
    return Response.redirect(redirectUrl, 303);
  }
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get invitation details
  const invitation = await env.DB.prepare(`
    SELECT i.*, g.name as group_name
    FROM group_invitations i
    JOIN groups g ON i.group_id = g.id
    WHERE i.invite_code = ?
  `).bind(inviteCode).first();
  
  if (!invitation) {
    return new Response('초대 코드가 유효하지 않습니다.', { status: 404 });
  }
  
  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return new Response('초대 코드가 만료되었습니다.', { status: 410 });
  }
  
  // Check if max uses reached
  if (invitation.uses_count >= invitation.max_uses) {
    return new Response('초대 코드 사용 횟수가 초과되었습니다.', { status: 410 });
  }
  
  // Check if user is already a member
  const existingMember = await env.DB.prepare(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(invitation.group_id, user.id).first();
  
  if (existingMember) {
    return new Response('이미 그룹의 멤버입니다.', { status: 409 });
  }
  
  // Add user to group
  await env.DB.prepare(
    'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, datetime("now"))'
  ).bind(invitation.group_id, user.id).run();
  
  // Increment uses count
  await env.DB.prepare(
    'UPDATE group_invitations SET uses_count = uses_count + 1 WHERE id = ?'
  ).bind(invitation.id).run();
  
  // Redirect to groups page with success message
  return Response.redirect(new URL(`/groups?joined=${encodeURIComponent(invitation.group_name)}`, request.url), 303);
}

// Render invitation page
// Create general invitation (for new user signup)
async function createGeneralInvitation(request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Generate unique invite code
  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = await env.DB.prepare(
      'SELECT 1 FROM general_invitations WHERE invite_code = ?'
    ).bind(inviteCode).first();
    if (!existing) break;
    attempts++;
  } while (attempts < 10);
  
  if (attempts >= 10) {
    return new Response('초대 코드 생성에 실패했습니다.', { status: 500 });
  }
  
  // Create invitation (expires in 7 days)
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await env.DB.prepare(`
    INSERT INTO general_invitations (id, invite_code, created_by, created_at, expires_at, max_uses, uses_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, inviteCode, user.id, createdAt, expiresAt, 10, 0).run();
  
  // Return the invite link
  const inviteUrl = new URL(`/invite/${inviteCode}`, request.url).toString();
  return new Response(JSON.stringify({ 
    code: inviteCode, 
    url: inviteUrl,
    expires_at: expiresAt,
    type: 'general'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleInvitationPage(inviteCode, env) {
  // First check if it's a group invitation
  let invitation = await env.DB.prepare(`
    SELECT i.*, g.name as group_name, g.description as group_description, u.username as inviter_name, 'group' as type
    FROM group_invitations i
    JOIN groups g ON i.group_id = g.id
    JOIN users u ON i.created_by = u.id
    WHERE i.invite_code = ?
  `).bind(inviteCode).first();
  
  // If not found, check general invitations
  if (!invitation) {
    invitation = await env.DB.prepare(`
      SELECT i.*, u.username as inviter_name, 'general' as type
      FROM general_invitations i
      JOIN users u ON i.created_by = u.id
      WHERE i.invite_code = ?
    `).bind(inviteCode).first();
  }
  
  const html = await renderInvitationPage(inviteCode, invitation);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

export { createGroupInvitation, acceptGroupInvitation, handleInvitationPage, createGeneralInvitation };