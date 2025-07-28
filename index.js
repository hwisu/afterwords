import { handleLogin, handleLoginPost, handleLogout, checkAuth, handleSignup, handleSignupPost } from './handlers/auth.js';
import { handleHomePage, handleAddReview, handleGetReview, handleDeleteReview, getReviewsByGroup, getAllReviews, handleReviewEditPage, handleUpdateReview } from './handlers/reviews.js';
import { getAllBooks, getReviewsByBook, handleBookRegistrationPage, handleAddBook, handleReviewWritingPage, handleBooksListPage, handleBookEditPage, handleUpdateBook, handleDeleteBook } from './handlers/books.js';
import { getAllGroups, getGroup, createGroup, addMemberToGroup, addBookToGroup, handleGroupsPage, handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleGroupManagePage, handleRemoveMember, handleMakeAdmin, handleDeleteGroup } from './handlers/groups.js';
import { handleProfilePage } from './handlers/profile.js';
import { createGroupInvitation, acceptGroupInvitation, handleInvitationPage, createGeneralInvitation } from './handlers/invitations.js';

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
    if (request.method === 'GET' && pathname === '/signup') {
      return handleSignup(request, env);
    }
    if (request.method === 'POST' && pathname === '/signup') {
      return handleSignupPost(request, env);
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
    
    // Profile route
    if (request.method === 'GET' && pathname === '/profile') {
      return handleProfilePage(request, env);
    }
    
    // Book routes
    if (request.method === 'GET' && pathname === '/books') {
      return handleBooksListPage(env);
    }
    if (request.method === 'GET' && pathname === '/books/new') {
      return handleBookRegistrationPage();
    }
    if (request.method === 'POST' && pathname === '/books') {
      return handleAddBook(request, env);
    }
    if (request.method === 'GET' && pathname.match(/^\/books\/[^\/]+\/edit$/)) {
      const bookId = pathname.split('/')[2];
      return handleBookEditPage(bookId, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/books\/[^\/]+\/edit$/)) {
      const bookId = pathname.split('/')[2];
      return handleUpdateBook(bookId, request, env);
    }
    if (request.method === 'DELETE' && pathname.match(/^\/books\/[^\/]+$/)) {
      const bookId = pathname.split('/')[2];
      return handleDeleteBook(bookId, env);
    }
    
    // Review routes
    if (request.method === 'GET' && pathname === '/reviews/new') {
      return handleReviewWritingPage(request, env);
    }
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
    if (request.method === 'GET' && pathname.match(/^\/review\/[^\/]+\/edit$/)) {
      const reviewId = pathname.split('/')[2];
      return handleReviewEditPage(reviewId, request, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/review\/[^\/]+\/edit$/)) {
      const reviewId = pathname.split('/')[2];
      return handleUpdateReview(reviewId, request, env);
    }
    
    // Books API routes
    if (request.method === 'GET' && pathname === '/api/books') {
      const books = await getAllBooks(env);
      return new Response(JSON.stringify(books), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (request.method === 'GET' && pathname.startsWith('/api/books/')) {
      const bookId = pathname.split('/')[3];
      const reviews = await getReviewsByBook(bookId, env);
      return new Response(JSON.stringify(reviews), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get all reviews (for the frontend to use when no group is selected)
    if (request.method === 'GET' && pathname === '/reviews') {
      const reviews = await getAllReviews(env);
      return new Response(JSON.stringify(reviews), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Groups routes
    if (request.method === 'GET' && pathname === '/groups') {
      return handleGroupsPage(request, env);
    }
    if (request.method === 'POST' && pathname === '/groups') {
      return handleCreateGroup(request, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/groups\/[^\/]+\/join$/)) {
      const groupId = pathname.split('/')[2];
      return handleJoinGroup(groupId, request, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/groups\/[^\/]+\/leave$/)) {
      const groupId = pathname.split('/')[2];
      return handleLeaveGroup(groupId, request, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/groups\/[^\/]+\/invite$/)) {
      const groupId = pathname.split('/')[2];
      return createGroupInvitation(groupId, request, env);
    }
    if (request.method === 'GET' && pathname.match(/^\/groups\/[^\/]+\/manage$/)) {
      const groupId = pathname.split('/')[2];
      return handleGroupManagePage(groupId, request, env);
    }
    if (request.method === 'DELETE' && pathname.match(/^\/groups\/[^\/]+\/members\/[^\/]+$/)) {
      const groupId = pathname.split('/')[2];
      const userId = pathname.split('/')[4];
      return handleRemoveMember(groupId, userId, request, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/groups\/[^\/]+\/admins$/)) {
      const groupId = pathname.split('/')[2];
      return handleMakeAdmin(groupId, request, env);
    }
    if (request.method === 'DELETE' && pathname.match(/^\/groups\/[^\/]+$/)) {
      const groupId = pathname.split('/')[2];
      return handleDeleteGroup(groupId, request, env);
    }
    
    // General invitation creation (admin only)
    if (request.method === 'POST' && pathname === '/invitations/general') {
      return createGeneralInvitation(request, env);
    }
    
    // Invitation routes
    if (request.method === 'GET' && pathname.match(/^\/invite\/[^\/]+$/)) {
      const inviteCode = pathname.split('/')[2];
      return handleInvitationPage(inviteCode, env);
    }
    if (request.method === 'POST' && pathname.match(/^\/invite\/[^\/]+\/accept$/)) {
      const inviteCode = pathname.split('/')[2];
      return acceptGroupInvitation(inviteCode, request, env);
    }
    // Groups API routes
    if (request.method === 'GET' && pathname === '/api/groups') {
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
    
    // Reviews by group route
    if (request.method === 'GET' && pathname.startsWith('/reviews/group/')) {
      const groupId = pathname.split('/')[3];
      const reviews = await getReviewsByGroup(env, groupId);
      return new Response(JSON.stringify(reviews), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
