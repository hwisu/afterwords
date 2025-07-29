import { getUserByUsername, getUserFromToken } from './auth.js';
import { isUserGroupMember, isUserGroupAdmin, getUserFromRequest, verifyGroupAccess } from '../middleware/auth.js';

// Handle getting all groups with membership status
async function getAllGroups(env, userId = null) {
  // Get all non-deleted groups with member count
  const groups = await env.DB.prepare(`
    SELECT g.*, 
           COUNT(DISTINCT gm.user_id) as member_count,
           COUNT(DISTINCT rg.review_id) as review_count
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN review_groups rg ON g.id = rg.group_id
    WHERE g.deleted_at IS NULL
    GROUP BY g.id
    ORDER BY g.name
  `).all();
  
  if (!userId) {
    return groups.results;
  }
  
  // Add membership status for the user
  const userMemberships = await env.DB.prepare(`
    SELECT gm.group_id,
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
    FROM group_members gm
    LEFT JOIN group_admins ga ON gm.group_id = ga.group_id AND ga.user_id = gm.user_id
    WHERE gm.user_id = ?
  `).bind(userId).all();
  
  const membershipMap = {};
  userMemberships.results.forEach(m => {
    membershipMap[m.group_id] = { 
      is_member: true, 
      is_admin: m.is_admin === 1 
    };
  });
  
  return groups.results.map(group => ({
    ...group,
    is_member: membershipMap[group.id]?.is_member || false,
    is_admin: membershipMap[group.id]?.is_admin || false
  }));
}

// Handle getting a specific group (with access control)
async function getGroup(env, id, userId = null) {
  const groupResult = await env.DB.prepare('SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!groupResult) {
    return null;
  }

  // If userId is provided, verify access
  if (userId) {
    const hasAccess = await isUserGroupMember(env, userId, id);
    if (!hasAccess) {
      return null; // Don't reveal group exists
    }
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


// Handle creating a new group
async function handleCreateGroup(c) {
  const formData = await c.req.formData();
  const name = formData.get('name');
  const description = formData.get('description');
  const env = c.env;
  
  // Get the authenticated user
  const user = c.get('user');
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
  
  return Response.redirect(new URL('/groups', c.req.url), 303);
}

// Handle joining a group
async function handleJoinGroup(groupId, c) {
  const env = c.env;
  // Get the authenticated user
  const user = c.get('user');
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
  
  return new Response(JSON.stringify({ 
    success: true 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle leaving a group
async function handleLeaveGroup(groupId, c) {
  const env = c.env;
  // Get the authenticated user
  const user = c.get('user');
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
    // Soft delete the group
    const deletedAt = new Date().toISOString();
    await env.DB.prepare('UPDATE groups SET deleted_at = ? WHERE id = ?').bind(deletedAt, groupId).run();
    await env.DB.prepare('DELETE FROM group_invitations WHERE group_id = ?').bind(groupId).run();
    try {
      await env.DB.prepare('DELETE FROM group_admins WHERE group_id = ?').bind(groupId).run();
    } catch (e) {}
    await env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId).run();
    return new Response(JSON.stringify({ 
      success: true,
      message: '모임이 삭제되었습니다.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // Remove from group
    await env.DB.prepare(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
    ).bind(groupId, user.id).run();
    return new Response(JSON.stringify({ 
      success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


// Handle removing a member from group (admin only)
async function handleRemoveMember(groupId, userId, c) {
  const env = c.env;
  // Get the authenticated user
  const user = c.get('user');
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
async function handleMakeAdmin(groupId, c) {
  const { user_id } = await c.req.json();
  const env = c.env;
  
  // Get the authenticated user
  const user = c.get('user');
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
async function handleDeleteGroup(groupId, c) {
  const env = c.env;
  // Get the authenticated user
  const user = c.get('user');
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
    return new Response('멤버가 남아있어 모임을 삭제할 수 없습니다.', { status: 400 });
  }
  
  // Soft delete the group
  const deletedAt = new Date().toISOString();
  await env.DB.prepare('UPDATE groups SET deleted_at = ? WHERE id = ?').bind(deletedAt, groupId).run();
  
  // Clean up relations
  await env.DB.prepare('DELETE FROM group_members WHERE group_id = ?').bind(groupId).run();
  await env.DB.prepare('DELETE FROM group_books WHERE group_id = ?').bind(groupId).run();
  await env.DB.prepare('DELETE FROM group_invitations WHERE group_id = ?').bind(groupId).run();
  try {
    await env.DB.prepare('DELETE FROM group_admins WHERE group_id = ?').bind(groupId).run();
  } catch (e) {}
  
  // Note: review_groups relation is preserved - reviews remain accessible to users
  
  return new Response('Group deleted', { status: 200 });
}

export { getAllGroups, getGroup, createGroup, addMemberToGroup, addBookToGroup, handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleRemoveMember, handleMakeAdmin, handleDeleteGroup };
