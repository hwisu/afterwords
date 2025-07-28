import { renderHomePage, renderReviewPage } from '../views/templates.js';

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
  
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await env.DB.prepare('INSERT INTO reviews (id, title, author, review, rating, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, title, author, review, parseInt(rating), createdAt)
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

// Get all reviews
async function getAllReviews(env) {
  const stmt = env.DB.prepare('SELECT * FROM reviews ORDER BY created_at DESC');
  const result = await stmt.all();
  return result.results;
}

export { handleHomePage, handleAddReview, handleGetReview, handleDeleteReview, getAllReviews };
