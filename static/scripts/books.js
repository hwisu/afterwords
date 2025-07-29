// Books page scripts

let allBooks = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBooks();
    
    // Setup search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        filterBooks(e.target.value);
    });
    
    // Check for flash message in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        showFlashMessage(decodeURIComponent(message));
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        
        allBooks = await response.json();
        displayBooks(allBooks);
    } catch (error) {
        console.error('책 목록을 불러오는 데 실패했습니다:', error);
        document.getElementById('booksList').innerHTML = `
            <div class="empty-state">
                <p class="error">책 목록을 불러오는 데 실패했습니다.</p>
            </div>
        `;
    }
}

function displayBooks(books) {
    const booksContainer = document.getElementById('booksList');
    
    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="empty-state">
                <h2>아직 등록된 책이 없습니다</h2>
                <p>첫 번째 책을 등록해보세요!</p>
                <a href="/books/new" class="btn btn-primary">새 책 등록</a>
            </div>
        `;
        return;
    }
    
    booksContainer.innerHTML = books.map(book => `
        <div class="book-card">
            <h2 class="book-title">
                <a href="/books/${book.id}">${escapeHtml(book.title)}</a>
            </h2>
            <div class="book-author">${escapeHtml(book.author)}</div>
            <div class="book-meta">
                <span class="meta-item">ISBN: ${escapeHtml(book.isbn || '없음')}</span>
                <span class="meta-item">독후감 ${book.review_count || 0}개</span>
            </div>
            <div class="book-actions">
                <a href="/reviews/new?book_id=${book.id}" class="btn btn-primary">독후감 쓰기</a>
                ${book.can_edit ? `
                    <a href="/books/${book.id}/edit" class="btn btn-secondary">수정</a>
                    <button onclick="deleteBook('${book.id}')" class="btn btn-danger">삭제</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterBooks(searchTerm) {
    const filtered = allBooks.filter(book => {
        const term = searchTerm.toLowerCase();
        return book.title.toLowerCase().includes(term) || 
               book.author.toLowerCase().includes(term) ||
               (book.isbn && book.isbn.includes(term));
    });
    displayBooks(filtered);
}

async function deleteBook(bookId) {
    if (!confirm('정말 이 책을 삭제하시겠습니까? 관련된 모든 독후감도 함께 삭제됩니다.')) return;
    
    try {
        const response = await fetch(`/api/books/${bookId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showFlashMessage('책이 삭제되었습니다.');
            await loadBooks();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete book');
        }
    } catch (error) {
        console.error('책 삭제 실패:', error);
        showFlashMessage(error.message || '책 삭제에 실패했습니다.');
    }
}