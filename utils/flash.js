export function redirectWithMessage(url, message, type = 'success') {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url,
      'Set-Cookie': `flash_message=${encodeURIComponent(JSON.stringify({ message, type }))}; Path=/; HttpOnly; Max-Age=5`
    }
  });
}

export function getFlashMessage(request) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;

  const cookies = Object.fromEntries(
    cookie.split(';').map(c => {
      const [key, value] = c.trim().split('=');
      return [key, decodeURIComponent(value || '')];
    })
  );

  if (!cookies.flash_message) return null;

  try {
    return JSON.parse(cookies.flash_message);
  } catch {
    return null;
  }
}

export function clearFlashMessage() {
  return 'flash_message=; Path=/; HttpOnly; Max-Age=0';
}