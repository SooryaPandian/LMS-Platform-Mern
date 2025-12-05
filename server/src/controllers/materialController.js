const CourseMaterial = require('../models/CourseMaterial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10485760 }
});

const getMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (req.query.courseId) query.courseId = req.query.courseId;
    if (req.query.visibility) query.visibility = req.query.visibility;
    const materials = await CourseMaterial.find(query).skip(skip).limit(Number(limit)).sort({ uploadedAt: -1 });
    const total = await CourseMaterial.countDocuments(query);
    res.json({ data: materials, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { courseId, title, visibility } = req.body;
    const material = new CourseMaterial({
      courseId,
      title,
      visibility: visibility || 'public',
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    });
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMaterialsByCourse = async (req, res) => {
  try {
    const materials = await CourseMaterial.find({ courseId: req.params.courseId }).sort({ uploadedAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    const filePath = path.join(uploadDir, path.basename(material.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { upload, getMaterials, uploadMaterial, getMaterialsByCourse, deleteMaterial };
