const express = require('express');
const { getBatches, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { getRegulations, createRegulation, updateRegulation, deleteRegulation } = require('../controllers/regulationController');
const { getClasses, createClass, updateClass, deleteClass, assignFacultyToClass } = require('../controllers/classController');
const { getFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');
const { getStudents, createStudent, updateStudent, deleteStudent, bulkUploadStudents } = require('../controllers/studentController');
const { getMarks, createOrUpdateMarks, getMarksByStudent, getMarksByClass } = require('../controllers/marksController');
const { getFees, createFee, updateFee, recordPayment, getStudentFees, createBulkFees, generateFeeTemplate, bulkUploadFees } = require('../controllers/feeController');
const { upload, getMaterials, uploadMaterial, getMaterialsByCourse, deleteMaterial } = require('../controllers/materialController');
const { upload: uploadCourseMaterial, uploadMaterial: uploadCourseMat, getMaterials: getCourseMats, getMaterialsByCourse: getCourseMaterialsByCourse, deleteMaterial: delCourseMaterial } = require('../controllers/courseMaterialController');
const { createAssessment, getAssessments, getAssessment, updateMarks, getStudentMarks, deleteAssessment } = require('../controllers/assessmentController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { getCourseAllocations, getCoursesForSection, assignFacultyToCourse, bulkAssignFaculty, deleteCourseAllocation } = require('../controllers/courseAllocationController');
const { getCourseAssignments, getCoursesForSemester, assignCourseToSemester, bulkAssignCourses, removeCourseAssignment, updateCourseAssignment } = require('../controllers/courseAssignmentController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Dashboard
const dashboardRoutes = express.Router();
dashboardRoutes.use(auth);
dashboardRoutes.get('/stats', authorize('admin'), getDashboardStats);

// Batches
const batchRoutes = express.Router();
batchRoutes.use(auth);
batchRoutes.get('/', getBatches);
batchRoutes.post('/', authorize('admin'), createBatch);
batchRoutes.put('/:id', authorize('admin'), updateBatch);
batchRoutes.delete('/:id', authorize('admin'), deleteBatch);

// Departments
const departmentRoutes = express.Router();
departmentRoutes.use(auth);
departmentRoutes.get('/', getDepartments);
departmentRoutes.post('/', authorize('admin'), createDepartment);
departmentRoutes.put('/:id', authorize('admin'), updateDepartment);
departmentRoutes.delete('/:id', authorize('admin'), deleteDepartment);

// Courses
const courseRoutes = express.Router();
courseRoutes.use(auth);
courseRoutes.get('/', getCourses);
courseRoutes.post('/', authorize('admin'), createCourse);
courseRoutes.put('/:id', authorize('admin'), updateCourse);
courseRoutes.delete('/:id', authorize('admin'), deleteCourse);

// Regulations
const regulationRoutes = express.Router();
regulationRoutes.use(auth);
regulationRoutes.get('/', getRegulations);
regulationRoutes.post('/', authorize('admin'), createRegulation);
regulationRoutes.put('/:id', authorize('admin'), updateRegulation);
regulationRoutes.delete('/:id', authorize('admin'), deleteRegulation);

// Course Assignments
const courseAssignmentRoutes = express.Router();
courseAssignmentRoutes.use(auth);
courseAssignmentRoutes.get('/', getCourseAssignments);
courseAssignmentRoutes.get('/semester', getCoursesForSemester);
courseAssignmentRoutes.post('/', authorize('admin'), assignCourseToSemester);
courseAssignmentRoutes.post('/bulk', authorize('admin'), bulkAssignCourses);
courseAssignmentRoutes.put('/:id', authorize('admin'), updateCourseAssignment);
courseAssignmentRoutes.delete('/:id', authorize('admin'), removeCourseAssignment);

// Classes
const classRoutes = express.Router();
classRoutes.use(auth);
classRoutes.get('/', getClasses);
classRoutes.post('/', authorize('admin'), createClass);
classRoutes.post('/:classId/assign-faculty', authorize('admin'), assignFacultyToClass);
classRoutes.put('/:id', authorize('admin'), updateClass);
classRoutes.delete('/:id', authorize('admin'), deleteClass);

// Faculty
const facultyRoutes = express.Router();
facultyRoutes.use(auth);
facultyRoutes.get('/', getFaculty);
facultyRoutes.post('/', authorize('admin'), createFaculty);
facultyRoutes.put('/:id', authorize('admin'), updateFaculty);
facultyRoutes.delete('/:id', authorize('admin'), deleteFaculty);

// Students
const studentRoutes = express.Router();
studentRoutes.use(auth);
studentRoutes.get('/', getStudents);
studentRoutes.post('/', authorize('admin'), createStudent);
studentRoutes.post('/bulk', authorize('admin'), bulkUploadStudents);
studentRoutes.put('/:id', authorize('admin'), updateStudent);
studentRoutes.delete('/:id', authorize('admin'), deleteStudent);

// Marks
const marksRoutes = express.Router();
marksRoutes.use(auth);
marksRoutes.get('/', getMarks);
marksRoutes.post('/', authorize('admin', 'faculty'), createOrUpdateMarks);
marksRoutes.get('/student/:studentId', getMarksByStudent);
marksRoutes.get('/class/:classId', getMarksByClass);

// Fees
const feeRoutes = express.Router();
feeRoutes.use(auth);
feeRoutes.get('/', getFees);
feeRoutes.get('/template', authorize('admin'), generateFeeTemplate);
feeRoutes.post('/', authorize('admin'), createFee);
feeRoutes.post('/bulk', authorize('admin'), createBulkFees);
feeRoutes.post('/bulk-upload', authorize('admin'), bulkUploadFees);
feeRoutes.put('/:id', authorize('admin'), updateFee);
feeRoutes.post('/:id/payment', authorize('admin'), recordPayment);
feeRoutes.get('/student/:studentId', getStudentFees);

// Materials
const materialRoutes = express.Router();
materialRoutes.use(auth);
materialRoutes.get('/', getMaterials);
materialRoutes.post('/', authorize('admin', 'faculty'), upload.single('file'), uploadMaterial);
materialRoutes.get('/course/:courseId', getMaterialsByCourse);
materialRoutes.delete('/:id', authorize('admin', 'faculty'), deleteMaterial);

// Course Allocations
const courseAllocationRoutes = express.Router();
courseAllocationRoutes.use(auth);
courseAllocationRoutes.get('/', getCourseAllocations);
courseAllocationRoutes.get('/section/:classId/semester/:semester', getCoursesForSection);
courseAllocationRoutes.post('/assign', authorize('admin'), assignFacultyToCourse);
courseAllocationRoutes.post('/bulk-assign', authorize('admin'), bulkAssignFaculty);
courseAllocationRoutes.delete('/:id', authorize('admin'), deleteCourseAllocation);

// Course Materials (Faculty Upload)
const courseMaterialRoutes = express.Router();
courseMaterialRoutes.use(auth);
courseMaterialRoutes.get('/', getCourseMats);
courseMaterialRoutes.post('/', authorize('faculty'), uploadCourseMaterial.array('files', 10), uploadCourseMat);
courseMaterialRoutes.get('/course/:courseId', getCourseMaterialsByCourse);
courseMaterialRoutes.delete('/:id', authorize('faculty'), delCourseMaterial);

// Assessments
const assessmentRoutes = express.Router();
assessmentRoutes.use(auth);
assessmentRoutes.get('/', getAssessments);
assessmentRoutes.get('/:id', getAssessment);
assessmentRoutes.post('/', authorize('faculty'), createAssessment);
assessmentRoutes.put('/:id/marks', authorize('faculty'), updateMarks);
assessmentRoutes.get('/student/:studentId', getStudentMarks);
assessmentRoutes.delete('/:id', authorize('faculty'), deleteAssessment);

module.exports = {
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
};
