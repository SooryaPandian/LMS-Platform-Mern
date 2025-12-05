import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Edit, Trash2, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function Assessments() {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [marksDialogOpen, setMarksDialogOpen] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, number>>({});

    const [formData, setFormData] = useState({
        courseId: '',
        classId: '',
        name: '',
        type: 'Mid',
        maxMarks: '',
        date: ''
    });

    useEffect(() => {
        fetchCourses();
        fetchAssessments();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.getCourseAllocations();
            const allocations = Array.isArray(response) ? response : (response as any)?.data || [];
            setCourses(allocations);

            // Extract unique classes
            const uniqueClasses = new Map();
            allocations.forEach((alloc: any) => {
                const classInfo = typeof alloc.classId === 'object' ? alloc.classId : null;
                if (classInfo && classInfo._id) {
                    uniqueClasses.set(classInfo._id, classInfo);
                }
            });

            setClasses(Array.from(uniqueClasses.values()));
        } catch (error: any) {
            toast.error(error.message || 'Failed to load courses');
        }
    };

    const fetchAssessments = async () => {
        try {
            setIsLoading(true);
            const response = await api.getAssessments();
            const assessmentList = Array.isArray(response) ? response : (response as any)?.data || [];
            setAssessments(assessmentList);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load assessments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            await api.createAssessment({
                ...formData,
                maxMarks: Number(formData.maxMarks)
            });

            toast.success('Assessment created successfully');
            setDialogOpen(false);
            setFormData({ courseId: '', classId: '', name: '', type: 'Mid', maxMarks: '', date: '' });
            fetchAssessments();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create assessment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnterMarks = async (assessment: any) => {
        setSelectedAssessment(assessment);

        // Fetch students for this class
        try {
            const classId = typeof assessment.classId === 'object' ?
                (assessment.classId._id || assessment.classId.id) : assessment.classId;

            const response = await api.getClassStudents(classId);
            const studentList = Array.isArray(response) ? response : (response as any)?.data || [];
            setStudents(studentList);

            // Pre-fill existing marks
            const existingMarks: Record<string, number> = {};
            assessment.marks?.forEach((mark: any) => {
                const studentId = typeof mark.studentId === 'object' ?
                    (mark.studentId._id || mark.studentId.id) : mark.studentId;
                existingMarks[studentId] = mark.marksObtained;
            });
            setMarks(existingMarks);

            setMarksDialogOpen(true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load students');
        }
    };

    const handleSaveMarks = async () => {
        if (!selectedAssessment) return;

        try {
            const marksArray = Object.entries(marks)
                .filter(([_, value]) => value !== undefined && value !== null)
                .map(([studentId, marksObtained]) => ({
                    studentId,
                    marksObtained: Number(marksObtained)
                }));

            await api.updateAssessmentMarks(selectedAssessment._id || selectedAssessment.id, marksArray);
            toast.success('Marks saved successfully');
            setMarksDialogOpen(false);
            fetchAssessments();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save marks');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assessment?')) return;

        try {
            await api.deleteAssessment(id);
            toast.success('Assessment deleted');
            fetchAssessments();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete assessment');
        }
    };

    // Group assessments by class
    const groupedAssessments = assessments.reduce((acc: any, assessment) => {
        const classId = typeof assessment.classId === 'object' ?
            (assessment.classId._id || assessment.classId.id) : assessment.classId;

        if (!acc[classId]) {
            acc[classId] = {
                classInfo: typeof assessment.classId === 'object' ? assessment.classId : null,
                assessments: []
            };
        }
        acc[classId].assessments.push(assessment);
        return acc;
    }, {});

    const displayClasses = selectedClass === 'all' ?
        Object.keys(groupedAssessments) :
        [selectedClass].filter(id => groupedAssessments[id]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Assessments by Class</h1>
                    <p className="text-muted-foreground">Create and manage tests organized by class</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assessment
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter by Class</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            <div className="space-y-4">
                {displayClasses.map(classId => {
                    const { classInfo, assessments: classAssessments } = groupedAssessments[classId] || { classInfo: null, assessments: [] };
                    const dept = typeof classInfo?.departmentId === 'object' ? classInfo.departmentId : null;
                    const batch = typeof classInfo?.batchId === 'object' ? classInfo.batchId : null;

                    return (
                        <Card key={classId}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5" />
                                            <CardTitle>{classInfo?.name || 'Unknown Class'}</CardTitle>
                                        </div>
                                        <CardDescription className="mt-1">
                                            {dept?.name || 'Department'} • {batch?.name || 'Batch'} • {classAssessments.length} assessments
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    {classAssessments.map((assessment: any) => {
                                        const course = typeof assessment.courseId === 'object' ? assessment.courseId : null;
                                        const marksEntered = assessment.marks?.length || 0;

                                        return (
                                            <Card key={assessment._id || assessment.id}>
                                                <CardContent className="flex items-center justify-between p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{assessment.name}</span>
                                                            <span className="px-2 py-1 text-xs bg-primary/10 rounded">{assessment.type}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {course?.code} - {course?.title} • Max: {assessment.maxMarks} marks
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {marksEntered} students marked • {new Date(assessment.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEnterMarks(assessment)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Enter Marks
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(assessment._id || assessment.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {classAssessments.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                            <p>No assessments created for this class</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {displayClasses.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No assessments found</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Assessment Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Assessment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select
                                value={formData.courseId}
                                onValueChange={(value) => {
                                    const selected = courses.find(c =>
                                        (c.courseId?._id || c.courseId?.id) === value
                                    );
                                    setFormData({
                                        ...formData,
                                        courseId: value,
                                        classId: selected?.classId?._id || selected?.classId?.id || ''
                                    });
                                }}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => {
                                        const courseData = typeof course.courseId === 'object' ? course.courseId : null;
                                        const classData = typeof course.classId === 'object' ? course.classId : null;
                                        return (
                                            <SelectItem
                                                key={courseData?._id || courseData?.id}
                                                value={courseData?._id || courseData?.id || ''}
                                            >
                                                {courseData?.code} - {classData?.name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Assessment Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Mid Semester - 1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mid">Mid Semester</SelectItem>
                                        <SelectItem value="Sessional">Sessional</SelectItem>
                                        <SelectItem value="EndSem">End Semester</SelectItem>
                                        <SelectItem value="Assignment">Assignment</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Max Marks *</Label>
                                <Input
                                    type="number"
                                    value={formData.maxMarks}
                                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                                    placeholder="100"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                Create
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Enter Marks Dialog */}
            <Dialog open={marksDialogOpen} onOpenChange={setMarksDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Enter Marks - {selectedAssessment?.name} (Max: {selectedAssessment?.maxMarks})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {students.map(student => {
                            const studentId = student._id || student.id;
                            return (
                                <div key={studentId} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{student.rollNo}</p>
                                        <p className="text-sm text-muted-foreground">{student.name}</p>
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            type="number"
                                            placeholder="Marks"
                                            value={marks[studentId] || ''}
                                            onChange={(e) => setMarks({ ...marks, [studentId]: Number(e.target.value) })}
                                            min="0"
                                            max={selectedAssessment?.maxMarks}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setMarksDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveMarks}>
                            Save Marks
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
