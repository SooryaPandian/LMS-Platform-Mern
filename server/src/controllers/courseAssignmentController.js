const CourseAssignment = require('../models/CourseAssignment');
const Course = require('../models/Course');
const Regulation = require('../models/Regulation');
const Department = require('../models/Department');
const Batch = require('../models/Batch');

// Get all course assignments with optional filters
const getCourseAssignments = async (req, res) => {
  try {
    const { regulationId, departmentId, batchId, semesterNumber, page = 1, limit = 100 } = req.query;
    
    const query = {};
    if (regulationId) query.regulationId = regulationId;
    if (departmentId) query.departmentId = departmentId;
    if (batchId) query.batchId = batchId;
    if (semesterNumber) query.semesterNumber = Number(semesterNumber);

    const skip = (Number(page) - 1) * Number(limit);
    
    const assignments = await CourseAssignment.find(query)
      .populate('courseId', 'code title credits category')
      .populate('regulationId', 'name')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ semesterNumber: 1, courseId: 1 });

    const total = await CourseAssignment.countDocuments(query);

    res.json({
      data: assignments,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses for a specific semester with context
const getCoursesForSemester = async (req, res) => {
  try {
    const { regulationId, departmentId, batchId, semesterNumber } = req.query;

    if (!regulationId || !departmentId || !batchId || !semesterNumber) {
      return res.status(400).json({ 
        message: 'regulationId, departmentId, batchId, and semesterNumber are required' 
      });
    }

    const assignments = await CourseAssignment.find({
      regulationId,
      departmentId,
      batchId,
      semesterNumber: Number(semesterNumber)
    }).populate('courseId');

    const courses = assignments.map(a => a.courseId);

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign a single course to a semester
const assignCourseToSemester = async (req, res) => {
  try {
    const { regulationId, departmentId, batchId, semesterNumber, courseId } = req.body;

    if (!regulationId || !departmentId || !batchId || !semesterNumber || !courseId) {
      return res.status(400).json({ 
        message: 'All fields are required: regulationId, departmentId, batchId, semesterNumber, courseId' 
      });
    }

    // Validate semester number
    if (semesterNumber < 1 || semesterNumber > 8) {
      return res.status(400).json({ message: 'Semester number must be between 1 and 8' });
    }

    // Validate that entities exist
    const [regulation, department, batch, course] = await Promise.all([
      Regulation.findById(regulationId),
      Department.findById(departmentId),
      Batch.findById(batchId),
      Course.findById(courseId)
    ]);

    if (!regulation) return res.status(404).json({ message: 'Regulation not found' });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Create or update assignment
    const assignment = await CourseAssignment.findOneAndUpdate(
      { regulationId, departmentId, batchId, semesterNumber, courseId },
      { regulationId, departmentId, batchId, semesterNumber, courseId },
      { upsert: true, new: true }
    ).populate('courseId');

    res.status(201).json(assignment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This course is already assigned to this semester' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Bulk assign courses
const bulkAssignCourses = async (req, res) => {
  try {
    const { regulationId, departmentId, batchId, semesterNumber, courseIds } = req.body;

    if (!regulationId || !departmentId || !batchId || !semesterNumber || !courseIds) {
      return res.status(400).json({ 
        message: 'All fields are required: regulationId, departmentId, batchId, semesterNumber, courseIds' 
      });
    }

    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'courseIds must be an array' });
    }

    // Validate semester number
    if (semesterNumber < 1 || semesterNumber > 8) {
      return res.status(400).json({ message: 'Semester number must be between 1 and 8' });
    }

    // Remove existing assignments for this context
    await CourseAssignment.deleteMany({
      regulationId,
      departmentId,
      batchId,
      semesterNumber
    });

    // Create new assignments
    const assignmentPromises = courseIds.map(courseId =>
      CourseAssignment.create({
        regulationId,
        departmentId,
        batchId,
        semesterNumber,
        courseId
      })
    );

    const assignments = await Promise.all(assignmentPromises);

    res.status(201).json({
      message: `Successfully assigned ${assignments.length} courses`,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a course assignment
const removeCourseAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await CourseAssignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Course assignment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a course assignment
const updateCourseAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const assignment = await CourseAssignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('courseId regulationId departmentId batchId');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCourseAssignments,
  getCoursesForSemester,
  assignCourseToSemester,
  bulkAssignCourses,
  removeCourseAssignment,
  updateCourseAssignment
};
