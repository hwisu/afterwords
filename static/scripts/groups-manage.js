// Groups management page scripts

let groupId;
let groupData;

document.addEventListener('DOMContentLoaded', async () => {
    // Get group ID from URL
    const pathParts = window.location.pathname.split('/');
    groupId = pathParts[2];
    
    if (!groupId) {
        window.location.href = '/groups';
        return;
    }
    
    await loadGroupData();
    await loadMembers();
});

async function loadGroupData() {
    try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) {
            if (response.status === 404) {
                showFlashMessage('모임을 찾을 수 없습니다.');
                setTimeout(() => window.location.href = '/groups', 2000);
                return;
            }
            throw new Error('Failed to fetch group');
        }
        
        groupData = await response.json();
        displayGroupInfo();
    } catch (error) {
        console.error('모임 정보를 불러오는 데 실패했습니다:', error);
        showFlashMessage('모임 정보를 불러오는 데 실패했습니다.');
    }
}

function displayGroupInfo() {
    const groupInfoDiv = document.getElementById('groupInfo');
    groupInfoDiv.innerHTML = `
        <h2>${escapeHtml(groupData.name)}</h2>
        ${groupData.description ? `<p>${escapeHtml(groupData.description)}</p>` : ''}
        <p>참여자 ${groupData.member_count || 0}명 · 생성일 ${new Date(groupData.created_at).toLocaleDateString('ko-KR')}</p>
    `;
}

async function loadMembers() {
    try {
        const response = await fetch(`/api/groups/${groupId}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        
        const members = await response.json();
        displayMembers(members);
    } catch (error) {
        console.error('참여자 목록을 불러오는 데 실패했습니다:', error);
        document.getElementById('membersList').innerHTML = '<p class="error">참여자 목록을 불러오는 데 실패했습니다.</p>';
    }
}

function displayMembers(members) {
    const membersDiv = document.getElementById('membersList');
    
    if (members.length === 0) {
        membersDiv.innerHTML = '<p>참여자가 없습니다.</p>';
        return;
    }
    
    membersDiv.innerHTML = members.map(member => `
        <div class="member-item">
            <div class="member-info">
                <div class="member-name">
                    ${escapeHtml(member.username)}
                    ${member.is_admin ? '<span class="admin-badge">관리자</span>' : ''}
                </div>
                <div class="member-meta">
                    가입일 ${new Date(member.joined_at).toLocaleDateString('ko-KR')}
                </div>
            </div>
            <div class="member-actions">
                ${!member.is_admin ? `
                    <button onclick="makeAdmin('${member.user_id}')" class="btn btn-secondary">관리자 지정</button>
                    <button onclick="removeMember('${member.user_id}')" class="btn btn-danger">내보내기</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function createInvite() {
    try {
        const response = await fetch(`/api/groups/${groupId}/invite`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            const inviteUrl = `${window.location.origin}/invite/${data.code}`;
            
            document.getElementById('inviteLink').style.display = 'block';
            document.getElementById('inviteLinkInput').value = inviteUrl;
            
            showFlashMessage('초대 링크가 생성되었습니다.');
        } else {
            throw new Error('Failed to create invite');
        }
    } catch (error) {
        console.error('초대 링크 생성 실패:', error);
        showFlashMessage('초대 링크 생성에 실패했습니다.');
    }
}

function copyInviteLink() {
    const input = document.getElementById('inviteLinkInput');
    input.select();
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(input.value)
            .then(() => showFlashMessage('링크가 복사되었습니다.'))
            .catch(() => showFlashMessage('복사에 실패했습니다.'));
    } else {
        document.execCommand('copy');
        showFlashMessage('링크가 복사되었습니다.');
    }
}

async function makeAdmin(userId) {
    if (!confirm('이 사용자를 관리자로 지정하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/groups/${groupId}/admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        
        if (response.ok) {
            showFlashMessage('관리자로 지정되었습니다.');
            await loadMembers();
        } else {
            throw new Error('Failed to make admin');
        }
    } catch (error) {
        console.error('관리자 지정 실패:', error);
        showFlashMessage('관리자 지정에 실패했습니다.');
    }
}

async function removeMember(userId) {
    if (!confirm('정말 이 참여자를 내보내시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showFlashMessage('참여자를 내보냈습니다.');
            await loadMembers();
        } else {
            throw new Error('Failed to remove member');
        }
    } catch (error) {
        console.error('참여자 내보내기 실패:', error);
        showFlashMessage('참여자 내보내기에 실패했습니다.');
    }
}

async function deleteGroup() {
    if (!confirm('정말 이 모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('모임과 관련된 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/groups/${groupId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showFlashMessage('모임이 삭제되었습니다.');
            setTimeout(() => window.location.href = '/groups', 2000);
        } else {
            throw new Error('Failed to delete group');
        }
    } catch (error) {
        console.error('모임 삭제 실패:', error);
        showFlashMessage('모임 삭제에 실패했습니다.');
    }
}