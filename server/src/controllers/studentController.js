const Student = require('../models/Student');
const Class = require('../models/Class');

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', classId, departmentId, batchId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    
    // Search by name, roll number, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by class directly
    if (classId) {
      query.classId = classId;
    }
    
    // Filter by department or batch (need to find classes first)
    if (departmentId || batchId) {
      const classQuery = {};
      if (departmentId) classQuery.departmentId = departmentId;
      if (batchId) classQuery.batchId = batchId;
      
      const matchingClasses = await Class.find(classQuery).select('_id');
      const classIds = matchingClasses.map(c => c._id);
      query.classId = { $in: classIds };
    }
    
    const students = await Student.find(query)
      .populate({
        path: 'classId',
        select: 'name departmentId batchId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name passingYear' }
        ]
      })
      .populate('guardianId', 'name email mobile')
      .skip(skip)
      .limit(Number(limit))
      .sort({ rollNo: 1 });
      
    const total = await Student.countDocuments(query);
    res.json({ data: students, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'classId',
        select: 'name departmentId batchId facultyIds advisorFacultyId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name passingYear' },
          { path: 'facultyIds', select: 'name email designation' },
          { path: 'advisorFacultyId', select: 'name email' }
        ]
      })
      .populate('guardianId', 'name email mobile');
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const Parent = require('../models/Parent');
    const bcrypt = require('bcryptjs');
    
    // Validate that class exists
    const classExists = await Class.findById(req.body.classId);
    if (!classExists) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    // Create parent if guardian details are provided
    let guardianId = req.body.guardianId;
    if (req.body.guardianEmail && req.body.guardianMobile) {
      // Check if parent already exists
      let parent = await Parent.findOne({ email: req.body.guardianEmail });
      
      if (!parent) {
        // Create parent record
        parent = new Parent({
          name: req.body.guardianName || 'Parent',
          email: req.body.guardianEmail,
          mobile: req.body.guardianMobile,
          password: await bcrypt.hash(req.body.guardianMobile, 10)
        });
        await parent.save();
      }
      
      guardianId = parent._id;
    }
    
    // Create student
    const student = new Student({
      ...req.body,
      guardianId
    });
    await student.save();
    
    // Populate the response
    await student.populate({
      path: 'classId',
      select: 'name departmentId batchId',
      populate: [
        { path: 'departmentId', select: 'name code' },
        { path: 'batchId', select: 'name passingYear' }
      ]
    });
    
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    // If updating classId, validate it exists
    if (req.body.classId) {
      const classExists = await Class.findById(req.body.classId);
      if (!classExists) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
    }
    
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({
        path: 'classId',
        select: 'name departmentId batchId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name passingYear' }
        ]
      });
      
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const bulkUploadStudents = async (req, res) => {
  try {
    const { students } = req.body; // Expect array of student objects
    const Parent = require('../models/Parent');
    const bcrypt = require('bcryptjs');
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Invalid data format. Expected array of students.' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const studentData of students) {
      try {
        // Validate class exists
        const classExists = await Class.findById(studentData.classId);
        if (!classExists) {
          throw new Error('Invalid class ID');
        }
        
        // Create parent if guardian details provided
        let guardianId = studentData.guardianId;
        if (studentData.guardianEmail && studentData.guardianMobile) {
          let parent = await Parent.findOne({ email: studentData.guardianEmail });
          
          if (!parent) {
            parent = new Parent({
              name: studentData.guardianName || 'Parent',
              email: studentData.guardianEmail,
              mobile: studentData.guardianMobile,
              password: await bcrypt.hash(studentData.guardianMobile, 10)
            });
            await parent.save();
          }
          
          guardianId = parent._id;
        }
        
        const student = new Student({
          ...studentData,
          guardianId
        });
        await student.save();
        results.success.push({ rollNo: student.rollNo, name: student.name });
      } catch (error) {
        results.errors.push({ 
          rollNo: studentData.rollNo, 
          name: studentData.name, 
          error: error.message 
        });
      }
    }

    res.json({
      message: `Uploaded ${results.success.length} students successfully. ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getStudents, 
  getStudentById,
  createStudent, 
  updateStudent, 
  deleteStudent, 
  bulkUploadStudents 
};
