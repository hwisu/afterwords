import { handleLogin, handleLoginPost, handleLogout, checkAuth } from './handlers/auth.js';
import { handleHomePage, handleAddReview, handleGetReview, handleDeleteReview } from './handlers/reviews.js';
import { getAllBooks, getReviewsByBook } from './handlers/books.js';
import { getAllGroups, getGroup, createGroup, addMemberToGroup, addBookToGroup } from './handlers/groups.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Authentication routes (public)
    if (request.method === 'GET' && pathname === '/login') {
      return handleLogin(env);
    }
    if (request.method === 'POST' && pathname === '/login') {
      return handleLoginPost(request, env);
    }
    if (request.method === 'GET' && pathname === '/logout') {
      return handleLogout();
    }
    
    // Check authentication for protected routes
    const isAuthenticated = await checkAuth(request, env);
    const protectedPaths = ['/', '/reviews', '/review', '/books', '/groups'];
    const isProtectedRoute = protectedPaths.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    );
    
    if (!isAuthenticated && isProtectedRoute) {
      return Response.redirect(new URL('/login', request.url), 302);
    }
    
    // Main application routes (protected)
    if (request.method === 'GET' && pathname === '/') {
      return handleHomePage(env);
    }
    
    // Review routes
    if (request.method === 'POST' && pathname === '/reviews') {
      return handleAddReview(request, env);
    }
    if (request.method === 'GET' && pathname.startsWith('/review/')) {
      const id = pathname.split('/')[2];
      return handleGetReview(id, env);
    }
    if (request.method === 'DELETE' && pathname.startsWith('/review/')) {
      const id = pathname.split('/')[2];
      return handleDeleteReview(id, env);
    }
    
    // Books routes
    if (request.method === 'GET' && pathname === '/books') {
      const books = await getAllBooks(env);
      return new Response(JSON.stringify(books), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (request.method === 'GET' && pathname.startsWith('/books/')) {
      const pathParts = pathname.split('/');
      const title = decodeURIComponent(pathParts[2]);
      const author = decodeURIComponent(pathParts[3]);
      const reviews = await getReviewsByBook(title, author, env);
      return new Response(JSON.stringify(reviews), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Groups routes
    if (request.method === 'GET' && pathname === '/groups') {
      const groups = await getAllGroups(env);
      return new Response(JSON.stringify(groups), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (request.method === 'GET' && pathname.startsWith('/groups/')) {
      const id = pathname.split('/')[2];
      const group = await getGroup(env, id);
      if (!group) {
        return new Response('Group not found', { status: 404 });
      }
      return new Response(JSON.stringify(group), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
