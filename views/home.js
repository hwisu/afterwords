export async function renderHomePage(reviews = [], flashMessage = null) {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Afterwords - 독서 커뮤니티</title>
      <link rel="stylesheet" href="/styles/base.css">
      <link rel="stylesheet" href="/styles/home.css">
    </head>
    <body>
      <nav class="navbar">
        <div class="nav-container">
          <a href="/" class="logo">Afterwords</a>
          <div class="nav-links">
            <a href="/books">책 검색</a>
            <a href="/groups">모임</a>
            <a href="/profile">프로필</a>
            <a href="/logout">로그아웃</a>
          </div>
        </div>
      </nav>

      <main class="main-content">
        ${flashMessage ? `
          <div class="flash-message flash-${flashMessage.type || 'success'}">
            ${flashMessage.message}
          </div>
        ` : ''}

        <div class="hero-section">
          <h1>독서의 즐거움을 함께 나누어요</h1>
          <p>책을 읽고, 생각을 나누고, 함께 성장하는 커뮤니티</p>
          <div class="hero-actions">
            <a href="/books" class="btn btn-primary">책 찾아보기</a>
            <a href="/groups" class="btn btn-secondary">모임 둘러보기</a>
          </div>
        </div>

        <section class="recent-reviews">
          <h2>최근 독후감</h2>
          ${reviews.length > 0 ? `
            <div class="reviews-grid">
              ${reviews.map(review => `
                <div class="review-card">
                  <div class="review-header">
                    <h3>${review.book_title || '제목 없음'}</h3>
                    <div class="rating">
                      ${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}
                    </div>
                  </div>
                  <p class="review-author">by ${review.author_name || '익명'}</p>
                  <p class="review-content">${review.content || ''}</p>
                  <div class="review-meta">
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString('ko-KR')}</span>
                    ${review.group_name ? `<span class="review-group">${review.group_name}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="no-reviews">아직 등록된 독후감이 없습니다. 첫 번째 독후감을 작성해보세요!</p>
          `}
        </section>
      </main>

      <footer class="footer">
        <div class="footer-content">
          <p>&copy; 2024 Afterwords. All rights reserved.</p>
        </div>
      </footer>

      <script src="/scripts/base.js"></script>
      <script src="/scripts/home.js"></script>
    </body>
    </html>
  `;
}