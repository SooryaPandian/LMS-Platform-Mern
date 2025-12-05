const mongoose = require('mongoose');

const courseAssignmentSchema = new mongoose.Schema({
  regulationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Regulation',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
courseAssignmentSchema.index({ 
  regulationId: 1, 
  departmentId: 1, 
  batchId: 1, 
  semesterNumber: 1 
});

// Unique index to prevent duplicate assignments
courseAssignmentSchema.index({
  regulationId: 1,
  departmentId: 1,
  batchId: 1,
  semesterNumber: 1,
  courseId: 1
}, { unique: true });

module.exports = mongoose.model('CourseAssignment', courseAssignmentSchema);
