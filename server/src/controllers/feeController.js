const Fee = require('../models/Fee');

const getFees = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (req.query.studentId) query.studentId = req.query.studentId;
    if (req.query.year) query.year = Number(req.query.year);
    if (req.query.status) query.status = req.query.status;
    const fees = await Fee.find(query).skip(skip).limit(Number(limit)).sort({ year: -1 });
    const total = await Fee.countDocuments(query);
    res.json({ data: fees, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFee = async (req, res) => {
  try {
    const fee = new Fee(req.body);
    await fee.save();
    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    fee.paidAmount += Number(amount);
    const totalFee = fee.components.reduce((sum, comp) => sum + comp.amount, 0);
    if (fee.paidAmount >= totalFee) fee.status = 'paid';
    else if (fee.paidAmount > 0) fee.status = 'partially-paid';
    else fee.status = 'unpaid';
    await fee.save();
    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStudentFees = async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId }).sort({ year: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBulkFees = async (req, res) => {
  try {
    const { studentIds, year, components } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }
    
    const fees = studentIds.map(studentId => ({
      studentId,
      year: Number(year),
      components: components || [],
      paidAmount: 0,
      status: 'unpaid'
    }));
    
    const createdFees = await Fee.insertMany(fees);
    res.status(201).json({ 
      message: `Successfully created fees for ${createdFees.length} students`,
      data: createdFees 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const generateFeeTemplate = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const { departmentId, batchId, section } = req.query;
    
    const query = {};
    if (departmentId) query.departmentId = departmentId;
    if (batchId) query.batchId = batchId;
    if (section) query.section = section;
    
    const students = await Student.find(query).select('rollNo name email departmentId batchId section');
    
    // Return student data for Excel template generation on frontend
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkUploadFees = async (req, res) => {
  try {
    const { fees } = req.body;
    
    if (!fees || !Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ message: 'Fees array is required' });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const feeData of fees) {
      try {
        const { studentId, year, components, tuitionFee, labFee, libraryFee, examFee, otherFee } = feeData;
        
        // Build components from individual fee fields
        const feeComponents = [];
        if (tuitionFee) feeComponents.push({ name: 'Tuition Fee', amount: Number(tuitionFee) });
        if (labFee) feeComponents.push({ name: 'Lab Fee', amount: Number(labFee) });
        if (libraryFee) feeComponents.push({ name: 'Library Fee', amount: Number(libraryFee) });
        if (examFee) feeComponents.push({ name: 'Exam Fee', amount: Number(examFee) });
        if (otherFee) feeComponents.push({ name: 'Other Fee', amount: Number(otherFee) });
        
        const fee = new Fee({
          studentId,
          year: Number(year),
          components: components || feeComponents,
          paidAmount: 0,
          status: 'unpaid'
        });
        
        await fee.save();
        results.successful.push(studentId);
      } catch (error) {
        results.failed.push({ studentId: feeData.studentId, error: error.message });
      }
    }
    
    res.json({
      message: `Processed ${fees.length} fee records. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  getFees, 
  createFee, 
  updateFee, 
  recordPayment, 
  getStudentFees,
  createBulkFees,
  generateFeeTemplate,
  bulkUploadFees
};
