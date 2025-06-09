// public/js/script.js - Continued with Principal Section Selection Logic

// --- Global Constants ---
const API_BASE_URL = '/api'; // Your backend API base URL
const PRINCIPAL_SELECTED_SECTION_KEY = 'principalSelectedSection'; // localStorage key for principal's selected section

// --- Utility Functions (already existing) ---
// showMessage, saveToken, getToken, removeToken, saveUserRole, getUserRole, makeAuthenticatedRequest
// (No changes to these basic utilities, they are included in the full file at the end)

/**
 * Hides all content sections and shows the specified one.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

/**
 * Handles the user logout process.
 */
function handleLogout() {
    removeToken(); // Clear authentication data
    localStorage.removeItem(PRINCIPAL_SELECTED_SECTION_KEY); // Clear principal's selected section
    window.location.href = '/index.html'; // Redirect to login page
}


// --- Principal Dashboard Specific Logic ---

/**
 * Initializes and loads data for the Principal Dashboard, including section selection.
 */
async function loadPrincipalDashboard() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const changeSectionButton = document.getElementById('changeSectionButton');
    if (changeSectionButton) {
        changeSectionButton.addEventListener('click', () => {
            // Clear selected section and show section selection screen
            localStorage.removeItem(PRINCIPAL_SELECTED_SECTION_KEY);
            document.getElementById('dashboardContentWrapper').classList.add('hidden');
            showSection('sectionSelectionSection');
            populateSectionDropdown(); // Repopulate in case new sections were added
            showMessage('sectionSelectionMessage', 'Please select a section to continue.', 'info');
        });
    }

    const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);
    const dashboardContentWrapper = document.getElementById('dashboardContentWrapper');
    const sectionSelectionSection = document.getElementById('sectionSelectionSection');
    const principalSectionSelect = document.getElementById('principalSectionSelect');
    const proceedToDashboardBtn = document.getElementById('proceedToDashboardBtn');

    if (selectedSection && dashboardContentWrapper) {
        // If a section is already selected in localStorage, skip selection screen
        document.getElementById('currentSectionDisplay').textContent = selectedSection;
        document.getElementById('principalWelcome').textContent = `Welcome, Principal! (${selectedSection})`;
        dashboardContentWrapper.classList.remove('hidden');
        sectionSelectionSection.classList.add('hidden');
        loadPrincipalDataForSection(selectedSection); // Load dashboard data for the selected section
    } else if (sectionSelectionSection) {
        // If no section selected, show section selection screen
        sectionSelectionSection.classList.remove('hidden');
        dashboardContentWrapper.classList.add('hidden');
        populateSectionDropdown(); // Populate sections for selection

        if (proceedToDashboardBtn) {
            proceedToDashboardBtn.addEventListener('click', () => {
                const chosenSection = principalSectionSelect.value;
                if (chosenSection) {
                    localStorage.setItem(PRINCIPAL_SELECTED_SECTION_KEY, chosenSection);
                    document.getElementById('currentSectionDisplay').textContent = chosenSection;
                    document.getElementById('principalWelcome').textContent = `Welcome, Principal! (${chosenSection})`;
                    sectionSelectionSection.classList.add('hidden');
                    dashboardContentWrapper.classList.remove('hidden');
                    loadPrincipalDataForSection(chosenSection); // Load dashboard data for the new section
                } else {
                    showMessage('sectionSelectionMessage', 'Please select a section.', 'error');
                }
            });
        }
    }

    // Initialize all principal dashboard forms and sections (these will mostly trigger loads based on selected section)
    initAddStudentForm();
    initAddSubjectForm();
    initViewStudentsSection();
    initViewFeedbackSection();

    // Show the first content section by default if dashboard is visible
    if (!dashboardContentWrapper.classList.contains('hidden')) {
        showSection('addStudentSection');
    }
}

/**
 * Populates the dropdown for section selection on the principal's initial screen.
 */
