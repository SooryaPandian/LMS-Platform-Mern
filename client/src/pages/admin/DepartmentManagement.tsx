import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Department } from '@/types';
import { api } from '@/lib/api';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
  });

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDept) {
        await api.updateDepartment((editingDept as any)._id || editingDept.id, formData);
        toast.success('Department updated successfully');
      } else {
        await api.createDepartment(formData);
        toast.success('Department created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save department');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      id: (dept as any)._id || dept.id,
      name: dept.name,
      code: dept.code,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
      try {
        await api.deleteDepartment((dept as any)._id || dept.id);
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete department');
      }
    }
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ id: '', name: '', code: '' });
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Department Name' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground">Manage academic departments</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <DataTable
        data={departments}
        columns={columns}
        searchable
        searchPlaceholder="Search departments..."
        actions={(dept) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(dept)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Department Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value, id: e.target.value })}
                placeholder="e.g., CSE, ECE"
                required
                disabled={!!editingDept}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science and Engineering"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDept ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
