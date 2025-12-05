 const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true 
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  unit: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: { 
    type: String, 
    required: true 
  },
  description: {
    type: String
  },
  uploadedBy: { 
    type: String, 
    required: true 
  },
  visibility: { 
    type: String, 
    enum: ['public', 'private'],
    default: 'public'
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseMaterialSchema.index({ courseId: 1, unit: 1 });
courseMaterialSchema.index({ facultyId: 1 });
courseMaterialSchema.index({ courseId: 1, facultyId: 1, unit: 1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
