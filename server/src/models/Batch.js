const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passingYear: { type: Number, required: true },
  durationYears: { type: Number, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
