const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Department = require('../models/Department');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Regulation = require('../models/Regulation');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Admin = require('../models/Admin');
const Class = require('../models/Class');
const Fee = require('../models/Fee');

// Sample data arrays for realistic generation
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Aryan', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Aarush', 'Dhruv', 'Kabir', 'Shivansh', 'Vihaan', 'Advaith',
  'Aadhya', 'Saanvi', 'Kiara', 'Diya', 'Ananya', 'Navya', 'Pari', 'Aaradhya', 'Sara', 'Myra',
  'Aanya', 'Ira', 'Avni', 'Riya', 'Shanaya', 'Anvi', 'Tara', 'Siya', 'Prisha', 'Kyra'
];

const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Gupta', 'Verma',
  'Agarwal', 'Joshi', 'Mehta', 'Shah', 'Desai', 'Kulkarni', 'Pandey', 'Malhotra', 'Chopra', 'Kapoor',
  'Bhat', 'Menon', 'Pillai', 'Shetty', 'Hegde', 'Kamath', 'Rao', 'Murthy', 'Krishnan', 'Subramanian'
];

const guardianFirstNames = [
  'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Ganesh', 'Rakesh', 'Mukesh', 'Dinesh', 'Umesh', 'Naresh',
  'Vijay', 'Ajay', 'Sanjay', 'Manoj', 'Anil', 'Sunil', 'Praveen', 'Naveen', 'Ravi', 'Kiran'
];

const departmentData = [
  { name: 'Computer Science Engineering', code: 'CSE' },
  { name: 'Electronics and Communication', code: 'ECE' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Electrical and Electronics', code: 'EEE' }
];

const batchYears = [2022, 2023, 2024];
const sections = ['A', 'B', 'C', 'D'];

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRollNo = (deptCode, year, index) => {
  return `${year}${deptCode}${String(index).padStart(3, '0')}`;
};

const generateMobile = () => {
  return `${getRandomNumber(7, 9)}${getRandomNumber(100000000, 999999999)}`;
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-connect');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');
  await Department.deleteMany({});
  await Batch.deleteMany({});
  await Course.deleteMany({});
  await Regulation.deleteMany({});
  await Faculty.deleteMany({});
  await Student.deleteMany({});
  await Parent.deleteMany({});
  await Admin.deleteMany({});
  await Class.deleteMany({});
  await Fee.deleteMany({});
  console.log('✅ Database cleared');
};

// Seed functions
const seedDepartments = async () => {
  console.log('📚 Seeding departments...');
  const departments = await Department.insertMany(departmentData);
  console.log(`✅ Created ${departments.length} departments`);
  return departments;
};

const seedBatches = async () => {
  console.log('📅 Seeding batches...');
  const batches = [];
  
  for (const year of batchYears) {
    batches.push({
      name: `Batch ${year}`,
      passingYear: year + 4,
      durationYears: 4
    });
  }
  
  const createdBatches = await Batch.insertMany(batches);
  console.log(`✅ Created ${createdBatches.length} batches`);
  return createdBatches;
};

const seedCourses = async (departments) => {
  console.log('📖 Seeding courses...');
  console.log(`DEBUG seedCourses: Received ${departments.length} departments`);
  console.log(`DEBUG seedCourses: First dept:`, {code: departments[0]?.code, _id: departments[0]?._id});
  
  const courses = [];
  
  // Generate courses for each department and semester
  for (const dept of departments) {
    for (let semester = 1; semester <= 8; semester++) {
      // 5-7 courses per semester
      const coursesPerSemester = getRandomNumber(5, 7);
      
      for (let i = 0; i < coursesPerSemester; i++) {
        const category = i < 3 ? 'Core' : (i === coursesPerSemester - 1 ? 'Lab' : 'Elective');
        const credits = category === 'Lab' ? 2 : (category === 'Project' ? 4 : 3);
        
        courses.push({
          code: `${dept.code}${semester}0${i + 1}`,
          title: `${dept.code} ${category} Course ${semester}.${i + 1}`,
          credits,
          category,
          semester,
          departmentId: dept._id,
          description: `${category} course for semester ${semester} in ${dept.name}`
        });
      }
    }
  }
  
  console.log(`DEBUG seedCourses: First 3 courses departmentIds:`, courses.slice(0, 3).map(c => ({code: c.code, deptId: c.departmentId})));
  const createdCourses = await Course.insertMany(courses);
  console.log(`✅ Created ${createdCourses.length} courses`);
  return createdCourses;
};

