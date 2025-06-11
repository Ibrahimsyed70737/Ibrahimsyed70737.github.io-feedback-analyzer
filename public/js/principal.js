// public/js/principal.js
import { showMessage, removeToken, makeAuthenticatedRequest, getToken, getUserRole, PRINCIPAL_SELECTED_SECTION_KEY, analyzeCommentSentiment } from './utils.js';

// --- Core Dashboard UI Functions ---

/**
 * Hides all content sections and shows the specified one.
 * This is specific to the principal dashboard's tab navigation.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    document.querySelectorAll('.dashboard-content .content-section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

// --- Principal Dashboard Specific Logic ---

/**
 * Initializes and loads data for the Principal Dashboard, assuming a section is already selected.
 */
async function loadPrincipalDashboard() {
    const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);

    // Ensure selectedSection is valid before proceeding
    if (!selectedSection || selectedSection === 'undefined' || selectedSection === 'null' || selectedSection.trim() === '') {
        console.error('No valid section selected for principal. Redirecting to section selection.');
        removeToken(); // Invalidate session as state is inconsistent
        window.location.href = '/principalSectionSelect.html';
        return;
    }

    const currentSectionDisplay = document.getElementById('currentSectionDisplay');
    const principalWelcome = document.getElementById('principalWelcome');
    if (currentSectionDisplay) currentSectionDisplay.textContent = selectedSection;
    if (principalWelcome) principalWelcome.textContent = `Welcome, Principal! (Section: ${selectedSection})`;

    // Attach logout listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', removeTokenAndRedirect);
    }

    // Attach change section listener - will redirect back to section selection page
    const changeSectionButton = document.getElementById('changeSectionButton');
    if (changeSectionButton) {
        changeSectionButton.addEventListener('click', () => {
            localStorage.removeItem(PRINCIPAL_SELECTED_SECTION_KEY); // Clear selected section
            window.location.href = '/principalSectionSelect.html';
        });
    }

    // Attach listeners for navigation buttons
    const navButtons = [
        { id: 'navAddStudent', section: 'addStudentSection' },
        { id: 'navAddSubject', section: 'addSubjectSection' },
        { id: 'navViewStudents', section: 'viewStudentsSection' },
        { id: 'navViewFeedback', section: 'viewFeedbackSection' }
    ];

    navButtons.forEach(btn => {
        const buttonElement = document.getElementById(btn.id);
        if (buttonElement) {
            buttonElement.addEventListener('click', () => {
                showSection(btn.section);
            });
        }
    });

    // Initialize all principal dashboard forms and sections (passing the selected section)
    initAddStudentForm(selectedSection);
    initAddSubjectForm(selectedSection);
    initViewStudentsSection(selectedSection);
    initViewFeedbackSection(selectedSection);

    // Show the initial content section
    showSection('addStudentSection'); // Default to Add Student
}


/**
 * Loads all data specific to the selected principal section.
 * This function is called once a section is chosen (now by principalSectionLogic.js).
 * @param {string} section - The selected section.
 */
async function loadPrincipalDataForSection(section) {
    const studentSectionInput = document.getElementById('studentSection');
    if (studentSectionInput) {
        studentSectionInput.value = section;
    }

    const subjectSectionInput = document.getElementById('subjectSection');
    if (subjectSectionInput) {
        subjectSectionInput.value = section;
    }

    const viewStudentsSectionDisplay = document.getElementById('viewStudentsSectionDisplay');
    if (viewStudentsSectionDisplay) {
        viewStudentsSectionDisplay.textContent = section;
    }

    const viewFeedbackSectionDisplay = document.getElementById('viewFeedbackSectionDisplay');
    if (viewFeedbackSectionDisplay) {
        viewFeedbackSectionDisplay.textContent = section;
    }

    // Trigger data loading for currently visible sections that depend on the section
    if (document.getElementById('viewStudentsSection') && !document.getElementById('viewStudentsSection').classList.contains('hidden')) {
        loadAllStudents(section);
    }
    if (document.getElementById('viewFeedbackSection') && !document.getElementById('viewFeedbackSection').classList.contains('hidden')) {
        populateSubjectDropdownsForPrincipal(section);
    }
    // Set initial active section after dashboard loads
    showSection('addStudentSection');
}


