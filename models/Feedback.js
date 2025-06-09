const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Subject model
    ref: 'Subject',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model (for students)
    ref: 'User',
    required: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
  },
  // New rating fields
  teachingRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  knowledgeRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  behaviorRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true
});

// Optional: Add a compound unique index if you want to ensure
// a student can only submit one feedback per subject per section.
FeedbackSchema.index({ student: 1, subject: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
