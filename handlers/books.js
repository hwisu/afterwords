import { renderBookRegistrationPage, renderBooksListPage, renderBookEditPage } from '../views/books.js';
import { renderReviewWritingPage } from '../views/reviews.js';
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

// Handle showing book registration page
async function handleBookRegistrationPage() {
  const html = await renderBookRegistrationPage();
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
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
  
  return Response.redirect(new URL('/', request.url), 303);
}

// Handle showing review writing page
async function handleReviewWritingPage(request, env) {
  // Get the authenticated user
  const cookieHeader = request.headers.get('Cookie');
  const cookies = Object.fromEntries(
    cookieHeader ? cookieHeader.split('; ').map(c => c.split('=')) : []
  );
  const token = cookies.auth_token;
  
  // Get user from token
  const user = await getUserFromToken(token, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get all books
  const books = await env.DB.prepare('SELECT * FROM books ORDER BY title').all();
  
  // Get user's groups
  const userGroups = await env.DB.prepare(`
    SELECT g.*
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = ?
    ORDER BY g.name
  `).bind(user.id).all();
  
  const html = await renderReviewWritingPage(books.results, userGroups.results);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle showing books list page
async function handleBooksListPage(env) {
  const books = await env.DB.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
  const html = await renderBooksListPage(books.results);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

// Handle showing book edit page
async function handleBookEditPage(bookId, env) {
  const book = await env.DB.prepare('SELECT * FROM books WHERE id = ?').bind(bookId).first();
  if (!book) {
    return new Response('Book not found', { status: 404 });
  }
  
  const html = await renderBookEditPage(book);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
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
  
  return new Response('Book deleted', { status: 200 });
}

export { getAllBooks, getReviewsByBook, handleBookRegistrationPage, handleAddBook, handleReviewWritingPage, handleBooksListPage, handleBookEditPage, handleUpdateBook, handleDeleteBook };
