import { getUserFromRequest, verifyGroupAccess, isUserGroupAdmin } from '../middleware/auth.js';
import { getAllBooks } from './books.js';

/**
 * Handle meeting creation page
 */
export async function handleMeetingCreationPage(groupId, request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Check if user is admin
  const isAdmin = await isUserGroupAdmin(env, user.id, groupId);
  if (!isAdmin) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  // Get group details
  const group = await env.DB.prepare('SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL')
    .bind(groupId).first();
  
  if (!group) {
    return new Response('모임을 찾을 수 없습니다.', { status: 404 });
  }
  
  // Get all books for the requirement selector
  const books = await getAllBooks(env);
  
  const html = await renderMeetingCreationPage(groupId, group, books);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Handle meeting creation
 */
export async function handleCreateMeeting(groupId, request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Check if user is admin
  const isAdmin = await isUserGroupAdmin(env, user.id, groupId);
  if (!isAdmin) {
    return new Response('권한이 없습니다.', { status: 403 });
  }
  
  const formData = await request.formData();
  
  // Parse form data
  const title = formData.get('title');
  const description = formData.get('description');
  const startDate = formData.get('start_date');
  const startTime = formData.get('start_time');
  const endDate = formData.get('end_date');
  const endTime = formData.get('end_time');
  const locationType = formData.get('location_type');
  const locationName = formData.get('location_name') || formData.get('online_platform');
  const locationAddress = formData.get('location_address');
  const onlineUrl = formData.get('online_url');
  const maxParticipants = formData.get('max_participants') ? parseInt(formData.get('max_participants')) : null;
  const requireReview = formData.get('require_review') === 'true';
  const requiredBookId = formData.get('required_book_id');
  
  // Create timezone-aware datetime strings (assuming KST)
  const startDateTime = new Date(`${startDate}T${startTime}:00+09:00`).toISOString();
  const endDateTime = new Date(`${endDate}T${endTime}:00+09:00`).toISOString();
  
  // Validate times
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    return new Response('종료 시간은 시작 시간 이후여야 합니다.', { status: 400 });
  }
  
  // Start transaction
  const meetingId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  try {
    // Create meeting
    await env.DB.prepare(`
      INSERT INTO meetings (
        id, group_id, title, description, start_time, end_time,
        location_type, location_name, location_address, online_url,
        max_participants, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      meetingId, groupId, title, description, startDateTime, endDateTime,
      locationType, locationName, locationAddress, onlineUrl,
      maxParticipants, user.id, now, now
    ).run();
    
    // Create requirement if needed
    if (requireReview && requiredBookId) {
      // Get book details
      const book = await env.DB.prepare('SELECT title, author FROM books WHERE id = ?')
        .bind(requiredBookId).first();
      
      if (book) {
        const requirementId = crypto.randomUUID();
        const requirementData = JSON.stringify({
          book_id: requiredBookId,
          book_title: book.title,
          book_author: book.author,
          group_id: groupId
        });
        
        await env.DB.prepare(`
          INSERT INTO meeting_requirements (
            id, meeting_id, requirement_type, requirement_data, display_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          requirementId, meetingId, 'book_review', requirementData, 0, now
        ).run();
      }
    }
    
    return Response.redirect(new URL(`/groups/${groupId}/meetings`, request.url), 303);
  } catch (error) {
    console.error('Failed to create meeting:', error);
    return new Response('만남 생성에 실패했습니다.', { status: 500 });
  }
}

/**
 * Handle meetings list page
 */