function initAddStudentForm(section) {
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        // Set the section in the form on initialization
        const studentSectionInput = document.getElementById('studentSection');
        if (studentSectionInput) {
            studentSectionInput.value = section;
        }

        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('studentEmail').value;
            const password = document.getElementById('studentPassword').value;
            const studentId = document.getElementById('studentId').value;
            const currentSection = document.getElementById('studentSection').value; // Get section from readonly input
            const addStudentMessage = document.getElementById('addStudentMessage');

            try {
                const data = await makeAuthenticatedRequest('/principal/add-student', 'POST', { email, password, studentId, section: currentSection });
                showMessage('addStudentMessage', data.message, 'success');
                addStudentForm.reset(); // Clear form
                document.getElementById('studentSection').value = currentSection; // Re-set readonly field
                // Re-load students if the view students section is active
                if (document.getElementById('viewStudentsSection') && !document.getElementById('viewStudentsSection').classList.contains('hidden')) {
                    loadAllStudents(currentSection);
                }
            } catch (error) {
                console.error('Add student error:', error);
                showMessage('addStudentMessage', error.message || 'Failed to add student.', 'error');
            }
        });
    }
}

function initAddSubjectForm(section) {
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        // Set the section in the form on initialization
        const subjectSectionInput = document.getElementById('subjectSection');
        if (subjectSectionInput) {
            subjectSectionInput.value = section;
        }

        addSubjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('subjectName').value;
            const currentSection = document.getElementById('subjectSection').value;
            const addSubjectMessage = document.getElementById('addSubjectMessage');

            try {
                const data = await makeAuthenticatedRequest('/principal/add-subject', 'POST', { name, section: currentSection });
                showMessage('addSubjectMessage', data.message, 'success');
                addSubjectForm.reset();
                document.getElementById('subjectSection').value = currentSection;
                // Refresh subjects in the feedback dropdown if that section is active
                if (document.getElementById('viewFeedbackSection') && !document.getElementById('viewFeedbackSection').classList.contains('hidden')) {
                    populateSubjectDropdownsForPrincipal(currentSection);
                }
            } catch (error) {
                console.error('Add subject error:', error);
                showMessage('addSubjectMessage', error.message || 'Failed to add subject.', 'error');
            }
        });
    }
}


/**
 * Fetches and displays all registered students, filtered by the given section.
 * @param {string} section - The section to filter students by.
 */
async function loadAllStudents(section) {
    const studentsTableBody = document.getElementById('studentsTableBody');
    const viewStudentsMessage = document.getElementById('viewStudentsMessage');
    if (!studentsTableBody) {
        console.error('studentsTableBody element not found.');
        return;
    }

    studentsTableBody.innerHTML = '<tr><td colspan="4">Loading students...</td></tr>';

    try {
        const students = await makeAuthenticatedRequest(`/principal/students?section=${encodeURIComponent(section)}`);
        studentsTableBody.innerHTML = '';

        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="4">No students registered in this section yet.</td></tr>';
            showMessage('viewStudentsMessage', `No students found in section ${section}.`, 'info');
        } else {
            students.forEach(student => {
                const row = studentsTableBody.insertRow();
                row.innerHTML = `
                    <td>${student.email}</td>
                    <td>${student.studentId}</td>
                    <td>${student.section}</td>
                    <td>${new Date(student.createdAt).toLocaleDateString()}</td>
                `;
            });
            showMessage('viewStudentsMessage', `Loaded ${students.length} students in section ${section}.`, 'success');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        studentsTableBody.innerHTML = '<tr><td colspan="4">Failed to load students.</td></tr>';
        showMessage('viewStudentsMessage', error.message || 'Failed to load students.', 'error');
    }
}

