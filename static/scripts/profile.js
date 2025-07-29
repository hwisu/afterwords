// Profile page scripts

document.addEventListener('DOMContentLoaded', async () => {
    // Load user profile data
    await loadUserProfile();
    await loadUserReviews();
    await loadUserGroups();
    
    // Check for flash message in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        showFlashMessage(decodeURIComponent(message));
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to fetch user profile');
        }
        
        const user = await response.json();
        document.getElementById('username').textContent = user.username;
        document.getElementById('createdAt').textContent = new Date(user.created_at).toLocaleDateString('ko-KR');
    } catch (error) {
        console.error('프로필을 불러오는 데 실패했습니다:', error);
        showFlashMessage('프로필을 불러오는 데 실패했습니다.');
    }
}

async function loadUserReviews() {
    try {
        const response = await fetch('/api/me/reviews');
        if (!response.ok) throw new Error('Failed to fetch user reviews');
        
        const reviews = await response.json();
        const reviewsContainer = document.getElementById('userReviews');
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="empty-message">아직 작성한 독후감이 없습니다.</p>';
            return;
        }
        
        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="card">
                <h3 class="card-title">
                    <a href="/review/${review.id}">${escapeHtml(review.title)}</a>
                </h3>
                <div class="card-subtitle">${escapeHtml(review.author)}</div>
                <div class="card-meta">
                    평점 ${review.rating}/5 · 
                    ${new Date(review.created_at).toLocaleDateString('ko-KR')}
                    ${review.group_name ? ` · ${escapeHtml(review.group_name)}` : ''}
                </div>
                <div class="card-actions">
                    <a href="/review/${review.id}/edit" class="btn btn-secondary">수정</a>
                    <button onclick="deleteReview('${review.id}')" class="btn btn-danger">삭제</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('독후감을 불러오는 데 실패했습니다:', error);
        document.getElementById('userReviews').innerHTML = '<p class="error">독후감을 불러오는 데 실패했습니다.</p>';
    }
}

async function loadUserGroups() {
    try {
        const response = await fetch('/api/me/groups');
        if (!response.ok) throw new Error('Failed to fetch user groups');
        
        const groups = await response.json();
        const groupsContainer = document.getElementById('userGroups');
        
        if (groups.length === 0) {
            groupsContainer.innerHTML = '<p class="empty-message">참여 중인 모임이 없습니다.</p>';
            return;
        }
        
        groupsContainer.innerHTML = groups.map(group => `
            <div class="card">
                <h3 class="card-title">
                    <a href="/groups/${group.id}">${escapeHtml(group.name)}</a>
                </h3>
                <div class="card-meta">
                    ${group.member_count}명 참여 · 
                    가입일 ${new Date(group.joined_at).toLocaleDateString('ko-KR')}
                    ${group.is_admin ? ' · 관리자' : ''}
                </div>
                <div class="card-actions">
                    ${group.is_admin ? `<a href="/groups/${group.id}/manage" class="btn btn-secondary">관리</a>` : ''}
                    <button onclick="leaveGroup('${group.id}')" class="btn btn-danger">탈퇴</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('모임을 불러오는 데 실패했습니다:', error);
        document.getElementById('userGroups').innerHTML = '<p class="error">모임을 불러오는 데 실패했습니다.</p>';
    }
}

async function deleteReview(reviewId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/review/${reviewId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showFlashMessage('독후감이 삭제되었습니다.');
            await loadUserReviews();
        } else {
            throw new Error('Failed to delete review');
        }
    } catch (error) {
        console.error('독후감 삭제 실패:', error);
        showFlashMessage('독후감 삭제에 실패했습니다.');
    }
}

async function leaveGroup(groupId) {
    if (!confirm('정말 모임에서 탈퇴하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/groups/${groupId}/leave`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showFlashMessage('모임에서 탈퇴했습니다.');
            await loadUserGroups();
        } else {
            throw new Error('Failed to leave group');
        }
    } catch (error) {
        console.error('모임 탈퇴 실패:', error);
        showFlashMessage('모임 탈퇴에 실패했습니다.');
    }
}