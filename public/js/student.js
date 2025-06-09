// public/js/student.js
import { showMessage, removeToken, makeAuthenticatedRequest, getToken, getUserRole } from './utils.js';

// --- Core Dashboard UI Functions ---

/**
 * Hides all content sections and shows the specified one.
 * This is specific to the student dashboard's tab navigation.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    console.log(`[student.js] Showing section: ${sectionId}`);
    document.querySelectorAll('.dashboard-content .content-section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log(`[student.js] Section '${sectionId}' is now visible.`);
    } else {
        console.error(`[student.js] Target section '${sectionId}' not found.`);
    }
}

// --- Student Dashboard Specific Logic ---

/**
 * Initializes and loads data for the Student Dashboard.
 */
async function loadStudentDashboard() {
    console.log('[student.js] loadStudentDashboard started.');

    const studentWelcome = document.getElementById('studentWelcome');
    const studentEmailDisplay = document.getElementById('studentEmailDisplay'); // New element
    const studentIdDisplay = document.getElementById('studentIdDisplay');     // New element

    // Fetch user details to display email and ID
    try {
        const userDetails = await makeAuthenticatedRequest('/auth/me', 'GET');
        if (userDetails) {
            if (studentWelcome) studentWelcome.textContent = `Welcome, ${userDetails.email.split('@')[0]}!`; // Display part of email
            if (studentEmailDisplay) studentEmailDisplay.textContent = userDetails.email;
            if (studentIdDisplay) studentIdDisplay.textContent = userDetails.studentId || 'N/A';
            console.log(`[student.js] Student info loaded: Email: ${userDetails.email}, ID: ${userDetails.studentId}`);
        } else {
            console.warn('[student.js] Could not load student details.');
        }

    } catch (error) {
        console.error('[student.js] Error loading student details:', error);
        if (studentEmailDisplay) studentEmailDisplay.textContent = 'Error loading';
        if (studentIdDisplay) studentIdDisplay.textContent = 'Error loading';
    }


    const logoutButtonStudent = document.getElementById('logoutButtonStudent');
    if (logoutButtonStudent) {
        logoutButtonStudent.addEventListener('click', removeTokenAndRedirect);
        console.log('[student.js] Logout button listener attached.');
    } else {
        console.warn('[student.js] Logout button not found.');
    }

    // Attach listeners for navigation buttons
    const navButtons = [
        { id: 'navGiveFeedback', section: 'giveFeedbackSection' },
        { id: 'navMyFeedbackHistory', section: 'myFeedbackHistorySection' }
    ];

    navButtons.forEach(btn => {
        const buttonElement = document.getElementById(btn.id);
        if (buttonElement) {
            buttonElement.addEventListener('click', () => {
                console.log(`[student.js] Navigation button '${btn.id}' clicked. Showing section: ${btn.section}`);
                showSection(btn.section);
            });
            console.log(`[student.js] Listener attached for navigation button: ${btn.id}`);
        } else {
            console.warn(`[student.js] Navigation button element not found: ${btn.id}.`);
        }
    });

    initSubmitFeedbackForm();
    initMyFeedbackHistorySection();

    showSection('giveFeedbackSection'); // Show default section on load
}

/**
 * Sets up the event listener for the Submit Feedback form.
 */
