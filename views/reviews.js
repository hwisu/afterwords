// Review related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @param {import('../types/database').Review & {title: string, author: string, username: string}} review 
 * @returns {Promise<string>}
 */
export async function renderReviewPage(review) {
  const styles = `
    body {
        max-width: 700px;
        font-weight: 300;
    }
    
    .book-info {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    
    h1 {
        font-size: 28px;
        margin-bottom: 8px;
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
  `;
  
  const content = `
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
  `;
  
  return renderPageLayout(`${review.title}`, content, styles);
}

/**
 * @param {import('../types/database').Review & {title: string, author: string, group_name?: string}} review 
 * @returns {Promise<string>}
 */
export async function renderReviewEditPage(review) {
  const styles = `
    body {
        max-width: 600px;
    }
    
    .book-info {
        background: transparent;
        padding: 15px 0;
        margin-bottom: 30px;
        color: #666;
        font-size: 14px;
        border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    
    textarea {
        min-height: 200px;
        resize: vertical;
    }
    
    .cancel-btn {
        color: #666;
    }
  `;
  
  const content = `
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
        <div style="text-align: right;">
            <button type="button" class="cancel-btn" onclick="location.href='/review/${review.id}'">취소</button>
            <button type="submit">수정</button>
        </div>
    </form>
  `;
  
  return renderPageLayout('독후감 수정', content, styles);
}

/**
 * @param {import('../types/database').Book[]} books 
 * @param {import('../types/database').Group[]} userGroups 
 * @returns {Promise<string>}
 */
export async function renderReviewWritingPage(books, userGroups) {
  const styles = `
    body {
        max-width: 600px;
    }
    
    .info-box {
        background: transparent;
        padding: 15px 0;
        margin-bottom: 30px;
        font-size: 14px;
        color: #666;
        font-weight: 300;
    }
    
    textarea {
        min-height: 200px;
        resize: vertical;
    }
    
    .cancel-btn {
        color: #666;
    }
  `;
  
  const content = `
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
  `;
  
  return renderPageLayout('독후감 작성', content, styles);
}