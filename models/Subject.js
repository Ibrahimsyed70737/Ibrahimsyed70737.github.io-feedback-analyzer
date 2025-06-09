   const mongoose = require('mongoose');

   const SubjectSchema = new mongoose.Schema({
     name: {
       type: String,
       required: true,
       trim: true,
     },
     section: { // To which section this subject belongs
       type: String,
       required: true,
       trim: true,
       uppercase: true // Ensure consistency
     }
   }, {
     timestamps: true
   });

   // Ensure that subject name is unique within a specific section
   // THIS IS THE CORRECT COMPOUND INDEX
   SubjectSchema.index({ name: 1, section: 1 }, { unique: true });

   module.exports = mongoose.model('Subject', SubjectSchema);
   