function initSubmitFeedbackForm() {
    console.log('[student.js] Initializing Submit Feedback Form.');
    const submitFeedbackForm = document.getElementById('submitFeedbackForm');
    if (submitFeedbackForm) {
        console.log('[student.js] Submit Feedback Form found, attaching submit listener.');
        submitFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[student.js] Submit Feedback Form submitted.');

            const subjectId = document.getElementById('feedbackSubjectSelectStudent').value;
            const teachingRating = parseInt(document.getElementById('teachingRating').value);
            const knowledgeRating = parseInt(document.getElementById('knowledgeRating').value);
            const behaviorRating = parseInt(document.getElementById('behaviorRating').value);
            const comment = document.getElementById('feedbackComment').value;
            const giveFeedbackMessage = document.getElementById('giveFeedbackMessage');

            // Basic validation for new rating fields
            if (!subjectId || isNaN(teachingRating) || isNaN(knowledgeRating) || isNaN(behaviorRating)) {
                showMessage('giveFeedbackMessage', 'Please select a subject and provide all three ratings (Teaching, Knowledge, Behavior).', 'error');
                console.log('[student.js] Submit Feedback validation failed: missing subject or ratings.');
                return;
            }
            if (teachingRating < 1 || teachingRating > 5 || knowledgeRating < 1 || knowledgeRating > 5 || behaviorRating < 1 || behaviorRating > 5) {
                showMessage('giveFeedbackMessage', 'All ratings must be between 1 and 5.', 'error');
                console.log('[student.js] Submit Feedback validation failed: ratings out of range.');
                return;
            }

            try {
                console.log(`[student.js] Attempting to submit feedback for subject ${subjectId} with ratings: T:${teachingRating}, K:${knowledgeRating}, B:${behaviorRating}`);
                const data = await makeAuthenticatedRequest('/student/submit-feedback', 'POST', {
                    subjectId,
                    teachingRating,
                    knowledgeRating,
                    behaviorRating,
                    comment
                });
                console.log('[student.js] Feedback submitted successfully:', data);
                showMessage('giveFeedbackMessage', data.message, 'success');
                submitFeedbackForm.reset();
                // Optionally, refresh feedback history if 'My Feedback History' is open
                if (document.getElementById('myFeedbackHistorySection') && !document.getElementById('myFeedbackHistorySection').classList.contains('hidden')) {
                    loadMyFeedbackHistory();
                }
            } catch (error) {
                console.error('[student.js] Submit feedback error:', error);
                showMessage('giveFeedbackMessage', error.message || 'Failed to submit feedback.', 'error');
            }
        });

        // Populate subject dropdown when this section is visible or on page load
        const giveFeedbackSection = document.getElementById('giveFeedbackSection');
        if (giveFeedbackSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class' && !giveFeedbackSection.classList.contains('hidden')) {
                        console.log('[student.js] Student Give Feedback Section became visible. Populating subjects.');
                        populateSubjectDropdownsForStudent(); // Call new function
                    }
                });
            });
            observer.observe(giveFeedbackSection, { attributes: true });
        } else {
            console.warn('[student.js] giveFeedbackSection not found for observer.');
        }
    } else {
        console.log('[student.js] Submit Feedback Form not found.');
    }
}

/**
 * Fetches and displays the current student's feedback history in a table.
 */
async function loadMyFeedbackHistory() {
    console.log('[student.js] Loading student\'s feedback history.');
    const myFeedbackTableBody = document.getElementById('myFeedbackTableBody');
    const myFeedbackHistoryMessage = document.getElementById('myFeedbackHistoryMessage');
    if (!myFeedbackTableBody) {
        console.error('[student.js] myFeedbackTableBody element not found.');
        return;
    }

    myFeedbackTableBody.innerHTML = '<tr><td colspan="7">Loading feedback history...</td></tr>';

    try {
        console.log('[student.js] Making API request for student\'s feedback: /student/my-feedback');
        const feedback = await makeAuthenticatedRequest('/student/my-feedback');
        console.log('[student.js] Student feedback fetched successfully:', feedback);
        myFeedbackTableBody.innerHTML = '';

        if (feedback.length === 0) {
            myFeedbackTableBody.innerHTML = '<tr><td colspan="7">You have not submitted any feedback yet.</td></tr>';
            showMessage('myFeedbackHistoryMessage', 'No feedback history found.', 'info');
            return;
        }

        feedback.forEach(f => {
            const row = myFeedbackTableBody.insertRow();
            row.innerHTML = `
                <td>${f.subject ? f.subject.name : 'N/A'}</td>
                <td>${f.section}</td>
                <td>${f.teachingRating ? `${f.teachingRating} / 5` : 'N/A'}</td>
                <td>${f.knowledgeRating ? `${f.knowledgeRating} / 5` : 'N/A'}</td>
                <td>${f.behaviorRating ? `${f.behaviorRating} / 5` : 'N/A'}</td>
                <td>${f.comment || 'No comment'}</td>
                <td>${new Date(f.createdAt).toLocaleDateString()}</td>
            `;
        });
        showMessage('myFeedbackHistoryMessage', `Loaded ${feedback.length} feedback entries.`, 'success');
    } catch (error) {
        console.error('[student.js] Error loading my feedback history:', error);
        myFeedbackTableBody.innerHTML = '<tr><td colspan="7">Failed to load feedback history.</td></tr>';
        showMessage('myFeedbackHistoryMessage', error.message || 'Failed to load feedback history.', 'error');
    }
}