const seedRegulations = async (batches) => {
  console.log('📜 Seeding regulations...');
  const regulations = [];
  
  for (const batch of batches) {
    const year = batch.name.split(' ')[1];
    regulations.push({
      name: `Regulation ${year}`,
      appliesToBatches: [batch._id],
      semesters: Array.from({ length: 8 }, (_, i) => ({
        semesterNumber: i + 1,
        courses: []
      }))
    });
  }
  
  const createdRegulations = await Regulation.insertMany(regulations);
  console.log(`✅ Created ${createdRegulations.length} regulations`);
  return createdRegulations;
};

const seedClasses = async (departments, batches, faculty) => {
  console.log('🏫 Seeding classes...');
  const classes = [];
  
  // Create classes for each department and batch combination
  for (const dept of departments.slice(0, 3)) { // First 3 departments
    for (const batch of batches.slice(0, 2)) { // First 2 batches
      for (const sectionName of ['A', 'B']) { // Sections A, B
        // Assign faculty from the department
        const deptFaculty = faculty.filter(f => String(f.departmentId) === String(dept._id));
        
        // Pick one as advisor and 2-3 as class incharges
        const advisor = deptFaculty.length > 0 ? getRandomElement(deptFaculty)._id : null;
        const numFaculty = Math.min(deptFaculty.length, getRandomNumber(2, 3));
        const facultyList = [];
        
        for (let i = 0; i < numFaculty; i++) {
          const fac = getRandomElement(deptFaculty);
          if (!facultyList.includes(fac._id)) {
            facultyList.push(fac._id);
          }
        }
        
        classes.push({
          departmentId: dept._id,
          batchId: batch._id,
          name: sectionName,
          advisorFacultyId: advisor,
          facultyIds: facultyList
        });
      }
    }
  }
  
  const createdClasses = await Class.insertMany(classes);
  console.log(`✅ Created ${createdClasses.length} classes`);
  return createdClasses;
};

const seedFaculty = async (departments) => {
  console.log('👨‍🏫 Seeding faculty...');
  const facultyMembers = [];
  let facultyCount = 0;
  
  // 4 faculty per department = 20 total
  for (const dept of departments) {
    for (let i = 0; i < 4; i++) {
      facultyCount++;
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = `faculty${facultyCount}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@college.edu`;
      
      // Create faculty with password
      facultyMembers.push({
        name: `${firstName} ${lastName}`,
        email,
        password: await bcrypt.hash('password123', 10),
        departmentId: dept._id,
        designation: i === 0 ? 'Professor' : (i === 1 ? 'Associate Professor' : 'Assistant Professor'),
        qualification: 'Ph.D.',
        experience: getRandomNumber(5, 20)
      });
    }
  }
  
  const createdFaculty = await Faculty.insertMany(facultyMembers);
  console.log(`✅ Created ${createdFaculty.length} faculty members`);
  return createdFaculty;
};

