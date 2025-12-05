import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MyClasses() {
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.getCourseAllocations();
            const classList = Array.isArray(response) ? response : (response as any)?.data || [];
            setClasses(classList);
        } catch (error: any) {
            console.error('Error fetching classes:', error);
            toast.error(error.message || 'Failed to load classes');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Classes</h1>
                    <p className="text-muted-foreground">View and manage your assigned courses</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((classItem: any) => {
                    const course = typeof classItem.courseId === 'object' ? classItem.courseId : null;
                    const classInfo = typeof classItem.classId === 'object' ? classItem.classId : null;

                    return (
                        <Card key={classItem._id || classItem.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    {course?.code || 'Unknown Course'}
                                </CardTitle>
                                <CardDescription>{course?.title || 'Course Title'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Class:</span>
                                        <span className="font-medium">{classInfo?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Semester:</span>
                                        <span className="font-medium">{classItem.semester || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link to={`/faculty/classes/${classItem._id || classItem.id}/students`}>
                                            <Users className="mr-2 h-4 w-4" />
                                            Students
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link to={`/faculty/materials?courseId=${course?._id || course?.id}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Materials
                                        </Link>
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link to={`/faculty/assessments?courseId=${course?._id || course?.id}&classId=${classInfo?._id || classInfo?.id}`}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tests
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {classes.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No classes assigned yet</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
