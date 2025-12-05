// Core data types for the LMS

export type UserRole = 'admin' | 'faculty' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  batchId?: string;
  section?: string;
}

export interface Batch {
  id: string;
  _id?: string;
  name: string;
  passingYear: number;
  durationYears: number;
}

export interface Department {
  id: string;
  _id?: string;
  name: string;
  code: string;
}

// Removed - Section is now represented by Class

export interface Course {
  id: string;
  _id?: string;
  code: string;
  title: string;
  credits: number;
  category: 'Core' | 'Elective' | 'Lab' | 'Project';
  description: string;
  semester: number;
}

export interface Regulation {
  id: string;
  name: string;
  appliesToBatches: string[];
  semesters: RegulationSemester[];
}

export interface RegulationSemester {
  semesterNumber: number;
  courses: string[];
}

// Class represents a group of students (e.g., "CSE 2024 Batch - Section A")
export interface Class {
  id: string;
  _id?: string;
  departmentId: string | Department;
  batchId: string | Batch;
  name: string; // Section name (A, B, C, etc.)
  advisorFacultyId?: string | Faculty;
  facultyIds: string[] | Faculty[]; // Class incharges/teachers
}

export interface Faculty {
  id: string;
  _id?: string;
  name: string;
  email: string;
  departmentId: string;
  roles: string[];
}

export interface Student {
  id: string;
  _id?: string;
  name: string;
  rollNo: string;
  email: string;
  classId: string | Class; // Reference to the class (section) the student belongs to
  guardianId?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianMobile?: string;
}

export interface Marks {
  id: string;
  classId: string;
  studentId: string;
  componentMarks: {
    mid: number;
    sessional: number;
    endsem: number;
  };
  total: number;
  grade: string;
  enteredBy: string;
}

export interface Fee {
  id: string;
  studentId: string;
  year: number;
  components: FeeComponent[];
  paidAmount: number;
  status: 'paid' | 'partially-paid' | 'unpaid';
}

export interface FeeComponent {
  name: string;
  amount: number;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  uploadedBy: string;
  visibility: 'public' | 'private';
  fileUrl: string;
  uploadedAt: string;
}
