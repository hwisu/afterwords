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
            text-decoration: underline;
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

// Render home page - main navigation
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
        .nav-menu {
            display: flex;
            gap: 40px;
            margin-bottom: 60px;
            justify-content: center;
        }
        .nav-item {
            text-align: center;
            text-decoration: underline;
            color: #333;
            transition: opacity 0.3s ease;
        }
        .nav-item:hover {
            opacity: 0.6;
        }
        .nav-title {
            font-size: 16px;
            font-weight: 400;
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
            border-bottom: 1px solid rgba(0,0,0,0.3);
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
            text-decoration: underline;
        }
        button:hover {
            background: #f0f0f0;
        }
        .review-list {
            list-style: none;
            padding: 0;
        }
        .review-item {
            margin-bottom: 50px;
            padding-bottom: 40px;
            border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .review-item:last-child {
            border-bottom: none;
        }
        .review-title {
            font-size: 20px;
            margin-bottom: 12px;
            font-weight: 400;
            line-height: 1.4;
        }
        .review-meta {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
            font-weight: 300;
        }
        .review-text {
            font-size: 16px;
            color: #444;
            white-space: pre-wrap;
            line-height: 1.9;
            font-weight: 300;
            margin-top: 16px;
        }
        a {
            color: #333;
            text-decoration: underline;
        }
        a:hover {
            text-decoration: underline;
            opacity: 0.6;
        }
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-link {
            color: #333;
            text-decoration: underline;
            font-size: 14px;
            margin-left: 20px;
            transition: opacity 0.3s ease;
        }
        .header-link:hover {
            opacity: 0.6;
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
        <div>
            <a href="/profile" class="header-link">내 정보</a>
            <a href="/logout" class="header-link">로그아웃</a>
        </div>
    </div>
    
    <div class="nav-menu">
        <a href="/books" class="nav-item">
            <div class="nav-title">책 목록</div>
        </a>
        <a href="/books/new" class="nav-item">
            <div class="nav-title">책 등록</div>
        </a>
        <a href="/reviews/new" class="nav-item">
            <div class="nav-title">독후감 작성</div>
        </a>
        <a href="/groups" class="nav-item">
            <div class="nav-title">그룹 관리</div>
        </a>
    </div>
    
    <h2 style="margin-top: 40px;">최근 독후감</h2>
    
    <div class="filters">
        <label for="group-filter">그룹 필터:</label>
        <select id="group-filter" name="group-filter">
            <option value="">모든 그룹</option>
            <!-- 그룹 옵션은 자바스크립트로 동적으로 추가될 것입니다 -->
        </select>
    </div>
    <ul class="review-list">
        ${reviews.map(review => `
            <li class="review-item">
                <h2 class="review-title">
                    <a href="/review/${review.id}">${escapeHtml(review.title)}</a>
                </h2>
                <div class="review-meta">
                    ${escapeHtml(review.author)} · 
                    평점 ${review.rating}/5 · 
                    ${new Date(review.created_at).toLocaleDateString('ko-KR')}
                </div>
                <div class="review-text">${escapeHtml(review.review).substring(0, 200)}${review.review.length > 200 ? '...' : ''}</div>
            </li>
        `).join('')}
    </ul>
    <script>
        // 그룹 목록을 가져와서 필터 드롭다운에 추가
        async function loadGroups() {
            try {
                const response = await fetch('/groups');
                const groups = await response.json();
                const groupFilter = document.getElementById('group-filter');
                
                groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    groupFilter.appendChild(option);
                });
            } catch (error) {
                console.error('그룹을 불러오는 데 실패했습니다:', error);
            }
        }
        
        // 필터가 변경되었을 때 독후감 목록을 업데이트
        async function updateReviews() {
            const groupId = document.getElementById('group-filter').value;
            let reviews = [];
            
            if (groupId) {
                // 특정 그룹의 독후감만 가져오기
                const response = await fetch('/reviews/group/' + groupId);
                reviews = await response.json();
            } else {
                // 모든 독후감 가져오기
                const response = await fetch('/reviews');
                reviews = await response.json();
            }
            
            // 독후감 목록 업데이트
            const reviewList = document.querySelector('.review-list');
            let reviewHtml = '';
            reviews.forEach(function(review) {
                reviewHtml += '<li class="review-item">';
                reviewHtml += '<h2 class="review-title">';
                reviewHtml += '<a href="/review/' + review.id + '">' + escapeHtml(review.title) + '</a>';
                reviewHtml += '</h2>';
                reviewHtml += '<div class="review-meta">';
                reviewHtml += escapeHtml(review.author) + ' · ';
                reviewHtml += '평점 ' + review.rating + '/5 · ';
                reviewHtml += new Date(review.created_at).toLocaleDateString('ko-KR');
                reviewHtml += '</div>';
                reviewHtml += '<div class="review-text">' + escapeHtml(review.review).substring(0, 200);
                if (review.review.length > 200) {
                    reviewHtml += '...';
                }
                reviewHtml += '</div>';
                reviewHtml += '</li>';
            });
            reviewList.innerHTML = reviewHtml;
        }
        
        // 페이지 로드 시 그룹 목록 로드
        document.addEventListener('DOMContentLoaded', async () => {
            await loadGroups();
            // 초기 독후감 목록 로드
            updateReviews();
            
            // 필터 변경 이벤트 리스너 추가
            document.getElementById('group-filter').addEventListener('change', updateReviews);
        });
    </script>
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
            font-weight: 300;
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
        .header-link {
            color: #333;
            text-decoration: underline;
            font-size: 14px;
            margin-left: 20px;
            transition: opacity 0.3s ease;
        }
        .header-link:hover {
            opacity: 0.6;
        }
        .book-info {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        h1 {
            font-size: 28px;
            margin-bottom: 8px;
            color: #222;
            font-weight: 400;
            line-height: 1.3;
        }
        .book-author {
            font-size: 18px;
            color: #666;
            font-weight: 300;
        }
        .review-info {
            display: flex;
            gap: 40px;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .rating-section, .date-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .rating-label, .date-label {
            font-size: 13px;
            color: #999;
            font-weight: 400;
        }
        .rating-value, .date-value {
            font-size: 16px;
            color: #333;
            font-weight: 300;
        }
        .review-content {
            font-size: 17px;
            line-height: 2;
            white-space: pre-wrap;
            padding: 0;
            margin: 0;
            font-weight: 300;
            color: #222;
        }
        .delete-btn {
            background: transparent;
            color: #dc3545;
            border: none;
            padding: 0;
            font-size: 14px;
            cursor: pointer;
            margin-top: 30px;
            margin-right: 20px;
            transition: opacity 0.3s ease;
            text-decoration: underline;
        }
        .delete-btn:hover {
            opacity: 0.6;
        }
        a {
            color: #333;
            text-decoration: underline;
        }
        a:hover {
            text-decoration: underline;
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="header-container">
        <a href="/" class="back-link">← 목록으로</a>
        <div>
            <a href="/profile" class="header-link">내 정보</a>
            <a href="/logout" class="header-link">로그아웃</a>
        </div>
    </div>
    
    <div class="book-info">
        <h1>${escapeHtml(review.title)}</h1>
        <div class="book-author">${escapeHtml(review.author)}</div>
    </div>
    
    <div class="review-info">
        <div class="rating-section">
            <span class="rating-label">평점</span>
            <span class="rating-value">${review.rating}/5</span>
        </div>
        <div class="date-section">
            <span class="date-label">작성일</span>
            <span class="date-value">${new Date(review.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
    </div>
    
    <div class="review-content">${escapeHtml(review.review)}</div>
    
    <button class="delete-btn" onclick="deleteReview()">삭제</button>
    <button class="edit-btn" onclick="location.href='/review/${review.id}/edit'" style="background: transparent; color: #007bff; border: none; padding: 0; cursor: pointer; transition: opacity 0.3s ease; text-decoration: underline;">수정</button>
    
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

// Render book registration page
async function renderBookRegistrationPage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>책 등록 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #222;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 400;
            font-size: 14px;
            color: #666;
        }
        input {
            width: 100%;
            padding: 8px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            background: transparent;
            font-weight: 300;
        }
        input:focus {
            outline: none;
            border-bottom: 1px solid rgba(0,0,0,0.3);
        }
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            margin-right: 20px;
            transition: opacity 0.3s ease;
            font-weight: 400;
            text-decoration: underline;
        }
        button:hover {
            opacity: 0.6;
        }
        .cancel-btn {
            color: #666;
        }
        .notice {
            background: transparent;
            padding: 15px 0;
            margin-bottom: 30px;
            font-size: 14px;
            color: #666;
            font-weight: 300;
        }
    </style>
</head>
<body>
    <h1>책 등록</h1>
    <div class="notice">
        <strong>공지:</strong> 등록된 책은 모든 사용자가 볼 수 있습니다.
    </div>
    <form method="POST" action="/books">
        <div class="form-group">
            <label for="title">책 제목</label>
            <input type="text" id="title" name="title" required>
        </div>
        <div class="form-group">
            <label for="author">저자</label>
            <input type="text" id="author" name="author" required>
        </div>
        <div class="form-group">
            <label for="isbn">ISBN (선택)</label>
            <input type="text" id="isbn" name="isbn" placeholder="예: 978-89-123-4567-8">
        </div>
        <div class="form-group">
            <label for="page_count">페이지 수 (선택)</label>
            <input type="number" id="page_count" name="page_count" min="1" placeholder="예: 320">
        </div>
        <div style="text-align: right;">
            <button type="button" class="cancel-btn" onclick="location.href='/'">취소</button>
            <button type="submit">등록</button>
        </div>
    </form>
</body>
</html>`;
}

// Render review writing page
async function renderReviewWritingPage(books, userGroups) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>독후감 작성 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #222;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 400;
            font-size: 14px;
            color: #666;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            font-family: inherit;
            background: transparent;
            font-weight: 300;
        }
        textarea {
            min-height: 200px;
            resize: vertical;
        }
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            margin-right: 20px;
            transition: opacity 0.3s ease;
            font-weight: 400;
            text-decoration: underline;
        }
        button:hover {
            opacity: 0.6;
        }
        .cancel-btn {
            color: #666;
        }
        .info-box {
            background: transparent;
            padding: 15px 0;
            margin-bottom: 30px;
            font-size: 14px;
            color: #666;
            font-weight: 300;
        }
    </style>
</head>
<body>
    <h1>독후감 작성</h1>
    <div class="info-box">
        그룹을 선택하지 않으면 개인 독후감으로 저장됩니다. 같은 책에 대해 각 그룹마다 하나의 독후감만 작성할 수 있습니다.
    </div>
    <form id="reviewForm" method="POST" action="/reviews">
        <div class="form-group">
            <label for="book_id">책 선택</label>
            <select id="book_id" name="book_id" required>
                <option value="">책을 선택하세요</option>
                ${books.map(book => `<option value="${book.id}">${escapeHtml(book.title)} - ${escapeHtml(book.author)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="group_id">그룹 선택 (선택사항)</label>
            <select id="group_id" name="group_id">
                <option value="">개인 독후감</option>
                ${userGroups.map(group => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="rating">평점</label>
            <select id="rating" name="rating" required>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
            </select>
        </div>
        <div class="form-group">
            <label for="review">감상</label>
            <textarea id="review" name="review" required placeholder="책을 읽고 느낀 점을 자유롭게 작성해주세요"></textarea>
        </div>
        <div style="text-align: right;">
            <button type="button" class="cancel-btn" onclick="location.href='/'">취소</button>
            <button type="submit">등록</button>
        </div>
    </form>
    
    <script>
        document.getElementById('reviewForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/reviews', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else if (response.status === 409) {
                    const data = await response.json();
                    alert(data.error);
                } else {
                    alert('독후감 등록에 실패했습니다.');
                }
            } catch (error) {
                alert('오류가 발생했습니다.');
            }
        });
    </script>
</body>
</html>`;
}

// Render user profile page
async function renderProfilePage(user, reviews, groups) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>내 정보 - 읽고 난 뒤</title>
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
            font-weight: 300;
        }
        h1, h2 {
            color: #222;
            font-weight: 400;
        }
        .profile-section {
            background: transparent;
            padding: 20px 0;
            margin-bottom: 40px;
        }
        .review-item, .group-item {
            padding: 20px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .review-item:last-child, .group-item:last-child {
            border-bottom: none;
        }
        .back-btn {
            display: inline-block;
            padding: 0;
            background: transparent;
            color: #333;
            text-decoration: underline;
            margin-bottom: 30px;
            font-size: 15px;
            transition: opacity 0.3s ease;
        }
        .back-btn:hover {
            opacity: 0.6;
        }
        .admin-badge {
            background: transparent;
            color: #666;
            padding: 0 0 0 10px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← 홈으로</a>
    
    <h1>내 정보</h1>
    
    <div class="profile-section">
        <h2>프로필</h2>
        <p><strong>사용자명:</strong> ${escapeHtml(user.username)}</p>
        <p><strong>가입일:</strong> ${new Date(user.created_at).toLocaleDateString('ko-KR')}</p>
    </div>
    
    <div class="profile-section">
        <h2>내가 쓴 독후감</h2>
        ${reviews.length === 0 ? '<p>작성한 독후감이 없습니다.</p>' : 
          reviews.map(review => `
            <div class="review-item">
                <h3><a href="/review/${review.id}">${escapeHtml(review.title)}</a></h3>
                <p>${escapeHtml(review.author)} · 평점 ${review.rating}/5 · ${new Date(review.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
          `).join('')
        }
    </div>
    
    <div class="profile-section">
        <h2>내가 속한 그룹</h2>
        ${groups.length === 0 ? '<p>가입한 그룹이 없습니다.</p>' : 
          groups.map(group => `
            <div class="group-item">
                <h3>${escapeHtml(group.name)}${group.is_admin ? '<span class="admin-badge">관리자</span>' : ''}</h3>
                <p>${escapeHtml(group.description || '설명이 없습니다.')}</p>
            </div>
          `).join('')
        }
    </div>
</body>
</html>`;
}

// Render groups page
async function renderGroupsPage(groups, userGroups, userId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>그룹 관리 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
            font-weight: 300;
        }
        h1 {
            font-size: 24px;
            font-weight: 400;
            margin-bottom: 30px;
        }
        h2 {
            font-size: 18px;
            font-weight: 400;
            margin-bottom: 20px;
        }
        .back-btn {
            display: inline-block;
            padding: 0;
            background: transparent;
            color: #333;
            text-decoration: underline;
            margin-bottom: 30px;
            font-size: 15px;
            transition: opacity 0.3s ease;
        }
        .back-btn:hover {
            opacity: 0.6;
        }
        .section {
            background: transparent;
            padding: 0;
            margin-bottom: 50px;
        }
        .group-item {
            padding: 20px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .group-item:last-child {
            border-bottom: none;
        }
        .admin-badge {
            background: transparent;
            color: #666;
            padding: 0 0 0 10px;
            font-size: 12px;
        }
        .action-buttons {
            display: flex;
            gap: 20px;
        }
        .join-btn, .leave-btn, .manage-btn {
            padding: 0;
            border: none;
            cursor: pointer;
            font-size: 14px;
            background: transparent;
            transition: opacity 0.3s ease;
            text-decoration: underline;
        }
        .join-btn {
            color: #333;
        }
        .leave-btn {
            color: #dc3545;
        }
        .manage-btn {
            color: #333;
        }
        .join-btn:hover, .leave-btn:hover, .manage-btn:hover {
            opacity: 0.6;
        }
        .create-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        label {
            font-weight: 600;
        }
        input, textarea {
            padding: 10px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            font-family: inherit;
            background: transparent;
            font-weight: 300;
        }
        input:focus, textarea:focus {
            outline: none;
            border-bottom: 1px solid rgba(0,0,0,0.3);
        }
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        .create-btn {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            align-self: flex-start;
            transition: opacity 0.3s ease;
            font-weight: 400;
            text-decoration: underline;
        }
        .create-btn:hover {
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← 홈으로</a>
    
    <h1>그룹 관리</h1>
    
    <div class="section">
        <h2>새 그룹 만들기</h2>
        <form class="create-form" method="POST" action="/groups">
            <div class="form-group">
                <label for="name">그룹 이름</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="description">그룹 설명</label>
                <textarea id="description" name="description" placeholder="그룹에 대한 간단한 설명을 입력하세요"></textarea>
            </div>
            <button type="submit" class="create-btn">그룹 만들기</button>
        </form>
    </div>
    
    <div class="section">
        <h2>내가 속한 그룹</h2>
        ${userGroups.length === 0 ? '<p>가입한 그룹이 없습니다.</p>' :
          userGroups.map(group => `
            <div class="group-item">
                <div>
                    <h3 style="margin: 0;">${escapeHtml(group.name)}${group.is_admin ? '<span class="admin-badge">관리자</span>' : ''}</h3>
                    <p style="margin: 5px 0; color: #666;">${escapeHtml(group.description || '설명이 없습니다.')}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #999;">멤버 ${group.member_count}명</p>
                </div>
                <div class="action-buttons">
                    <button class="join-btn" onclick="createInvite('${group.id}')">초대</button>
                    ${group.is_admin ? 
                      `<button class="manage-btn" onclick="location.href='/groups/${group.id}/manage'">관리</button>` : 
                      `<button class="leave-btn" onclick="leaveGroup('${group.id}')">탈퇴</button>`
                    }
                </div>
            </div>
          `).join('')
        }
    </div>
    
    <div class="section">
        <h2>모든 그룹</h2>
        ${groups.filter(g => !userGroups.find(ug => ug.id === g.id)).map(group => `
            <div class="group-item">
                <div>
                    <h3 style="margin: 0;">${escapeHtml(group.name)}</h3>
                    <p style="margin: 5px 0; color: #666;">${escapeHtml(group.description || '설명이 없습니다.')}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #999;">멤버 ${group.member_count}명</p>
                </div>
                <div class="action-buttons">
                    <button class="join-btn" onclick="joinGroup('${group.id}')">가입</button>
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        async function joinGroup(groupId) {
            const response = await fetch(\`/groups/\${groupId}/join\`, { method: 'POST' });
            if (response.ok) {
                location.reload();
            } else {
                alert('그룹 가입에 실패했습니다.');
            }
        }
        
        async function leaveGroup(groupId) {
            if (confirm('정말 이 그룹을 탈퇴하시겠습니까?')) {
                const response = await fetch(\`/groups/\${groupId}/leave\`, { method: 'POST' });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('그룹 탈퇴에 실패했습니다.');
                }
            }
        }
        
        async function createInvite(groupId) {
            const response = await fetch(\`/groups/\${groupId}/invite\`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                prompt('초대 링크가 생성되었습니다. 아래 링크를 복사하여 공유하세요:', data.url);
            } else {
                alert('초대 링크 생성에 실패했습니다.');
            }
        }
    </script>
</body>
</html>`;
}

// Render books list page
async function renderBooksListPage(books) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>책 목록 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
            font-weight: 300;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            font-weight: 400;
        }
        .back-btn {
            display: inline-block;
            padding: 0;
            background: transparent;
            color: #333;
            text-decoration: underline;
            margin-bottom: 30px;
            font-size: 15px;
            transition: opacity 0.3s ease;
        }
        .back-btn:hover {
            opacity: 0.6;
        }
        .search-box {
            margin-bottom: 40px;
        }
        .search-box input {
            width: 100%;
            max-width: 500px;
            padding: 10px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            background: transparent;
            font-weight: 300;
        }
        .search-box input:focus {
            outline: none;
            border-bottom: 1px solid rgba(0,0,0,0.3);
        }
        .books-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .book-card {
            background: transparent;
            padding: 30px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            transition: opacity 0.3s ease;
        }
        .book-card:last-child {
            border-bottom: none;
        }
        .book-card:hover {
            opacity: 0.8;
        }
        .book-title {
            font-size: 18px;
            font-weight: 400;
            margin-bottom: 8px;
            color: #333;
        }
        .book-author {
            color: #666;
            margin-bottom: 8px;
            font-size: 15px;
        }
        .book-meta {
            font-size: 14px;
            color: #999;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        .book-actions {
            display: flex;
            gap: 20px;
        }
        .btn {
            padding: 0;
            border: none;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            display: inline-block;
            background: transparent;
            transition: opacity 0.3s ease;
        }
        .btn-primary {
            color: #333;
        }
        .btn-primary:hover {
            opacity: 0.6;
        }
        .btn-secondary {
            color: #007bff;
        }
        .btn-secondary:hover {
            opacity: 0.6;
        }
        .add-book-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: transparent;
            color: #333;
            padding: 20px;
            text-decoration: underline;
            font-size: 24px;
            transition: opacity 0.3s ease;
            opacity: 0.8;
        }
        .add-book-btn:hover {
            opacity: 1;
        }
        .stats {
            margin-bottom: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← 홈으로</a>
    
    <h1>책 목록</h1>
    
    <div class="stats">
        총 ${books.length}권의 책이 등록되어 있습니다.
    </div>
    
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="제목, 저자, ISBN으로 검색..." onkeyup="filterBooks()">
    </div>
    
    <div class="books-grid" id="booksGrid">
        ${books.map(book => `
            <div class="book-card" data-title="${escapeHtml(book.title.toLowerCase())}" data-author="${escapeHtml(book.author.toLowerCase())}" data-isbn="${book.isbn ? escapeHtml(book.isbn.toLowerCase()) : ''}">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-author">${escapeHtml(book.author)}</div>
                <div class="book-meta">
                    ${book.isbn ? `ISBN: ${escapeHtml(book.isbn)}<br>` : ''}
                    ${book.page_count ? `${book.page_count}페이지<br>` : ''}
                    등록일: ${new Date(book.created_at).toLocaleDateString('ko-KR')}
                </div>
                <div class="book-actions">
                    <a href="/reviews/new?book_id=${book.id}" class="btn btn-primary">독후감 작성</a>
                    <a href="/books/${book.id}/edit" class="btn btn-secondary">수정</a>
                </div>
            </div>
        `).join('')}
    </div>
    
    <a href="/books/new" class="add-book-btn">책 등록</a>
    
    <script>
        function filterBooks() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const bookCards = document.querySelectorAll('.book-card');
            
            bookCards.forEach(card => {
                const title = card.dataset.title;
                const author = card.dataset.author;
                const isbn = card.dataset.isbn;
                
                if (title.includes(searchTerm) || author.includes(searchTerm) || isbn.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
}

// Render book edit page
async function renderBookEditPage(book) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>책 정보 수정 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #222;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 400;
            font-size: 14px;
            color: #666;
        }
        input {
            width: 100%;
            padding: 10px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            background: transparent;
            font-weight: 300;
        }
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            margin-right: 20px;
            transition: opacity 0.3s ease;
            font-weight: 400;
            text-decoration: underline;
        }
        button:hover {
            opacity: 0.6;
        }
        .cancel-btn {
            color: #666;
        }
        .delete-btn {
            background: transparent;
            color: #dc3545;
            float: right;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: opacity 0.3s ease;
            text-decoration: underline;
        }
        .delete-btn:hover {
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <h1>책 정보 수정</h1>
    <form method="POST" action="/books/${book.id}/edit">
        <div class="form-group">
            <label for="title">책 제목</label>
            <input type="text" id="title" name="title" value="${escapeHtml(book.title)}" required>
        </div>
        <div class="form-group">
            <label for="author">저자</label>
            <input type="text" id="author" name="author" value="${escapeHtml(book.author)}" required>
        </div>
        <div class="form-group">
            <label for="isbn">ISBN (선택)</label>
            <input type="text" id="isbn" name="isbn" value="${book.isbn ? escapeHtml(book.isbn) : ''}" placeholder="예: 978-89-123-4567-8">
        </div>
        <div class="form-group">
            <label for="page_count">페이지 수 (선택)</label>
            <input type="number" id="page_count" name="page_count" value="${book.page_count || ''}" min="1" placeholder="예: 320">
        </div>
        <button type="submit">수정</button>
        <button type="button" class="cancel-btn" onclick="location.href='/books'">취소</button>
        <button type="button" class="delete-btn" onclick="deleteBook()">삭제</button>
    </form>
    
    <script>
        async function deleteBook() {
            if (confirm('정말 이 책을 삭제하시겠습니까? 관련된 모든 독후감도 함께 삭제됩니다.')) {
                const response = await fetch('/books/${book.id}', { method: 'DELETE' });
                if (response.ok) {
                    window.location.href = '/books';
                } else {
                    alert('책 삭제에 실패했습니다.');
                }
            }
        }
    </script>
</body>
</html>`;
}

// Render review edit page
async function renderReviewEditPage(review, books) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>독후감 수정 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #222;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 400;
            font-size: 14px;
            color: #666;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px 0;
            border: none;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            font-size: 15px;
            font-family: inherit;
            background: transparent;
            font-weight: 300;
        }
        textarea {
            min-height: 200px;
            resize: vertical;
        }
        button {
            background: transparent;
            color: #333;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            margin-right: 20px;
            transition: opacity 0.3s ease;
            font-weight: 400;
            text-decoration: underline;
        }
        button:hover {
            opacity: 0.6;
        }
        .cancel-btn {
            color: #666;
        }
        .book-info {
            background: transparent;
            padding: 15px 0;
            margin-bottom: 30px;
            color: #666;
            font-size: 14px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
    </style>
</head>
<body>
    <h1>독후감 수정</h1>
    <div class="book-info">
        <strong>${escapeHtml(review.title)}</strong> - ${escapeHtml(review.author)}
        ${review.group_name ? `<br>그룹: ${escapeHtml(review.group_name)}` : ''}
    </div>
    <form method="POST" action="/review/${review.id}/edit">
        <div class="form-group">
            <label for="rating">평점</label>
            <select id="rating" name="rating" required>
                <option value="5" ${review.rating === 5 ? 'selected' : ''}>5</option>
                <option value="4" ${review.rating === 4 ? 'selected' : ''}>4</option>
                <option value="3" ${review.rating === 3 ? 'selected' : ''}>3</option>
                <option value="2" ${review.rating === 2 ? 'selected' : ''}>2</option>
                <option value="1" ${review.rating === 1 ? 'selected' : ''}>1</option>
            </select>
        </div>
        <div class="form-group">
            <label for="review">감상</label>
            <textarea id="review" name="review" required>${escapeHtml(review.review)}</textarea>
        </div>
        <button type="submit">수정</button>
        <button type="button" class="cancel-btn" onclick="location.href='/review/${review.id}'">취소</button>
    </form>
</body>
</html>`;
}

// Render group management page
async function renderGroupManagePage(group, members, currentUserId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(group.name)} 관리 - 읽고 난 뒤</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400&display=swap');
        
        body {
            font-family: 'Noto Serif KR', serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fafafa;
            color: #333;
            font-weight: 300;
        }
        h1 {
            font-size: 24px;
            font-weight: 400;
            margin-bottom: 10px;
        }
        .group-desc {
            color: #666;
            margin-bottom: 40px;
        }
        .back-btn {
            display: inline-block;
            padding: 0;
            background: transparent;
            color: #333;
            text-decoration: underline;
            margin-bottom: 30px;
            font-size: 15px;
            transition: opacity 0.3s ease;
        }
        .back-btn:hover {
            opacity: 0.6;
        }
        .section {
            margin-bottom: 50px;
        }
        h2 {
            font-size: 18px;
            font-weight: 400;
            margin-bottom: 20px;
        }
        .member-list {
            list-style: none;
            padding: 0;
        }
        .member-item {
            padding: 20px 0;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .member-info {
            flex: 1;
        }
        .member-name {
            font-size: 16px;
            margin-bottom: 4px;
        }
        .member-meta {
            font-size: 14px;
            color: #666;
        }
        .admin-badge {
            background: transparent;
            color: #666;
            padding: 0 0 0 10px;
            font-size: 12px;
        }
        .member-actions {
            display: flex;
            gap: 20px;
        }
        .remove-btn, .make-admin-btn {
            padding: 0;
            border: none;
            cursor: pointer;
            font-size: 14px;
            background: transparent;
            transition: opacity 0.3s ease;
            text-decoration: underline;
        }
        .remove-btn {
            color: #dc3545;
        }
        .make-admin-btn {
            color: #007bff;
        }
        .remove-btn:hover, .make-admin-btn:hover {
            opacity: 0.6;
        }
        .delete-group-btn {
            background: transparent;
            color: #dc3545;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 15px;
            transition: opacity 0.3s ease;
            text-decoration: underline;
        }
        .delete-group-btn:hover {
            opacity: 0.6;
        }
        .info {
            background: transparent;
            padding: 15px 0;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <a href="/groups" class="back-btn">← 그룹 목록으로</a>
    
    <h1>${escapeHtml(group.name)} 관리</h1>
    ${group.description ? `<p class="group-desc">${escapeHtml(group.description)}</p>` : ''}
    
    <div class="section">
        <h2>멤버 관리</h2>
        <div class="info">
            현재 ${members.length}명의 멤버가 있습니다.
        </div>
        <ul class="member-list">
            ${members.map(member => `
                <li class="member-item">
                    <div class="member-info">
                        <div class="member-name">
                            ${escapeHtml(member.username)}
                            ${member.is_admin ? '<span class="admin-badge">관리자</span>' : ''}
                        </div>
                        <div class="member-meta">
                            ${new Date(member.joined_at).toLocaleDateString('ko-KR')} 가입
                        </div>
                    </div>
                    ${member.id !== currentUserId ? `
                        <div class="member-actions">
                            ${!member.is_admin ? `
                                <button class="make-admin-btn" onclick="makeAdmin('${member.id}')">관리자 지정</button>
                            ` : ''}
                            <button class="remove-btn" onclick="removeMember('${member.id}')">강퇴</button>
                        </div>
                    ` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>그룹 삭제</h2>
        <div class="info">
            모든 멤버가 탈퇴하면 그룹이 자동으로 삭제됩니다.
        </div>
        ${members.length > 1 ? `
            <p>멤버가 남아있어 그룹을 삭제할 수 없습니다.</p>
        ` : `
            <button class="delete-group-btn" onclick="deleteGroup()">그룹 삭제</button>
        `}
    </div>
    
    <script>
        async function removeMember(userId) {
            if (confirm('정말 이 멤버를 강퇴시키시겠습니까?')) {
                const response = await fetch('/groups/${group.id}/members/' + userId, { method: 'DELETE' });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('강퇴에 실패했습니다.');
                }
            }
        }
        
        async function makeAdmin(userId) {
            if (confirm('이 멤버를 관리자로 지정하시겠습니까?')) {
                const response = await fetch('/groups/${group.id}/admins', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('관리자 지정에 실패했습니다.');
                }
            }
        }
        
        async function deleteGroup() {
            if (confirm('정말 이 그룹을 삭제하시겠습니까? 모든 독후감과 데이터가 삭제됩니다.')) {
                const response = await fetch('/groups/${group.id}', { method: 'DELETE' });
                if (response.ok) {
                    window.location.href = '/groups';
                } else {
                    alert('그룹 삭제에 실패했습니다.');
                }
            }
        }
    </script>
</body>
</html>`;
}

// Render signup page
async function renderSignupPage(inviteCode, inviteType, invitation, error = null) {
  const isGroupInvite = inviteType === 'group';
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입 - 읽고 난 뒤</title>
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
        .signup-container {
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #222;
            text-align: center;
        }
        
        .invite-info {
            background: transparent;
            padding: 15px 0;
            margin-bottom: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        
        .invite-info strong {
            color: #333;
            font-weight: 400;
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
            text-decoration: underline;
        }
        
        button:hover {
            background: #f0f0f0;
        }
        
        .error {
            color: #dc3545;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        script {
            display: none;
        }
    </style>
    <script>
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    </script>
</head>
<body>
    <div class="signup-container">
        <h1>회원가입</h1>
        
        ${invitation ? `
            <div class="invite-info">
                ${isGroupInvite ? 
                    `<strong>${escapeHtml(invitation.group_name)}</strong> 그룹에 초대되었습니다.` :
                    `<strong>읽고 난 뒤</strong>에 초대되었습니다.`
                }
            </div>
        ` : ''}
        
        ${error ? `<div class="error">${error}</div>` : ''}
        
        <form method="POST" action="/signup">
            <input type="hidden" name="invite_code" value="${inviteCode}">
            <input type="hidden" name="invite_type" value="${inviteType}">
            
            <div class="form-group">
                <label for="username">아이디</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input type="password" id="password" name="password" required>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    6~50자, 숫자와 문자 포함 필수
                </div>
            </div>
            <div class="form-group">
                <label for="password_confirm">비밀번호 확인</label>
                <input type="password" id="password_confirm" name="password_confirm" required>
            </div>
            <button type="submit">가입하기</button>
        </form>
    </div>
</body>
</html>`;
}

export { renderLoginPage, renderHomePage, renderReviewPage, escapeHtml, renderBookRegistrationPage, renderReviewWritingPage, renderProfilePage, renderGroupsPage, renderBooksListPage, renderBookEditPage, renderReviewEditPage, renderGroupManagePage, renderSignupPage };
