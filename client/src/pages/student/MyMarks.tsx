import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MyMarks() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // For parents, get the selected child's ID, otherwise use logged-in student's ID
    const getStudentId = () => {
        if (user.role === 'parent') {
            return localStorage.getItem('selectedChildId') || '';
        }
        return user._id || '';
    };

    const studentId = getStudentId();

    useEffect(() => {
        console.log('User from localStorage:', user);
        console.log('StudentId:', studentId);
        if (studentId && studentId !== 'student') {
            fetchMarks();
        } else {
            console.error('Invalid studentId:', studentId);
            if (user.role === 'parent') {
                toast.error('Please select a child from the dashboard');
            } else {
                toast.error('Invalid student ID. Please login again.');
            }
            setIsLoading(false);
        }
    }, [studentId]);

    const fetchMarks = async () => {
        try {
            console.log('Fetching marks for studentId:', studentId);
            const response = await api.getStudentMarks(studentId);
            console.log('Marks response:', response);
            const marksList = Array.isArray(response) ? response : (response as any)?.data || [];
            console.log('Processed marks:', marksList);
            setAssessments(marksList);
        } catch (error: any) {
            console.error('Error fetching marks:', error);
            toast.error(error.message || 'Failed to load marks');
        } finally {
            setIsLoading(false);
        }
    };

    // Group assessments by course
    const groupedByCourse = assessments.reduce((acc: any, assessment) => {
        const course = typeof assessment.courseId === 'object' ? assessment.courseId : null;
        const courseId = course?._id || course?.id || 'unknown';

        if (!acc[courseId]) {
            acc[courseId] = {
                course,
                assessments: []
            };
        }
        acc[courseId].assessments.push(assessment);
        return acc;
    }, {});

    // Get unique courses for filter
    const uniqueCourses = Object.values(groupedByCourse).map((group: any) => group.course);

    // Filter by selected course
    const filteredCourses = selectedCourse === 'all'
        ? Object.values(groupedByCourse)
        : Object.values(groupedByCourse).filter((group: any) => {
            const courseId = group.course?._id || group.course?.id;
            return courseId === selectedCourse;
        });

    const calculateCourseAverage = (assessments: any[]) => {
        if (assessments.length === 0) return 0;
        const total = assessments.reduce((sum, a) => {
            const marksObtained = a.marksObtained || 0;
            return sum + (marksObtained / a.maxMarks) * 100;
        }, 0);
        return total / assessments.length;
    };

    const getGrade = (percentage: number) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    const title = user.role === 'parent' ? "Child's Marks" : "My Marks";
    const subtitle = user.role === 'parent' ? "View your child's assessment scores and grades" : "View your assessment scores and grades";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>

            {/* Course Filter */}
            {uniqueCourses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Filter by Course</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {uniqueCourses.map((course: any) => (
                                        <SelectItem key={course?._id || course?.id} value={course?._id || course?.id}>
                                            {course?.code} - {course?.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {filteredCourses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No marks available yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredCourses.map((group: any) => {
                        const { course, assessments: courseAssessments } = group;
                        const average = calculateCourseAverage(courseAssessments);
                        const grade = getGrade(average);

                        return (
                            <Card key={course?._id || course?.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{course?.title || 'Course'}</CardTitle>
                                            <CardDescription>{course?.code}</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                <span className="text-2xl font-bold">{average.toFixed(1)}%</span>
                                            </div>
                                            <p className="text-sm font-medium text-primary">{grade}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {courseAssessments.map((assessment: any) => {
                                            const marksObtained = assessment.marksObtained || 0;
                                            const percentage = (marksObtained / assessment.maxMarks) * 100;

                                            return (
                                                <div key={assessment._id || assessment.id} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium">{assessment.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span className="px-2 py-0.5 bg-primary/10 rounded">{assessment.type}</span>
                                                                <span>{new Date(assessment.date).toLocaleDateString()}</span>
                                                                {assessment.enteredAt && (
                                                                    <span>• Entered: {new Date(assessment.enteredAt).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold">
                                                                {marksObtained}/{assessment.maxMarks}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                                        </div>
                                                    </div>
                                                    <Progress value={percentage} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
