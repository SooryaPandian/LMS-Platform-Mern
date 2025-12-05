const mongoose = require('mongoose');

const regulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  appliesToBatches: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Regulation', regulationSchema);
