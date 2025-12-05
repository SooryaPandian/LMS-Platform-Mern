import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Class, Department, Batch } from '@/types';
import { api } from '@/lib/api';

export default function ClassManagement() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        departmentId: '',
        batchId: '',
        name: '', // Section name (A, B, C, etc.)
    });

    // Load initial data
    useEffect(() => {
        fetchClasses();
        fetchDepartments();
        fetchBatches();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.getClasses();
            const classes = Array.isArray(response) ? response : (response as any)?.data || [];
            setClasses(classes);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load classes');
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            const departments = Array.isArray(response) ? response : (response as any)?.data || [];
            setDepartments(departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await api.getBatches();
            const batches = Array.isArray(response) ? response : (response as any)?.data || [];
            setBatches(batches);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingClass) {
                await api.updateClass(editingClass.id, formData);
                toast.success('Class updated successfully');
            } else {
                await api.createClass(formData);
                toast.success('Class created successfully');
            }

            setDialogOpen(false);
            resetForm();
            fetchClasses();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save class');
        }
    };

    const handleEdit = (classItem: Class) => {
        setEditingClass(classItem);
        setFormData({
            id: classItem.id,
            departmentId: typeof classItem.departmentId === 'object' ? classItem.departmentId.id : classItem.departmentId,
            batchId: typeof classItem.batchId === 'object' ? classItem.batchId.id : classItem.batchId,
            name: classItem.name,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (classItem: Class) => {
        if (confirm(`Are you sure you want to delete this class?`)) {
            try {
                await api.deleteClass(classItem.id);
                toast.success('Class deleted successfully');
                fetchClasses();
            } catch (error: any) {
                toast.error(error.message || 'Failed to delete class');
            }
        }
    };

    const resetForm = () => {
        setEditingClass(null);
        setFormData({
            id: '',
            departmentId: '',
            batchId: '',
            name: '',
        });
    };

    const getClassName = (classItem: Class) => {
        const dept = typeof classItem.departmentId === 'object' ? classItem.departmentId.code : classItem.departmentId;
        const batch = typeof classItem.batchId === 'object' ? classItem.batchId.name : classItem.batchId;
        return `${dept} ${batch} - Section ${classItem.name}`;
    };

    const columns = [
        {
            key: 'name',
            label: 'Class',
            render: (classItem: Class) => getClassName(classItem)
        },
        {
            key: 'departmentId',
            label: 'Department',
            render: (classItem: Class) => typeof classItem.departmentId === 'object' ? classItem.departmentId.name : classItem.departmentId
        },
        {
            key: 'batchId',
            label: 'Batch',
            render: (classItem: Class) => typeof classItem.batchId === 'object' ? classItem.batchId.name : classItem.batchId
        },
        {
            key: 'advisorFacultyId',
            label: 'Class Advisor',
            render: (classItem: Class) => typeof classItem.advisorFacultyId === 'object' ? classItem.advisorFacultyId.name : classItem.advisorFacultyId || 'Not assigned'
        },
        {
            key: 'facultyIds',
            label: 'Faculty Count',
            render: (classItem: Class) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {classItem.facultyIds?.length || 0} teacher(s)
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Class Management</h1>
                    <p className="text-muted-foreground">Manage class groups and faculty assignments</p>
                </div>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                </Button>
            </div>

            <DataTable
                data={classes}
                columns={columns}
                searchable
                searchPlaceholder="Search classes..."
                actions={(classItem) => (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(classItem)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(classItem)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingClass ? 'Edit Class' : 'Create Class'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Create a class by selecting department, batch, and section. Faculty can be assigned later through Faculty Assignment.
                        </p>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="departmentId">Department *</Label>
                                <Select
                                    value={formData.departmentId}
                                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.code} - {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="batchId">Batch *</Label>
                                <Select
                                    value={formData.batchId}
                                    onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map(batch => (
                                            <SelectItem key={batch.id} value={batch.id}>
                                                {batch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Section *</Label>
                                <Select
                                    value={formData.name}
                                    onValueChange={(value) => setFormData({ ...formData, name: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['A', 'B', 'C', 'D', 'E'].map(sec => (
                                            <SelectItem key={sec} value={sec}>
                                                Section {sec}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingClass ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
