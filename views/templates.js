// HTML escape utility
function escapeHtml(text) {
  const map = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Render login page
async function renderLoginPage(error = null) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>로그인 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        body.loaded {
            opacity: 1;
        }
        .login-container {
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #222;
            text-align: center;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
        }
        
        input {
            width: 100%;
            padding: 8px 0;
            border: none;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
            font-family: inherit;
            background: transparent;
        }
        
        input:focus {
            outline: none;
            border-bottom: 1px solid #333;
        }
        
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
        }
        
        button:hover {
            background: #f0f0f0;
        }
        
        .back-link {
            display: none;
        }
        
        .login-container {
            margin-bottom: 30px;
        }
        
        .error {
            color: #dc3545;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        
        script {
            display: none;
        }
    </style>
    <script>
        // Wait for font to load before showing page
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        // Fallback in case fonts don't load for some reason
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    </script>
</head>
<body>
    <div class="login-container">
        <h1>로그인</h1>
        ${error ? `<div class="error">${error}</div>` : ''}
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="username">아이디</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">로그인</button>
        </form>
    </div>
</body>
</html>`;
}

// Render home page
async function renderHomePage(reviews) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        body.loaded {
            opacity: 1;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #222;
        }
        .review-form {
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
        }
        input, textarea, select {
            width: 100%;
            padding: 8px 0;
            border: none;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
            font-family: inherit;
            background: transparent;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-bottom: 1px solid #333;
        }
        textarea {
            resize: vertical;
            min-height: 120px;
            line-height: 1.6;
        }
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            display: block;
            margin-left: auto;
            width: fit-content;
        }
        button:hover {
            background: #f0f0f0;
        }
        .review-list {
            list-style: none;
            padding: 0;
        }
        .review-item {
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        .review-item:last-child {
            border-bottom: none;
        }
        .review-title {
            font-size: 18px;
            margin-bottom: 5px;
            color: #222;
        }
        .review-meta {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .review-text {
            font-size: 14px;
            color: #444;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        .rating {
            color: #f39c12;
        }
        a {
            color: #333;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .logout-btn {
            float: right;
            background: transparent;
            color: #333;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
        }
        .logout-btn:hover {
            background: #f0f0f0;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
    <script>
        // Wait for font to load before showing page
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        // Fallback in case fonts don't load for some reason
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    </script>
</head>
<body>
    <div class="header-container">
        <h1>읽고 난 뒤</h1>
        <form action="/logout" method="GET" style="display: inline;">
            <button type="submit" class="logout-btn">로그아웃</button>
        </form>
    </div>
    
    <form class="review-form" method="POST" action="/reviews">
        <div class="form-group">
            <label for="title">책 제목</label>
            <input type="text" id="title" name="title" required>
        </div>
        
        <div class="form-group">
            <label for="author">저자</label>
            <input type="text" id="author" name="author" required>
        </div>
        
        <div class="form-group">
            <label for="rating">평점</label>
            <select id="rating" name="rating" required>
                <option value="5">★★★★★</option>
                <option value="4">★★★★☆</option>
                <option value="3">★★★☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="1">★☆☆☆☆</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="review">감상</label>
            <textarea id="review" name="review" required></textarea>
        </div>
        
        <button type="submit" class="register-btn">등록</button>
    </form>
    
    <ul class="review-list">
        ${reviews.map(review => `
            <li class="review-item">
                <h2 class="review-title">
                    <a href="/review/${review.id}">${escapeHtml(review.title)}</a>
                </h2>
                <div class="review-meta">
                    ${escapeHtml(review.author)} | 
                    <span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span> | 
                    ${new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </div>
                <div class="review-text">${escapeHtml(review.review).substring(0, 200)}${review.review.length > 200 ? '...' : ''}</div>
            </li>
        `).join('')}
    </ul>
</body>
</html>`;
}

// Render review page
async function renderReviewPage(review) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(review.title)} - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.8;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .back-link {
            display: inline-block;
            color: #666;
            font-size: 14px;
        }
        .logout-btn {
            background: transparent;
            color: #333;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
        }
        .logout-btn:hover {
            background: #f0f0f0;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            color: #222;
        }
        .meta {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        .review-content {
            font-size: 16px;
            line-height: 1.8;
            white-space: pre-wrap;
            padding: 0;
            margin: 0;
        }
        .rating {
            color: #f39c12;
        }
        .delete-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 20px;
        }
        .delete-btn:hover {
            background: #c82333;
        }
        a {
            color: #333;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <a href="/" class="back-link">← 목록으로</a>
        <form action="/logout" method="GET" style="display: inline;">
            <button type="submit" class="logout-btn">로그아웃</button>
        </form>
    </div>
    
    <h1>${escapeHtml(review.title)}</h1>
    <div class="meta">
        ${escapeHtml(review.author)} | 
        <span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span> | 
        ${new Date(review.createdAt).toLocaleDateString('ko-KR')}
    </div>
    
    <div class="review-content">${escapeHtml(review.review)}</div>
    
    <button class="delete-btn" onclick="deleteReview()">삭제</button>
    
    <script>
        async function deleteReview() {
            if (confirm('정말 삭제하시겠습니까?')) {
                const response = await fetch('/review/${review.id}', { method: 'DELETE' });
                if (response.ok) {
                    window.location.href = '/';
                }
            }
        }
    </script>
</body>
</html>`;
}

export { renderLoginPage, renderHomePage, renderReviewPage, escapeHtml };
