import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BookOpen, FileText, DollarSign, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ParentDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [childData, setChildData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      localStorage.setItem('selectedChildId', selectedChild);
      fetchChildData();
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      // Parent's studentIds are populated during login
      const studentIds = user.studentIds || [];

      if (studentIds.length === 0) {
        toast.error('No children linked to this account');
        setIsLoading(false);
        return;
      }

      // Fetch student details for each child
      const childrenData = [];
      for (const studentId of studentIds) {
        try {
          const response = await api.getStudent(typeof studentId === 'object' ? (studentId._id || studentId.id) : studentId);
          const student = response?.data || response;
          if (student) {
            childrenData.push(student);
          }
        } catch (error) {
          console.error('Error fetching child data:', error);
        }
      }

      setChildren(childrenData);

      // Auto-select first child or previously selected
      const savedChildId = localStorage.getItem('selectedChildId');
      if (savedChildId && childrenData.find(c => c._id === savedChildId)) {
        setSelectedChild(savedChildId);
      } else if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]._id);
      }
    } catch (error: any) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChildData = async () => {
    try {
      const child = children.find(c => c._id === selectedChild);
      setChildData(child);
    } catch (error: any) {
      console.error('Error:', error);
    }
  };

  const stats = [
    { title: 'Enrolled Courses', value: '6', icon: BookOpen, trend: 'This semester' },
    { title: 'Materials Available', value: '34', icon: FileText, trend: 'Total resources' },
    { title: 'Fee Status', value: 'Paid', icon: DollarSign, trend: 'Up to date' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No children linked to this account</p>
        <p className="text-sm text-muted-foreground mt-2">Please contact administration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <p className="text-muted-foreground">Monitor your child's academic progress and resources</p>
      </div>

      {/* Child Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Child</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child._id} value={child._id}>
                    {child.name} ({child.rollNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {childData && (
        <>
          {/* Child Info */}
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{childData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{childData.rollNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{childData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{childData.guardianMobile || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-3">
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

          {/* Quick Access */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/parent/marks">
                    <FileText className="mr-2 h-4 w-4" />
                    View Marks
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/parent/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Courses
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/parent/materials">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Course Materials
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/parent/fees">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Fee Details
                  </Link>
                </Button>
              </CardContent>
            </Card>

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
        </>
      )}
    </div>
  );
}
