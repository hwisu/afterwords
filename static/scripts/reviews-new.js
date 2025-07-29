// Review writing page scripts

document.addEventListener('DOMContentLoaded', async () => {
    await loadBooks();
    await loadGroups();
    
    // Setup form submission
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', handleSubmit);
    
    // Check for pre-selected book
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('book_id');
    if (bookId) {
        document.getElementById('book_id').value = bookId;
    }
});

async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        
        const books = await response.json();
        const selectElement = document.getElementById('book_id');
        
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title} - ${book.author}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('책 목록을 불러오는 데 실패했습니다:', error);
        showFlashMessage('책 목록을 불러오는 데 실패했습니다.');
    }
}

async function loadGroups() {
    try {
        const response = await fetch('/api/me/groups');
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const groups = await response.json();
        const selectElement = document.getElementById('group_id');
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('모임 목록을 불러오는 데 실패했습니다:', error);
        // Not critical, user can still write personal review
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = data.redirect || '/?message=' + encodeURIComponent('독후감이 등록되었습니다.');
        } else {
            showFlashMessage(data.error || '독후감 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('독후감 등록 실패:', error);
        showFlashMessage('독후감 등록에 실패했습니다.');
    }
}