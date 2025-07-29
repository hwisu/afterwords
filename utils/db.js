/**
 * Database query helpers
 */

/**
 * Get user by ID
 * @param {Object} env - Environment with DB binding
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserById(env, userId) {
  return await env.DB.prepare(
    'SELECT id, username, email, created_at FROM users WHERE id = ?'
  ).bind(userId).first();
}

/**
 * Get user by username
 * @param {Object} env - Environment with DB binding
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByUsername(env, username) {
  return await env.DB.prepare(
    'SELECT id, username, email, created_at FROM users WHERE username = ?'
  ).bind(username).first();
}

/**
 * Check if user is member of group
 * @param {Object} env - Environment with DB binding
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user is member
 */
export async function isGroupMember(env, userId, groupId) {
  const result = await env.DB.prepare(
    'SELECT 1 FROM group_members WHERE user_id = ? AND group_id = ?'
  ).bind(userId, groupId).first();
  
  return !!result;
}

/**
 * Check if user is admin of group
 * @param {Object} env - Environment with DB binding
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isGroupAdmin(env, userId, groupId) {
  const result = await env.DB.prepare(
    'SELECT 1 FROM group_admins WHERE user_id = ? AND group_id = ?'
  ).bind(userId, groupId).first();
  
  return !!result;
}

/**
 * Get group with member counts
 * @param {Object} env - Environment with DB binding
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} Group object or null
 */
export async function getGroupWithCounts(env, groupId) {
  return await env.DB.prepare(`
    SELECT g.*,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
           (SELECT COUNT(*) FROM reviews r 
            JOIN review_groups rg ON r.id = rg.review_id 
            WHERE rg.group_id = g.id) as review_count
    FROM groups g
    WHERE g.id = ? AND g.deleted_at IS NULL
  `).bind(groupId).first();
}