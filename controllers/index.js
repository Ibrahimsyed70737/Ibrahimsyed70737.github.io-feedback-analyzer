const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Feedback = require('../models/Feedback');
const Section = require('../models/Section');
const mongoose = require('mongoose');

// --- Helper function to generate JWT token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// --- Auth Controllers ---
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: 'Login successful'
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
};

// @desc    Get current authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // req.user is populated by the protect middleware
  const user = await User.findById(req.user.id).select('-password'); // Exclude password
  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      studentId: user.studentId, // Include studentId
      section: user.section // Include section
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};


// --- Principal Controllers ---

// @desc    Add a new student
// @route   POST /api/principal/add-student
// @access  Private/Principal
const addStudent = async (req, res) => {
  const { email, password, studentId, section } = req.body;

  if (!email || !password || !studentId || !section) {
    return res.status(400).json({ message: 'Please enter all student fields (email, password, studentId, section)' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Student with this email or Student ID already exists' });
    }

    const sectionExists = await Section.findOne({ name: section });
    if (!sectionExists) {
        return res.status(400).json({ message: `Section '${section}' does not exist. Please add it first.` });
    }

    const newStudent = await User.create({
      email,
      password,
      role: 'student',
      studentId,
      section,
    });

    if (newStudent) {
      res.status(201).json({
        _id: newStudent._id,
        email: newStudent.email,
        studentId: newStudent.studentId,
        section: newStudent.section,
        message: 'Student added successfully'
      });
    } else {
      res.status(400).json({ message: 'Invalid student data' });
    }
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Server error when adding student', error: error.message });
  }
};

// @desc    Get all students (for principal to view, with optional section filter)
// @route   GET /api/principal/students
// @access  Private/Principal
const getAllStudents = async (req, res) => {
  try {
    const { section } = req.query;

    let query = { role: 'student' };
    if (section) {
      query.section = section;
    }

    const students = await User.find(query).select('-password');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error when fetching students', error: error.message });
  }
};

// @desc    Add a new subject
// @route   POST /api/principal/add-subject
// @access  Private/Principal
const addSubject = async (req, res) => {
  const { name, section } = req.body;

  if (!name || !section) {
    return res.status(400).json({ message: 'Please enter subject name and section' });
  }

  try {
    const sectionExists = await Section.findOne({ name: section });
    if (!sectionExists) {
        return res.status(400).json({ message: `Section '${section}' does not exist. Please add it first.` });
    }

    const existingSubject = await Subject.findOne({ name, section });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject with this name already exists in this section' });
    }

    const newSubject = await Subject.create({
      name,
      section,
    });

    res.status(201).json({
      _id: newSubject._id,
      name: newSubject.name,
      section: newSubject.section,
      message: 'Subject added successfully'
    });
  }
  catch (error) {
    console.error('Error adding subject:', error);
    // Specifically check for duplicate key errors for compound index
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject with this name already exists in this section.' });
    }
    res.status(500).json({ message: 'Server error when adding subject', error: error.message });
  }
};

// @desc    Get all subjects (for general listing, like principal's general subjects view)
// @route   GET /api/subjects
// @access  Private (accessible by both principal and student for specific use cases)
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error when fetching subjects', error: error.message });
  }
};

// @desc    Get subjects by specific section (for principal's dropdowns)
// @route   GET /api/principal/subjects-by-section
// @access  Private/Principal
const getSubjectsBySection = async (req, res) => {
  try {
    const { section } = req.query;
    if (!section) {
        return res.status(400).json({ message: 'Section query parameter is required.' });
    }
    const subjects = await Subject.find({ section: section });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects by section:', error);
    res.status(500).json({ message: 'Server error when fetching subjects by section', error: error.message });
  }
};

// @desc    Add a new section
// @route   POST /api/principal/add-section
// @access  Private/Principal
const addSection = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Please enter section name.' });
  }

  try {
    const formattedName = name.trim().toUpperCase();

    const existingSection = await Section.findOne({ name: formattedName });
    if (existingSection) {
      return res.status(400).json({ message: `Section '${formattedName}' already exists.` });
    }

    const newSection = await Section.create({ name: formattedName });
    res.status(201).json({
      _id: newSection._id,
      name: newSection.name,
      message: `Section '${newSection.name}' added successfully.`
    });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({ message: 'Server error when adding section.', error: error.message });
  }
};

// @desc    Get all unique sections (fetched from Section model)
// @route   GET /api/sections
// @access  Private (accessible by both principal and student)
const getUniqueSections = async (req, res) => {
  try {
    const sections = await Section.find({}).select('name -_id').lean();
    const sectionNames = sections.map(s => s.name);
    res.status(200).json(sectionNames);
  } catch (error) {
    console.error('Error fetching unique sections:', error);
    res.status(500).json({ message: 'Server error when fetching unique sections', error: error.message });
  }
};


