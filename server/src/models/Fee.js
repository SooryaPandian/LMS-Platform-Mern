const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  year: { type: Number, required: true },
  components: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  paidAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['paid', 'partially-paid', 'unpaid'],
    default: 'unpaid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);
