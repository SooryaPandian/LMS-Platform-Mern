import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search, Mail, Phone, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClassStudents() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [students, setStudents] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.getCourseAllocations();
            const allocations = Array.isArray(response) ? response : (response as any)?.data || [];

            // Extract unique classes
            const uniqueClasses = new Map();
            allocations.forEach((alloc: any) => {
                const classInfo = typeof alloc.classId === 'object' ? alloc.classId : null;
                if (classInfo && classInfo._id) {
                    uniqueClasses.set(classInfo._id, classInfo);
                }
            });

            const classList = Array.from(uniqueClasses.values());
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
                const response = await api.getClassStudents(classInfo._id || classInfo.id);
                const studentList = Array.isArray(response) ? response : (response as any)?.data || [];
                studentsData[classInfo._id || classInfo.id] = studentList;
            } catch (error: any) {
                console.error(`Error fetching students for class ${classInfo.name}:`, error);
                studentsData[classInfo._id || classInfo.id] = [];
            }
        }

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

    if (isLoading) {
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
                    <div className="grid grid-cols-2 gap-4">
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
                                                {dept?.name || 'Dept'} - {batch?.name || 'Batch'} - {classInfo.name}
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
                    </div>
                </CardContent>
            </Card>

            {selectedClass === 'all' ? (
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
                                                <CardTitle>{classInfo.name}</CardTitle>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {dept?.name || 'Department'} • {batch?.name || 'Batch'} • {filteredStudents.length} students
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
