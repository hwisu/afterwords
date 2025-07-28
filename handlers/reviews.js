import { renderHomePage, renderReviewPage } from '../views/templates.js';
import { getUserByUsername } from './auth.js';

// Handle home page
async function handleHomePage(env) {
  const reviews = await getAllReviews(env);
  const html = await renderHomePage(reviews);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle adding a new review
async function handleAddReview(request, env) {
  const formData = await request.formData();
  const title = formData.get('title');
  const author = formData.get('author');
  const review = formData.get('review');
  const rating = formData.get('rating');
  
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, value] = cookie.trim().split('=');
      return [key, value];
    })
  );
  const token = cookies.auth_token;
  const tokenResult = await env.DB.prepare('SELECT token FROM auth_tokens WHERE token = ?').bind(token).first();
  if (!tokenResult) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get user from token
  const username = 'admin'; // This should be derived from the auth token in a real implementation
  const user = await getUserByUsername(env, username);
  if (!user) {
    return new Response('User not found', { status: 404 });
  }
  
  // Check if the book already exists
  let bookResult = await env.DB.prepare('SELECT id FROM books WHERE title = ? AND author = ?')
    .bind(title, author)
    .first();
  
  let bookId;
  if (bookResult) {
    bookId = bookResult.id;
  } else {
    // Create a new book
    bookId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO books (id, title, author, created_at) VALUES (?, ?, ?, ?)')
      .bind(bookId, title, author, now)
      .run();
  }
  
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await env.DB.prepare('INSERT INTO reviews (id, book_id, review, rating, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, bookId, review, parseInt(rating), createdAt, user.id)
    .run();
  
  return Response.redirect(new URL('/', request.url), 303);
}

// Handle getting a specific review
async function handleGetReview(id, env) {
  const result = await env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first();
  if (!result) {
    return new Response('Review not found', { status: 404 });
  }
  
  const html = await renderReviewPage(result);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle deleting a review
async function handleDeleteReview(id, env) {
  await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
  return new Response('Deleted', { status: 200 });
}

// Get reviews for a specific group with book information
async function getReviewsByGroup(env, groupId) {
  const stmt = env.DB.prepare(`
    SELECT r.*, b.title, b.author, u.username 
    FROM reviews r 
    JOIN books b ON r.book_id = b.id 
    JOIN users u ON r.user_id = u.id 
    JOIN group_members gm ON u.id = gm.user_id 
    WHERE gm.group_id = ? 
    ORDER BY r.created_at DESC
  `);
  const result = await stmt.bind(groupId).all();
  return result.results;
}

// Get all reviews with book and user information
async function getAllReviews(env) {
  const stmt = env.DB.prepare(`
    SELECT r.*, b.title, b.author, u.username 
    FROM reviews r 
    JOIN books b ON r.book_id = b.id 
    JOIN users u ON r.user_id = u.id 
    ORDER BY r.created_at DESC
  `);
  const result = await stmt.all();
  return result.results;
}

// Get reviews by user with book information
async function getReviewsByUser(env, userId) {
  const stmt = env.DB.prepare(`
    SELECT r.*, b.title, b.author, u.username 
    FROM reviews r 
    JOIN books b ON r.book_id = b.id 
    JOIN users u ON r.user_id = u.id 
    WHERE r.user_id = ? 
    ORDER BY r.created_at DESC
  `);
  const result = await stmt.bind(userId).all();
  return result.results;
}

export { handleHomePage, handleAddReview, handleGetReview, handleDeleteReview, getReviewsByGroup, getAllReviews };
