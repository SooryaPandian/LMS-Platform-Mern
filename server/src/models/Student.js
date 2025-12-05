const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  guardianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  guardianName: { type: String },
  guardianEmail: { type: String },
  guardianMobile: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
