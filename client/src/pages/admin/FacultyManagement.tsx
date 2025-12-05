import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Faculty, Department } from '@/types';
import { api } from '@/lib/api';

export default function FacultyManagement() {
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        departmentId: '',
        designation: '',
        phoneNumber: '',
    });

    // Load initial data
    useEffect(() => {
        fetchFaculty();
        fetchDepartments();
    }, []);

    const fetchFaculty = async () => {
        try {
            const response = await api.getFaculty();
            const facultyList = Array.isArray(response) ? response : (response as any)?.data || [];
            setFaculty(facultyList);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            toast.error('Failed to load faculty');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingFaculty) {
                // Don't send password if it's empty (user doesn't want to change it)
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete (updateData as any).password;
                }
                await api.updateFaculty(editingFaculty.id, updateData);
                toast.success('Faculty updated successfully');
            } else {
                await api.createFaculty(formData);
                toast.success('Faculty created successfully');
            }

            setDialogOpen(false);
            resetForm();
            fetchFaculty();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save faculty');
        }
    };

    const handleEdit = (facultyMember: Faculty) => {
        setEditingFaculty(facultyMember);
        setFormData({
            id: facultyMember.id,
            name: facultyMember.name,
            email: facultyMember.email,
            password: '', // Don't populate password
            departmentId: typeof facultyMember.departmentId === 'object'
                ? facultyMember.departmentId.id
                : facultyMember.departmentId,
            designation: facultyMember.designation || '',
            phoneNumber: facultyMember.phoneNumber || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (facultyMember: Faculty) => {
        if (confirm(`Are you sure you want to delete ${facultyMember.name}?`)) {
            try {
                await api.deleteFaculty(facultyMember.id);
                toast.success('Faculty deleted successfully');
                fetchFaculty();
            } catch (error: any) {
                toast.error(error.message || 'Failed to delete faculty');
            }
        }
    };

    const resetForm = () => {
        setEditingFaculty(null);
        setFormData({
            id: '',
            name: '',
            email: '',
            password: '',
            departmentId: '',
            designation: '',
            phoneNumber: '',
        });
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        {
            key: 'departmentId',
            label: 'Department',
            render: (facultyMember: Faculty) =>
                typeof facultyMember.departmentId === 'object'
                    ? facultyMember.departmentId.name
                    : facultyMember.departmentId
        },
        {
            key: 'designation',
            label: 'Designation',
            render: (facultyMember: Faculty) => facultyMember.designation || '-'
        },
        {
            key: 'phoneNumber',
            label: 'Phone',
            render: (facultyMember: Faculty) => facultyMember.phoneNumber || '-'
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Faculty Management</h1>
                    <p className="text-muted-foreground">Manage faculty members and their roles</p>
                </div>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Faculty
                </Button>
            </div>

            <DataTable
                data={faculty}
                columns={columns}
                searchable
                searchPlaceholder="Search faculty..."
                actions={(facultyMember) => (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(facultyMember)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(facultyMember)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Dr. John Smith"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="faculty@college.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password {editingFaculty ? '(leave blank to keep current)' : '*'}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required={!editingFaculty}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                <Label htmlFor="designation">Designation</Label>
                                <Input
                                    id="designation"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="Professor"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingFaculty ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
