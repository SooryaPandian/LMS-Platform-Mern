import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Student, Class, Department, Batch } from '@/types';
import { BulkUpload } from '@/components/BulkUpload';
import { api } from '@/lib/api';

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        rollNo: '',
        email: '',
        password: '',
        classId: '',
        guardianName: '',
        guardianEmail: '',
        guardianMobile: ''
    });

    // Load initial data
    useEffect(() => {
        fetchStudents();
        fetchClasses();
        fetchDepartments();
        fetchBatches();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.getStudents();
            const studentList = Array.isArray(response) ? response : (response as any)?.data || [];
            setStudents(studentList);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.getClasses();
            const classList = Array.isArray(response) ? response : (response as any)?.data || [];
            setClasses(classList);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            const deptList = Array.isArray(response) ? response : (response as any)?.data || [];
            setDepartments(deptList);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingStudent) {
                await api.updateStudent(editingStudent.id, formData);
                toast.success('Student updated successfully');
            } else {
                await api.createStudent(formData);
                toast.success('Student created successfully');
            }

            setDialogOpen(false);
            resetForm();
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save student');
        }
    };

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            id: student.id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email,
            password: '',
            classId: typeof student.classId === 'object' ? student.classId.id : student.classId,
            guardianName: student.guardianName || '',
            guardianEmail: student.guardianEmail || '',
            guardianMobile: student.guardianMobile || ''
        });
        setDialogOpen(true);
    };

    const handleDelete = async (student: Student) => {
        if (confirm(`Are you sure you want to delete ${student.name}?`)) {
            try {
                await api.deleteStudent(student.id);
                toast.success('Student deleted successfully');
                fetchStudents();
            } catch (error: any) {
                toast.error(error.message || 'Failed to delete student');
            }
        }
    };

    const handleBulkUpload = async (data: any[]) => {
        try {
            await api.bulkUploadStudents({ students: data });
            toast.success('Students uploaded successfully');
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload students');
        }
    };

    const resetForm = () => {
        setEditingStudent(null);
        setFormData({
            id: '',
            name: '',
            rollNo: '',
            email: '',
            password: '',
            classId: '',
            guardianName: '',
            guardianEmail: '',
            guardianMobile: ''
        });
    };

    const getClassName = (classItem: Class | string) => {
        if (typeof classItem === 'string') return classItem;
        const dept = typeof classItem.departmentId === 'object' ? classItem.departmentId.code : classItem.departmentId;
        const batch = typeof classItem.batchId === 'object' ? classItem.batchId.name : classItem.batchId;
        return `${dept} ${batch} - Section ${classItem.name}`;
    };

    const columns = [
        { key: 'rollNo', label: 'Roll No' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        {
            key: 'classId',
            label: 'Class',
            render: (s: Student) => getClassName(s.classId)
        },
        {
            key: 'guardianName',
            label: 'Guardian',
            render: (s: Student) => s.guardianName || 'Not provided'
        }
    ];

    const bulkUploadHeaders = [
        'name', 'rollNo', 'email', 'password', 'classId',
        'guardianName', 'guardianEmail', 'guardianMobile'
    ];

    // Filter options
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');

    const filteredClasses = classes.filter(c => {
        const deptId = typeof c.departmentId === 'object' ? (c.departmentId._id || c.departmentId.id) : c.departmentId;
        const batchId = typeof c.batchId === 'object' ? (c.batchId._id || c.batchId.id) : c.batchId;
        if (selectedDept && deptId !== selectedDept) return false;
        if (selectedBatch && batchId !== selectedBatch) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Student Management</h1>
                    <p className="text-muted-foreground">Manage student records and parent details</p>
                </div>
                <div className="flex gap-2">
                    <BulkUpload
                        onUpload={handleBulkUpload}
                        templateHeaders={bulkUploadHeaders}
                        entityName="Students"
                    />
                    <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Student
                    </Button>
                </div>
            </div>

            <DataTable
                data={students}
                columns={columns}
                searchable
                searchPlaceholder="Search students..."
                actions={(student) => (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(student)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Student Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Alice Johnson"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rollNo">Roll Number *</Label>
                                    <Input
                                        id="rollNo"
                                        value={formData.rollNo}
                                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                                        placeholder="2024CSE001"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="student@college.edu"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password {!editingStudent && '*'}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingStudent ? "Leave blank to keep unchanged" : "password123"}
                                        required={!editingStudent}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="classId">Class *</Label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by dept" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Departments</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>{dept.code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Batches</SelectItem>
                                            {batches.map(batch => (
                                                <SelectItem key={batch._id || batch.id} value={batch._id || batch.id}>{batch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Select
                                    value={formData.classId}
                                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses.map(classItem => (
                                            <SelectItem key={classItem._id || classItem.id} value={classItem._id || classItem.id}>
                                                {getClassName(classItem)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Parent/Guardian Information */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
                            <p className="text-sm text-muted-foreground">
                                Parent login: Email as username, mobile number as password
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="guardianName">Guardian Name</Label>
                                <Input
                                    id="guardianName"
                                    value={formData.guardianName}
                                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                    placeholder="Parent Name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                                    <Input
                                        id="guardianEmail"
                                        type="email"
                                        value={formData.guardianEmail}
                                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                                        placeholder="parent@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guardianMobile">Guardian Mobile (Password)</Label>
                                    <Input
                                        id="guardianMobile"
                                        type="tel"
                                        value={formData.guardianMobile}
                                        onChange={(e) => setFormData({ ...formData, guardianMobile: e.target.value })}
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingStudent ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
