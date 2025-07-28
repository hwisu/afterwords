// Group related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @param {import('../types/database').Group[]} groups 
 * @param {Array<import('../types/database').Group & {member_count: number, is_admin: boolean}>} userGroups 
 * @param {string} userId 
 * @returns {Promise<string>}
 */
export async function renderGroupsPage(groups, userGroups, userId) {
  const styles = `
    body {
        max-width: 800px;
        font-weight: 300;
    }
    
    .section {
        background: transparent;
        padding: 0;
        margin-bottom: 50px;
    }
    
    .group-item {
        padding: 20px 0;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .group-item:last-child {
        border-bottom: none;
    }
    
    .admin-badge {
        background: transparent;
        color: #666;
        padding: 0 0 0 10px;
        font-size: 12px;
    }
    
    .action-buttons {
        display: flex;
        gap: 20px;
    }
    
    .join-btn, .leave-btn, .manage-btn {
        padding: 0;
        border: none;
        cursor: pointer;
        font-size: 14px;
        background: transparent;
        transition: opacity 0.3s ease;
        text-decoration: underline;
    }
    
    .join-btn {
        color: #333;
    }
    
    .leave-btn {
        color: #dc3545;
    }
    
    .manage-btn {
        color: #333;
    }
    
    .join-btn:hover, .leave-btn:hover, .manage-btn:hover {
        opacity: 0.6;
    }
    
    .create-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .create-btn {
        background: transparent;
        color: #333;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        font-size: 15px;
        align-self: flex-start;
        transition: opacity 0.3s ease;
        font-weight: 400;
        text-decoration: underline;
    }
    
    .create-btn:hover {
        opacity: 0.6;
    }
    
    textarea {
        min-height: 100px;
        resize: vertical;
    }
  `;
  
  const content = `
    <a href="/" class="back-btn">← 홈으로</a>
    
    <h1>그룹 관리</h1>
    
    <div class="section">
        <h2>새 그룹 만들기</h2>
        <form class="create-form" method="POST" action="/groups">
            <div class="form-group">
                <label for="name">그룹 이름</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="description">그룹 설명</label>
                <textarea id="description" name="description" placeholder="그룹에 대한 간단한 설명을 입력하세요"></textarea>
            </div>
            <button type="submit" class="create-btn">그룹 만들기</button>
        </form>
    </div>
    
    <div class="section">
        <h2>내가 속한 그룹</h2>
        ${userGroups.length === 0 ? '<p>가입한 그룹이 없습니다.</p>' :
          userGroups.map(group => `
            <div class="group-item">
                <div>
                    <h3 style="margin: 0;">${escapeHtml(group.name)}${group.is_admin ? '<span class="admin-badge">관리자</span>' : ''}</h3>
                    <p style="margin: 5px 0; color: #666;">${escapeHtml(group.description || '설명이 없습니다.')}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #999;">멤버 ${group.member_count}명</p>
                </div>
                <div class="action-buttons">
                    <button class="join-btn" onclick="createInvite('${group.id}')">초대</button>
                    ${group.is_admin ? 
                      `<button class="manage-btn" onclick="location.href='/groups/${group.id}/manage'">관리</button>` : 
                      `<button class="leave-btn" onclick="leaveGroup('${group.id}')">탈퇴</button>`
                    }
                </div>
            </div>
          `).join('')
        }
    </div>
    
    <div class="section">
        <h2>모든 그룹</h2>
        ${groups.filter(g => !userGroups.find(ug => ug.id === g.id)).map(group => `
            <div class="group-item">
                <div>
                    <h3 style="margin: 0;">${escapeHtml(group.name)}</h3>
                    <p style="margin: 5px 0; color: #666;">${escapeHtml(group.description || '설명이 없습니다.')}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #999;">멤버 ${group.member_count}명</p>
                </div>
                <div class="action-buttons">
                    <button class="join-btn" onclick="joinGroup('${group.id}')">가입</button>
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        async function joinGroup(groupId) {
            const response = await fetch(\`/groups/\${groupId}/join\`, { method: 'POST' });
            if (response.ok) {
                location.reload();
            } else {
                alert('그룹 가입에 실패했습니다.');
            }
        }
        
        async function leaveGroup(groupId) {
            if (confirm('정말 이 그룹을 탈퇴하시겠습니까?')) {
                const response = await fetch(\`/groups/\${groupId}/leave\`, { method: 'POST' });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('그룹 탈퇴에 실패했습니다.');
                }
            }
        }
        
        async function createInvite(groupId) {
            const response = await fetch(\`/groups/\${groupId}/invite\`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                prompt('초대 링크가 생성되었습니다. 아래 링크를 복사하여 공유하세요:', data.url);
            } else {
                alert('초대 링크 생성에 실패했습니다.');
            }
        }
    </script>
  `;
  
  return renderPageLayout('그룹 관리', content, styles);
}

/**
 * @param {import('../types/database').Group} group 
 * @param {Array<import('../types/database').User & {joined_at: string, is_admin: boolean}>} members 
 * @param {string} currentUserId 
 * @returns {Promise<string>}
 */
export async function renderGroupManagePage(group, members, currentUserId) {
  const styles = `
    body {
        max-width: 800px;
        font-weight: 300;
    }
    
    .group-desc {
        color: #666;
        margin-bottom: 40px;
    }
    
    .section {
        margin-bottom: 50px;
    }
    
    .member-list {
        list-style: none;
        padding: 0;
    }
    
    .member-item {
        padding: 20px 0;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .member-info {
        flex: 1;
    }
    
    .member-name {
        font-size: 16px;
        margin-bottom: 4px;
    }
    
    .member-meta {
        font-size: 14px;
        color: #666;
    }
    
    .admin-badge {
        background: transparent;
        color: #666;
        padding: 0 0 0 10px;
        font-size: 12px;
    }
    
    .member-actions {
        display: flex;
        gap: 20px;
    }
    
    .remove-btn, .make-admin-btn {
        padding: 0;
        border: none;
        cursor: pointer;
        font-size: 14px;
        background: transparent;
        transition: opacity 0.3s ease;
        text-decoration: underline;
    }
    
    .remove-btn {
        color: #dc3545;
    }
    
    .make-admin-btn {
        color: #007bff;
    }
    
    .remove-btn:hover, .make-admin-btn:hover {
        opacity: 0.6;
    }
    
    .delete-group-btn {
        background: transparent;
        color: #dc3545;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        font-size: 15px;
        transition: opacity 0.3s ease;
        text-decoration: underline;
    }
    
    .delete-group-btn:hover {
        opacity: 0.6;
    }
    
    .info {
        background: transparent;
        padding: 15px 0;
        margin-bottom: 20px;
        font-size: 14px;
        color: #666;
    }
  `;
  
  const content = `
    <a href="/groups" class="back-btn">← 그룹 목록으로</a>
    
    <h1>${escapeHtml(group.name)} 관리</h1>
    ${group.description ? `<p class="group-desc">${escapeHtml(group.description)}</p>` : ''}
    
    <div class="section">
        <h2>멤버 관리</h2>
        <div class="info">
            현재 ${members.length}명의 멤버가 있습니다.
        </div>
        <ul class="member-list">
            ${members.map(member => `
                <li class="member-item">
                    <div class="member-info">
                        <div class="member-name">
                            ${escapeHtml(member.username)}
                            ${member.is_admin ? '<span class="admin-badge">관리자</span>' : ''}
                        </div>
                        <div class="member-meta">
                            ${new Date(member.joined_at).toLocaleDateString('ko-KR')} 가입
                        </div>
                    </div>
                    ${member.id !== currentUserId ? `
                        <div class="member-actions">
                            ${!member.is_admin ? `
                                <button class="make-admin-btn" onclick="makeAdmin('${member.id}')">관리자 지정</button>
                            ` : ''}
                            <button class="remove-btn" onclick="removeMember('${member.id}')">강퇴</button>
                        </div>
                    ` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>그룹 삭제</h2>
        <div class="info">
            모든 멤버가 탈퇴하면 그룹이 자동으로 삭제됩니다.
        </div>
        ${members.length > 1 ? `
            <p>멤버가 남아있어 그룹을 삭제할 수 없습니다.</p>
        ` : `
            <button class="delete-group-btn" onclick="deleteGroup()">그룹 삭제</button>
        `}
    </div>
    
    <script>
        async function removeMember(userId) {
            if (confirm('정말 이 멤버를 강퇴시키시겠습니까?')) {
                const response = await fetch('/groups/${group.id}/members/' + userId, { method: 'DELETE' });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('강퇴에 실패했습니다.');
                }
            }
        }
        
        async function makeAdmin(userId) {
            if (confirm('이 멤버를 관리자로 지정하시겠습니까?')) {
                const response = await fetch('/groups/${group.id}/admins', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId })
                });
                if (response.ok) {
                    location.reload();
                } else {
                    alert('관리자 지정에 실패했습니다.');
                }
            }
        }
        
        async function deleteGroup() {
            if (confirm('정말 이 그룹을 삭제하시겠습니까? 모든 독후감과 데이터가 삭제됩니다.')) {
                const response = await fetch('/groups/${group.id}', { method: 'DELETE' });
                if (response.ok) {
                    window.location.href = '/groups';
                } else {
                    alert('그룹 삭제에 실패했습니다.');
                }
            }
        }
    </script>
  `;
  
  return renderPageLayout(`${group.name} 관리`, content, styles);
}