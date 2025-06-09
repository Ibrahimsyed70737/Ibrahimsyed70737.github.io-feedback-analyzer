const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  loginUser,
  getMe, // Import getMe
  addStudent,
  getAllStudents,
  addSubject,
  getAllSubjects,
  getSubjectsBySection,
  addSection,
  getUniqueSections,
  getFeedbackForSubject,
  submitFeedback,
  getMyFeedback,
  getSubjectsForStudentSection,
} = require('../controllers/index');

// --- Public Routes ---
router.post('/auth/login', loginUser);

// --- General Protected Routes (Accessible by both principal and student) ---
router.get('/auth/me', protect, getMe); // NEW: Get current user's profile
router.get('/subjects', protect, getAllSubjects);
router.get('/sections', protect, getUniqueSections);


// --- Principal Routes (Protected and Principal-only) ---
router.post('/principal/add-student', protect, authorize(['principal']), addStudent);
router.get('/principal/students', protect, authorize(['principal']), getAllStudents);
router.post('/principal/add-subject', protect, authorize(['principal']), addSubject);
router.get('/principal/feedback/:subjectId', protect, authorize(['principal']), getFeedbackForSubject);
router.get('/principal/subjects-by-section', protect, authorize(['principal']), getSubjectsBySection);
router.post('/principal/add-section', protect, authorize(['principal']), addSection);

// --- Student Routes (Protected and Student-only) ---
router.post('/student/submit-feedback', protect, authorize(['student']), submitFeedback);
router.get('/student/my-feedback', protect, authorize(['student']), getMyFeedback);
router.get('/student/subjects', protect, authorize(['student']), getSubjectsForStudentSection); // Student-specific subjects

module.exports = router;
