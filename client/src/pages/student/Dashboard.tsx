import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function StudentDashboard() {
  const stats = [
    { title: 'Current CGPA', value: '8.5', icon: TrendingUp, trend: 'Keep it up!' },
    { title: 'Enrolled Courses', value: '6', icon: BookOpen, trend: 'This semester' },
    { title: 'Materials Available', value: '34', icon: FileText, trend: 'Total resources' },
    { title: 'Fee Status', value: 'Paid', icon: DollarSign, trend: 'Up to date' },
  ];

  const recentMarks = [
    { course: 'CSE101', title: 'Programming Fundamentals', marks: 92, total: 100, grade: 'A+' },
    { course: 'MTH101', title: 'Engineering Mathematics', marks: 85, total: 100, grade: 'A' },
    { course: 'PHY101', title: 'Engineering Physics', marks: 78, total: 100, grade: 'B+' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your academic progress and resources.</p>
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
            <CardTitle>Recent Marks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMarks.map((mark) => (
              <div key={mark.course} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{mark.title}</p>
                    <p className="text-xs text-muted-foreground">{mark.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{mark.marks}/{mark.total}</p>
                    <p className="text-xs font-medium text-primary">{mark.grade}</p>
                  </div>
                </div>
                <Progress value={(mark.marks / mark.total) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/student/marks">
                <FileText className="mr-2 h-4 w-4" />
                View All Marks
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/student/materials">
                <BookOpen className="mr-2 h-4 w-4" />
                Course Materials
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/student/fees">
                <DollarSign className="mr-2 h-4 w-4" />
                Fee Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Semester Progress</span>
                <span className="font-medium">Week 8 of 16</span>
              </div>
              <Progress value={50} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Attendance</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