// @desc    Get feedback for a specific subject (for principal), with analysis
// @route   GET /api/principal/feedback/:subjectId
// @access  Private/Principal
const getFeedbackForSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid Subject ID format' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const feedback = await Feedback.find({ subject: subjectId })
      .populate('student', 'email studentId')
      .sort({ createdAt: -1 });

    // Identify students who haven't submitted feedback in this subject/section
    const allStudentsInSection = await User.find({ role: 'student', section: subject.section }).select('_id email studentId');
    const submittedStudentIds = new Set();
    feedback.forEach(f => {
        if (f.student && f.student._id) {
            submittedStudentIds.add(f.student._id.toString());
        }
    });

    const unsubmittedStudents = allStudentsInSection.filter(student => !submittedStudentIds.has(student._id.toString()));


    // --- Perform Feedback Analysis (for principal) ---
    let teachingSum = 0, knowledgeSum = 0, behaviorSum = 0;
    let positiveRatingsCount = 0; // Based on average rating for overall sentiment
    let neutralRatingsCount = 0;
    let negativeRatingsCount = 0;
    let totalRatings = feedback.length;

    feedback.forEach(f => {
        teachingSum += f.teachingRating || 0;
        knowledgeSum += f.knowledgeRating || 0;
        behaviorSum += f.behaviorRating || 0;

        const avgOverallRating = (f.teachingRating + f.knowledgeRating + f.behaviorRating) / 3;
        if (avgOverallRating >= 3.5) {
            positiveRatingsCount++;
        } else if (avgOverallRating <= 2.5) {
            negativeRatingsCount++;
        } else {
            neutralRatingsCount++;
        }
    });

    const averageRatings = {
        teaching: totalRatings > 0 ? (teachingSum / totalRatings).toFixed(2) : 'N/A',
        knowledge: totalRatings > 0 ? (knowledgeSum / totalRatings).toFixed(2) : 'N/A',
        behavior: totalRatings > 0 ? (behaviorSum / totalRatings).toFixed(2) : 'N/A',
    };


    res.status(200).json({
      subjectName: subject.name,
      section: subject.section,
      totalFeedbackEntries: totalRatings,
      feedbackDetails: feedback, // Send raw comments to frontend for sentiment analysis
      analysis: {
          overallSentiment: {
              positive: positiveRatingsCount,
              neutral: neutralRatingsCount,
              negative: negativeRatingsCount,
          },
          averageRatings: averageRatings,
          unsubmittedStudents: unsubmittedStudents.map(s => ({
              email: s.email,
              studentId: s.studentId
          }))
      }
    });
  } catch (error) {
    console.error('Error fetching feedback for subject:', error);
    res.status(500).json({ message: 'Server error when fetching feedback', error: error.message });
  }
};

// --- Student Controllers ---

// @desc    Get subjects for the authenticated student's section
// @route   GET /api/student/subjects
// @access  Private/Student
const getSubjectsForStudentSection = async (req, res) => {
    try {
        const student = req.user; // User object attached by protect middleware
        if (!student || !student.section) {
            return res.status(400).json({ message: 'Student section could not be determined.' });
        }
        const subjects = await Subject.find({ section: student.section });
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Error fetching subjects for student section:', error);
        res.status(500).json({ message: 'Server error when fetching subjects for student section', error: error.message });
    }
};


// @desc    Submit feedback for a subject
// @route   POST /api/student/submit-feedback
// @access  Private/Student
const submitFeedback = async (req, res) => {
  const { subjectId, teachingRating, knowledgeRating, behaviorRating, comment } = req.body;
  const studentId = req.user._id;

  if (!subjectId || !teachingRating || !knowledgeRating || !behaviorRating) {
    return res.status(400).json({ message: 'Please provide subject and all three ratings.' });
  }
  if (teachingRating < 1 || teachingRating > 5 || knowledgeRating < 1 || knowledgeRating > 5 || behaviorRating < 1 || behaviorRating > 5) {
    return res.status(400).json({ message: 'All ratings must be between 1 and 5.' });
  }

  try {
    const studentUser = await User.findById(studentId).select('section');
    if (!studentUser || !studentUser.section) {
        return res.status(400).json({ message: 'Could not determine student section.' });
    }
    const studentSection = studentUser.section;

    const existingFeedback = await Feedback.findOne({
      student: studentId,
      subject: subjectId,
      section: studentSection
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this subject.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }
    if (subject.section !== studentSection) {
        return res.status(403).json({ message: 'You can only submit feedback for subjects in your section.' });
    }

    const newFeedback = await Feedback.create({
      subject: subjectId,
      student: studentId,
      section: studentSection,
      teachingRating,
      knowledgeRating,
      behaviorRating,
      comment,
    });

    res.status(201).json({
      _id: newFeedback._id,
      subject: newFeedback.subject,
      student: newFeedback.student,
      message: 'Feedback submitted successfully',
      ratings: {
          teaching: newFeedback.teachingRating,
          knowledge: newFeedback.knowledgeRating,
          behavior: newFeedback.behaviorRating,
      }
    });

  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: 'You have already submitted feedback for this subject in this section.' });
    }
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error when submitting feedback', error: error.message });
  }
};


// @desc    Get all feedback submitted by a specific student
// @route   GET /api/student/my-feedback
// @access  Private/Student
const getMyFeedback = async (req, res) => {
  try {
    const studentId = req.user._id;

    const feedback = await Feedback.find({ student: studentId })
      .populate('subject', 'name section')
      .sort({ createdAt: -1 });

    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching student\'s feedback:', error);
    res.status(500).json({ message: 'Server error when fetching feedback', error: error.message });
  }
};


module.exports = {
  loginUser,
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
  getMe,
};
