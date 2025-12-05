const Course = require('../models/Course');

const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = search ? { $or: [{ title: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }] } : {};
    const courses = await Course.find(query).skip(skip).limit(Number(limit)).sort({ code: 1 });
    const total = await Course.countDocuments(query);
    res.json({ data: courses, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };
