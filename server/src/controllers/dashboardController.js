const Department = require('../models/Department');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Fee = require('../models/Fee');

const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalBatches = await Batch.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalClasses = await Class.countDocuments();

    // Get active students (those with unpaid or partially-paid fees)
    const currentYear = new Date().getFullYear();
    const pendingFees = await Fee.countDocuments({
      year: currentYear,
      status: { $in: ['unpaid', 'partially-paid'] }
    });

    // Get recent students (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Department-wise student distribution
    // Students -> Class -> Department
    const studentsByDepartment = await Student.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      {
        $unwind: '$class'
      },
      {
        $group: {
          _id: '$class.departmentId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          department: '$department.name',
          code: '$department.code',
          count: 1
        }
      },
      {
        $sort: { department: 1 }
      }
    ]);

    // Batch-wise student distribution
    // Students -> Class -> Batch
    const studentsByBatch = await Student.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      {
        $unwind: '$class'
      },
      {
        $group: {
          _id: '$class.batchId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batch'
        }
      },
      {
        $unwind: '$batch'
      },
      {
        $project: {
          batch: '$batch.name',
          passingYear: '$batch.passingYear',
          count: 1
        }
      },
      {
        $sort: { passingYear: -1 }
      }
    ]);

    // Class-wise student distribution
    const studentsByClass = await Student.aggregate([
      {
        $group: {
          _id: '$classId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'class'
        }
      },
      {
        $unwind: '$class'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'class.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'class.batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      {
        $unwind: '$batch'
      },
      {
        $project: {
          className: {
            $concat: [
              '$department.code',
              ' ',
              '$batch.name',
              ' - Section ',
              '$class.name'
            ]
          },
          count: 1
        }
      },
      {
        $sort: { className: 1 }
      }
    ]);

    // Recent activity (last 10 fee payments)
    const recentActivity = await Fee.find({
      status: { $ne: 'unpaid' }
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('studentId', 'name rollNo')
      .select('studentId paidAmount status updatedAt');

    res.json({
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalBatches,
      totalCourses,
      totalClasses,
      pendingFees,
      recentStudents,
      studentsByDepartment,
      studentsByBatch,
      studentsByClass,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
