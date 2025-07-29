/**
 * Format date for display in Korean
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  const now = new Date();
  
  // Default options
  const {
    includeTime = false,
    includeYear = d.getFullYear() !== now.getFullYear(),
    relative = false
  } = options;
  
  if (relative) {
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? '방금 전' : `${minutes}분 전`;
      }
      return `${hours}시간 전`;
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    }
  }
  
  const dateOptions = {
    month: 'long',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' })
  };
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dateStr = d.toLocaleDateString('ko-KR', dateOptions);
  
  if (includeTime) {
    const timeStr = d.toLocaleTimeString('ko-KR', timeOptions);
    return `${dateStr} ${timeStr}`;
  }
  
  return dateStr;
}

/**
 * Check if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(date) {
  return new Date(date) < new Date();
}

/**
 * Create ISO string for current time
 * @returns {string} ISO date string
 */
export function nowISO() {
  return new Date().toISOString();
}