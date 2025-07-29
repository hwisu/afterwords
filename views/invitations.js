export function renderInvitationPage(invitation) {
  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;
  const isMaxUsesReached = invitation ? invitation.uses_count >= invitation.max_uses : false;
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>초대장 - Afterwords</title>
      <link rel="stylesheet" href="/styles/base.css">
      <link rel="stylesheet" href="/styles/auth.css">
    </head>
    <body>
      <div class="auth-container">
        <h1>Afterwords</h1>
        
        ${invitation ? `
          ${invitation.type === 'group' ? `
            <div class="invitation-card">
              <h2>${invitation.group_name} 모임 초대</h2>
              <p class="invitation-description">${invitation.group_description || '독서 모임에 초대되었습니다.'}</p>
              <p class="inviter-info">${invitation.inviter_name}님이 초대했습니다</p>
              
              ${isExpired ? `
                <div class="error-message">
                  이 초대장은 만료되었습니다.
                </div>
              ` : isMaxUsesReached ? `
                <div class="error-message">
                  이 초대장은 더 이상 사용할 수 없습니다.
                </div>
              ` : `
                <div class="invitation-actions">
                  <a href="/signup?invite=${invitation.invite_code}" class="btn btn-primary">
                    회원가입하고 참여하기
                  </a>
                  <a href="/login?invite=${invitation.invite_code}" class="btn btn-secondary">
                    로그인하고 참여하기
                  </a>
                </div>
              `}
            </div>
          ` : `
            <div class="invitation-card">
              <h2>Afterwords 초대장</h2>
              <p class="invitation-description">독서 커뮤니티에 초대되었습니다.</p>
              <p class="inviter-info">${invitation.inviter_name}님이 초대했습니다</p>
              
              ${isExpired ? `
                <div class="error-message">
                  이 초대장은 만료되었습니다.
                </div>
              ` : isMaxUsesReached ? `
                <div class="error-message">
                  이 초대장은 더 이상 사용할 수 없습니다.
                </div>
              ` : `
                <div class="invitation-actions">
                  <a href="/signup?invite=${invitation.invite_code}" class="btn btn-primary">
                    회원가입하기
                  </a>
                  <a href="/login" class="btn btn-secondary">
                    이미 계정이 있으신가요?
                  </a>
                </div>
              `}
            </div>
          `}
        ` : `
          <div class="error-message">
            유효하지 않은 초대 코드입니다.
          </div>
          <div class="invitation-actions">
            <a href="/" class="btn btn-secondary">홈으로 가기</a>
          </div>
        `}
      </div>
    </body>
    </html>
  `;
}