// Authentication related views
import { renderPageLayout, escapeHtml } from './common.js';

/**
 * @param {string|null} error 
 * @returns {Promise<string>}
 */
export async function renderLoginPage(error = null) {
  const styles = `
    body {
        max-width: 400px;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .login-container {
        margin-bottom: 30px;
    }
    
    h1 {
        text-align: center;
        margin-bottom: 20px;
    }
    
    button {
        width: 100%;
    }
    
    button:hover {
        background: #f0f0f0;
    }
  `;
  
  const content = `
    <div class="login-container">
        <h1>로그인</h1>
        ${error ? `<div class="error">${error}</div>` : ''}
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="username">아이디</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">로그인</button>
        </form>
    </div>
    <script>
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    </script>
  `;
  
  return renderPageLayout('로그인', content, styles);
}

/**
 * @param {string} inviteCode 
 * @param {string} inviteType 
 * @param {import('../types/database').GroupInvitation | import('../types/database').GeneralInvitation | null} invitation 
 * @param {string|null} error 
 * @returns {Promise<string>}
 */
export async function renderSignupPage(inviteCode, inviteType, invitation, error = null) {
  const isGroupInvite = inviteType === 'group';
  
  const styles = `
    body {
        max-width: 400px;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .signup-container {
        margin-bottom: 30px;
    }
    
    h1 {
        text-align: center;
        margin-bottom: 20px;
    }
    
    .invite-info {
        background: transparent;
        padding: 15px 0;
        margin-bottom: 30px;
        text-align: center;
        font-size: 14px;
        color: #666;
    }
    
    .invite-info strong {
        color: #333;
        font-weight: 400;
    }
    
    button {
        width: 100%;
    }
    
    button:hover {
        background: #f0f0f0;
    }
  `;
  
  const content = `
    <div class="signup-container">
        <h1>회원가입</h1>
        
        ${invitation ? `
            <div class="invite-info">
                ${isGroupInvite ? 
                    `<strong>${escapeHtml(invitation.group_name)}</strong> 그룹에 초대되었습니다.` :
                    `<strong>읽고 난 뒤</strong>에 초대되었습니다.`
                }
            </div>
        ` : ''}
        
        ${error ? `<div class="error">${error}</div>` : ''}
        
        <form method="POST" action="/signup">
            <input type="hidden" name="invite_code" value="${inviteCode}">
            <input type="hidden" name="invite_type" value="${inviteType}">
            
            <div class="form-group">
                <label for="username">아이디</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input type="password" id="password" name="password" required>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    6~50자, 숫자와 문자 포함 필수
                </div>
            </div>
            <div class="form-group">
                <label for="password_confirm">비밀번호 확인</label>
                <input type="password" id="password_confirm" name="password_confirm" required>
            </div>
            <button type="submit">가입하기</button>
        </form>
    </div>
    <script>
        document.fonts.ready.then(() => {
            document.body.classList.add('loaded');
        });
        
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    </script>
  `;
  
  return renderPageLayout('회원가입', content, styles);
}