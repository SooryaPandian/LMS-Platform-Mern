import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, Save, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
}

interface ClassItem {
    id: string;
    _id?: string;
    courseId: string;
    facultyIds: string[];
    semester: number;
}

export default function FacultyAssignment() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);

    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    const [facultyAssignments, setFacultyAssignments] = useState<Record<string, string[]>>({});
    const [facultySearch, setFacultySearch] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Load initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptData, batchData, facultyData] = await Promise.all([
                    api.getDepartments(),
                    api.getBatches(),
                    api.getFaculty()
                ]);

                setDepartments(Array.isArray(deptData) ? deptData : (deptData as any)?.data || []);
                setBatches(Array.isArray(batchData) ? batchData : (batchData as any)?.data || []);
                setFaculty(Array.isArray(facultyData) ? facultyData : (facultyData as any)?.data || []);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data');
            }
        };

        fetchData();
    }, []);

    // Load classes and courses when section is selected
    useEffect(() => {
        const loadCoursesAndAllocations = async () => {
            if (selectedDepartment && selectedBatch && selectedSection && selectedSemester) {
                try {
                    // Find the class ID for the selected department/batch/section
                    const classesResponse = await api.getClasses({
                        departmentId: selectedDepartment,
                        batchId: selectedBatch,
                        name: selectedSection
                    });

                    const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse.data || [];
                    if (classes.length === 0) {
                        toast.error('No class found for the selected filters');
                        setClasses([]);
                        return;
                    }

                    const classId = classes[0]._id || classes[0].id;

                    // Load courses for this section/semester
                    const coursesData = await api.getCoursesForSection(classId, Number(selectedSemester));
                    const coursesWithAllocations = coursesData.courses || [];

                    // Set up classes and assignments
                    const classItems: ClassItem[] = coursesWithAllocations.map((course: any) => ({
                        id: course.allocationId || `new-${course._id}`,
                        courseId: course._id,
                        facultyIds: course.facultyIds?.map((f: any) => typeof f === 'object' ? f._id : f) || [],
                        semester: Number(selectedSemester)
                    }));

                    setClasses(classItems);
                    setCourses(coursesWithAllocations);

                    // Initialize faculty assignments
                    const assignments: Record<string, string[]> = {};
                    const searches: Record<string, string> = {};
                    classItems.forEach(cls => {
                        assignments[cls.courseId] = cls.facultyIds;
                        searches[cls.courseId] = '';
                    });
                    setFacultyAssignments(assignments);
                    setFacultySearch(searches);
                } catch (error: any) {
                    console.error('Error loading courses:', error);
                    toast.error(error.message || 'Failed to load courses');
                }
            }
        };

        loadCoursesAndAllocations();
    }, [selectedDepartment, selectedBatch, selectedSection, selectedSemester]);

    const handleFacultyToggle = (classId: string, facultyId: string) => {
        setFacultyAssignments(prev => {
            const current = prev[classId] || [];
            const isAssigned = current.includes(facultyId);

            return {
                ...prev,
                [classId]: isAssigned
                    ? current.filter(f => f !== facultyId)
                    : [...current, facultyId]
            };
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Find the class ID
            const classesResponse = await api.getClasses({
                departmentId: selectedDepartment,
                batchId: selectedBatch,
                name: selectedSection
            });

            const classes = Array.isArray(classesResponse) ? classesResponse : classesResponse.data || [];
            if (classes.length === 0) {
                toast.error('Class not found');
                return;
            }

            const classId = classes[0]._id || classes[0].id;

            // Prepare assignments for bulk save
            const assignments = Object.entries(facultyAssignments).map(([courseId, facultyIds]) => ({
                courseId,
                facultyIds
            }));

            await api.bulkAssignFaculty({
                classId,
                semester: Number(selectedSemester),
                assignments
            });

            toast.success('Faculty assignments saved successfully');
        } catch (error: any) {
            console.error('Error saving assignments:', error);
            toast.error(error.message || 'Failed to save assignments');
        } finally {
            setIsLoading(false);
        }
    };

    const getCourseDetails = (courseId: string) => {
        return courses.find(c => c.id === courseId);
    };

    const getFilteredFaculty = (classId: string) => {
        const search = facultySearch[classId]?.toLowerCase() || '';

        // Filter by selected department first
        let filteredByDept = faculty;
        if (selectedDepartment) {
            filteredByDept = faculty.filter(f => {
                const fDeptId = typeof f.departmentId === 'object'
                    ? ((f.departmentId as any)._id || (f.departmentId as any).id)
                    : f.departmentId;
                return fDeptId === selectedDepartment;
            });
        }

        if (!search) return filteredByDept;

        return filteredByDept.filter(f =>
            f.name.toLowerCase().includes(search) ||
            f.email.toLowerCase().includes(search)
        );
    };

    const canShowAssignments = selectedDepartment && selectedBatch && selectedSection && selectedSemester;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Faculty Assignment</h1>
                    <p className="text-muted-foreground">Assign faculty to courses for each section</p>
                </div>
                <Button onClick={() => navigate('/admin/faculty-assignment-view')} variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Assignments
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Section</CardTitle>
                    <CardDescription>Choose department, batch, section, and semester</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
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

                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['A', 'B', 'C', 'D'].map(sec => (
                                        <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Semester</Label>
                            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {canShowAssignments && (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">
                            {departments.find(d => (d._id || d.id) === selectedDepartment)?.code || 'Unknown'} -
                            Batch {batches.find(b => (b._id || b.id) === selectedBatch)?.name || 'Unknown'} -
                            Section {selectedSection} - Semester {selectedSemester}
                        </h2>
                        <Button onClick={handleSave} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            Save All Assignments
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {classes.map(classItem => {
                            const course = getCourseDetails(classItem.courseId);
                            const assignedFaculty = facultyAssignments[classItem.courseId] || [];
                            const filteredFaculty = getFilteredFaculty(classItem.courseId);

                            return (
                                <Card key={classItem.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{course?.code} - {course?.title}</CardTitle>
                                                <CardDescription>Select faculty members to teach this course</CardDescription>
                                            </div>
                                            <Badge variant="secondary">{assignedFaculty.length} faculty assigned</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Search Input */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search faculty by name or email..."
                                                value={facultySearch[classItem.courseId] || ''}
                                                onChange={(e) => setFacultySearch({ ...facultySearch, [classItem.courseId]: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>

                                        {/* Faculty Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {filteredFaculty.map(fac => {
                                                const facId = fac._id || fac.id;
                                                const isAssigned = assignedFaculty.includes(facId);

                                                return (
                                                    <div
                                                        key={facId}
                                                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${isAssigned ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                                                            }`}
                                                        onClick={() => handleFacultyToggle(classItem.courseId, facId)}
                                                    >
                                                        <Checkbox checked={isAssigned} className="mt-1" />
                                                        <div className="flex-1">
                                                            <p className="font-medium">{fac.name}</p>
                                                            <p className="text-sm text-muted-foreground">{fac.email}</p>
                                                        </div>
                                                        {isAssigned && <UserCheck className="h-5 w-5 text-primary" />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {filteredFaculty.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>No faculty found matching your search</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}

            {!canShowAssignments && (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Select department, batch, section, and semester to start assigning faculty
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
