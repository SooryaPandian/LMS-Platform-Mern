const mongoose = require('mongoose');

const courseAllocationSchema = new mongoose.Schema({
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  semester: { 
    type: Number, 
    required: true,
    min: 1,
    max: 8
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  facultyIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Faculty' 
  }]
}, {
  timestamps: true
});

// Compound unique index to ensure one allocation per class/semester/course combination
courseAllocationSchema.index({ classId: 1, semester: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CourseAllocation', courseAllocationSchema);
