import { renderHomePage } from '../views/home.js';
import { renderReviewPage, renderReviewEditPage } from '../views/reviews.js';
import { getUserByUsername, getUserFromToken } from './auth.js';

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
  const book_id = formData.get('book_id');
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
  
  // Get user from token
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const group_id = formData.get('group_id') || null;
  
  // Check if user already reviewed this book in this group
  if (group_id) {
    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND book_id = ? AND group_id = ?'
    ).bind(user.id, book_id, group_id).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: '이미 이 그룹에서 해당 책에 대한 독후감을 작성하셨습니다.' 
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    // Check for personal review
    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE user_id = ? AND book_id = ? AND group_id IS NULL'
    ).bind(user.id, book_id).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: '이미 해당 책에 대한 개인 독후감을 작성하셨습니다.' 
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await env.DB.prepare('INSERT INTO reviews (id, book_id, review, rating, created_at, user_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, book_id, review, parseInt(rating), createdAt, user.id, group_id)
    .run();
  
  return Response.redirect(new URL('/', request.url), 303);
}

// Handle getting a specific review
async function handleGetReview(id, env) {
  const result = await env.DB.prepare(`
    SELECT r.*, b.title, b.author, u.username
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `).bind(id).first();
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

// Handle showing review edit page
async function handleReviewEditPage(reviewId, request, env) {
  // Get the review with book and group info
  const review = await env.DB.prepare(`
    SELECT r.*, b.title, b.author, g.name as group_name
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    LEFT JOIN groups g ON r.group_id = g.id
    WHERE r.id = ?
  `).bind(reviewId).first();
  
  if (!review) {
    return new Response('Review not found', { status: 404 });
  }
  
  // Check if user owns this review
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!user || user.id !== review.user_id) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  const html = await renderReviewEditPage(review);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle updating review
async function handleUpdateReview(reviewId, request, env) {
  const formData = await request.formData();
  const reviewText = formData.get('review');
  const rating = formData.get('rating');
  
  // Check if user owns this review
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // Verify ownership
  const review = await env.DB.prepare('SELECT user_id FROM reviews WHERE id = ?').bind(reviewId).first();
  if (!review || user.id !== review.user_id) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Update review
  await env.DB.prepare(
    'UPDATE reviews SET review = ?, rating = ? WHERE id = ?'
  ).bind(reviewText, parseInt(rating), reviewId).run();
  
  return Response.redirect(new URL(`/review/${reviewId}`, request.url), 303);
}

export { handleHomePage, handleAddReview, handleGetReview, handleDeleteReview, getReviewsByGroup, getAllReviews, handleReviewEditPage, handleUpdateReview };
