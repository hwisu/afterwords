// Common utilities and shared components

export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export const commonStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400&display=swap');
  
  body {
      font-family: 'Noto Serif KR', serif;
      line-height: 1.6;
      margin: 0 auto;
      padding: 20px;
      background-color: #fafafa;
      color: #333;
      font-weight: 300;
  }
  
  h1 {
      font-size: 24px;
      font-weight: 400;
      color: #222;
  }
  
  h2 {
      font-size: 18px;
      font-weight: 400;
      color: #222;
  }
  
  a {
      color: #333;
      text-decoration: underline;
  }
  
  a:hover {
      text-decoration: underline;
      opacity: 0.6;
  }
  
  button {
      background: transparent;
      color: #333;
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 15px;
      transition: opacity 0.3s ease;
      font-weight: 400;
      text-decoration: underline;
  }
  
  button:hover {
      opacity: 0.6;
  }
  
  input, select, textarea {
      width: 100%;
      padding: 10px 0;
      border: none;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      font-size: 15px;
      font-family: inherit;
      background: transparent;
      font-weight: 300;
  }
  
  input:focus, textarea:focus, select:focus {
      outline: none;
      border-bottom: 1px solid rgba(0,0,0,0.3);
  }
  
  .form-group {
      margin-bottom: 20px;
  }
  
  label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #666;
  }
  
  .back-btn {
      display: inline-block;
      padding: 0;
      background: transparent;
      color: #333;
      text-decoration: underline;
      margin-bottom: 30px;
      font-size: 15px;
      transition: opacity 0.3s ease;
  }
  
  .back-btn:hover {
      opacity: 0.6;
  }
  
  .error {
      color: #dc3545;
      font-size: 14px;
      margin-bottom: 15px;
  }
  
  .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  
  .header-link {
      color: #333;
      text-decoration: underline;
      font-size: 14px;
      margin-left: 20px;
      transition: opacity 0.3s ease;
  }
  
  .header-link:hover {
      opacity: 0.6;
  }
`;

export function renderHeader(showAuth = true) {
  if (!showAuth) return '';
  
  return `
    <div class="header-container">
        <h1>읽고 난 뒤</h1>
        <div>
            <a href="/profile" class="header-link">내 정보</a>
            <a href="/logout" class="header-link">로그아웃</a>
        </div>
    </div>
  `;
}

export function renderPageLayout(title, content, additionalStyles = '') {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 읽고 난 뒤</title>
    <style>
        ${commonStyles}
        ${additionalStyles}
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}