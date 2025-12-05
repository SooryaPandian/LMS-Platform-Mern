import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const stats = [
    { title: 'My Classes', value: '4', icon: BookOpen, trend: 'This semester' },
    { title: 'Total Students', value: '156', icon: Users, trend: 'Across all classes' },
    { title: 'Materials Uploaded', value: '23', icon: FileText, trend: 'This month' },
    { title: 'Pending Marks', value: '2', icon: Upload, trend: 'To be entered' },
  ];

  const upcomingClasses = [
    { course: 'CSE101', title: 'Programming Fundamentals', section: 'A', time: '10:00 AM', room: 'Lab-1' },
    { course: 'CSE102', title: 'Data Structures', section: 'B', time: '2:00 PM', room: 'CR-201' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your teaching overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
            <CardTitle>Today's Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{cls.course}</span>
                    <span className="text-xs text-muted-foreground">Section {cls.section}</span>
                  </div>
                  <p className="text-sm font-medium">{cls.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {cls.time} • {cls.room}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/faculty/classes/${cls.course}`}>View</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/faculty/classes">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Classes
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Enter Marks
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              View Students
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
