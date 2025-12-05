const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  credits: { type: Number, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Core', 'Elective', 'Lab', 'Project'] 
  },
  description: { type: String, required: true },
  semester: { type: Number, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
