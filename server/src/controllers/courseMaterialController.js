const CourseMaterial = require('../models/CourseMaterial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/course-materials');
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document types
  const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Upload course material (supports multiple files)
const uploadMaterial = async (req, res) => {
  try {
    const { courseId, unit, title, description } = req.body;
   
    console.log('Upload request body:', req.body);
    console.log('Upload files:', req.files);
    console.log('Authenticated user:', req.user);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (!courseId || !unit || !title) {
      return res.status(400).json({ message: 'Missing required fields: courseId, unit, title' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Create a material entry for each uploaded file
    const materials = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileTitle = req.files.length > 1 ? `${title} (${i + 1})` : title;
      
      const material = new CourseMaterial({
        courseId,
        facultyId: req.user.id,
        unit: Number(unit),
        title: fileTitle,
        description,
        uploadedBy: req.user.id,
        fileUrl: `/uploads/course-materials/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });

      await material.save();
      materials.push(material);
    }

    res.status(201).json({ 
      message: `${materials.length} file(s) uploaded successfully`,
      data: materials 
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get materials (with filters)
const getMaterials = async (req, res) => {
  try {
    const { courseId, facultyId, unit } = req.query;
    const query = {};
    
    if (courseId) query.courseId = courseId;
    if (facultyId) query.facultyId = facultyId;
    if (unit) query.unit = Number(unit);

    const materials = await CourseMaterial.find(query)
      .populate('courseId', 'code title')
      .populate('facultyId', 'name email')
      .sort({ unit: 1, uploadedAt: -1 });

    res.json({ data: materials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get materials for a specific course (for students)
const getMaterialsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { facultyId, unit } = req.query;
    
    const query = { courseId, visibility: 'public' };
    if (facultyId) query.facultyId = facultyId;
    if (unit) query.unit = Number(unit);

    const materials = await CourseMaterial.find(query)
      .populate('facultyId', 'name')
      .sort({ unit: 1, uploadedAt: -1 });

    // Group by unit
    const groupedByUnit = materials.reduce((acc, material) => {
      const unit = material.unit;
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(material);
      return acc;
    }, {});

    res.json({ data: groupedByUnit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if user is the uploader or admin
    if (material.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this material' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../..', material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await CourseMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  uploadMaterial,
  getMaterials,
  getMaterialsByCourse,
  deleteMaterial
};
