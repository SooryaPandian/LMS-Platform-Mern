const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');

const getFaculty = async (req, res) => {
  try {
    const { page = 1, limit = 1000, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    const faculty = await Faculty.find(query).populate('departmentId').skip(skip).limit(Number(limit)).sort({ name: 1 });
    const total = await Faculty.countDocuments(query);
    res.json({ data: faculty, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const faculty = new Faculty({
      ...rest,
      password: hashedPassword
    });
    await faculty.save();
    
    // Don't send password back in response
    const facultyResponse = faculty.toObject();
    delete facultyResponse.password;
    
    res.status(201).json(facultyResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getFaculty, createFaculty, updateFaculty, deleteFaculty };
