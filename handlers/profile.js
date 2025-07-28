import { renderProfilePage } from '../views/profile.js';
import { getUserByUsername, getUserFromToken } from './auth.js';

// Handle profile page
async function handleProfilePage(request, env) {
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
  
  // Get user's reviews
  const reviews = await env.DB.prepare(`
    SELECT r.*, b.title, b.author 
    FROM reviews r 
    JOIN books b ON r.book_id = b.id 
    WHERE r.user_id = ? 
    ORDER BY r.created_at DESC
  `).bind(user.id).all();
  
  // Get user's groups
  const groups = await env.DB.prepare(`
    SELECT g.*, 
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    LEFT JOIN group_admins ga ON g.id = ga.group_id AND ga.user_id = ?
    WHERE gm.user_id = ?
    ORDER BY g.name
  `).bind(user.id, user.id).all();
  
  const html = await renderProfilePage(user, reviews.results, groups.results);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

export { handleProfilePage };