export async function handleMeetingsListPage(groupId, request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Verify group access
  const accessResult = await verifyGroupAccess(env, user.id, groupId);
  if (!accessResult.allowed) {
    return new Response(accessResult.reason, { status: 403 });
  }
  
  // Get group details
  const group = await env.DB.prepare('SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL')
    .bind(groupId).first();
  
  if (!group) {
    return new Response('모임을 찾을 수 없습니다.', { status: 404 });
  }
  
  // Get meetings with participant count and requirements
  const meetings = await env.DB.prepare(`
    SELECT 
      m.*,
      COUNT(DISTINCT mp.user_id) as participant_count,
      GROUP_CONCAT(
        json_object(
          'requirement_type', mr.requirement_type,
          'requirement_data', mr.requirement_data
        )
      ) as requirements_json
    FROM meetings m
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id AND mp.status = 'registered'
    LEFT JOIN meeting_requirements mr ON m.id = mr.meeting_id
    WHERE m.group_id = ?
    GROUP BY m.id
    ORDER BY m.start_time DESC
  `).bind(groupId).all();
  
  // Parse requirements
  const meetingsWithRequirements = meetings.results.map(meeting => ({
    ...meeting,
    requirements: meeting.requirements_json ? 
      meeting.requirements_json.split(',').map(r => JSON.parse(r)) : []
  }));
  
  const isAdmin = await isUserGroupAdmin(env, user.id, groupId);
  
  const html = await renderMeetingsListPage(groupId, group, meetingsWithRequirements, isAdmin);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

/**
 * Check if user meets meeting requirements
 */
async function checkMeetingRequirements(env, meetingId, userId) {
  // Get all requirements for the meeting
  const requirements = await env.DB.prepare(`
    SELECT * FROM meeting_requirements WHERE meeting_id = ?
  `).bind(meetingId).all();
  
  const unmetRequirements = [];
  
  for (const req of requirements.results) {
    // Check if requirement is fulfilled
    const fulfillment = await env.DB.prepare(`
      SELECT * FROM meeting_requirement_fulfillments
      WHERE requirement_id = ? AND user_id = ?
    `).bind(req.id, userId).first();
    
    if (!fulfillment) {
      // Special handling for book_review requirement
      if (req.requirement_type === 'book_review') {
        const data = JSON.parse(req.requirement_data);
        // Check if user has written a review for this book in this group
        const review = await env.DB.prepare(`
          SELECT id FROM reviews 
          WHERE user_id = ? AND book_id = ? AND group_id = ?
        `).bind(userId, data.book_id, data.group_id).first();
        
        if (review) {
          // Auto-fulfill the requirement
          await env.DB.prepare(`
            INSERT INTO meeting_requirement_fulfillments (
              id, meeting_id, user_id, requirement_id, fulfilled_at, fulfillment_data
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            meetingId,
            userId,
            req.id,
            new Date().toISOString(),
            JSON.stringify({ review_id: review.id })
          ).run();
        } else {
          unmetRequirements.push({
            type: req.requirement_type,
            data: data
          });
        }
      }
    }
  }
  
  return {
    met: unmetRequirements.length === 0,
    unmetRequirements
  };
}

/**
 * Handle meeting registration
 */
export async function handleMeetingRegistration(groupId, meetingId, request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Verify group access
  const accessResult = await verifyGroupAccess(env, user.id, groupId);
  if (!accessResult.allowed) {
    return new Response(accessResult.reason, { status: 403 });
  }
  
  // Get meeting details
  const meeting = await env.DB.prepare(`
    SELECT * FROM meetings WHERE id = ? AND group_id = ?
  `).bind(meetingId, groupId).first();
  
  if (!meeting) {
    return new Response('만남을 찾을 수 없습니다.', { status: 404 });
  }
  
  // Check if meeting has started
  if (new Date() > new Date(meeting.start_time)) {
    return new Response('이미 시작된 만남입니다.', { status: 400 });
  }
  
  // Check if already registered
  const existing = await env.DB.prepare(`
    SELECT * FROM meeting_participants 
    WHERE meeting_id = ? AND user_id = ?
  `).bind(meetingId, user.id).first();
  
  if (existing) {
    return new Response('이미 참여 신청하셨습니다.', { status: 409 });
  }
  
  // Check requirements
  const requirementsCheck = await checkMeetingRequirements(env, meetingId, user.id);
  if (!requirementsCheck.met) {
    const messages = requirementsCheck.unmetRequirements.map(req => {
      if (req.type === 'book_review') {
        return `"${req.data.book_title}" 독후감을 먼저 작성해주세요.`;
      }
      return '참여 조건을 충족하지 못했습니다.';
    });
    return new Response(messages.join('\n'), { status: 400 });
  }
  
  // Check max participants
  if (meeting.max_participants) {
    const currentCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM meeting_participants 
      WHERE meeting_id = ? AND status = 'registered'
    `).bind(meetingId).first();
    
    if (currentCount.count >= meeting.max_participants) {
      return new Response('참여 인원이 마감되었습니다.', { status: 400 });
    }
  }
  
  // Register for meeting
  await env.DB.prepare(`
    INSERT INTO meeting_participants (
      meeting_id, user_id, status, registered_at
    ) VALUES (?, ?, ?, ?)
  `).bind(
    meetingId, user.id, 'registered', new Date().toISOString()
  ).run();
  
  return Response.redirect(new URL(`/groups/${groupId}/meetings/${meetingId}`, request.url), 303);
}

/**
 * Handle meeting detail page
 */
export async function handleMeetingDetailPage(groupId, meetingId, request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return Response.redirect(new URL('/login', request.url), 303);
  }
  
  // Verify group access
  const accessResult = await verifyGroupAccess(env, user.id, groupId);
  if (!accessResult.allowed) {
    return new Response(accessResult.reason, { status: 403 });
  }
  
  // Get meeting details with requirements
  const meeting = await env.DB.prepare(`
    SELECT m.*, u.username as creator_name
    FROM meetings m
    JOIN users u ON m.created_by = u.id
    WHERE m.id = ? AND m.group_id = ?
  `).bind(meetingId, groupId).first();
  
  if (!meeting) {
    return new Response('만남을 찾을 수 없습니다.', { status: 404 });
  }
  
  // Get requirements
  const requirements = await env.DB.prepare(`
    SELECT * FROM meeting_requirements WHERE meeting_id = ?
  `).bind(meetingId).all();
  
  // Get participants
  const participants = await env.DB.prepare(`
    SELECT mp.*, u.username
    FROM meeting_participants mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.meeting_id = ? AND mp.status = 'registered'
  `).bind(meetingId).all();
  
  // Check if current user is registered
  const isRegistered = participants.results.some(p => p.user_id === user.id);
  
  // Check requirements for current user
  const requirementsCheck = await checkMeetingRequirements(env, meetingId, user.id);
  
  // Check if registration is available
  const now = new Date();
  const canRegister = now < new Date(meeting.start_time) && 
                     (!meeting.max_participants || participants.results.length < meeting.max_participants);
  
  // Combine data
  const meetingData = {
    ...meeting,
    requirements: requirements.results,
    participants: participants.results
  };
  
  const html = await renderMeetingDetailPage(
    groupId, 
    meetingData, 
    user, 
    isRegistered, 
    canRegister, 
    requirementsCheck.unmetRequirements
  );
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}

export { checkMeetingRequirements };