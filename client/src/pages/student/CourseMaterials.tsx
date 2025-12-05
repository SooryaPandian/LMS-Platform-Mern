import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

export default function CourseMaterials() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const classId = user.classId;

    useEffect(() => {
        if (classId) {
            fetchCourses();
        }
    }, [classId]);

    useEffect(() => {
        if (selectedCourse) {
            fetchMaterials();
        }
    }, [selectedCourse, selectedFaculty, selectedUnit]);

    const fetchCourses = async () => {
        try {
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
            toast.error(error.message || 'Failed to load courses');
        }
    };

    const fetchMaterials = async () => {
        try {
            setIsLoading(true);
            const params: any = { courseId: selectedCourse };
            if (selectedFaculty !== 'all') params.facultyId = selectedFaculty;
            if (selectedUnit !== 'all') params.unit = selectedUnit;

            const response = await api.getCourseMaterials(params);
            const materialList = Array.isArray(response) ? response : (response as any)?.data || [];
            setMaterials(materialList);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load materials');
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique faculty for selected course
    const getFacultyForCourse = () => {
        if (!selectedCourse) return [];
        const courseAllocation = courses.find((alloc: any) => {
            const course = typeof alloc.courseId === 'object' ? alloc.courseId : null;
            return (course?._id || course?.id) === selectedCourse;
        });

        if (!courseAllocation) return [];

        const facultyList = Array.isArray(courseAllocation.facultyIds) ? courseAllocation.facultyIds : [];
        return facultyList.filter((f: any) => f && (f._id || f.id));
    };

    const facultyList = getFacultyForCourse();

    // Group materials by unit
    const groupedMaterials = materials.reduce((acc: any, material: any) => {
        const unit = material.unit || 1;
        if (!acc[unit]) acc[unit] = [];
        acc[unit].push(material);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Course Materials</h1>
                <p className="text-muted-foreground">Access study materials uploaded by your faculty</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Course, Faculty & Unit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select value={selectedCourse} onValueChange={(value) => {
                                setSelectedCourse(value);
                                setSelectedFaculty('all'); // Reset faculty when course changes
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(allocation => {
                                        const course = typeof allocation.courseId === 'object' ? allocation.courseId : null;
                                        return (
                                            <SelectItem key={course?._id || course?.id} value={course?._id || course?.id || ''}>
                                                {course?.code} - {course?.title}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedCourse && facultyList.length > 0 && (
                            <div className="space-y-2">
                                <Label>Faculty</Label>
                                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Faculty</SelectItem>
                                        {facultyList.map(faculty => (
                                            <SelectItem key={faculty._id || faculty.id} value={faculty._id || faculty.id}>
                                                {faculty.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All units" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Units</SelectItem>
                                    {[1, 2, 3, 4, 5].map(unit => (
                                        <SelectItem key={unit} value={unit.toString()}>Unit {unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedCourse && (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(unit => {
                        const unitMaterials = groupedMaterials[unit] || [];
                        if (selectedUnit === 'all' || selectedUnit === unit.toString()) {
                            return (
                                <Card key={unit}>
                                    <CardHeader>
                                        <CardTitle>Unit {unit}</CardTitle>
                                        <CardDescription>{unitMaterials.length} materials</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {unitMaterials.length > 0 ? (
                                            <div className="grid gap-3">
                                                {unitMaterials.map((material: any) => {
                                                    const faculty = typeof material.facultyId === 'object' ? material.facultyId : null;
                                                    return (
                                                        <Card key={material._id || material.id}>
                                                            <CardContent className="flex items-center justify-between p-4">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                                    <div className="flex-1">
                                                                        <p className="font-medium">{material.title}</p>
                                                                        <p className="text-sm text-muted-foreground">{material.description}</p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {material.fileName} • {(material.fileSize / 1024 / 1024).toFixed(2)} MB
                                                                            </p>
                                                                            {faculty && (
                                                                                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                                                                                    {faculty.name}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <a href={`${SERVER_URL}${material.fileUrl}`} target="_blank" rel="noopener noreferrer" download>
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">
                                                No materials uploaded for this unit
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {!selectedCourse && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a course to view materials</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
