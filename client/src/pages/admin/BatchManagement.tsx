import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from '@/types';
import { api } from '@/lib/api';

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    passingYear: new Date().getFullYear(),
    durationYears: 4,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await api.getBatches();
      setBatches(response.data || response);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch.id, formData);
        toast.success('Batch updated successfully');
      } else {
        await api.createBatch(formData);
        toast.success('Batch created successfully');
      }

      await fetchBatches();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData(batch);
    setDialogOpen(true);
  };

  const handleDelete = async (batch: Batch) => {
    if (confirm(`Are you sure you want to delete ${batch.name}?`)) {
      try {
        await api.deleteBatch(batch.id);
        toast.success('Batch deleted successfully');
        await fetchBatches();
      } catch (error: any) {
        console.error('Error deleting batch:', error);
        toast.error(error.message || 'Failed to delete batch');
      }
    }
  };

  const resetForm = () => {
    setEditingBatch(null);
    setFormData({
      id: '',
      name: '',
      passingYear: new Date().getFullYear(),
      durationYears: 4,
    });
  };

  const columns = [
    { key: 'id', label: 'Batch ID' },
    { key: 'name', label: 'Batch Name' },
    { key: 'passingYear', label: 'Passing Year' },
    { key: 'durationYears', label: 'Duration (Years)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground">Manage student batches and their details</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Batch
        </Button>
      </div>

      <DataTable
        data={batches}
        columns={columns}
        searchable
        searchPlaceholder="Search batches..."
        actions={(batch) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(batch)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create Batch'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">Batch ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
                disabled={!!editingBatch}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passingYear">Passing Year</Label>
              <Input
                id="passingYear"
                type="number"
                value={formData.passingYear}
                onChange={(e) => setFormData({ ...formData, passingYear: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationYears">Duration (Years)</Label>
              <Input
                id="durationYears"
                type="number"
                value={formData.durationYears}
                onChange={(e) => setFormData({ ...formData, durationYears: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBatch ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
