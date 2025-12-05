const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Regulation = require('./src/models/Regulation');
const Course = require('./src/models/Course');
const Department = require('./src/models/Department');
const Batch = require('./src/models/Batch');
const Class = require('./src/models/Class');
const Faculty = require('./src/models/Faculty');
const CourseAllocation = require('./src/models/CourseAllocation');
const CourseAssignment = require('./src/models/CourseAssignment');

async function seedCourseAndFacultyAssignments() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college-connect';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing data
    const departments = await Department.find();
    const courses = await Course.find();
    const batches = await Batch.find();
    const classes = await Class.find();
    const faculty = await Faculty.find();

    if (departments.length === 0 || courses.length === 0) {
      console.log('Please run the main seeder first to create departments and courses');
      process.exit(1);
    }

    console.log('\n🔄 Starting Course and Faculty Assignment Seeding...\n');

    // ===== STEP 1: Create Simple Regulations =====
    console.log('📚 Creating Regulations...');
    
    await Regulation.deleteMany({});

    const regulation2023 = await Regulation.create({
      name: 'Regulation 2023',
      appliesToBatches: ['Batch 2023', 'Batch 2024']
    });

    const regulation2022 = await Regulation.create({
      name: 'Regulation 2022',
      appliesToBatches: ['Batch 2022']
    });

    console.log(`✅ Created ${[regulation2023, regulation2022].length} regulations`);

    // ===== STEP 2: Create Course Assignments =====
    console.log('\n📖 Creating Course Assignments...');
    
    await CourseAssignment.deleteMany({});

    let assignmentCount = 0;

    // For each regulation
    for (const regulation of [regulation2023, regulation2022]) {
      console.log(`\nProcessing regulation: ${regulation.name}`);
      console.log(`  Applies to batches: ${regulation.appliesToBatches.join(', ')}`);
      
      // Get batches that apply to this regulation
      const applicableBatches = batches.filter(b => regulation.appliesToBatches.includes(b.name));
      console.log(`  Found ${applicableBatches.length} applicable batches:`, applicableBatches.map(b => b.name).join(', '));
      
      // For each applicable batch
      for (const batch of applicableBatches) {
        console.log(`\n  Processing batch: ${batch.name}`);
        
        // For each department
        for (const department of departments) {
          // Filter courses for this department
          const deptCourses = courses.filter(c => 
            c.departmentId && c.departmentId.toString() === department._id.toString()
          );

          console.log(`    Dept ${department.code}: Found ${deptCourses.length} courses`);
          
          if (deptCourses.length === 0) continue;

          // Distribute courses across 8 semesters
          const coursesPerSemester = regulation.name.includes('2023') ? 5 : 4;
          
          for (let semester = 1; semester <= 8; semester++) {
            const startIdx = (semester - 1) * coursesPerSemester;
            const endIdx = Math.min(startIdx + coursesPerSemester, deptCourses.length);
            const semesterCourses = deptCourses.slice(startIdx, endIdx);

            // Create assignment for each course
            for (const course of semesterCourses) {
              try {
                await CourseAssignment.create({
                  regulationId: regulation._id,
                  departmentId: department._id,
                  batchId: batch._id,
                  semesterNumber: semester,
                  courseId: course._id
                });
                assignmentCount++;
              } catch (error) {
                // Skip if duplicate
                if (error.code !== 11000) {
                  console.error('Error creating assignment:', error.message);
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ Created ${assignmentCount} course assignments`);

    // ===== STEP 3: Create Faculty Assignments (Course Allocations) =====
    console.log('\n👨‍🏫 Creating Faculty Assignments...');
    
    await CourseAllocation.deleteMany({});

    let allocationCount = 0;

    // For each class
    for (const classItem of classes) {
      const classDept = classItem.departmentId;
      const classBatch = classItem.batchId;

      // Find the batch to get its name
      const batch = batches.find(b => b._id.equals(classBatch));
      if (!batch) continue;

      // Find the applicable regulation for this batch
      const applicableRegulation = [regulation2023, regulation2022].find(reg =>
        reg.appliesToBatches.includes(batch.name)
      );

      if (!applicableRegulation) continue;

      // Get faculty from the same department
      const deptFaculty = faculty.filter(f => 
        f.departmentId && f.departmentId.equals(classDept)
      );

      if (deptFaculty.length === 0) continue;

      // Assign faculty to courses for all 8 semesters
      for (let semester = 1; semester <= 8; semester++) {
        // Find course assignments for this context
        const assignments = await CourseAssignment.find({
          regulationId: applicableRegulation._id,
          departmentId: classDept,
          batchId: classBatch,
          semesterNumber: semester
        });

        if (assignments.length === 0) continue;

        // Assign faculty to each course
        for (let i = 0; i < assignments.length; i++) {
          const assignment = assignments[i];
          
          // Assign 1-2 faculty members per course (randomly)
          const numFaculty = Math.random() > 0.5 ? 2 : 1;
          const assignedFaculty = [];
          
          for (let j = 0; j < numFaculty && j < deptFaculty.length; j++) {
            const facultyIndex = (i + j) % deptFaculty.length;
            assignedFaculty.push(deptFaculty[facultyIndex]._id);
          }

          try {
            await CourseAllocation.create({
              classId: classItem._id,
              courseId: assignment.courseId,
              facultyIds: assignedFaculty,
              semester
            });
            allocationCount++;
          } catch (error) {
            // Skip duplicates
            if (error.code !== 11000) {
              console.error('Error creating allocation:', error.message);
            }
          }
        }
      }
    }

    console.log(`✅ Created ${allocationCount} faculty assignments`);

    // ===== Summary =====
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Regulations: 2`);
    console.log(`   - Course Assignments: ${assignmentCount}`);
    console.log(`   - Faculty Allocations: ${allocationCount}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Batches: ${batches.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Faculty: ${faculty.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
seedCourseAndFacultyAssignments();
