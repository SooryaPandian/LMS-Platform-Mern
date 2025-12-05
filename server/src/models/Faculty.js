const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  designation: { type: String },
  qualification: { type: String },
  experience: { type: Number },
  roles: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