async function populateSectionDropdown() {
    const principalSectionSelect = document.getElementById('principalSectionSelect');
    if (!principalSectionSelect) return;

    principalSectionSelect.innerHTML = '<option value="">Loading sections...</option>';
    try {
        const sections = await makeAuthenticatedRequest('/sections'); // Assumes this endpoint returns unique sections
        principalSectionSelect.innerHTML = '<option value="">-- Select Section --</option>'; // Default option
        if (sections.length === 0) {
            principalSectionSelect.innerHTML += '<option value="" disabled>No sections added yet. Add subjects to create sections.</option>';
        } else {
            sections.forEach(section => {
                const option = `<option value="${section}">${section}</option>`;
                principalSectionSelect.innerHTML += option;
            });
        }
    } catch (error) {
        console.error('Error populating section dropdown:', error);
        principalSectionSelect.innerHTML = '<option value="">Error loading sections</option>';
        showMessage('sectionSelectionMessage', error.message || 'Failed to load sections.', 'error');
    }
}

/**
 * Loads all data specific to the selected principal section.
 * This function is called once a section is chosen.
 * @param {string} section - The selected section.
 */
async function loadPrincipalDataForSection(section) {
    // Set the section in the forms that need it
    const studentSectionInput = document.getElementById('studentSection');
    if (studentSectionInput) studentSectionInput.value = section;

    const subjectSectionInput = document.getElementById('subjectSection');
    if (subjectSectionInput) subjectSectionInput.value = section;

    const viewStudentsSectionDisplay = document.getElementById('viewStudentsSectionDisplay');
    if (viewStudentsSectionDisplay) viewStudentsSectionDisplay.textContent = section;

    const viewFeedbackSectionDisplay = document.getElementById('viewFeedbackSectionDisplay');
    if (viewFeedbackSectionDisplay) viewFeedbackSectionDisplay.textContent = section;

    // Trigger data loading for currently visible sections
    // Or just load all relevant data upon section change for initial display
    if (!document.getElementById('addStudentSection').classList.contains('hidden')) {
         // No specific data load for 'Add Student'
    }
    if (!document.getElementById('addSubjectSection').classList.contains('hidden')) {
        // No specific data load for 'Add Subject'
    }
    if (!document.getElementById('viewStudentsSection').classList.contains('hidden')) {
        loadAllStudents(section);
    }
    if (!document.getElementById('viewFeedbackSection').classList.contains('hidden')) {
        populateSubjectDropdowns(section); // Populate subjects specific to this section for feedback view
    }
    // Set first active section
    showSection('addStudentSection');
}


function initAddStudentForm() {
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('studentEmail').value;
            const password = document.getElementById('studentPassword').value;
            const studentId = document.getElementById('studentId').value;
            // The section is now taken from the readonly input, which is set by loadPrincipalDataForSection
            const section = document.getElementById('studentSection').value;
            const addStudentMessage = document.getElementById('addStudentMessage');

            try {
                const data = await makeAuthenticatedRequest('/principal/add-student', 'POST', { email, password, studentId, section });
                showMessage('addStudentMessage', data.message, 'success');
                addStudentForm.reset(); // Clear form
                document.getElementById('studentSection').value = section; // Re-set readonly field
                // Only reload if the view students section is currently active
                if (!document.getElementById('viewStudentsSection').classList.contains('hidden')) {
                    loadAllStudents(section);
                }
            } catch (error) {
                console.error('Add student error:', error);
                showMessage('addStudentMessage', error.message || 'Failed to add student.', 'error');
            }
        });
    }
}

function initAddSubjectForm() {
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('subjectName').value;
            // The section is now taken from the readonly input
            const section = document.getElementById('subjectSection').value;
            const addSubjectMessage = document.getElementById('addSubjectMessage');

            try {
                const data = await makeAuthenticatedRequest('/principal/add-subject', 'POST', { name, section });
                showMessage('addSubjectMessage', data.message, 'success');
                addSubjectForm.reset(); // Clear form
                document.getElementById('subjectSection').value = section; // Re-set readonly field
                populateSubjectDropdowns(section); // Refresh relevant subject lists based on current section
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
    if (!studentsTableBody) return;

    studentsTableBody.innerHTML = '<tr><td colspan="4">Loading students...</td></tr>';

    try {
        // Pass section as a query parameter
        const students = await makeAuthenticatedRequest(`/principal/students?section=${encodeURIComponent(section)}`);
        studentsTableBody.innerHTML = '';

        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="4">No students registered in this section yet.</td></tr>';
            showMessage('viewStudentsMessage', `No students found in section ${section}.`, 'info');
            return;
        }

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
    } catch (error) {
        console.error('Error loading students:', error);
        studentsTableBody.innerHTML = '<tr><td colspan="4">Failed to load students.</td></tr>';
        showMessage('viewStudentsMessage', error.message || 'Failed to load students.', 'error');
    }
}

