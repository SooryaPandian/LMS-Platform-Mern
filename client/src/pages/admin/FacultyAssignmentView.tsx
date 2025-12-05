import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, UserCheck, Edit, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Faculty {
    id: string;
    _id?: string;
    name: string;
    email: string;
    departmentId: string;
}

interface Course {
    id: string;
    _id?: string;
    code: string;
    title: string;
    credits: number;
    allocationId?: string;
    facultyIds?: any[];
}

interface Allocation {
    _id: string;
    courseId: any;
    facultyIds: any[];
    semester: number;
    classId: string;
}

export default function FacultyAssignmentView() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [allocationsBySemester, setAllocationsBySemester] = useState<Map<number, Allocation[]>>(new Map());

    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [classId, setClassId] = useState('');

    // Load initial data
    useEffect(() => {
        fetchDepartments();
        fetchBatches();
        fetchFaculty();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            const depts = Array.isArray(response) ? response : (response as any)?.data || [];
            setDepartments(depts);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await api.getBatches();
            const batchList = Array.isArray(response) ? response : (response as any)?.data || [];
            setBatches(batchList);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchFaculty = async () => {
        try {
            const response = await api.getFaculty();
            const facultyList = Array.isArray(response) ? response : (response as any)?.data || [];
            setFaculty(facultyList);
        } catch (error) {
            console.error('Error fetching faculty:', error);
        }
    };

    // Load allocations when section is selected
    useEffect(() => {
        const loadAllocations = async () => {
            if (selectedDepartment && selectedBatch && selectedSection) {
                try {
                    // Find the class
                    const classesResponse = await api.getClasses({
                        departmentId: selectedDepartment,
                        batchId: selectedBatch,
                        name: selectedSection
                    });

                    const classes = Array.isArray(classesResponse) ? classesResponse : (classesResponse as any)?.data || [];
                    if (classes.length === 0) {
                        toast.error('No class found for the selected filters');
                        setAllocationsBySemester(new Map());
                        return;
                    }

                    const selectedClassId = classes[0]._id || classes[0].id;
                    setClassId(selectedClassId);

                    // Load allocations for all semesters
                    const semesterMap = new Map<number, Allocation[]>();

                    for (let semester = 1; semester <= 8; semester++) {
                        try {
                            const coursesData = await api.getCoursesForSection(selectedClassId, semester);
                            const courses = coursesData.courses || [];

                            // Convert courses to allocations format
                            const allocations: Allocation[] = courses
                                .filter((c: any) => c.allocationId) // Only include courses that have allocations
                                .map((course: any) => ({
                                    _id: course.allocationId,
                                    courseId: course,
                                    facultyIds: course.facultyIds || [],
                                    semester: semester,
                                    classId: selectedClassId
                                }));

                            if (allocations.length > 0) {
                                semesterMap.set(semester, allocations);
                            }
                        } catch (error) {
                            console.error(`Error loading semester ${semester}:`, error);
                        }
                    }

                    setAllocationsBySemester(semesterMap);
                } catch (error: any) {
                    console.error('Error loading allocations:', error);
                    toast.error(error.message || 'Failed to load allocations');
                }
            }
        };

        loadAllocations();
    }, [selectedDepartment, selectedBatch, selectedSection]);

    const getFacultyDetails = (facultyId: string) => {
        return faculty.find(f => (f._id || f.id) === (facultyId._id || facultyId));
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const canShowView = selectedDepartment && selectedBatch && selectedSection;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Faculty Assignment View</h1>
                    <p className="text-muted-foreground">View faculty assignments for each semester</p>
                </div>
                <Button
                    onClick={() => navigate('/admin/faculty-assignment')}
                    variant="default"
                >
                    <Edit className="mr-2 h-4 w-4" />
                    Assign Faculty
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Section to View</CardTitle>
                    <CardDescription>Choose department, batch, and section</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id || dept._id} value={dept.id || dept._id}>
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
                                        <SelectItem key={batch.id || batch._id} value={batch.id || batch._id}>
                                            {batch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['A', 'B', 'C', 'D'].map(sec => (
                                        <SelectItem key={sec} value={sec}>
                                            Section {sec}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Semester-wise Faculty Assignment View */}
            {canShowView && (
                <>
                    <div className="rounded-lg border bg-card p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">
                                {departments.find(d => (d.id || d._id) === selectedDepartment)?.code} - Batch {batches.find(b => (b.id || b._id) === selectedBatch)?.name} - Section {selectedSection}
                            </h2>
                            <p className="text-muted-foreground">Faculty assignments for all semesters</p>
                        </div>

                        {/* Semester Grid - 2 columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => {
                                const semesterAllocations = allocationsBySemester.get(semester) || [];
                                const totalCourses = semesterAllocations.length;

                                return (
                                    <Card key={semester} className="overflow-hidden">
                                        <CardHeader className="bg-primary/5 border-b">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">Semester {semester}</CardTitle>
                                                <Badge variant="secondary">
                                                    {totalCourses} course{totalCourses !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {semesterAllocations.length > 0 ? (
                                                <div className="divide-y">
                                                    {semesterAllocations.map(allocation => {
                                                        const course = allocation.courseId;
                                                        const assignedFaculty = allocation.facultyIds
                                                            .map(fId => getFacultyDetails(typeof fId === 'object' ? fId._id : fId))
                                                            .filter(Boolean) as Faculty[];

                                                        return (
                                                            <div key={allocation._id} className="p-4 hover:bg-muted/50 transition-colors">
                                                                <div className="space-y-3">
                                                                    {/* Course Info */}
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                                                                                <BookOpen className="h-4 w-4 text-primary" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-semibold text-sm">{course.code}</p>
                                                                                <p className="text-sm text-muted-foreground">{course.title}</p>
                                                                            </div>
                                                                        </div>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {course.credits} credits
                                                                        </Badge>
                                                                    </div>

                                                                    {/* Faculty List */}
                                                                    {assignedFaculty.length > 0 ? (
                                                                        <div className="ml-11 space-y-2">
                                                                            {assignedFaculty.map(fac => (
                                                                                <div
                                                                                    key={fac._id || fac.id}
                                                                                    className="flex items-center gap-2 text-sm"
                                                                                >
                                                                                    <Avatar className="h-6 w-6">
                                                                                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                                                                            {getInitials(fac.name)}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="font-medium">{fac.name}</span>
                                                                                    <Mail className="h-3 w-3 text-muted-foreground ml-auto" />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="ml-11">
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                No faculty assigned
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No courses for this semester</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Faculty Workload Summary</CardTitle>
                            <CardDescription>Overview of courses assigned to each faculty member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {faculty.map(fac => {
                                    let assignedCount = 0;
                                    const semesters = new Set<number>();

                                    allocationsBySemester.forEach((allocations, semester) => {
                                        allocations.forEach(allocation => {
                                            const hasThisFaculty = allocation.facultyIds.some(
                                                fId => (typeof fId === 'object' ? fId._id : fId) === (fac._id || fac.id)
                                            );
                                            if (hasThisFaculty) {
                                                assignedCount++;
                                                semesters.add(semester);
                                            }
                                        });
                                    });

                                    return (
                                        <div
                                            key={fac._id || fac.id}
                                            className="rounded-lg border p-4 space-y-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                                        {getInitials(fac.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{fac.name}</p>
                                                    <p className="text-xs text-muted-foreground">{fac.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{assignedCount}</span>
                                                    <span className="text-muted-foreground">courses</span>
                                                </div>
                                                {semesters.size > 0 && (
                                                    <div className="flex gap-1">
                                                        {Array.from(semesters).sort().map(sem => (
                                                            <Badge key={sem} variant="outline" className="text-xs">
                                                                S{sem}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {assignedCount === 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    No assignments
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!canShowView && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Select department, batch, and section to view faculty assignments
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
