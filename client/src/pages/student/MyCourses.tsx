import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, User } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MyCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const classId = user.classId;

    useEffect(() => {
        if (classId) {
            fetchCourses();
        }
    }, [classId]);

    const fetchCourses = async () => {
        try {
            // Get course allocations for the student's class with populated faculty
            const response = await api.getCourseAllocations();
            const allocations = Array.isArray(response) ? response : (response as any)?.data || [];

            // Filter for this student's class
            const classCourses = allocations.filter((alloc: any) => {
                const allocClassId = typeof alloc.classId === 'object' ?
                    (alloc.classId._id || alloc.classId.id) : alloc.classId;
                return allocClassId === classId;
            });

            setCourses(classCourses);
        } catch (error: any) {
            console.error('Error fetching courses:', error);
            toast.error(error.message || 'Failed to load courses');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Courses</h1>
                <p className="text-muted-foreground">View your enrolled courses and faculty</p>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No courses assigned yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {courses.map((allocation) => {
                        const course = typeof allocation.courseId === 'object' ? allocation.courseId : null;
                        const facultyList = Array.isArray(allocation.facultyIds) ? allocation.facultyIds : [];

                        return (
                            <Card key={allocation._id || allocation.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="h-5 w-5" />
                                                {course?.title || 'Course'}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {course?.code}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                                        <p className="text-sm">{course?.description || 'No description available'}</p>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t">
                                        <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                                        {facultyList.length > 0 ? (
                                            <div className="space-y-2">
                                                {facultyList.map((faculty: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{faculty?.name || 'Unknown'}</p>
                                                            {faculty?.email && (
                                                                <p className="text-xs text-muted-foreground">{faculty.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Faculty not assigned</p>
                                        )}
                                    </div>

                                    {course?.credits && (
                                        <div className="flex items-center justify-between pt-2 border-t text-sm">
                                            <span className="text-muted-foreground">Credits</span>
                                            <span className="font-medium">{course.credits}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
