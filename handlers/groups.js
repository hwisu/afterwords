import { renderGroupsPage, renderGroupManagePage } from '../views/groups.js';
import { getUserByUsername, getUserFromToken } from './auth.js';

// Handle getting all groups
async function getAllGroups(env) {
  const stmt = env.DB.prepare('SELECT * FROM groups ORDER BY name');
  const result = await stmt.all();
  return result.results;
}

// Handle getting a specific group
async function getGroup(env, id) {
  const groupResult = await env.DB.prepare('SELECT * FROM groups WHERE id = ?').bind(id).first();
  if (!groupResult) {
    return null;
  }

  // Get members with usernames
  const membersResult = await env.DB.prepare(`
    SELECT u.username 
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ? 
    ORDER BY u.username
  `).bind(id).all();
  const memberUsernames = membersResult.results.map(row => row.username);

  // Get books
  const booksResult = await env.DB.prepare('SELECT book_id FROM group_books WHERE group_id = ? ORDER BY book_id')
    .bind(id)
    .all();
  const bookIds = booksResult.results.map(row => row.book_id);

  return {
    ...groupResult,
    memberUsernames,
    bookIds
  };
}

// Handle creating a new group
async function createGroup(env, groupData) {
  const id = groupData.id || crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Insert group
  await env.DB.prepare('INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, groupData.name, groupData.description, now)
    .run();

  // Add members if provided (expecting user IDs)
  if (groupData.memberUserIds && groupData.memberUserIds.length > 0) {
    const memberStmt = env.DB.prepare('INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)');
    const memberPromises = groupData.memberUserIds.map(userId => 
      memberStmt.bind(id, userId, now).run()
    );
    await Promise.all(memberPromises);
  }

  // Add books if provided
  if (groupData.bookIds && groupData.bookIds.length > 0) {
    const bookStmt = env.DB.prepare('INSERT INTO group_books (group_id, book_id, added_at) VALUES (?, ?, ?)');
    const bookPromises = groupData.bookIds.map(bookId => 
      bookStmt.bind(id, bookId, now).run()
    );
    await Promise.all(bookPromises);
  }

  return getGroup(env, id);
}

// Handle adding a member to a group
async function addMemberToGroup(env, groupId, userId) {
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)')
    .bind(groupId, userId, now)
    .run();
  return getGroup(env, groupId);
}

// Handle adding a book to a group
async function addBookToGroup(env, groupId, bookId) {
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO group_books (group_id, book_id, added_at) VALUES (?, ?, ?)')
    .bind(groupId, bookId, now)
    .run();
  return getGroup(env, groupId);
}

// Handle groups page
async function handleGroupsPage(request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  if (!token) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Get user from token
  const user = await getUserFromToken(token, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Get all groups with member count
  const allGroups = await env.DB.prepare(`
    SELECT g.*, COUNT(gm.user_id) as member_count
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    GROUP BY g.id
    ORDER BY g.name
  `).all();
  
  // Get user's groups with admin check
  const userGroups = await env.DB.prepare(`
    SELECT g.*, 
           COUNT(gm2.user_id) as member_count,
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    LEFT JOIN group_members gm2 ON g.id = gm2.group_id
    LEFT JOIN group_admins ga ON g.id = ga.group_id AND ga.user_id = ?
    WHERE gm.user_id = ?
    GROUP BY g.id
    ORDER BY g.name
  `).bind(user.id, user.id).all();
  
  const html = await renderGroupsPage(allGroups.results, userGroups.results, user.id);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle creating a new group
async function handleCreateGroup(request, env) {
  const formData = await request.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  
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
  
  // Create group
  const groupId = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO groups (id, name, description, created_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(groupId, name, description).run();
  
  // Add creator as first member
  await env.DB.prepare(
    'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, datetime("now"))'
  ).bind(groupId, user.id).run();
  
  // Add creator as admin (if table exists)
  try {
    await env.DB.prepare(
      'INSERT INTO group_admins (group_id, user_id, created_at) VALUES (?, ?, datetime("now"))'
    ).bind(groupId, user.id).run();
  } catch (e) {
    // Table might not exist yet
    console.log('group_admins table not found, skipping admin assignment');
  }
  
  return Response.redirect(new URL('/groups', request.url), 303);
}

// Handle joining a group
async function handleJoinGroup(groupId, request, env) {
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
  
  // Check if already a member
  const existing = await env.DB.prepare(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, user.id).first();
  
  if (existing) {
    return new Response('Already a member', { status: 409 });
  }
  
  // Add to group
  await env.DB.prepare(
    'INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, datetime("now"))'
  ).bind(groupId, user.id).run();
  
  return new Response('Joined successfully', { status: 200 });
}

// Handle leaving a group
async function handleLeaveGroup(groupId, request, env) {
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
  
  // Check if user is admin
  const group = await env.DB.prepare('SELECT * FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) {
    return new Response('Group not found', { status: 404 });
  }
  
  // Check if user is admin in group_admins table
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (isAdmin) {
      return new Response('Admin cannot leave the group', { status: 403 });
    }
  } catch (e) {
    // group_admins table might not exist
  }
  
  // Check member count
  const memberCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?'
  ).bind(groupId).first();
  
  if (memberCount.count <= 1) {
    // Last member, delete the group
    await env.DB.prepare('DELETE FROM group_members WHERE group_id = ?').bind(groupId).run();
    await env.DB.prepare('DELETE FROM group_books WHERE group_id = ?').bind(groupId).run();
    await env.DB.prepare('DELETE FROM reviews WHERE group_id = ?').bind(groupId).run();
    await env.DB.prepare('DELETE FROM group_invitations WHERE group_id = ?').bind(groupId).run();
    try {
      await env.DB.prepare('DELETE FROM group_admins WHERE group_id = ?').bind(groupId).run();
    } catch (e) {}
    await env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId).run();
    return new Response('Group deleted', { status: 200 });
  } else {
    // Remove from group
    await env.DB.prepare(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).run();
    return new Response('Left successfully', { status: 200 });
  }
}

