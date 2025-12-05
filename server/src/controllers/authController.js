const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Parent = require('../models/Parent');
const Admin = require('../models/Admin');

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Select model based on role
    let Model, userRole;
    switch(role) {
      case 'student':
        Model = Student;
        userRole = 'student';
        break;
      case 'faculty':
        Model = Faculty;
        userRole = 'faculty';
        break;
      case 'parent':
        Model = Parent;
        userRole = 'parent';
        break;
      case 'admin':
        Model = Admin;
        userRole = 'admin';
        break;
      default:
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Find user in appropriate collection
    const user = await Model.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: userRole, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: { ...userObj, role: userRole } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const { role, id } = req.user; // from JWT middleware

    // Select model based on role
    let Model, populateOptions = [];
    switch(role) {
      case 'student':
        Model = Student;
        populateOptions = [
          {
            path: 'classId',
            select: 'name departmentId batchId facultyIds advisorFacultyId',
            populate: [
              { path: 'departmentId', select: 'name code' },
              { path: 'batchId', select: 'name passingYear' },
              { path: 'facultyIds', select: 'name email designation' },
              { path: 'advisorFacultyId', select: 'name email' }
            ]
          },
          { path: 'guardianId', select: 'name email mobile' }
        ];
        break;
      case 'faculty':
        Model = Faculty;
        populateOptions = [
          { path: 'departmentId', select: 'name code' }
        ];
        break;
      case 'parent':
        Model = Parent;
        populateOptions = [
          { path: 'studentIds', select: 'name rollNo email classId' }
        ];
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }

    let query = Model.findById(id);
    if (populateOptions.length > 0) {
      query = query.populate(populateOptions);
    }
    
    const user = await query;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ ...user.toObject(), role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, getProfile };
