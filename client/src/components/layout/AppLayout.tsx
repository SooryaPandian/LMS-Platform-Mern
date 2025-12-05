import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  DollarSign,
  Upload,
  LogOut,
  Menu,
  X,
  Building2,
  Calendar,
  UserCog,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: any;
  path: string;
}

const roleNavigation: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Batches', icon: Calendar, path: '/admin/batches' },
    { label: 'Departments', icon: Building2, path: '/admin/departments' },
    { label: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { label: 'Regulations', icon: FileText, path: '/admin/regulations' },
    { label: 'Course Assignment', icon: BookOpen, path: '/admin/course-assignment' },
    { label: 'Faculty Assignment', icon: UserCog, path: '/admin/faculty-assignment' },
    { label: 'Classes', icon: GraduationCap, path: '/admin/classes' },
    { label: 'Faculty', icon: UserCog, path: '/admin/faculty' },
    { label: 'Students', icon: Users, path: '/admin/students' },
    { label: 'Fees', icon: DollarSign, path: '/admin/fees' },
    { label: 'Bulk Upload', icon: Upload, path: '/admin/bulk-upload' },
  ],
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/faculty' },
    { label: 'My Classes', icon: GraduationCap, path: '/faculty/classes' },
    { label: 'Course Materials', icon: Upload, path: '/faculty/materials' },
    { label: 'Assessments', icon: FileText, path: '/faculty/assessments' },
    { label: 'Students', icon: Users, path: '/faculty/students' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { label: 'My Marks', icon: FileText, path: '/student/marks' },
    { label: 'My Courses', icon: GraduationCap, path: '/student/courses' },
    { label: 'Materials', icon: BookOpen, path: '/student/materials' },
    { label: 'Fees', icon: DollarSign, path: '/student/fees' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
    { label: 'Child Marks', icon: FileText, path: '/parent/marks' },
    { label: 'Courses', icon: GraduationCap, path: '/parent/courses' },
    { label: 'Materials', icon: BookOpen, path: '/parent/materials' },
    { label: 'Fees', icon: DollarSign, path: '/parent/fees' },
  ],
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user ? roleNavigation[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/" className="text-xl font-bold text-foreground">
              College LMS
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          style={{ top: '64px' }}
        >
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
