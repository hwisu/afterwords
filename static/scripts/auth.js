// Authentication scripts

document.addEventListener('DOMContentLoaded', () => {
    // Page fade-in effect
    document.fonts.ready.then(() => {
        document.body.classList.add('loaded');
    });
    
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1000);
    
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = decodeURIComponent(error);
            errorElement.style.display = 'block';
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const errorElement = document.getElementById('errorMessage');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = data.redirect || '/';
            } else {
                if (errorElement) {
                    errorElement.textContent = data.error || '로그인에 실패했습니다.';
                    errorElement.style.display = 'block';
                }
            }
        } catch (error) {
            if (errorElement) {
                errorElement.textContent = '서버 오류가 발생했습니다.';
                errorElement.style.display = 'block';
            }
        }
    });
}

// Handle signup form submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(signupForm);
        const errorElement = document.getElementById('errorMessage');
        
        // Password validation
        const password = formData.get('password');
        const passwordConfirm = formData.get('password_confirm');
        
        if (password !== passwordConfirm) {
            if (errorElement) {
                errorElement.textContent = '비밀번호가 일치하지 않습니다.';
                errorElement.style.display = 'block';
            }
            return;
        }
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = data.redirect || '/';
            } else {
                if (errorElement) {
                    errorElement.textContent = data.error || '회원가입에 실패했습니다.';
                    errorElement.style.display = 'block';
                }
            }
        } catch (error) {
            if (errorElement) {
                errorElement.textContent = '서버 오류가 발생했습니다.';
                errorElement.style.display = 'block';
            }
        }
    });
}