function initViewStudentsSection() {
    const viewStudentsSection = document.getElementById('viewStudentsSection');
    if (viewStudentsSection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !viewStudentsSection.classList.contains('hidden')) {
                    const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);
                    if (selectedSection) {
                        loadAllStudents(selectedSection);
                    }
                }
            });
        });
        observer.observe(viewStudentsSection, { attributes: true });
    }
}

/**
 * Populates subject dropdowns. For principal, it filters by section. For student, it gets all subjects.
 * @param {string} [section=null] - Optional section to filter subjects by (used for principal).
 */
async function populateSubjectDropdowns(section = null) {
    const feedbackSubjectSelectPrincipal = document.getElementById('feedbackSubjectSelect'); // Principal's dropdown
    const feedbackSubjectSelectStudent = document.getElementById('feedbackSubjectSelectStudent'); // Student's dropdown

    // Initialize with loading message or default option
    if (feedbackSubjectSelectPrincipal) feedbackSubjectSelectPrincipal.innerHTML = '<option value="">Loading subjects...</option>';
    if (feedbackSubjectSelectStudent) feedbackSubjectSelectStudent.innerHTML = '<option value="">Loading subjects...</option>';

    try {
        let subjects;
        if (section) {
            // If section is provided (for principal's view), fetch subjects specific to that section
            subjects = await makeAuthenticatedRequest(`/principal/subjects-by-section?section=${encodeURIComponent(section)}`);
        } else {
            // For students (or general view), fetch all subjects
            subjects = await makeAuthenticatedRequest('/subjects');
        }

        // Clear existing options before populating
        if (feedbackSubjectSelectPrincipal) feedbackSubjectSelectPrincipal.innerHTML = '<option value="">-- Select Subject --</option>';
        if (feedbackSubjectSelectStudent) feedbackSubjectSelectStudent.innerHTML = '<option value="">-- Select Subject --</option>';

        if (subjects.length === 0) {
            const noSubjectsOption = `<option value="" disabled>No subjects added ${section ? `in section ${section}` : ''} yet</option>`;
            if (feedbackSubjectSelectPrincipal) feedbackSubjectSelectPrincipal.innerHTML += noSubjectsOption;
            if (feedbackSubjectSelectStudent) feedbackSubjectSelectStudent.innerHTML += noSubjectsOption;
            return;
        }

        subjects.forEach(subject => {
            const optionHtml = `<option value="${subject._id}">${subject.name} (Section: ${subject.section})</option>`;
            if (feedbackSubjectSelectPrincipal) feedbackSubjectSelectPrincipal.innerHTML += optionHtml;
            if (feedbackSubjectSelectStudent) feedbackSubjectSelectStudent.innerHTML += optionHtml;
        });
    } catch (error) {
        console.error('Error populating subjects:', error);
        const errorOption = '<option value="" disabled>Error loading subjects</option>';
        if (feedbackSubjectSelectPrincipal) feedbackSubjectSelectPrincipal.innerHTML = errorOption;
        if (feedbackSubjectSelectStudent) feedbackSubjectSelectStudent.innerHTML = errorOption;
    }
}

