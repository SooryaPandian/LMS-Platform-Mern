import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Course {
    id: string;
    _id?: string;
    code: string;
    title: string;
    credits: number;
    category: string;
}

interface Regulation {
    id: string;
    _id?: string;
    name: string;
    appliesToBatches: string[];
}

export default function CourseAssignment() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);

    const [selectedRegulation, setSelectedRegulation] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<string>('');

    const [currentRegulation, setCurrentRegulation] = useState<Regulation | null>(null);
    const [semesterAssignments, setSemesterAssignments] = useState<Record<number, string[]>>({});
    const [courseSearch, setCourseSearch] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Load initial data
    useEffect(() => {
        fetchDepartments();
        fetchBatches();
        fetchRegulations();
        fetchCourses();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            const depts = Array.isArray(response) ? response : (response as any)?.data || [];
            setDepartments(depts);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await api.getBatches();
            const batchList = Array.isArray(response) ? response : (response as any)?.data || [];
            setBatches(batchList);
        } catch (error) {
            console.error('Error fetching batches:', error);
            toast.error('Failed to load batches');
        }
    };

    const fetchRegulations = async () => {
        try {
            const response = await api.getRegulations();
            const regs = Array.isArray(response) ? response : (response as any)?.data || [];
            setRegulations(regs);
        } catch (error) {
            console.error('Error fetching regulations:', error);
            toast.error('Failed to load regulations');
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.getCourses();
            const courseList = Array.isArray(response) ? response : (response as any)?.data || [];
            setCourses(courseList);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to load courses');
        }
    };

    // Load course assignments when context is selected
    useEffect(() => {
        const loadAssignments = async () => {
            if (selectedRegulation && selectedDepartment && selectedBatch) {
                const regulation = regulations.find(r => ((r as any)._id || r.id) === selectedRegulation);
                setCurrentRegulation(regulation || null);

                // Load existing assignments for all semesters
                const assignments: Record<number, string[]> = {};
                const searches: Record<number, string> = {};

                for (let semester = 1; semester <= 8; semester++) {
                    try {
                        const response = await api.getCoursesForSemester(
                            selectedRegulation,
                            selectedDepartment,
                            selectedBatch,
                            semester
                        );
                        const semesterCourses = response.courses || [];
                        assignments[semester] = semesterCourses.map((c: any) => c._id || c.id);
                    } catch (error) {
                        assignments[semester] = [];
                    }
                    searches[semester] = '';
                }

                setSemesterAssignments(assignments);
                setCourseSearch(searches);
            }
        };

        loadAssignments();
    }, [selectedRegulation, selectedDepartment, selectedBatch, regulations]);

    const handleCourseToggle = (semester: number, courseId: string) => {
        setSemesterAssignments(prev => {
            const courses = prev[semester] || [];
            const isAssigned = courses.includes(courseId);

            return {
                ...prev,
                [semester]: isAssigned
                    ? courses.filter(c => c !== courseId)
                    : [...courses, courseId]
            };
        });
    };

    const handleSaveSemester = async (semester: number) => {
        if (!currentRegulation || !selectedDepartment || !selectedBatch) return;

        setIsLoading(true);
        try {
            const regulationId = (currentRegulation as any)._id || currentRegulation.id;
            const courseIds = semesterAssignments[semester] || [];

            await api.bulkAssignCourses({
                regulationId,
                departmentId: selectedDepartment,
                batchId: selectedBatch,
                semesterNumber: semester,
                courseIds
            });

            toast.success(`Semester ${semester} courses saved successfully`);
        } catch (error: any) {
            console.error('Error saving semester:', error);
            toast.error(error.message || 'Failed to save courses');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (!currentRegulation || !selectedDepartment || !selectedBatch) return;

        setIsLoading(true);
        try {
            const regulationId = (currentRegulation as any)._id || currentRegulation.id;

            // Save each semester sequentially
            for (let semester = 1; semester <= 8; semester++) {
                const courseIds = semesterAssignments[semester] || [];

                await api.bulkAssignCourses({
                    regulationId,
                    departmentId: selectedDepartment,
                    batchId: selectedBatch,
                    semesterNumber: semester,
                    courseIds
                });
            }

            toast.success('All semesters saved successfully');
        } catch (error: any) {
            console.error('Error saving all semesters:', error);
            toast.error(error.message || 'Failed to save all semesters');
        } finally {
            setIsLoading(false);
        }
    };

    const getCourseDetails = (courseId: string) => {
        return courses.find(c => (c._id || c.id) === courseId);
    };

    const getFilteredCourses = (semester: number) => {
        const search = courseSearch[semester]?.toLowerCase() || '';
        if (!search) return courses;

        return courses.filter(c =>
            c.code.toLowerCase().includes(search) ||
            c.title.toLowerCase().includes(search)
        );
    };

    const canShowAssignments = selectedRegulation && selectedDepartment && selectedBatch;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Course Assignment</h1>
                <p className="text-muted-foreground">
                    Assign courses to semesters for each regulation, department, and batch combination
                </p>
            </div>

            {/* Selection Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Context</CardTitle>
                    <CardDescription>Choose regulation, department, and batch to assign courses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Regulation</Label>
                            <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select regulation" />
                                </SelectTrigger>
                                <SelectContent>
                                    {regulations.map(reg => (
                                        <SelectItem key={reg._id || reg.id} value={reg._id || reg.id}>
                                            {reg.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                                            {dept.code} - {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Batch</Label>
                            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map(batch => (
                                        <SelectItem key={batch._id || batch.id} value={batch._id || batch.id}>
                                            {batch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {canShowAssignments && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                            <p className="text-sm">
                                <strong>Context:</strong> {currentRegulation?.name} • {' '}
                                {departments.find(d => (d._id || d.id) === selectedDepartment)?.code} • {' '}
                                Batch {batches.find(b => (b._id || b.id) === selectedBatch)?.name}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Course Assignment per Semester */}
            {canShowAssignments && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Semester-wise Course Assignment</h2>
                        <Button onClick={handleSaveAll} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            Save All Semesters
                        </Button>
                    </div>

                    {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                        <Card key={semester}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Semester {semester}</CardTitle>
                                    <Badge variant="secondary">
                                        {semesterAssignments[semester]?.length || 0} courses assigned
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search courses..."
                                        value={courseSearch[semester] || ''}
                                        onChange={(e) => setCourseSearch(prev => ({ ...prev, [semester]: e.target.value }))}
                                        className="pl-9"
                                    />
                                </div>

                                {/* Course List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                    {getFilteredCourses(semester).map(course => {
                                        const courseId = course._id || course.id;
                                        const isAssigned = semesterAssignments[semester]?.includes(courseId);

                                        return (
                                            <div
                                                key={courseId}
                                                onClick={() => handleCourseToggle(semester, courseId)}
                                                className={`
                                                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                                                    transition-all hover:bg-muted
                                                    ${isAssigned ? 'border-primary bg-primary/5' : 'border-border'}
                                                `}
                                            >
                                                {isAssigned ? (
                                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{course.code}</div>
                                                    <div className="text-sm text-muted-foreground truncate">{course.title}</div>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {course.credits} credits
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {course.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-2 border-t">
                                    <Button
                                        onClick={() => handleSaveSemester(semester)}
                                        disabled={isLoading}
                                        size="sm"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Semester {semester}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!canShowAssignments && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Select Context</h3>
                            <p className="text-muted-foreground">
                                Please select a regulation, department, and batch to start assigning courses
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