function initViewStudentsSection(section) {
    const viewStudentsSection = document.getElementById('viewStudentsSection');
    if (viewStudentsSection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !viewStudentsSection.classList.contains('hidden')) {
                    loadAllStudents(section);
                }
            });
        });
        observer.observe(viewStudentsSection, { attributes: true });
    }
}

/**
 * Populates subject dropdown specifically for the principal, filtered by selected section.
 * @param {string} section - The section to filter subjects by.
 */
async function populateSubjectDropdownsForPrincipal(section) {
    const feedbackSubjectSelectPrincipal = document.getElementById('feedbackSubjectSelect');
    if (!feedbackSubjectSelectPrincipal) {
        console.error('feedbackSubjectSelectPrincipal element not found.');
        return;
    }

    feedbackSubjectSelectPrincipal.innerHTML = '<option value="">Loading subjects...</option>';

    try {
        const subjects = await makeAuthenticatedRequest(`/principal/subjects-by-section?section=${encodeURIComponent(section)}`);

        feedbackSubjectSelectPrincipal.innerHTML = '<option value="">-- Select Subject --</option>'; // Default option

        if (subjects.length === 0) {
            feedbackSubjectSelectPrincipal.innerHTML += `<option value="" disabled>No subjects added in section ${section} yet</option>`;
            return;
        }

        subjects.forEach(subject => {
            const optionHtml = `<option value="${subject._id}">${subject.name} (Section: ${subject.section})</option>`;
            feedbackSubjectSelectPrincipal.innerHTML += optionHtml;
        });
    }
    catch (error) {
        console.error('Error populating principal\'s subjects:', error);
        feedbackSubjectSelectPrincipal.innerHTML = '<option value="" disabled>Error loading subjects</option>';
    }
}

