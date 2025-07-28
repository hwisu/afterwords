// Book related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @returns {Promise<string>}
 */
export async function renderBookRegistrationPage() {
  const styles = `
    body {
        max-width: 600px;
    }
    
    .notice {
        background: transparent;
        padding: 15px 0;
        margin-bottom: 30px;
        font-size: 14px;
        color: #666;
        font-weight: 300;
    }
    
    .cancel-btn {
        color: #666;
    }
  `;
  
  const content = `
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
  `;
  
  return renderPageLayout('책 등록', content, styles);
}

/**
 * @param {import('../types/database').Book[]} books 
 * @returns {Promise<string>}
 */
export async function renderBooksListPage(books) {
  const styles = `
    body {
        max-width: 800px;
        font-weight: 300;
    }
    
    .search-box {
        margin-bottom: 40px;
    }
    
    .search-box input {
        max-width: 500px;
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
    
    .btn-secondary {
        color: #007bff;
    }
    
    .btn:hover {
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
  `;
  
  const content = `
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
  `;
  
  return renderPageLayout('책 목록', content, styles);
}

/**
 * @param {import('../types/database').Book} book 
 * @returns {Promise<string>}
 */
export async function renderBookEditPage(book) {
  const styles = `
    body {
        max-width: 600px;
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
  `;
  
  const content = `
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
        <div style="text-align: right;">
            <button type="button" class="cancel-btn" onclick="location.href='/books'">취소</button>
            <button type="submit">수정</button>
        </div>
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
  `;
  
  return renderPageLayout('책 정보 수정', content, styles);
}