function initViewFeedbackSection() {
    const loadFeedbackButton = document.getElementById('loadFeedbackButton');
    const feedbackSubjectSelect = document.getElementById('feedbackSubjectSelect');
    const viewFeedbackMessage = document.getElementById('viewFeedbackMessage');
    const feedbackResults = document.getElementById('feedbackResults');

    if (loadFeedbackButton && feedbackSubjectSelect) {
        loadFeedbackButton.addEventListener('click', async () => {
            const subjectId = feedbackSubjectSelect.value;
            if (!subjectId) {
                showMessage('viewFeedbackMessage', 'Please select a subject first.', 'error');
                feedbackResults.classList.add('hidden');
                return;
            }

            try {
                const data = await makeAuthenticatedRequest(`/principal/feedback/${subjectId}`);
                document.getElementById('selectedSubjectName').textContent = data.subjectName;
                document.getElementById('selectedSubjectSection').textContent = data.section;
                document.getElementById('feedbackCount').textContent = data.feedbackCount;

                const feedbackTableBody = document.getElementById('feedbackTableBody');
                feedbackTableBody.innerHTML = '';

                if (data.feedbackCount === 0) {
                    feedbackTableBody.innerHTML = '<tr><td colspan="6">No feedback available for this subject yet.</td></tr>';
                } else {
                    data.feedbackDetails.forEach(feedback => {
                        const row = feedbackTableBody.insertRow();
                        row.innerHTML = `
                            <td>${feedback.student ? feedback.student.email : 'N/A'}</td>
                            <td>${feedback.student ? feedback.student.studentId : 'N/A'}</td>
                            <td>${feedback.section}</td>
                            <td>${feedback.rating} / 5</td>
                            <td>${feedback.comment || 'No comment'}</td>
                            <td>${new Date(feedback.createdAt).toLocaleDateString()}</td>
                        `;
                    });
                }
                feedbackResults.classList.remove('hidden');
                showMessage('viewFeedbackMessage', `Loaded ${data.feedbackCount} feedback entries.`, 'success');
            } catch (error) {
                console.error('Error loading feedback:', error);
                showMessage('viewFeedbackMessage', error.message || 'Failed to load feedback.', 'error');
                feedbackResults.classList.add('hidden');
            }
        });

        const viewFeedbackSection = document.getElementById('viewFeedbackSection');
        if (viewFeedbackSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class' && !viewFeedbackSection.classList.contains('hidden')) {
                        const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);
                        if (selectedSection) {
                            populateSubjectDropdowns(selectedSection); // Populate subjects specific to this section
                        }
                    }
                });
            });
            observer.observe(viewFeedbackSection, { attributes: true });
        }
    }
}

// --- Student Dashboard Specific Logic (mostly unchanged, except for populateSubjectDropdowns call) ---

async function loadStudentDashboard() {
    const logoutButtonStudent = document.getElementById('logoutButtonStudent');
    if (logoutButtonStudent) {
        logoutButtonStudent.addEventListener('click', handleLogout);
    }

    initSubmitFeedbackForm();
    initMyFeedbackHistorySection();

    showSection('giveFeedbackSection');
}

function initSubmitFeedbackForm() {
    const submitFeedbackForm = document.getElementById('submitFeedbackForm');
    if (submitFeedbackForm) {
        submitFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subjectId = document.getElementById('feedbackSubjectSelectStudent').value;
            const rating = parseInt(document.getElementById('feedbackRating').value);
            const comment = document.getElementById('feedbackComment').value;
            const giveFeedbackMessage = document.getElementById('giveFeedbackMessage');

            if (!subjectId || isNaN(rating)) {
                showMessage('giveFeedbackMessage', 'Please select a subject and provide a rating.', 'error');
                return;
            }
            if (rating < 1 || rating > 5) {
                showMessage('giveFeedbackMessage', 'Rating must be between 1 and 5.', 'error');
                return;
            }

            try {
                const data = await makeAuthenticatedRequest('/student/submit-feedback', 'POST', { subjectId, rating, comment });
                showMessage('giveFeedbackMessage', data.message, 'success');
                submitFeedbackForm.reset();
                if (!document.getElementById('myFeedbackHistorySection').classList.contains('hidden')) {
                    loadMyFeedbackHistory();
                }
            } catch (error) {
                console.error('Submit feedback error:', error);
                showMessage('giveFeedbackMessage', error.message || 'Failed to submit feedback.', 'error');
            }
        });

        const giveFeedbackSection = document.getElementById('giveFeedbackSection');
        if (giveFeedbackSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'class' && !giveFeedbackSection.classList.contains('hidden')) {
                        populateSubjectDropdowns(); // Student gets all subjects, no section parameter
                    }
                });
            });
            observer.observe(giveFeedbackSection, { attributes: true });
        }
    }
}

