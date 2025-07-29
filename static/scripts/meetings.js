// Meetings page scripts

let groupId;
let groupData;

document.addEventListener('DOMContentLoaded', async () => {
    // Get group ID from URL
    const pathParts = window.location.pathname.split('/');
    groupId = pathParts[2];
    
    if (!groupId || pathParts[3] !== 'meetings') {
        window.location.href = '/groups';
        return;
    }
    
    // Update new meeting button
    document.getElementById('newMeetingBtn').href = `/groups/${groupId}/meetings/new`;
    
    await loadGroupData();
    await loadMeetings();
});

async function loadGroupData() {
    try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) {
            if (response.status === 404) {
                showFlashMessage('모임을 찾을 수 없습니다.');
                setTimeout(() => window.location.href = '/groups', 2000);
                return;
            }
            throw new Error('Failed to fetch group');
        }
        
        groupData = await response.json();
        displayGroupInfo();
    } catch (error) {
        console.error('모임 정보를 불러오는 데 실패했습니다:', error);
        showFlashMessage('모임 정보를 불러오는 데 실패했습니다.');
    }
}

function displayGroupInfo() {
    const groupInfoDiv = document.getElementById('groupInfo');
    groupInfoDiv.innerHTML = `
        <h2>${escapeHtml(groupData.name)}</h2>
        ${groupData.description ? `<p>${escapeHtml(groupData.description)}</p>` : ''}
    `;
}

async function loadMeetings() {
    try {
        const response = await fetch(`/api/groups/${groupId}/meetings`);
        if (!response.ok) throw new Error('Failed to fetch meetings');
        
        const meetings = await response.json();
        displayMeetings(meetings);
    } catch (error) {
        console.error('모임 일정을 불러오는 데 실패했습니다:', error);
        document.getElementById('meetingsList').innerHTML = `
            <div class="empty-state">
                <p class="error">모임 일정을 불러오는 데 실패했습니다.</p>
            </div>
        `;
    }
}

function displayMeetings(meetings) {
    const meetingsDiv = document.getElementById('meetingsList');
    
    if (meetings.length === 0) {
        meetingsDiv.innerHTML = `
            <div class="empty-state">
                <h2>아직 예정된 만남이 없습니다</h2>
                <p>첫 번째 만남을 만들어보세요!</p>
                <a href="/groups/${groupId}/meetings/new" class="btn btn-primary">만남 만들기</a>
            </div>
        `;
        return;
    }
    
    // Sort meetings by date (upcoming first)
    meetings.sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
    
    meetingsDiv.innerHTML = meetings.map(meeting => {
        const meetingDate = new Date(meeting.meeting_date);
        const isPast = meetingDate < new Date();
        
        return `
            <div class="meeting-card ${isPast ? 'past-meeting' : ''}">
                <div class="meeting-header">
                    <h3 class="meeting-title">
                        <a href="/groups/${groupId}/meetings/${meeting.id}">${escapeHtml(meeting.title)}</a>
                    </h3>
                    <div class="meeting-location">📍 ${escapeHtml(meeting.location)}</div>
                    <div class="meeting-time">
                        📅 ${meetingDate.toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            weekday: 'long' 
                        })} ${meetingDate.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </div>
                </div>
                <div class="meeting-meta">
                    <span class="meta-item participants-badge">
                        참석 ${meeting.participant_count || 0}명 / 정원 ${meeting.max_participants || '제한없음'}명
                    </span>
                    ${meeting.book_title ? `<span class="meta-item">📚 ${escapeHtml(meeting.book_title)}</span>` : ''}
                </div>
                <div class="meeting-actions">
                    <a href="/groups/${groupId}/meetings/${meeting.id}" class="btn btn-primary">상세보기</a>
                    ${!isPast && !meeting.is_registered ? 
                        `<button onclick="registerMeeting('${meeting.id}')" class="btn btn-secondary">참석 신청</button>` : 
                        ''
                    }
                    ${meeting.is_registered ? '<span class="participants-badge">참석 신청됨</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function registerMeeting(meetingId) {
    try {
        const response = await fetch(`/api/groups/${groupId}/meetings/${meetingId}/register`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showFlashMessage('참석 신청이 완료되었습니다.');
            await loadMeetings();
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to register');
        }
    } catch (error) {
        console.error('참석 신청 실패:', error);
        showFlashMessage(error.message || '참석 신청에 실패했습니다.');
    }
}