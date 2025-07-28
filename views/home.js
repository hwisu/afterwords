// Home page view
import { renderPageLayout, renderHeader, escapeHtml } from './common.js';

/**
 * @param {import('../types/database').Review[]} reviews 
 * @returns {Promise<string>}
 */
export async function renderHomePage(reviews) {
  const styles = `
    body {
        max-width: 800px;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    body.loaded {
        opacity: 1;
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
    
    .filters {
        margin-bottom: 30px;
    }
    
    .filters label {
        display: inline-block;
        margin-right: 10px;
    }
    
    .filters select {
        width: auto;
        padding: 5px 10px;
    }
  `;
  
  const content = `
    ${renderHeader()}
    
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
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
        
        async function loadGroups() {
            try {
                const response = await fetch('/api/groups');
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
        
        async function updateReviews() {
            const groupId = document.getElementById('group-filter').value;
            let reviews = [];
            
            if (groupId) {
                const response = await fetch('/reviews/group/' + groupId);
                reviews = await response.json();
            } else {
                const response = await fetch('/reviews');
                reviews = await response.json();
            }
            
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
        
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }
        
        document.addEventListener('DOMContentLoaded', async () => {
            await loadGroups();
            updateReviews();
            
            document.getElementById('group-filter').addEventListener('change', updateReviews);
        });
    </script>
  `;
  
  return renderPageLayout('읽고 난 뒤', content, styles);
}