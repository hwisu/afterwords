// Groups page scripts

document.addEventListener('DOMContentLoaded', async () => {
    await loadGroups();
    
    // Setup create group form
    const form = document.getElementById('newGroupForm');
    form.addEventListener('submit', handleCreateGroup);
    
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
        displayGroups(groups);
    } catch (error) {
        console.error('모임 목록을 불러오는 데 실패했습니다:', error);
        document.getElementById('groupsList').innerHTML = `
            <div class="empty-state">
                <p class="error">모임 목록을 불러오는 데 실패했습니다.</p>
            </div>
        `;
    }
}

function displayGroups(groups) {
    const groupsContainer = document.getElementById('groupsList');
    
    if (groups.length === 0) {
        groupsContainer.innerHTML = `
            <div class="empty-state">
                <h2>아직 모임이 없습니다</h2>
                <p>첫 번째 모임을 만들어보세요!</p>
            </div>
        `;
        return;
    }
    
    groupsContainer.innerHTML = groups.map(group => `
        <div class="group-card">
            <div class="group-header">
                <div>
                    <h2 class="group-title">
                        ${escapeHtml(group.name)}
                        ${group.is_member ? '<span class="member-badge">참여중</span>' : ''}
                        ${group.is_admin ? '<span class="member-badge admin-badge">관리자</span>' : ''}
                    </h2>
                    ${group.description ? `<p class="group-description">${escapeHtml(group.description)}</p>` : ''}
                    <div class="group-meta">
                        <span class="meta-item">참여자 ${group.member_count}명</span>
                        <span class="meta-item">독후감 ${group.review_count || 0}개</span>
                        <span class="meta-item">생성일 ${new Date(group.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                </div>
            </div>
            <div class="group-actions">
                ${group.is_member ? `
                    <a href="/groups/${group.id}/meetings" class="btn btn-primary">모임 일정</a>
                    ${group.is_admin ? `
                        <a href="/groups/${group.id}/manage" class="btn btn-secondary">관리</a>
                        <button onclick="createInvite('${group.id}')" class="btn btn-secondary">초대링크 생성</button>
                    ` : ''}
                    <button onclick="leaveGroup('${group.id}')" class="btn btn-danger">탈퇴</button>
                ` : `
                    <button onclick="joinGroup('${group.id}')" class="btn btn-primary">참여하기</button>
                `}
            </div>
        </div>
    `).join('');
}

function showCreateGroupForm() {
    document.getElementById('createGroupForm').style.display = 'block';
    document.getElementById('groupName').focus();
}

function hideCreateGroupForm() {
    document.getElementById('createGroupForm').style.display = 'none';
    document.getElementById('newGroupForm').reset();
}

async function handleCreateGroup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/groups', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showFlashMessage('모임이 생성되었습니다.');
            hideCreateGroupForm();
            await loadGroups();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create group');
        }
    } catch (error) {
        console.error('모임 생성 실패:', error);
        showFlashMessage(error.message || '모임 생성에 실패했습니다.');
    }
}

async function joinGroup(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showFlashMessage('모임에 참여했습니다.');
            await loadGroups();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to join group');
        }
    } catch (error) {
        console.error('모임 참여 실패:', error);
        showFlashMessage(error.message || '모임 참여에 실패했습니다.');
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
            await loadGroups();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to leave group');
        }
    } catch (error) {
        console.error('모임 탈퇴 실패:', error);
        showFlashMessage(error.message || '모임 탈퇴에 실패했습니다.');
    }
}

async function createInvite(groupId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/invite`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            const inviteUrl = `${window.location.origin}/invite/${data.code}`;
            
            // Copy to clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(inviteUrl);
                showFlashMessage('초대 링크가 클립보드에 복사되었습니다.');
            } else {
                prompt('초대 링크:', inviteUrl);
            }
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create invite');
        }
    } catch (error) {
        console.error('초대 링크 생성 실패:', error);
        showFlashMessage(error.message || '초대 링크 생성에 실패했습니다.');
    }
}