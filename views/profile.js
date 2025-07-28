// Profile related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @param {import('../types/database').User} user 
 * @param {Array<import('../types/database').Review & {title: string, author: string}>} reviews 
 * @param {Array<import('../types/database').Group & {is_admin: boolean}>} groups 
 * @returns {Promise<string>}
 */
export async function renderProfilePage(user, reviews, groups) {
  const styles = `
    body {
        max-width: 800px;
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
    
    .admin-badge {
        background: transparent;
        color: #666;
        padding: 0 0 0 10px;
        font-size: 12px;
    }
  `;
  
  const content = `
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
  `;
  
  return renderPageLayout('내 정보', content, styles);
}