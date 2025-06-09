// public/js/utils.js

// --- Global Constants ---
export const API_BASE_URL = '/api'; // Your backend API base URL
export const PRINCIPAL_SELECTED_SECTION_KEY = 'principalSelectedSection'; // localStorage key for principal's selected section

// --- Utility Functions ---

/**
 * Displays a temporary message to the user on the UI.
 * @param {string} elementId - The ID of the HTML element where the message should be displayed.
 * @param {string} message - The message text to display.
 * @param {string} type - The type of message (e.g., 'info', 'success', 'error'). Adds a corresponding CSS class.
 */
export function showMessage(elementId, message, type = 'info') {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message show ${type}`; // Add 'show' and type class
        // Hide message after 5 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
            // Clear message after animation for accessibility/cleanliness
            setTimeout(() => { messageElement.textContent = ''; }, 300);
        }, 5000);
    }
}

/**
 * Saves the JWT token to local storage.
 * @param {string} token - The JWT token received from the backend.
 */
export function saveToken(token) {
    localStorage.setItem('token', token);
    console.log(`[utils.js] Token saved. Current token: ${localStorage.getItem('token') ? 'present' : 'absent'}`);
}

/**
 * Retrieves the JWT token from local storage.
 * @returns {string | null} The JWT token or null if not found.
 */
export function getToken() {
    const token = localStorage.getItem('token');
    console.log(`[utils.js] getToken called. Token found: ${token ? 'true' : 'false'}`);
    return token;
}

/**
 * Removes the JWT token and user role from local storage (for logout).
 */
export function removeToken() {
    console.log('[utils.js] removeToken called. Current localStorage items before clear:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`- ${key}: ${localStorage.getItem(key)}`);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem(PRINCIPAL_SELECTED_SECTION_KEY);
    console.log('[utils.js] Token, userRole, and principalSelectedSection removed from localStorage.');

    console.log('[utils.js] Current localStorage items AFTER clear:');
    if (localStorage.length === 0) {
        console.log('- (empty)');
    } else {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`- ${key}: ${localStorage.getItem(key)}`);
        }
    }
}

/**
 * Saves the user's role to local storage.
 * @param {string} role - The role of the user (e.g., 'principal', 'student').
 */
export function saveUserRole(role) {
    localStorage.setItem('userRole', role);
    console.log(`[utils.js] User role saved: ${role}. Current role: ${localStorage.getItem('userRole')}`);
}

/**
 * Retrieves the user's role from local storage.
 * @returns {string | null} The user's role or null if not found.
 */
export function getUserRole() {
    const role = localStorage.getItem('userRole');
    console.log(`[utils.js] getUserRole called. Role found: ${role ? 'true' : 'false'} (${role})`);
    return role;
}

/**
 * Makes an authenticated API request to the backend.
 * Automatically attaches the JWT token from local storage.
 * Handles redirection to login if no token is found or token is invalid.
 * @param {string} url - The API endpoint path (e.g., '/principal/add-student').
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {object} [body=null] - The request body for POST/PUT requests.
 * @returns {Promise<object>} The JSON response data from the API.
 * @throws {Error} If the request fails or unauthorized.
 */
export async function makeAuthenticatedRequest(url, method = 'GET', body = null) {
    const token = getToken();
    if (!token) {
        console.error('[utils.js] No authentication token found for request. Redirecting to login.');
        window.location.href = '/index.html';
        throw new Error('No authentication token found. Please log in.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        console.log(`[utils.js] Making authenticated request: ${method} ${API_BASE_URL}${url}`);
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();
        console.log(`[utils.js] Response for ${url}:`, { status: response.status, data });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error(`[utils.js] Unauthorized or Forbidden access (${response.status}). Clearing token and redirecting.`);
                removeToken(); // Clear invalid token
                window.location.href = '/index.html'; // Redirect to login
            }
            throw new Error(data.message || `API request failed with status ${response.status}.`);
        }

        return data;
    } catch (error) {
        console.error(`[utils.js] Network or API request error for ${url}:`, error);
        throw error;
    }
}

/**
 * Performs a simple rule-based sentiment analysis on a text comment.
 * @param {string} comment - The text comment to analyze.
 * @returns {'positive' | 'neutral' | 'negative'} The sentiment category.
 */
export function analyzeCommentSentiment(comment) {
    if (!comment || comment.trim() === '') {
        return 'neutral';
    }

    const lowerComment = comment.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    // Positive keywords
    const positiveWords = ['great', 'excellent', 'good', 'fantastic', 'amazing', 'helpful', 'clear', 'engaging', 'well', 'best', 'love', 'enjoy', 'impressed', 'strong', 'effective'];
    // Negative keywords
    const negativeWords = ['poor', 'bad', 'weak', 'confusing', 'boring', 'unhelpful', 'terrible', 'worst', 'disappointed', 'struggle', 'lack', 'issues', 'difficult'];

    positiveWords.forEach(word => {
        if (lowerComment.includes(word)) {
            positiveScore++;
        }
    });

    negativeWords.forEach(word => {
        if (lowerComment.includes(word)) {
            negativeScore++;
        }
    });

    // Consider simple negations
    if (lowerComment.includes('not good') || lowerComment.includes('not clear') || lowerComment.includes('not helpful')) {
        negativeScore++;
        positiveScore--; // Reduce positive score if a positive word is negated
    }

    if (lowerComment.includes('no issues') || lowerComment.includes('not bad')) {
        positiveScore++;
        negativeScore--; // Reduce negative score if a negative word is negated
    }


    if (positiveScore > negativeScore) {
        return 'positive';
    } else if (negativeScore > positiveScore) {
        return 'negative';
    } else {
        return 'neutral'; // If scores are equal or no keywords found
    }
}