// Handle group management page
async function handleGroupManagePage(groupId, request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Check if user is admin
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isAdmin) {
      return new Response('권한이 없습니다.', { status: 403 });
    }
  } catch (e) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Get group details
  const group = await env.DB.prepare('SELECT * FROM groups WHERE id = ?').bind(groupId).first();
  if (!group) {
    return new Response('Group not found', { status: 404 });
  }
  
  // Get members
  const members = await env.DB.prepare(`
    SELECT u.*, gm.joined_at,
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN group_admins ga ON gm.group_id = ga.group_id AND gm.user_id = ga.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.joined_at
  `).bind(groupId).all();
  
  const html = await renderGroupManagePage(group, members.results, user.id);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle removing a member from group (admin only)
async function handleRemoveMember(groupId, userId, request, env) {
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
  
  // Check if current user is admin
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isAdmin) {
      return new Response('권한이 없습니다.', { status: 403 });
    }
  } catch (e) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Cannot remove yourself
  if (userId === user.id) {
    return new Response('자기 자신은 강퇴할 수 없습니다.', { status: 400 });
  }
  
  // Remove member
  await env.DB.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
  ).bind(groupId, userId).run();
  
  // Also remove from admins if they were admin
  try {
    await env.DB.prepare(
      'DELETE FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, userId).run();
  } catch (e) {}
  
  return new Response('Member removed', { status: 200 });
}

// Handle making a member admin
async function handleMakeAdmin(groupId, request, env) {
  const { user_id } = await request.json();
  
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
  
  // Check if current user is admin
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isAdmin) {
      return new Response('권한이 없습니다.', { status: 403 });
    }
  } catch (e) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Add as admin
  try {
    await env.DB.prepare(
      'INSERT INTO group_admins (group_id, user_id, created_at) VALUES (?, ?, datetime("now"))'
    ).bind(groupId, user_id).run();
  } catch (e) {
    // May already be admin
  }
  
  return new Response('Admin added', { status: 200 });
}

// Handle deleting a group
async function handleDeleteGroup(groupId, request, env) {
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
  
  // Check if current user is admin
  try {
    const isAdmin = await env.DB.prepare(
      'SELECT 1 FROM group_admins WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).first();
    
    if (!isAdmin) {
      return new Response('권한이 없습니다.', { status: 403 });
    }
  } catch (e) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Check member count
  const memberCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?'
  ).bind(groupId).first();
  
  if (memberCount.count > 1) {
    return new Response('멤버가 남아있어 그룹을 삭제할 수 없습니다.', { status: 400 });
  }
  
  // Delete everything related to group
  await env.DB.prepare('DELETE FROM group_members WHERE group_id = ?').bind(groupId).run();
  await env.DB.prepare('DELETE FROM group_books WHERE group_id = ?').bind(groupId).run();
  await env.DB.prepare('DELETE FROM reviews WHERE group_id = ?').bind(groupId).run();
  await env.DB.prepare('DELETE FROM group_invitations WHERE group_id = ?').bind(groupId).run();
  try {
    await env.DB.prepare('DELETE FROM group_admins WHERE group_id = ?').bind(groupId).run();
  } catch (e) {}
  await env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId).run();
  
  return new Response('Group deleted', { status: 200 });
}

export { getAllGroups, getGroup, createGroup, addMemberToGroup, addBookToGroup, handleGroupsPage, handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleGroupManagePage, handleRemoveMember, handleMakeAdmin, handleDeleteGroup };
