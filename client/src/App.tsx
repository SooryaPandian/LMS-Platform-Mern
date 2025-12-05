import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/Dashboard";
import BatchManagement from "./pages/admin/BatchManagement";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import RegulationManagement from "./pages/admin/RegulationManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import FacultyManagement from "./pages/admin/FacultyManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import CourseAssignment from "./pages/admin/CourseAssignment";
import FacultyAssignment from "./pages/admin/FacultyAssignment";
import FacultyAssignmentView from "./pages/admin/FacultyAssignmentView";
import FeeManagement from "./pages/admin/FeeManagement";

import FacultyDashboard from "./pages/faculty/Dashboard";
import MyClasses from "./pages/faculty/MyClasses";
import ClassStudents from "./pages/faculty/ClassStudents";
import CourseMaterials from "./pages/faculty/CourseMaterials";
import Assessments from "./pages/faculty/Assessments";

import StudentDashboard from "./pages/student/Dashboard";
import MyMarks from "./pages/student/MyMarks";
import MyFees from "./pages/student/MyFees";
import MyCourses from "./pages/student/MyCourses";
import StudentCourseMaterials from "./pages/student/CourseMaterials";
import ParentDashboard from "./pages/parent/Dashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/batches"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <BatchManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <DepartmentManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <CourseManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/regulations"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <RegulationManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <ClassManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/faculty"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <FacultyManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/students"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <StudentManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/course-assignment"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <CourseAssignment />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/faculty-assignment"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <FacultyAssignment />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/faculty-assignment-view"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <FacultyAssignmentView />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/admin/fees"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <ProtectedRoute>
                    <FeeManagement />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />


            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <FacultyDashboard />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/faculty/classes"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <MyClasses />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/faculty/classes/:classId/students"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <ClassStudents />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/faculty/materials"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <CourseMaterials />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/faculty/assessments"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <Assessments />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <RoleGuard allowedRoles={['faculty']}>
                  <ProtectedRoute>
                    <ClassStudents />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <RoleGuard allowedRoles={['student']}>
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/student/marks"
              element={
                <RoleGuard allowedRoles={['student']}>
                  <ProtectedRoute>
                    <MyMarks />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/student/fees"
              element={
                <RoleGuard allowedRoles={['student']}>
                  <ProtectedRoute>
                    <MyFees />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/student/courses"
              element={
                <RoleGuard allowedRoles={['student']}>
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/student/materials"
              element={
                <RoleGuard allowedRoles={['student']}>
                  <ProtectedRoute>
                    <StudentCourseMaterials />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />

            {/* Parent Routes */}
            <Route
              path="/parent"
              element={
                <RoleGuard allowedRoles={['parent']}>
                  <ProtectedRoute>
                    <ParentDashboard />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/parent/marks"
              element={
                <RoleGuard allowedRoles={['parent']}>
                  <ProtectedRoute>
                    <MyMarks />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/parent/fees"
              element={
                <RoleGuard allowedRoles={['parent']}>
                  <ProtectedRoute>
                    <MyFees />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/parent/courses"
              element={
                <RoleGuard allowedRoles={['parent']}>
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />
            <Route
              path="/parent/materials"
              element={
                <RoleGuard allowedRoles={['parent']}>
                  <ProtectedRoute>
                    <StudentCourseMaterials />
                  </ProtectedRoute>
                </RoleGuard>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
