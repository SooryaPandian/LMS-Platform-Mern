import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search, Mail, Phone, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ClassStudents() {
    const { user, loading: authLoading } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [students, setStudents] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [myClassesOnly, setMyClassesOnly] = useState(true); // Default to showing only my classes

    // Get the faculty ID - could be id or _id depending on the source
    const facultyId = (user as any)?._id || user?.id;

    useEffect(() => {
        if (!authLoading) {
            fetchClasses();
        }
    }, [authLoading, myClassesOnly, facultyId]);

    const fetchClasses = async () => {
        setIsLoading(true);
        try {
            // If myClassesOnly is enabled and we have a faculty ID, filter by faculty
            const params = myClassesOnly && facultyId ? { facultyId } : {};
            console.log('=== Fetching classes ===');
            console.log('Params:', params);

            const response = await api.getCourseAllocations(params);
            console.log('API Response:', response);

            const allocations = Array.isArray(response) ? response : (response as any)?.data || [];
            console.log('Allocations:', allocations);

            // Extract unique classes
            const uniqueClasses = new Map();
            allocations.forEach((alloc: any) => {
                const classInfo = typeof alloc.classId === 'object' ? alloc.classId : null;
                if (classInfo && classInfo._id) {
                    uniqueClasses.set(classInfo._id, classInfo);
                }
            });

            const classList = Array.from(uniqueClasses.values());
            console.log('Unique classes:', classList);
            setClasses(classList);

            // Fetch students for each class
            await fetchStudentsForClasses(classList);
        } catch (error: any) {
            console.error('Error fetching classes:', error);
            toast.error(error.message || 'Failed to load classes');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentsForClasses = async (classList: any[]) => {
        const studentsData: Record<string, any[]> = {};

        for (const classInfo of classList) {
            try {
                const classId = classInfo._id || classInfo.id;
                console.log('Fetching students for class:', classId, classInfo.name);

                const response = await api.getClassStudents(classId);
                console.log('Students response for', classInfo.name, ':', response);

                const studentList = Array.isArray(response) ? response : (response as any)?.data || [];
                console.log('Student list for', classInfo.name, ':', studentList.length, 'students');

                studentsData[classId] = studentList;
            } catch (error: any) {
                console.error(`Error fetching students for class ${classInfo.name}:`, error);
                studentsData[classInfo._id || classInfo.id] = [];
            }
        }

        console.log('Final students data:', studentsData);
        setStudents(studentsData);
    };

    const getFilteredStudents = (classId: string) => {
        const classStudents = students[classId] || [];
        if (!search) return classStudents;

        const searchTerm = search.toLowerCase();
        return classStudents.filter(student =>
            student.name?.toLowerCase().includes(searchTerm) ||
            student.rollNo?.toLowerCase().includes(searchTerm) ||
            student.email?.toLowerCase().includes(searchTerm)
        );
    };

    const getAllStudents = () => {
        const all: any[] = [];
        Object.values(students).forEach(classList => {
            all.push(...classList);
        });

        if (!search) return all;

        const searchTerm = search.toLowerCase();
        return all.filter(student =>
            student.name?.toLowerCase().includes(searchTerm) ||
            student.rollNo?.toLowerCase().includes(searchTerm) ||
            student.email?.toLowerCase().includes(searchTerm)
        );
    };

    if (isLoading || authLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    const displayClasses = selectedClass === 'all' ? classes : classes.filter(c => (c._id || c.id) === selectedClass);
    const totalStudents = selectedClass === 'all' ? getAllStudents().length : getFilteredStudents(selectedClass).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Students by Class</h1>
                <p className="text-muted-foreground">View and manage students organized by class</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Students</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(classInfo => {
                                        const dept = typeof classInfo.departmentId === 'object' ? classInfo.departmentId : null;
                                        const batch = typeof classInfo.batchId === 'object' ? classInfo.batchId : null;
                                        return (
                                            <SelectItem key={classInfo._id || classInfo.id} value={classInfo._id || classInfo.id}>
                                                {dept?.code || 'Dept'} - {batch?.name || 'Batch'} - Section {classInfo.name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, roll number, or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Show</Label>
                            <div className="flex items-center space-x-2 h-10">
                                <Switch
                                    id="my-classes"
                                    checked={myClassesOnly}
                                    onCheckedChange={setMyClassesOnly}
                                />
                                <Label htmlFor="my-classes" className="cursor-pointer">
                                    My Classes Only
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {classes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            {myClassesOnly ? 'No classes assigned to you yet' : 'No classes found'}
                        </p>
                    </CardContent>
                </Card>
            ) : selectedClass === 'all' ? (
                <div className="space-y-4">
                    {displayClasses.map(classInfo => {
                        const classId = classInfo._id || classInfo.id;
                        const filteredStudents = getFilteredStudents(classId);
                        const dept = typeof classInfo.departmentId === 'object' ? classInfo.departmentId : null;
                        const batch = typeof classInfo.batchId === 'object' ? classInfo.batchId : null;

                        return (
                            <Card key={classId}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-5 w-5" />
                                                <CardTitle>{dept?.code || 'Dept'} - {batch?.name || 'Batch'} - Section {classInfo.name}</CardTitle>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {dept?.name || 'Department'} • {filteredStudents.length} students
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        {filteredStudents.map((student) => (
                                            <Card key={student._id || student.id}>
                                                <CardContent className="flex items-center justify-between p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm font-medium">{student.rollNo}</span>
                                                        </div>
                                                        <p className="font-medium">{student.name}</p>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {student.email}
                                                            </span>
                                                            {student.guardianMobile && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {student.guardianMobile}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                                <p>No students found in this class</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <CardTitle>Students ({totalStudents})</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {getFilteredStudents(selectedClass).map((student) => (
                                <Card key={student._id || student.id}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-medium">{student.rollNo}</span>
                                            </div>
                                            <p className="font-medium">{student.name}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {student.email}
                                                </span>
                                                {student.guardianMobile && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {student.guardianMobile}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {getFilteredStudents(selectedClass).length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="mx-auto h-12 w-12 mb-4" />
                                    <p>No students found</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
