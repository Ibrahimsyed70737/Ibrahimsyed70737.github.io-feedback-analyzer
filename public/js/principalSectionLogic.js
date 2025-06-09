// public/js/principalSectionLogic.js
import { showMessage, removeToken, makeAuthenticatedRequest, PRINCIPAL_SELECTED_SECTION_KEY } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[principalSectionLogic.js] DOMContentLoaded event fired.');

    const principalSectionSelect = document.getElementById('principalSectionSelect');
    const proceedToDashboardBtn = document.getElementById('proceedToDashboardBtn');
    const logoutButton = document.getElementById('logoutButtonSectionSelect'); // Correct ID for this page's logout
    const sectionSelectionMessage = document.getElementById('sectionSelectionMessage');

    // Add Section elements
    const addSectionForm = document.getElementById('addSectionFormOnSelectPage');
    const sectionNameInput = document.getElementById('sectionNameOnSelectPage');
    const addSectionMessage = document.getElementById('addSectionMessageOnSelectPage');


    // Basic check for essential elements for THIS PAGE
    if (!principalSectionSelect || !proceedToDashboardBtn || !logoutButton ||
        !addSectionForm || !sectionNameInput || !addSectionMessage) {
        console.error('[principalSectionLogic.js] Missing essential elements in principalSectionSelect.html. Please ensure all IDs are correct.');
        showMessage('sectionSelectionMessage', 'Error loading page components. Please ensure all elements are present and IDs match.', 'error');
        return;
    } else {
        console.log('[principalSectionLogic.js] All essential DOM elements found on principalSectionSelect.html.');
    }

    // Attach logout listener
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log('[principalSectionLogic.js] Logout button clicked on section selection page. Calling removeToken().');
            removeToken(); // This clears token, role, and selected section
            console.log('[principalSectionLogic.js] Local storage cleared. Redirecting to /index.html.');
            window.location.href = '/index.html';
        });
    }

    // Populate the section dropdown on page load
    populateSectionDropdown();

    if (proceedToDashboardBtn) {
        proceedToDashboardBtn.addEventListener('click', () => {
            const chosenSection = principalSectionSelect.value;
            console.log(`[principalSectionLogic.js] Proceed to Dashboard button clicked. Chosen section: '${chosenSection}'`);
            if (chosenSection && chosenSection !== 'undefined' && chosenSection !== 'null' && chosenSection.trim() !== '') {
                localStorage.setItem(PRINCIPAL_SELECTED_SECTION_KEY, chosenSection);
                console.log(`[principalSectionLogic.js] Saved selected section to localStorage: '${chosenSection}'. Redirecting to /principal.html.`);
                window.location.href = '/principal.html'; // Redirect to the main principal dashboard
            } else {
                showMessage('sectionSelectionMessage', 'Please select a valid section.', 'error');
                console.log('[principalSectionLogic.js] Invalid or no section selected by principal for proceeding to dashboard.');
            }
        });
    }

    // Add Section Form Submission Logic
    if (addSectionForm) {
        addSectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[principalSectionLogic.js] Add Section Form on Select Page submitted.');

            const sectionName = sectionNameInput.value;

            if (!sectionName) {
                showMessage('addSectionMessageOnSelectPage', 'Please enter a section name.', 'error');
                console.log('[principalSectionLogic.js] Add Section form validation failed: missing section name.');
                return;
            }

            try {
                console.log(`[principalSectionLogic.js] Attempting to add section: ${sectionName}`);
                const data = await makeAuthenticatedRequest('/principal/add-section', 'POST', { name: sectionName });
                console.log('[principalSectionLogic.js] Add section successful:', data);
                showMessage('addSectionMessageOnSelectPage', data.message, 'success');
                addSectionForm.reset(); // Clear form
                populateSectionDropdown(); // Refresh the principal's section selection dropdown with new section
            } catch (error) {
                console.error('[principalSectionLogic.js] Error adding section from select page:', error);
                showMessage('addSectionMessageOnSelectPage', error.message || 'Failed to add section.', 'error');
            }
        });
    }

    /**
     * Populates the dropdown for section selection.
     */
    async function populateSectionDropdown() {
        console.log('[principalSectionLogic.js] Populating section dropdown...');
        principalSectionSelect.innerHTML = '<option value="">Loading sections...</option>';
        try {
            const sections = await makeAuthenticatedRequest('/sections');
            console.log(`[principalSectionLogic.js] Sections fetched successfully: ${sections.length} sections found.`);

            principalSectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
            if (sections.length === 0) {
                principalSectionSelect.innerHTML += '<option value="" disabled>No sections added yet. Please add sections below.</option>';
            } else {
                sections.forEach(section => {
                    const option = `<option value="${section}">${section}</option>`;
                    principalSectionSelect.innerHTML += option;
                });
                console.log(`[principalSectionLogic.js] Sections populated in dropdown. Total: ${sections.length}`);

                // Auto-select the first section if sections exist and none is currently selected
                if (!principalSectionSelect.value && sections.length > 0) {
                    principalSectionSelect.value = sections[0];
                    console.log(`[principalSectionLogic.js] Defaulted selected section to: ${sections[0]}`);
                }
            }
        } catch (error) {
            console.error('[principalSectionLogic.js] Error in populateSectionDropdown:', error);
            principalSectionSelect.innerHTML = '<option value="">Error loading sections</option>';
            showMessage('sectionSelectionMessage', error.message || 'Failed to load sections.', 'error');
        }
    }
});