const seedStudents = async (classes) => {
  console.log('👨‍🎓 Seeding students...');
  const students = [];
  const parents = [];
  let studentCount = 0;
  
  // Get department and batch info for roll number generation
  const Department = require('../models/Department');
  const Batch = require('../models/Batch');
  
  // Generate students for each class
  for (const classGroup of classes) {
    const dept = await Department.findById(classGroup.departmentId);
    const batch = await Batch.findById(classGroup.batchId);
    
    // 8-10 students per class
    const studentsPerSection = getRandomNumber(8, 10);
    
    for (let i = 0; i < studentsPerSection; i++) {
      studentCount++;
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const rollNo = generateRollNo(dept.code, batch.name.split(' ')[1], studentCount);
      const email = `student${studentCount}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@college.edu`;
      
      // Guardian details
      const guardianFirstName = getRandomElement(guardianFirstNames);
      const guardianName = `${guardianFirstName} ${lastName}`;
      const guardianEmail = `parent${studentCount}.${guardianFirstName.toLowerCase()}.${lastName.toLowerCase()}@parent.com`;
      const guardianMobile = generateMobile();
      
      // Create student with password - assign to class
      const studentData = {
        name: `${firstName} ${lastName}`,
        rollNo,
        email,
        password: await bcrypt.hash('password123', 10),
        classId: classGroup._id,
        guardianName,
        guardianEmail,
        guardianMobile
      };
      
      students.push(studentData);
      
      // Create parent record
      parents.push({
        name: guardianName,
        email: guardianEmail,
        mobile: guardianMobile,
        password: await bcrypt.hash(guardianMobile, 10)
      });
    }
  }
  
  const createdStudents = await Student.insertMany(students);
  
  // Link students to parents (after students are created)
  const createdParents = [];
  for (let i = 0; i < parents.length; i++) {
    parents[i].studentIds = [createdStudents[i]._id];
    createdParents.push(parents[i]);
  }
  
  await Parent.insertMany(createdParents);
  console.log(`✅ Created ${createdStudents.length} students with ${createdParents.length} parent accounts`);
  return createdStudents;
};

const seedFees = async (students) => {
  console.log('💰 Seeding fees...');
  const fees = [];
  const currentYear = new Date().getFullYear();
  
  // Create fee records for each student for current and previous year
  for (const student of students) {
    for (const year of [currentYear - 1, currentYear]) {
      fees.push({
        studentId: student._id,
        year,
        components: [
          { name: 'Tuition Fee', amount: 50000 },
          { name: 'Lab Fee', amount: 10000 },
          { name: 'Library Fee', amount: 5000 },
          { name: 'Exam Fee', amount: 3000 }
        ],
        paidAmount: Math.random() > 0.3 ? 68000 : getRandomNumber(0, 40000),
        status: Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'partially-paid' : 'unpaid')
      });
    }
  }
  
  const createdFees = await Fee.insertMany(fees);
  console.log(`✅ Created ${createdFees.length} fee records`);
  return createdFees;
};

// Class model represents a group of students (e.g., CSE 2024 Batch - Section A)

const seedAdmin = async () => {
  console.log('👤 Seeding admin user...');
  await Admin.create({
    name: 'Admin User',
    email: 'admin@college.edu',
    password: await bcrypt.hash('admin123', 10)
  });
  console.log('✅ Admin user created (email: admin@college.edu, password: admin123)');
};

// Main seeder function
const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await connectDB();
    await clearDatabase();
    
    // Seed in order
    const departments = await seedDepartments();
    const batches = await seedBatches();
    const courses = await seedCourses(departments);
    const regulations = await seedRegulations(batches);
    const faculty = await seedFaculty(departments);
    const classes = await seedClasses(departments, batches, faculty);
    const students = await seedStudents(classes);
    await seedFees(students);
    await seedAdmin();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Batches: ${batches.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Regulations: ${regulations.length}`);
    console.log(`   - Faculty: ${faculty.length}`);
    console.log(`   - Classes: ${(await Class.countDocuments())}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Parents: ${students.length}`);
    console.log(`   - Fees: ${(await Fee.countDocuments())}`);
    
    console.log('\n🔑 Login Credentials (role required):');
    console.log('   Admin: admin@college.edu / admin123 (role: admin)');
    console.log('   Faculty: any faculty email / password123 (role: faculty)');
    console.log('   Student: any student email / password123 (role: student)');
    console.log('   Parent: any parent email / (their mobile number) (role: parent)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
seed();
