const Marks = require('../models/Marks');

const getMarks = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (req.query.classId) query.classId = req.query.classId;
    if (req.query.studentId) query.studentId = req.query.studentId;
    const marks = await Marks.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });
    const total = await Marks.countDocuments(query);
    res.json({ data: marks, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createOrUpdateMarks = async (req, res) => {
  try {
    const { classId, studentId, componentMarks } = req.body;
    const total = componentMarks.mid + componentMarks.sessional + componentMarks.endsem;
    let grade = 'F';
    if (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B+';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';
    const marks = await Marks.findOneAndUpdate(
      { classId, studentId },
      { componentMarks, total, grade, enteredBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(marks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMarksByStudent = async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMarksByClass = async (req, res) => {
  try {
    const marks = await Marks.find({ classId: req.params.classId }).sort({ total: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMarks, createOrUpdateMarks, getMarksByStudent, getMarksByClass };
