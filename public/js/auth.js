// public/js/auth.js
import { showMessage, saveToken, saveUserRole, getToken, getUserRole, API_BASE_URL, PRINCIPAL_SELECTED_SECTION_KEY } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[auth.js] DOMContentLoaded event fired.');

    const loginForm = document.getElementById('loginForm');
    const messageElementId = 'message';

    // Check if user is already logged in and redirect if on login page
    const token = getToken(); // This already logs
    const role = getUserRole(); // This already logs
    const currentPage = window.location.pathname;

    console.log(`[auth.js] Current Page: ${currentPage}`);

    if (token && role && (currentPage === '/index.html' || currentPage === '/')) {
        console.log('[auth.js] User is already logged in and on login page, attempting redirect.');
        if (role === 'principal') {
            const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);
            console.log(`[auth.js] Principal selected section from localStorage: '${selectedSection}'`);

            // Check for truthiness AND ensure it's not the string 'undefined' or 'null'
            if (selectedSection && selectedSection !== 'undefined' && selectedSection !== 'null' && selectedSection.trim() !== '') {
                console.log('[auth.js] Redirecting principal to /principal.html (valid selected section found).');
                window.location.href = '/principal.html';
            } else {
                console.log('[auth.js] Redirecting principal to /principalSectionSelect.html (no valid selected section found).');
                window.location.href = '/principalSectionSelect.html';
            }
        } else if (role === 'student') {
            console.log('[auth.js] Redirecting student to /student.html.');
            window.location.href = '/student.html';
        } else {
            console.warn(`[auth.js] Unknown role for already logged-in user: ${role}. Clearing session.`);
            removeToken();
            window.location.href = '/index.html';
        }
    } else {
        console.log('[auth.js] Not logged in, or not on login page. Proceeding with login form setup.');
    }

    // Login Form Logic (only runs if loginForm element exists, i.e., on index.html)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[auth.js] Login form submitted.');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showMessage(messageElementId, 'Please fill in both email and password.', 'error');
                console.log('[auth.js] Login form validation failed: missing email or password.');
                return;
            }

            try {
                console.log('[auth.js] Sending login request to backend...');
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                console.log('[auth.js] Login API response received:', data);

                if (response.ok) {
                    showMessage(messageElementId, data.message, 'success');
                    saveToken(data.token); // This logs
                    saveUserRole(data.role); // This logs

                    if (data.role === 'principal') {
                        const selectedSection = localStorage.getItem(PRINCIPAL_SELECTED_SECTION_KEY);
                        console.log(`[auth.js] Principal login successful. Selected section in localStorage: '${selectedSection}'`);
                        // Re-evaluate redirection after successful login
                        if (selectedSection && selectedSection !== 'undefined' && selectedSection !== 'null' && selectedSection.trim() !== '') {
                            console.log('[auth.js] Redirecting principal to /principal.html (valid selected section found after login).');
                            window.location.href = '/principal.html';
                        } else {
                            console.log('[auth.js] Redirecting principal to /principalSectionSelect.html (no valid selected section after login).');
                            window.location.href = '/principalSectionSelect.html';
                        }
                    } else if (data.role === 'student') {
                        console.log('[auth.js] Redirecting student to /student.html.');
                        window.location.href = '/student.html';
                    } else {
                        console.warn('[auth.js] Login successful, but unknown role:', data.role);
                        showMessage(messageElementId, 'Login successful, but unknown role. Contact support.', 'error');
                        removeToken(); // Clear session if role is unknown
                        // Optionally, redirect to login page
                        window.location.href = '/index.html';
                    }
                } else {
                    console.error('[auth.js] Login failed:', data.message || 'Unknown error.');
                    showMessage(messageElementId, data.message || 'Login failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('[auth.js] Login network or API error:', error);
                showMessage(messageElementId, 'An error occurred during login. Please try again later.', 'error');
            }
        });
    } else {
        console.log('[auth.js] Login form element not found (auth.js is probably not on index.html).');
    }
});
