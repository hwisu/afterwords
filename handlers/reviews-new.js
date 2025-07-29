import { renderHomePage } from '../views/home.js';
import {  getUserFromToken } from './auth.js';
import { isUserGroupMember } from '../middleware/auth.js';
import { redirectWithMessage, getFlashMessage } from '../utils/flash.js';

// Handle home page
async function handleHomePage(request, env) {
  const reviews = await getAllReviews(env);
  const message = getFlashMessage(request);
  const html = await renderHomePage(reviews, message);
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
  
  // Check if user already reviewed this book
  const existing = await env.DB.prepare(
    'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?'
  ).bind(user.id, book_id).first();
  
  if (existing) {
    return new Response(JSON.stringify({ 
      error: '이미 해당 책에 대한 독후감을 작성하셨습니다.' 
    }), { 
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // If group_id provided, check membership
  if (group_id) {
    const isMember = await isUserGroupMember(env, user.id, group_id);
    if (!isMember) {
      return new Response(JSON.stringify({ 
        error: '해당 모임의 참여자가 아닙니다.' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  // Create the review (no group_id in reviews table anymore)
  await env.DB.prepare('INSERT INTO reviews (id, book_id, review, rating, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, book_id, review, parseInt(rating), createdAt, user.id)
    .run();
  
  // If group_id provided, add to review_groups relation
  if (group_id) {
    await env.DB.prepare('INSERT INTO review_groups (review_id, group_id, shared_at) VALUES (?, ?, ?)')
      .bind(id, group_id, createdAt)
      .run();
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    redirect: '/' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}


// Handle deleting a review
async function handleDeleteReview(id, request, env) {
  // Check if user owns this review
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Verify ownership
  const review = await env.DB.prepare('SELECT user_id FROM reviews WHERE id = ?').bind(id).first();
  if (!review || user.id !== review.user_id) {
    return new Response(JSON.stringify({ error: '권한이 없습니다.' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // review_groups will be cascade deleted due to foreign key
  await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Get reviews for a specific group with book information
async function getReviewsByGroup(env, groupId) {
  const stmt = env.DB.prepare(`
    SELECT r.*, b.title, b.author, u.username 
    FROM reviews r 
    JOIN books b ON r.book_id = b.id 
    JOIN users u ON r.user_id = u.id 
    JOIN review_groups rg ON r.id = rg.review_id
    WHERE rg.group_id = ? 
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
  // Get the review with book info
  const review = await env.DB.prepare(`
    SELECT r.*, b.title, b.author
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE r.id = ?
  `).bind(reviewId).first();
  
  if (!review) {
    return new Response('Review not found', { status: 404 });
  }
  
  // Get groups this review is shared with
  const groups = await env.DB.prepare(`
    SELECT g.id, g.name
    FROM review_groups rg
    JOIN groups g ON rg.group_id = g.id
    WHERE rg.review_id = ? AND g.deleted_at IS NULL
  `).bind(reviewId).all();
  
  review.groups = groups.results;
  
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
  
  return new Response(JSON.stringify({ error: 'This function is no longer supported' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
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
  
  return redirectWithMessage(`/review/${reviewId}`, '독후감이 수정되었습니다.');
}

// Share review with groups
async function shareReviewWithGroups(reviewId, groupIds, env) {
  const sharedAt = new Date().toISOString();
  
  for (const groupId of groupIds) {
    // Check if already shared
    const existing = await env.DB.prepare(
      'SELECT 1 FROM review_groups WHERE review_id = ? AND group_id = ?'
    ).bind(reviewId, groupId).first();
    
    if (!existing) {
      await env.DB.prepare(
        'INSERT INTO review_groups (review_id, group_id, shared_at) VALUES (?, ?, ?)'
      ).bind(reviewId, groupId, sharedAt).run();
    }
  }
}

// Unshare review from group
async function unshareReviewFromGroup(reviewId, groupId, env) {
  await env.DB.prepare(
    'DELETE FROM review_groups WHERE review_id = ? AND group_id = ?'
  ).bind(reviewId, groupId).run();
}

export { 
  handleAddReview, 
  handleDeleteReview, 
  getReviewsByGroup, 
  getAllReviews, 
  handleUpdateReview,
  shareReviewWithGroups,
  unshareReviewFromGroup
};