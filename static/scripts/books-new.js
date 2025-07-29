// Book creation page scripts

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bookForm');
    form.addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = data.redirect || '/books?message=' + encodeURIComponent('책이 등록되었습니다.');
        } else {
            showFlashMessage(data.error || '책 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('책 등록 실패:', error);
        showFlashMessage('책 등록에 실패했습니다.');
    }
}