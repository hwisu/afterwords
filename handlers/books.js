// Handle getting all books
async function getAllBooks(env) {
  const reviews = await getAllReviews(env);
  // Extract unique books from reviews
  const booksMap = new Map();
  reviews.forEach(review => {
    const key = `${review.title}-${review.author}`;
    if (!booksMap.has(key)) {
      booksMap.set(key, {
        title: review.title,
        author: review.author
      });
    }
  });
  return Array.from(booksMap.values());
}

// Handle getting reviews for a specific book
async function getReviewsByBook(title, author, env) {
  const reviews = await getAllReviews(env);
  return reviews.filter(review => 
    review.title === title && review.author === author
  );
}

// Make getAllReviews available to books handler
async function getAllReviews(env) {
  const stmt = env.DB.prepare('SELECT * FROM reviews ORDER BY created_at DESC');
  const result = await stmt.all();
  return result.results;
}

export { getAllBooks, getReviewsByBook };
