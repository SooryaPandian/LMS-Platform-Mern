const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  name: { type: String, required: true },
  advisorFacultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  facultyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Class', classSchema);