function initMyFeedbackHistorySection() {
    console.log('[student.js] Initializing My Feedback History Section observer.');
    const myFeedbackHistorySection = document.getElementById('myFeedbackHistorySection');
    if (myFeedbackHistorySection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !myFeedbackHistorySection.classList.contains('hidden')) {
                    console.log('[student.js] Student My Feedback History Section became visible. Loading history.');
                    loadMyFeedbackHistory();
                }
            });
        });
        observer.observe(myFeedbackHistorySection, { attributes: true });
    } else {
        console.log('[student.js] My Feedback History Section not found.');
    }
}

/**
 * Populates subject dropdown specifically for the student (only subjects in their section).
 */
async function populateSubjectDropdownsForStudent() {
    console.log('[student.js] Populating student\'s subject dropdowns for their section.');
    const feedbackSubjectSelectStudent = document.getElementById('feedbackSubjectSelectStudent');
    if (!feedbackSubjectSelectStudent) {
        console.error('[student.js] feedbackSubjectSelectStudent element not found.');
        return;
    }

    feedbackSubjectSelectStudent.innerHTML = '<option value="">Loading subjects...</option>';

    try {
        console.log('[student.js] Making API request for student\'s subjects: /student/subjects');
        // Call the new student-specific endpoint
        const subjects = await makeAuthenticatedRequest('/student/subjects');
        console.log('[student.js] Subjects fetched for student\'s section:', subjects);

        feedbackSubjectSelectStudent.innerHTML = '<option value="">-- Choose a Subject --</option>'; // Default option

        if (subjects.length === 0) {
            feedbackSubjectSelectStudent.innerHTML += `<option value="" disabled>No subjects available in your section yet</option>`;
            console.log('[student.js] No subjects found for student\'s section dropdown.');
            return;
        }

        subjects.forEach(subject => {
            const optionHtml = `<option value="${subject._id}">${subject.name} (Section: ${subject.section})</option>`;
            feedbackSubjectSelectStudent.innerHTML += optionHtml;
        });
        console.log('[student.js] Student\'s subject dropdown populated.');
    } catch (error) {
        console.error('[student.js] Error populating student\'s subjects:', error);
        feedbackSubjectSelectStudent.innerHTML = '<option value="" disabled>Error loading subjects</option>';
    }
}

// Redirect to login on logout
function removeTokenAndRedirect() {
    console.log('[student.js] Student Logging out and redirecting. Calling removeToken().');
    removeToken();
    console.log('[student.js] Local storage cleared. Redirecting to /index.html.');
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[student.js] DOMContentLoaded event fired.');
    const currentPage = window.location.pathname;
    const token = getToken();
    const role = getUserRole();

    console.log(`[student.js] On page load: Current Page: ${currentPage}, Token present: ${!!token}, Role: ${role}`);

    if (currentPage === '/student.html' || currentPage === '/student') {
        if (token && role === 'student') {
            console.log('[student.js] User is student and logged in. Loading student dashboard.');
            loadStudentDashboard();
        } else {
            console.log('[student.js] Access denied: Not student or no token. Redirecting to login.');
            removeToken(); // Ensure clean state if access is denied
            window.location.href = '/index.html';
        }
    } else {
        console.log('[student.js] Not on student.html page. No action taken by this script.');
    }
});
