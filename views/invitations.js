// Invitation related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @param {string} inviteCode 
 * @param {import('../types/database').GroupInvitation | import('../types/database').GeneralInvitation | null} invitation 
 * @returns {Promise<string>}
 */
export async function renderInvitationPage(inviteCode, invitation) {
  if (!invitation) {
    const styles = `
      body {
        max-width: 500px;
        text-align: center;
        padding: 50px;
      }
      
      h1 {
        color: #666;
        font-size: 24px;
      }
      
      a {
        color: #333;
        text-decoration: underline;
        transition: opacity 0.3s ease;
      }
      
      a:hover {
        opacity: 0.6;
      }
    `;
    
    const content = `
      <h1>유효하지 않은 초대 코드입니다</h1>
      <p>초대 코드를 다시 확인해주세요.</p>
      <a href="/">홈으로 돌아가기</a>
    `;
    
    return renderPageLayout('초대 코드 오류', content, styles);
  }
  
  const isGroupInvite = invitation.type === 'group';
  const title = isGroupInvite ? '그룹 초대' : '가입 초대';
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isFull = invitation.uses_count >= invitation.max_uses;
  
  const styles = `
    body {
        max-width: 500px;
        text-align: center;
        font-weight: 300;
    }
    
    .invitation-card {
        background: transparent;
        padding: 40px 0;
    }
    
    h1 { 
        font-size: 24px;
        margin-bottom: 20px;
        font-weight: 400;
    }
    
    .group-name {
        font-size: 20px;
        font-weight: 400;
        color: #333;
        margin-bottom: 10px;
    }
    
    .group-description {
        color: #666;
        margin-bottom: 20px;
    }
    
    .inviter {
        color: #999;
        font-size: 14px;
        margin-bottom: 30px;
    }
    
    .invite-code {
        display: inline-block;
        padding: 15px 0;
        background: transparent;
        font-family: monospace;
        font-size: 20px;
        letter-spacing: 2px;
        margin-bottom: 30px;
        border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    .btn {
        display: inline-block;
        padding: 10px 20px;
        text-decoration: underline;
        font-size: 15px;
        transition: opacity 0.3s ease;
        background: transparent;
        border: none;
        cursor: pointer;
    }
    
    .btn-accept {
        color: #333;
    }
    
    .btn-accept:hover {
        opacity: 0.6;
    }
    
    .btn-disabled {
        background: transparent;
        color: #999;
        cursor: not-allowed;
        opacity: 0.5;
    }
    
    .error-message {
        color: #666;
        margin-bottom: 20px;
        font-style: italic;
    }
  `;
  
  const content = `
    <div class="invitation-card">
        <h1>${title}</h1>
        ${isGroupInvite ? `
            <div class="group-name">${escapeHtml(invitation.group_name)}</div>
            ${invitation.group_description ? `<div class="group-description">${escapeHtml(invitation.group_description)}</div>` : ''}
        ` : `
            <div class="group-name">읽고 난 뒤</div>
            <div class="group-description">책을 읽고 감상을 공유하는 독서 커뮤니티</div>
        `}
        <div class="inviter">${escapeHtml(invitation.inviter_name)}님이 초대했습니다</div>
        <div class="invite-code">${inviteCode}</div>
        
        ${isExpired ? 
          '<div class="error-message">이 초대 코드는 만료되었습니다.</div>' :
          isFull ?
          '<div class="error-message">이 초대 코드는 사용 횟수가 초과되었습니다.</div>' :
          `<form method="POST" action="/invite/${inviteCode}/accept">
            <button type="submit" class="btn btn-accept">${isGroupInvite ? '그룹 가입하기' : '가입하기'}</button>
          </form>`
        }
        
        <p style="margin-top: 30px;">
            <a href="/" style="color: #666; text-decoration: underline;">홈으로 돌아가기</a>
        </p>
    </div>
  `;
  
  return renderPageLayout(title, content, styles);
}