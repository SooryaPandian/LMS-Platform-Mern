const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const {
  dashboardRoutes,
  batchRoutes,
  departmentRoutes,
  courseRoutes,
  regulationRoutes,
  courseAssignmentRoutes,
  classRoutes,
  facultyRoutes,
  studentRoutes,
  marksRoutes,
  feeRoutes,
  materialRoutes,
  courseAllocationRoutes,
  courseMaterialRoutes,
  assessmentRoutes
} = require('./routes/index');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_PATH || './uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'College Connect API is running' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/regulations', regulationRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/course-allocations', courseAllocationRoutes);
app.use('/api/course-assignments', courseAssignmentRoutes);
app.use('/api/course-materials', courseMaterialRoutes);
app.use('/api/assessments', assessmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
