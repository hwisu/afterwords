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

// Make getAllReviews available to books handler
async function getAllReviews(env) {
  const stmt = env.DB.prepare('SELECT * FROM reviews ORDER BY created_at DESC');
  const result = await stmt.all();
  return result.results;
}

export { getAllBooks, getReviewsByBook };