function initViewFeedbackSection(section) {
    const loadFeedbackButton = document.getElementById('loadFeedbackButton');
    const feedbackSubjectSelect = document.getElementById('feedbackSubjectSelect');
    const viewFeedbackMessage = document.getElementById('viewFeedbackMessage');
    const feedbackAnalysisResults = document.getElementById('feedbackAnalysisResults');

    if (loadFeedbackButton && feedbackSubjectSelect) {
        loadFeedbackButton.addEventListener('click', async () => {
            const subjectId = feedbackSubjectSelect.value;
            if (!subjectId) {
                showMessage('viewFeedbackMessage', 'Please select a subject first.', 'error');
                feedbackAnalysisResults.classList.add('hidden');
                return;
            }

            try {
                const data = await makeAuthenticatedRequest(`/principal/feedback/${subjectId}`);

                // Initialize sentiment counters for comments
                let commentPositiveCount = 0;
                let commentNeutralCount = 0;
                let commentNegativeCount = 0;

                // Populate Individual Feedback Details Table and analyze comment sentiment
                const feedbackTableBody = document.getElementById('feedbackTableBody');
                feedbackTableBody.innerHTML = ''; // Clear previous feedback

                if (data.feedbackDetails.length === 0) {
                    // Adjusted colspan to 5 (Section, Teaching, Knowledge, Behavior, Comment, Submitted At)
                    feedbackTableBody.innerHTML = '<tr><td colspan="5">No individual feedback available for this subject yet.</td></tr>';
                } else {
                    data.feedbackDetails.forEach(feedback => {
                        const commentSentiment = analyzeCommentSentiment(feedback.comment); // Analyze comment
                        if (commentSentiment === 'positive') commentPositiveCount++;
                        else if (commentSentiment === 'neutral') commentNeutralCount++;
                        else commentNegativeCount++;

                        const row = feedbackTableBody.insertRow();
                        row.innerHTML = `
                            <td>${feedback.section}</td>
                            <td>${feedback.teachingRating ? `${feedback.teachingRating} / 5` : 'N/A'}</td>
                            <td>${feedback.knowledgeRating ? `${feedback.knowledgeRating} / 5` : 'N/A'}</td>
                            <td>${feedback.behaviorRating ? `${feedback.behaviorRating} / 5` : 'N/A'}</td>
                            <td>${feedback.comment || 'No comment'}</td>
                            <td>${new Date(feedback.createdAt).toLocaleDateString()}</td>
                        `;
                    });
                }

                // Populate general info
                document.getElementById('analysisSubjectName').textContent = data.subjectName;
                document.getElementById('totalFeedbackEntries').textContent = data.totalFeedbackEntries;

                // Populate Overall Sentiment Overview (from Ratings)
                document.getElementById('sentimentPositive').textContent = data.analysis.overallSentiment.positive;
                document.getElementById('sentimentNeutral').textContent = data.analysis.overallSentiment.neutral;
                document.getElementById('sentimentNegative').textContent = data.analysis.overallSentiment.negative;

                // Populate Average Ratings
                document.getElementById('avgTeachingRating').textContent = data.analysis.averageRatings.teaching;
                document.getElementById('avgKnowledgeRating').textContent = data.analysis.averageRatings.knowledge;
                document.getElementById('avgBehaviorRating').textContent = data.analysis.averageRatings.behavior;

                // Populate Comment Sentiment Breakdown (using frontend analysis)
                document.getElementById('commentSentimentPositive').textContent = commentPositiveCount;
                document.getElementById('commentSentimentNeutral').textContent = commentNeutralCount;
                document.getElementById('commentSentimentNegative').textContent = commentNegativeCount;


                // Populate Unsubmitted Students
                const unsubmittedStudentsList = document.getElementById('unsubmittedStudentsList');
                unsubmittedStudentsList.innerHTML = ''; // Clear previous list
                if (data.analysis.unsubmittedStudents && data.analysis.unsubmittedStudents.length > 0) {
                    data.analysis.unsubmittedStudents.forEach(student => {
                        const li = document.createElement('li');
                        li.textContent = `${student.email} (ID: ${student.studentId})`;
                        unsubmittedStudentsList.appendChild(li);
                    });
                } else {
                    unsubmittedStudentsList.innerHTML = '<li>All students have submitted feedback for this subject, or no students registered in this section yet.</li>';
                }

                feedbackAnalysisResults.classList.remove('hidden'); // Show the analysis results section
                showMessage('viewFeedbackMessage', `Loaded feedback analysis for ${data.subjectName}.`, 'success');
            } catch (error) {
                console.error('Error loading feedback analysis:', error);
                showMessage('viewFeedbackMessage', error.message || 'Failed to load feedback analysis.', 'error');
                feedbackAnalysisResults.classList.add('hidden'); // Keep results hidden on error
            }
        });

        const viewFeedbackSection = document.getElementById('viewFeedbackSection');
        if (viewFeedbackSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class' && !viewFeedbackSection.classList.contains('hidden')) {
                        populateSubjectDropdownsForPrincipal(section);
                    }
                });
            });
            observer.observe(viewFeedbackSection, { attributes: true });
        }
    }
}

// Redirect to login on logout
function removeTokenAndRedirect() {
    removeToken(); // This function from utils already clears everything including PRINCIPAL_SELECTED_SECTION_KEY
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    const token = getToken();
    const role = getUserRole();
    const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);

    if (currentPage === '/principal.html' || currentPage === '/principal') {
        if (token && role === 'principal') {
            if (selectedSection && selectedSection !== 'undefined' && selectedSection !== 'null' && selectedSection.trim() !== '') {
                loadPrincipalDashboard();
            } else {
                removeToken(); // Ensure clean state if principal lands here without a section
                window.location.href = '/principalSectionSelect.html';
            }
        } else {
            removeToken(); // Ensure clean state if access is denied
            window.location.href = '/index.html'; // Redirect to login
        }
    }
});
