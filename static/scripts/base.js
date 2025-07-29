// Base JavaScript - 모든 페이지 공통

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navBar = document.querySelector('.nav-bar');
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (!navBar.contains(e.target) && e.target !== toggle) {
        document.getElementById('navLinks').classList.remove('active');
    }
});

// Flash message auto-hide
document.addEventListener('DOMContentLoaded', () => {
    const flashMessage = document.getElementById('flashMessage');
    if (flashMessage) {
        setTimeout(() => {
            flashMessage.style.opacity = '0';
            flashMessage.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => flashMessage.remove(), 300);
        }, 3000);
    }
});

// Font loading
document.fonts.ready.then(() => {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => el.classList.add('loaded'));
});

// Fallback for font loading
setTimeout(() => {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => el.classList.add('loaded'));
}, 1000);

// Common utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    return String(text).replace(/[&<>"'`=\/]/g, s => map[s]);
}

// Flash message functionality
function showFlashMessage(message) {
    const flashElement = document.getElementById('flashMessage');
    if (flashElement) {
        flashElement.textContent = message;
        flashElement.style.display = 'block';
        
        setTimeout(() => {
            flashElement.style.opacity = '0';
            flashElement.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                flashElement.style.display = 'none';
                flashElement.style.opacity = '1';
                flashElement.style.transform = 'translateX(-50%) translateY(0)';
            }, 300);
        }, 3000);
    }
}

// Set active navigation link
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
        }
    });
});