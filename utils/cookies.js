/**
 * Parse cookies from request header
 * @param {Request|string} request - Request object or cookie header string
 * @returns {Object} Parsed cookies
 */
export function parseCookies(request) {
  const cookieHeader = typeof request === 'string' 
    ? request 
    : request.headers?.get('Cookie') || request.header?.('Cookie');
    
  if (!cookieHeader) return {};
  
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, value] = cookie.trim().split('=');
      return [key, decodeURIComponent(value || '')];
    })
  );
}

/**
 * Create a cookie string
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 * @returns {string} Cookie string
 */
export function createCookie(name, value, options = {}) {
  const {
    httpOnly = true,
    secure = true,
    sameSite = 'strict',
    path = '/',
    maxAge,
    expires
  } = options;
  
  let cookie = `${name}=${encodeURIComponent(value)}`;
  
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  if (path) cookie += `; Path=${path}`;
  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  if (expires) cookie += `; Expires=${expires.toUTCString()}`;
  
  return cookie;
}