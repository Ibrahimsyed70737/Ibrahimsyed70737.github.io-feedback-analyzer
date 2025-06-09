const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Ensures section names are unique
    trim: true,
    uppercase: true // Store section names in uppercase for consistency
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Section', SectionSchema);