async function loadMyFeedbackHistory() {
    const myFeedbackTableBody = document.getElementById('myFeedbackTableBody');
    const myFeedbackHistoryMessage = document.getElementById('myFeedbackHistoryMessage');
    if (!myFeedbackTableBody) return;

    myFeedbackTableBody.innerHTML = '<tr><td colspan="5">Loading feedback history...</td></tr>';

    try {
        const feedback = await makeAuthenticatedRequest('/student/my-feedback');
        myFeedbackTableBody.innerHTML = '';

        if (feedback.length === 0) {
            myFeedbackTableBody.innerHTML = '<tr><td colspan="5">You have not submitted any feedback yet.</td></tr>';
            showMessage('myFeedbackHistoryMessage', 'No feedback history found.', 'info');
            return;
        }

        feedback.forEach(f => {
            const row = myFeedbackTableBody.insertRow();
            row.innerHTML = `
                <td>${f.subject ? f.subject.name : 'N/A'}</td>
                <td>${f.section}</td>
                <td>${f.rating} / 5</td>
                <td>${f.comment || 'No comment'}</td>
                <td>${new Date(f.createdAt).toLocaleDateString()}</td>
            `;
        });
        showMessage('myFeedbackHistoryMessage', `Loaded ${feedback.length} feedback entries.`, 'success');
    } catch (error) {
        console.error('Error loading my feedback history:', error);
        myFeedbackTableBody.innerHTML = '<tr><td colspan="5">Failed to load feedback history.</td></tr>';
        showMessage('myFeedbackHistoryMessage', error.message || 'Failed to load feedback history.', 'error');
    }
}

function initMyFeedbackHistorySection() {
    const myFeedbackHistorySection = document.getElementById('myFeedbackHistorySection');
    if (myFeedbackHistorySection) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !myFeedbackHistorySection.classList.contains('hidden')) {
                    loadMyFeedbackHistory();
                }
            });
        });
        observer.observe(myFeedbackHistorySection, { attributes: true });
    }
}


// --- Initial Page Load & Role-Based Initialization (re-verified) ---

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Logic for the Login Page (index.html)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showMessage('message', 'Please fill in both email and password.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('message', data.message, 'success');
                    saveToken(data.token);
                    saveUserRole(data.role);

                    // Redirect based on user role
                    if (data.role === 'principal') {
                        window.location.href = '/principal.html';
                    } else if (data.role === 'student') {
                        window.location.href = '/student.html';
                    } else {
                        showMessage('message', 'Login successful, but unknown role. Contact support.', 'error');
                        removeToken();
                    }
                } else {
                    showMessage('message', data.message || 'Login failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('message', 'An error occurred during login. Please try again later.', 'error');
            }
        });
    }

    // Logic for handling authenticated pages (principal.html, student.html) and redirects
    const token = getToken();
    const role = getUserRole();
    const currentPage = window.location.pathname;

    if (token && role) {
        // User is logged in
        if (currentPage === '/principal.html') {
            if (role === 'principal') {
                loadPrincipalDashboard(); // Load principal-specific functions
            } else {
                // Logged in as student, but trying to access principal page
                console.log('Access denied: Student trying to access principal page. Redirecting.');
                window.location.href = '/student.html';
            }
        } else if (currentPage === '/student.html') {
            if (role === 'student') {
                loadStudentDashboard(); // Load student-specific functions
            } else {
                // Logged in as principal, but trying to access student page
                console.log('Access denied: Principal trying to access student page. Redirecting.');
                window.location.href = '/principal.html';
            }
        }
        // If on index.html or root path, but already logged in, redirect to appropriate dashboard
        else if (currentPage === '/index.html' || currentPage === '/') {
            if (role === 'principal') {
                window.location.href = '/principal.html';
            } else if (role === 'student') {
                window.location.href = '/student.html';
            }
        }
    } else {
        // User is NOT logged in. If they are on a protected page, redirect to login.
        if (currentPage !== '/index.html' && currentPage !== '/') {
            console.log('No token or role found. Redirecting to login.');
            window.location.href = '/index.html';
        }
    }
});
