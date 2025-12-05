const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Mid', 'Sessional', 'EndSem', 'Assignment', 'Quiz', 'Project'],
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  marks: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },
    enteredAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
assessmentSchema.index({ courseId: 1, classId: 1 });
assessmentSchema.index({ facultyId: 1 });
assessmentSchema.index({ 'marks.studentId': 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
