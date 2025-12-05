const Class = require('../models/Class');
const Department = require('../models/Department');
const Batch = require('../models/Batch');

const getClasses = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.batchId) query.batchId = req.query.batchId;
    if (req.query.name) query.name = req.query.name; // Section name (A, B, C, etc.)
    
    const classes = await Class.find(query)
      .populate('departmentId', 'name code')
      .populate('batchId', 'name passingYear')
      .populate('facultyIds', 'name email designation')
      .populate('advisorFacultyId', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ departmentId: 1, batchId: 1, name: 1 });
      
    const total = await Class.countDocuments(query);
    res.json({ data: classes, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('batchId', 'name passingYear')
      .populate('facultyIds', 'name email designation')
      .populate('advisorFacultyId', 'name email');
    
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    res.json(classObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const classObj = new Class(req.body);
    await classObj.save();
    
    await classObj.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'batchId', select: 'name passingYear' },
      { path: 'facultyIds', select: 'name email designation' },
      { path: 'advisorFacultyId', select: 'name email' }
    ]);
    
    res.status(201).json(classObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const classObj = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('departmentId', 'name code')
      .populate('batchId', 'name passingYear')
      .populate('facultyIds', 'name email designation')
      .populate('advisorFacultyId', 'name email');
      
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    res.json(classObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    // Check if any students are in this class
    const Student = require('../models/Student');
    const studentCount = await Student.countDocuments({ classId: req.params.id });
    
    if (studentCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete class. ${studentCount} student(s) are enrolled in this class.` 
      });
    }
    
    const classObj = await Class.findByIdAndDelete(req.params.id);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const assignFacultyToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { facultyIds, advisorFacultyId } = req.body;

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    if (facultyIds) classObj.facultyIds = facultyIds;
    if (advisorFacultyId) classObj.advisorFacultyId = advisorFacultyId;
    
    await classObj.save();
    
    await classObj.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'batchId', select: 'name passingYear' },
      { path: 'facultyIds', select: 'name email designation' },
      { path: 'advisorFacultyId', select: 'name email' }
    ]);
    
    res.json(classObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  getClasses, 
  getClassById,
  createClass, 
  updateClass, 
  deleteClass,
  assignFacultyToClass
};
