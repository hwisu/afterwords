import { getUserFromToken } from '../handlers/auth.js';

// Handle getting all books
async function getAllBooks(env) {
  const stmt = env.DB.prepare('SELECT id, title, author FROM books ORDER BY title, author');
  const result = await stmt.all();
  return result.results;
}

// Handle getting reviews for a specific book
async function getReviewsByBook(bookId, env) {
  const stmt = env.DB.prepare(`
    SELECT r.*, u.username 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.book_id = ? 
    ORDER BY r.created_at DESC
  `);
  const result = await stmt.bind(bookId).all();
  return result.results;
}


// Handle adding a new book
async function handleAddBook(request, env) {
  const formData = await request.formData();
  const title = formData.get('title');
  const author = formData.get('author');
  const isbn = formData.get('isbn') || null;
  const page_count = formData.get('page_count') ? parseInt(formData.get('page_count')) : null;
  
  // Check if book already exists
  const existing = await env.DB.prepare('SELECT id FROM books WHERE title = ? AND author = ?')
    .bind(title, author)
    .first();
    
  if (existing) {
    return new Response('이미 등록된 책입니다.', { status: 409 });
  }
  
  // Check if ISBN already exists (if provided)
  if (isbn) {
    const existingIsbn = await env.DB.prepare('SELECT id FROM books WHERE isbn = ?')
      .bind(isbn)
      .first();
      
    if (existingIsbn) {
      return new Response('이미 등록된 ISBN입니다.', { status: 409 });
    }
  }
  
  // Generate unique ID
  const id = crypto.randomUUID();
  
  // Insert book
  await env.DB.prepare(
    'INSERT INTO books (id, title, author, isbn, page_count, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
  ).bind(id, title, author, isbn, page_count).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    redirect: '/books' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}


// Handle updating book
async function handleUpdateBook(bookId, request, env) {
  const formData = await request.formData();
  const title = formData.get('title');
  const author = formData.get('author');
  const isbn = formData.get('isbn') || null;
  const page_count = formData.get('page_count') ? parseInt(formData.get('page_count')) : null;
  
  // Check if another book with same ISBN exists (if ISBN provided)
  if (isbn) {
    const existingIsbn = await env.DB.prepare('SELECT id FROM books WHERE isbn = ? AND id != ?')
      .bind(isbn, bookId)
      .first();
      
    if (existingIsbn) {
      return new Response('이미 등록된 ISBN입니다.', { status: 409 });
    }
  }
  
  // Update book
  await env.DB.prepare(
    'UPDATE books SET title = ?, author = ?, isbn = ?, page_count = ? WHERE id = ?'
  ).bind(title, author, isbn, page_count, bookId).run();
  
  return Response.redirect(new URL('/books', request.url), 303);
}

// Handle deleting book
async function handleDeleteBook(bookId, env) {
  // Delete associated reviews first (due to foreign key constraint)
  await env.DB.prepare('DELETE FROM reviews WHERE book_id = ?').bind(bookId).run();
  
  // Delete book
  await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(bookId).run();
  
  return new Response(JSON.stringify({ 
    success: true 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export { getAllBooks, getReviewsByBook, handleAddBook, handleUpdateBook, handleDeleteBook };
