const Assessment = require('../models/Assessment');
const Student = require('../models/Student');

// Create assessment
const createAssessment = async (req, res) => {
  try {
    const { courseId, classId, name, type, maxMarks, date } = req.body;
    
    const assessment = new Assessment({
      courseId,
      classId,
      facultyId: req.user.id, // From auth middleware
      name,
      type,
      maxMarks: Number(maxMarks),
      date,
      marks: []
    });

    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get assessments
const getAssessments = async (req, res) => {
  try {
    const { courseId, classId, facultyId } = req.query;
    const query = {};
    
    if (courseId) query.courseId = courseId;
    if (classId) query.classId = classId;
    if (facultyId) query.facultyId = facultyId;

    const assessments = await Assessment.find(query)
      .populate('courseId', 'code title')
      .populate('classId', 'name departmentId batchId')
      .populate('facultyId', 'name')
      .sort({ date: -1 });

    res.json({ data: assessments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get single assessment with marks
const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('courseId', 'code title')
      .populate('classId', 'name departmentId batchId')
      .populate('facultyId', 'name')
      .populate('marks.studentId', 'rollNo name');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update marks for students
const updateMarks = async (req, res) => {
  try {
    const { marks } = req.body; // Array of { studentId, marksObtained }
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Verify faculty authorization
    if (assessment.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update marks' });
    }

    // Validate marks
    for (const mark of marks) {
      if (mark.marksObtained > assessment.maxMarks) {
        return res.status(400).json({ 
          message: `Marks for student ${mark.studentId} exceeds maximum marks` 
        });
      }
    }

    // Update or add marks
    for (const mark of marks) {
      const existingIndex = assessment.marks.findIndex(
        m => m.studentId.toString() === mark.studentId
      );

      if (existingIndex >= 0) {
        // Update existing
        assessment.marks[existingIndex].marksObtained = mark.marksObtained;
        assessment.marks[existingIndex].enteredAt = new Date();
      } else {
        // Add new
        assessment.marks.push({
          studentId: mark.studentId,
          marksObtained: mark.marksObtained
        });
      }
    }

    await assessment.save();
    
    // Populate and return
    const populated = await Assessment.findById(assessment._id)
      .populate('marks.studentId', 'rollNo name');
    
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get marks for a specific student
const getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const query = { 'marks.studentId': studentId };
    if (courseId) query.courseId = courseId;

    const assessments = await Assessment.find(query)
      .populate('courseId', 'code title')
      .populate('classId', 'name')
      .select('name type maxMarks date marks');

    // Filter to only show this student's marks
    const studentAssessments = assessments.map(assessment => {
      const studentMark = assessment.marks.find(
        m => m.studentId.toString() === studentId
      );
      
      return {
        _id: assessment._id,
        name: assessment.name,
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        date: assessment.date,
        courseId: assessment.courseId,
        classId: assessment.classId,
        marksObtained: studentMark ? studentMark.marksObtained : null,
        enteredAt: studentMark ? studentMark.enteredAt : null
      };
    });

    res.json({ data: studentAssessments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete assessment
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check authorization
    if (assessment.facultyId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assessment' });
    }

    await Assessment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessment,
  updateMarks,
  getStudentMarks,
  deleteAssessment
};
