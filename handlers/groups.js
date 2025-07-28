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

  // Get members
  const membersResult = await env.DB.prepare('SELECT username FROM group_members WHERE group_id = ? ORDER BY username')
    .bind(id)
    .all();
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

  // Add members if provided
  if (groupData.memberUsernames && groupData.memberUsernames.length > 0) {
    const memberStmt = env.DB.prepare('INSERT INTO group_members (group_id, username, joined_at) VALUES (?, ?, ?)');
    const memberPromises = groupData.memberUsernames.map(username => 
      memberStmt.bind(id, username, now).run()
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
async function addMemberToGroup(env, groupId, username) {
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO group_members (group_id, username, joined_at) VALUES (?, ?, ?)')
    .bind(groupId, username, now)
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

export { getAllGroups, getGroup, createGroup, addMemberToGroup, addBookToGroup };
