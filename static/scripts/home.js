// Home page scripts

document.addEventListener('DOMContentLoaded', async () => {
    // Load page with fade-in effect
    document.fonts.ready.then(() => {
        document.querySelector('.page-content').classList.add('loaded');
    });
    
    setTimeout(() => {
        document.querySelector('.page-content').classList.add('loaded');
    }, 1000);
    
    // Load groups and reviews
    await loadGroups();
    await updateReviews();
    
    // Add event listener for group filter
    document.getElementById('group-filter').addEventListener('change', updateReviews);
    
    // Check for flash message in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        showFlashMessage(decodeURIComponent(message));
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

async function loadGroups() {
    try {
        const response = await fetch('/api/groups');
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const groups = await response.json();
        const groupFilter = document.getElementById('group-filter');
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            groupFilter.appendChild(option);
        });
    } catch (error) {
        console.error('모임을 불러오는 데 실패했습니다:', error);
    }
}

async function updateReviews() {
    try {
        const groupId = document.getElementById('group-filter').value;
        let url = '/api/reviews';
        if (groupId) {
            url = `/api/reviews?group_id=${groupId}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        
        const reviews = await response.json();
        renderReviews(reviews);
    } catch (error) {
        console.error('독후감을 불러오는 데 실패했습니다:', error);
        showFlashMessage('독후감을 불러오는 데 실패했습니다.');
    }
}

function renderReviews(reviews) {
    const reviewList = document.getElementById('reviewList');
    
    if (reviews.length === 0) {
        reviewList.innerHTML = '<li class="review-item">아직 작성된 독후감이 없습니다.</li>';
        return;
    }
    
    reviewList.innerHTML = reviews.map(review => `
        <li class="review-item">
            <h2 class="review-title">
                <a href="/review/${review.id}">${escapeHtml(review.title)}</a>
            </h2>
            <div class="review-meta">
                ${escapeHtml(review.author)} · 
                평점 ${review.rating}/5 · 
                ${new Date(review.created_at).toLocaleDateString('ko-KR')}
                ${review.group_name ? ` · ${escapeHtml(review.group_name)}` : ''}
            </div>
            <div class="review-text">${escapeHtml(review.review).substring(0, 200)}${review.review.length > 200 ? '...' : ''}</div>
        </li>
    `).join('');
}