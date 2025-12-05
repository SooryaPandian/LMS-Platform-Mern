const CourseAllocation = require('../models/CourseAllocation');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Regulation = require('../models/Regulation');
const CourseAssignment = require('../models/CourseAssignment');

// Get course allocations with filters
const getCourseAllocations = async (req, res) => {
  try {
    const { page = 1, limit = 100, classId, semester, departmentId, batchId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    let query = {};
    
    if (classId) {
      query.classId = classId;
    }
    
    if (semester) {
      query.semester = Number(semester);
    }
    
    // If filtering by department or batch, we need to find matching classes first
    if (departmentId || batchId) {
      const classQuery = {};
      if (departmentId) classQuery.departmentId = departmentId;
      if (batchId) classQuery.batchId = batchId;
      
      const classes = await Class.find(classQuery).select('_id');
      const classIds = classes.map(c => c._id);
      query.classId = { $in: classIds };
    }
    
    const allocations = await CourseAllocation.find(query)
      .populate({
        path: 'classId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name passingYear' }
        ]
      })
      .populate('courseId', 'code title credits category')
      .populate('facultyIds', 'name email designation')
      .skip(skip)
      .limit(Number(limit))
      .sort({ semester: 1, courseId: 1 });
    
    const total = await CourseAllocation.countDocuments(query);
    
    res.json({ 
      data: allocations, 
      pagination: { page: Number(page), limit: Number(limit), total } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses for a specific section/semester (from regulation)
const getCoursesForSection = async (req, res) => {
  try {
    const { classId, semester } = req.params;
    
    // Get the class to find its batch
    const classObj = await Class.findById(classId).populate('batchId');
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Find the regulation that applies to this batch
    const batchYear = classObj.batchId.name; // e.g., "2024"
    const regulation = await Regulation.findOne({
      appliesToBatches: batchYear
    });
    
    if (!regulation) {
      return res.status(404).json({ 
        message: 'No regulation found for this batch',
        courses: []
      });
    }
    
    // Get course assignments for this context from CourseAssignment collection
    const assignments = await CourseAssignment.find({
      regulationId: regulation._id,
      departmentId: classObj.departmentId,
      batchId: classObj.batchId,
      semesterNumber: Number(semester)
    }).populate('courseId');
    
    if (assignments.length === 0) {
      return res.json({ courses: [] });
    }
    
    // Extract course IDs
    const courseIds = assignments.map(a => a.courseId._id);
    
    // Get the courses
    const courses = await Course.find({
      _id: { $in: courseIds }
    });
    
    // Get existing allocations for this class/semester
    const allocations = await CourseAllocation.find({
      classId,
      semester: Number(semester)
    }).populate('facultyIds', 'name email designation');
    
    // Merge course data with allocation data
    const coursesWithAllocations = courses.map(course => {
      const allocation = allocations.find(
        a => a.courseId.toString() === course._id.toString()
      );
      
      return {
        ...course.toObject(),
        allocationId: allocation?._id,
        facultyIds: allocation?.facultyIds || []
      };
    });
    
    res.json({ courses: coursesWithAllocations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign faculty to a specific course in a class/semester
const assignFacultyToCourse = async (req, res) => {
  try {
    const { classId, semester, courseId, facultyIds } = req.body;
    
    if (!classId || !semester || !courseId) {
      return res.status(400).json({ 
        message: 'classId, semester, and courseId are required' 
      });
    }
    
    // Check if allocation exists, update or create
    let allocation = await CourseAllocation.findOne({
      classId,
      semester,
      courseId
    });
    
    if (allocation) {
      allocation.facultyIds = facultyIds || [];
      await allocation.save();
    } else {
      allocation = new CourseAllocation({
        classId,
        semester,
        courseId,
        facultyIds: facultyIds || []
      });
      await allocation.save();
    }
    
    await allocation.populate([
      { path: 'classId', populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'batchId', select: 'name passingYear' }
      ]},
      { path: 'courseId', select: 'code title credits category' },
      { path: 'facultyIds', select: 'name email designation' }
    ]);
    
    res.json(allocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bulk assign faculty to multiple courses
const bulkAssignFaculty = async (req, res) => {
  try {
    const { classId, semester, assignments } = req.body;
    
    if (!classId || !semester || !Array.isArray(assignments)) {
      return res.status(400).json({ 
        message: 'classId, semester, and assignments array are required' 
      });
    }
    
    const results = [];
    
    for (const assignment of assignments) {
      const { courseId, facultyIds } = assignment;
      
      let allocation = await CourseAllocation.findOne({
        classId,
        semester,
        courseId
      });
      
      if (allocation) {
        allocation.facultyIds = facultyIds || [];
        await allocation.save();
      } else {
        allocation = new CourseAllocation({
          classId,
          semester,
          courseId,
          facultyIds: facultyIds || []
        });
        await allocation.save();
      }
      
      results.push(allocation);
    }
    
    // Populate all results
    const populatedResults = await CourseAllocation.find({
      _id: { $in: results.map(r => r._id) }
    })
      .populate({
        path: 'classId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name passingYear' }
        ]
      })
      .populate('courseId', 'code title credits category')
      .populate('facultyIds', 'name email designation');
    
    res.json({ 
      message: 'Faculty assignments saved successfully',
      data: populatedResults 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a course allocation
const deleteCourseAllocation = async (req, res) => {
  try {
    const allocation = await CourseAllocation.findByIdAndDelete(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Course allocation not found' });
    }
    res.json({ message: 'Course allocation deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getCourseAllocations,
  getCoursesForSection,
  assignFacultyToCourse,
  bulkAssignFaculty,
  deleteCourseAllocation
};
