const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  classId: { type: String, required: true },
  studentId: { type: String, required: true },
  componentMarks: {
    mid: { type: Number, default: 0 },
    sessional: { type:Number, default: 0 },
    endsem: { type: Number, default: 0 }
  },
  total: { type: Number, default: 0 },
  grade: { type: String, default: '' },
  enteredBy: { type: String, required: true }
}, {
  timestamps: true
});

// Ensure unique combination of classId and studentId
marksSchema.index({ classId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
