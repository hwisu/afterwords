import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleLoginPost, handleLogout, handleSignupPost, getUserFromToken } from './handlers/auth.js';
import { handleAddReview, handleDeleteReview, getReviewsByGroup, getAllReviews, handleUpdateReview } from './handlers/reviews-new.js';
import { getAllBooks, getReviewsByBook, handleAddBook, handleUpdateBook, handleDeleteBook } from './handlers/books.js';
import { getAllGroups, getGroup, handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleRemoveMember, handleMakeAdmin, handleDeleteGroup } from './handlers/groups.js';
import { createGroupInvitation, acceptGroupInvitation, handleInvitationPage, createGeneralInvitation } from './handlers/invitations.js';
import { handlePasswordResetRequest, handlePasswordResetRequestPost, handlePasswordResetPage, handlePasswordResetPost } from './handlers/password-reset.js';
import { handleCreateMeeting, handleMeetingRegistration } from './handlers/meetings.js';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:8787', 'https://book-reviews.h4o.kim'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Auth middleware for protected routes
const authMiddleware = async (c, next) => {
  const cookieHeader = c.req.header('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(cookie => cookie.split('=')) : []
  );
  const token = cookies.auth_token;
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const user = await getUserFromToken(token, c.env);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Static file serving middleware
const serveStatic = async (c, fileName) => {
  if (c.env.ASSETS) {
    const url = new URL(c.req.url);
    url.pathname = fileName;
    const response = await c.env.ASSETS.fetch(url);
    
    if (response.ok) {
      return response;
    }
    
    // Fallback to index.html for SPA routing
    if (response.status === 404 && fileName !== '/home.html') {
      url.pathname = '/home.html';
      return c.env.ASSETS.fetch(url);
    }
    
    return response;
  }
  
  return c.text('ASSETS binding not available', 500);
};

// Public pages
app.get('/login', async (c) => serveStatic(c, '/login.html'));
app.get('/signup', async (c) => serveStatic(c, '/signup.html'));
app.get('/password-reset', async (c) => serveStatic(c, '/password-reset.html'));
app.get('/password-reset/:token', async (c) => serveStatic(c, '/password-reset.html'));
app.get('/invite/:code', async (c) => serveStatic(c, '/invitation.html'));

// Protected pages - check auth first
app.get('/', async (c) => {
  const isAuthenticated = await checkAuth(c.req, c.env);
  if (!isAuthenticated) {
    return c.redirect('/login', 302);
  }
  return serveStatic(c, '/home.html');
});

app.get('/profile', authMiddleware, async (c) => serveStatic(c, '/profile.html'));
app.get('/books', authMiddleware, async (c) => serveStatic(c, '/books.html'));
app.get('/books/new', authMiddleware, async (c) => serveStatic(c, '/books-new.html'));
app.get('/groups', authMiddleware, async (c) => serveStatic(c, '/groups.html'));
app.get('/reviews/new', authMiddleware, async (c) => serveStatic(c, '/reviews-new.html'));
app.get('/groups/:id/meetings', authMiddleware, async (c) => serveStatic(c, '/meetings.html'));
app.get('/groups/:id/manage', authMiddleware, async (c) => serveStatic(c, '/groups-manage.html'));

// Auth API routes
app.post('/api/login', handleLoginPost);
app.post('/api/signup', handleSignupPost);
app.get('/logout', handleLogout);

// User API routes
app.get('/api/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({
    id: user.id,
    username: user.username,
    created_at: user.created_at
  });
});

