import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalCourses: 0,
    totalClasses: 0,
    totalBatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: loading ? '...' : stats.totalStudents.toLocaleString(),
      icon: Users,
      trend: `${stats.totalBatches || 0} batches active`,
    },
    {
      title: 'Active Courses',
      value: loading ? '...' : stats.totalCourses.toString(),
      icon: BookOpen,
      trend: 'Across all departments',
    },
    {
      title: 'Total Classes',
      value: loading ? '...' : stats.totalClasses.toString(),
      icon: GraduationCap,
      trend: `${stats.totalFaculty || 0} faculty members`,
    },
    {
      title: 'Departments',
      value: loading ? '...' : stats.totalDepartments.toString(),
      icon: Building2,
      trend: 'All active',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your institution.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New student enrollment</p>
                  <p className="text-xs text-muted-foreground">25 students added to Batch 2026</p>
                </div>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-accent/10 p-2">
                  <BookOpen className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Course materials uploaded</p>
                  <p className="text-xs text-muted-foreground">Dr. Smith uploaded 3 new lectures</p>
                </div>
                <span className="text-xs text-muted-foreground">5h ago</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-secondary/10 p-2">
                  <GraduationCap className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Marks entry completed</p>
                  <p className="text-xs text-muted-foreground">Final marks for CSE101 uploaded</p>
                </div>
                <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => navigate('/admin/students')}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Add New Students</p>
                <p className="text-xs text-muted-foreground">Bulk upload via CSV</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/classes')}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
            >
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Create Class</p>
                <p className="text-xs text-muted-foreground">Set up new class for semester</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Manage Courses</p>
                <p className="text-xs text-muted-foreground">Add or edit course catalog</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/course-assignment')}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted"
            >
              <BookOpen className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Assign Courses</p>
                <p className="text-xs text-muted-foreground">Map courses to semesters</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