app.get('/api/me/reviews', authMiddleware, async (c) => {
  const user = c.get('user');
  const reviews = await c.env.DB.prepare(`
    SELECT r.*, b.title, b.author, g.name as group_name
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    LEFT JOIN review_groups rg ON r.id = rg.review_id
    LEFT JOIN groups g ON rg.group_id = g.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).bind(user.id).all();
  
  return c.json(reviews.results);
});

app.get('/api/me/groups', authMiddleware, async (c) => {
  const user = c.get('user');
  const groups = await c.env.DB.prepare(`
    SELECT g.*, gm.joined_at,
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN group_admins ga ON g.id = ga.group_id AND ga.user_id = gm.user_id
    WHERE gm.user_id = ? AND g.deleted_at IS NULL
    ORDER BY gm.joined_at DESC
  `).bind(user.id).all();
  
  return c.json(groups.results);
});

// Review API routes
app.get('/api/reviews', async (c) => {
  const groupId = c.req.query('group_id');
  
  let reviews;
  if (groupId) {
    reviews = await getReviewsByGroup(c.env, groupId);
  } else {
    reviews = await getAllReviews(c.env);
  }
  
  return c.json(reviews);
});

app.post('/api/reviews', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleAddReview(c, c.env);
});

app.delete('/api/review/:id', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleDeleteReview(c.req.param('id'), c, c.env);
});

// Book API routes
app.get('/api/books', async (c) => {
  const books = await getAllBooks(c.env);
  const booksWithCounts = await Promise.all(books.map(async (book) => {
    const count = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM reviews WHERE book_id = ?'
    ).bind(book.id).first();
    return { ...book, review_count: count.count };
  }));
  
  return c.json(booksWithCounts);
});

app.post('/api/books', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleAddBook(c, c.env);
});

app.delete('/api/books/:id', authMiddleware, async (c) => {
  return handleDeleteBook(c.req.param('id'), c.env);
});

// Group API routes
app.get('/api/groups', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(cookie => cookie.split('=')) : []
  );
  const token = cookies.auth_token;
  
  let userId = null;
  if (token) {
    const user = await getUserFromToken(token, c.env);
    userId = user?.id;
  }
  
  const groups = await getAllGroups(c.env, userId);
  return c.json(groups);
});

app.get('/api/groups/:id', async (c) => {
  const group = await getGroup(c.env, c.req.param('id'));
  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }
  return c.json(group);
});

app.get('/api/groups/:id/members', async (c) => {
  const members = await c.env.DB.prepare(`
    SELECT u.id as user_id, u.username, gm.joined_at,
           CASE WHEN ga.user_id IS NOT NULL THEN 1 ELSE 0 END as is_admin
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN group_admins ga ON gm.group_id = ga.group_id AND ga.user_id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.joined_at ASC
  `).bind(c.req.param('id')).all();
  
  return c.json(members.results);
});

app.post('/api/groups', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleCreateGroup(c, c.env);
});

app.post('/api/groups/:id/join', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleJoinGroup(c.req.param('id'), c, c.env);
});

app.post('/api/groups/:id/leave', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleLeaveGroup(c.req.param('id'), c, c.env);
});

app.post('/api/groups/:id/invite', authMiddleware, async (c) => {
  c.set('request', c.req);
  return createGroupInvitation(c.req.param('id'), c, c.env);
});

app.post('/api/groups/:id/admins', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleMakeAdmin(c.req.param('id'), c, c.env);
});

app.delete('/api/groups/:id/members/:userId', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleRemoveMember(c.req.param('id'), c.req.param('userId'), c, c.env);
});

app.delete('/api/groups/:id', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleDeleteGroup(c.req.param('id'), c, c.env);
});

// Meeting API routes
app.get('/api/groups/:id/meetings', authMiddleware, async (c) => {
  const user = c.get('user');
  const meetings = await c.env.DB.prepare(`
    SELECT m.*, b.title as book_title,
           COUNT(mp.user_id) as participant_count,
           CASE WHEN mp2.user_id IS NOT NULL THEN 1 ELSE 0 END as is_registered
    FROM meetings m
    LEFT JOIN books b ON m.book_id = b.id
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
    LEFT JOIN meeting_participants mp2 ON m.id = mp2.meeting_id AND mp2.user_id = ?
    WHERE m.group_id = ?
    GROUP BY m.id
    ORDER BY m.meeting_date DESC
  `).bind(user.id, c.req.param('id')).all();
  
  return c.json(meetings.results);
});

app.post('/api/groups/:groupId/meetings/:meetingId/register', authMiddleware, async (c) => {
  c.set('request', c.req);
  return handleMeetingRegistration(c.req.param('groupId'), c.req.param('meetingId'), c, c.env);
});

// Password reset routes
app.post('/password-reset', async (c) => {
  c.set('request', c.req);
  return handlePasswordResetRequestPost(c, c.env);
});

app.post('/password-reset/:token', async (c) => {
  c.set('request', c.req);
  return handlePasswordResetPost(c.req.param('token'), c, c.env);
});

// Invitation routes
app.post('/invite/:code/accept', async (c) => {
  c.set('request', c.req);
  return acceptGroupInvitation(c.req.param('code'), c, c.env);
});

// General invitation (admin only)
app.post('/invitations/general', authMiddleware, async (c) => {
  c.set('request', c.req);
  return createGeneralInvitation(c, c.env);
});

// Catch-all for static assets
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.notFound();
});

// Helper function to check auth
async function checkAuth(request, env) {
  const cookieHeader = request.header('Cookie');
  if (!cookieHeader) return false;
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, value] = cookie.trim().split('=');
      return [key, value];
    })
  );
  
  if (!cookies.auth_token) return false;
  
  const token = cookies.auth_token;
  const result = await env.DB.prepare('SELECT token FROM auth_tokens WHERE token = ?').bind(token).first();
  return result !== null;
}

export default app;