import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Regulation, Batch } from '@/types';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

export default function RegulationManagement() {
    const navigate = useNavigate();
    const [regulations, setRegulations] = useState<Regulation[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        appliesToBatches: [] as string[],
        semesters: [] as { semesterNumber: number; courses: string[] }[],
    });

    // Load initial data
    useEffect(() => {
        fetchRegulations();
        fetchBatches();
    }, []);

    const fetchRegulations = async () => {
        try {
            const response = await api.getRegulations();
            const regs = Array.isArray(response) ? response : (response as any)?.data || [];
            setRegulations(regs);
        } catch (error) {
            console.error('Error fetching regulations:', error);
            toast.error('Failed to load regulations');
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
            if (editingRegulation) {
                await api.updateRegulation((editingRegulation as any).id || (editingRegulation as any)._id, formData);
                toast.success('Regulation updated successfully');
            } else {
                await api.createRegulation(formData);
                toast.success('Regulation created successfully');
            }

            setDialogOpen(false);
            resetForm();
            fetchRegulations();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save regulation');
        }
    };

    const handleEdit = (regulation: Regulation) => {
        setEditingRegulation(regulation);
        setFormData({
            id: (regulation as any).id || (regulation as any)._id || '',
            name: regulation.name,
            appliesToBatches: regulation.appliesToBatches || [],
            semesters: regulation.semesters || [],
        });
        setDialogOpen(true);
    };

    const handleDelete = async (regulation: Regulation) => {
        if (confirm(`Are you sure you want to delete ${regulation.name}?`)) {
            try {
                await api.deleteRegulation((regulation as any).id || (regulation as any)._id);
                toast.success('Regulation deleted successfully');
                fetchRegulations();
            } catch (error: any) {
                toast.error(error.message || 'Failed to delete regulation');
            }
        }
    };

    const resetForm = () => {
        setEditingRegulation(null);
        setFormData({
            id: '',
            name: '',
            appliesToBatches: [],
            semesters: [],
        });
    };

    const toggleBatch = (batchName: string) => {
        setFormData(prev => ({
            ...prev,
            appliesToBatches: prev.appliesToBatches.includes(batchName)
                ? prev.appliesToBatches.filter(b => b !== batchName)
                : [...prev.appliesToBatches, batchName]
        }));
    };

    // Check if a batch is already assigned to another regulation
    const isBatchAssignedToOther = (batchName: string): { assigned: boolean; regulationName?: string } => {
        const assignedReg = regulations.find(reg => {
            // Skip the current regulation being edited
            const currentRegId = (editingRegulation as any)?._id || (editingRegulation as any)?.id;
            const regId = (reg as any)._id || (reg as any).id;
            if (currentRegId && regId === currentRegId) return false;

            return reg.appliesToBatches?.includes(batchName);
        });

        return {
            assigned: !!assignedReg,
            regulationName: assignedReg?.name
        };
    };


    const columns = [
        {
            key: 'name',
            label: 'Regulation Name'
        },
        {
            key: 'appliesToBatches',
            label: 'Applies To Batches',
            render: (regulation: Regulation) => (
                <div className="flex gap-1 flex-wrap">
                    {regulation.appliesToBatches?.map(batch => (
                        <span key={batch} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            {batch}
                        </span>
                    ))}
                </div>
            )
        },
        {
            key: 'semesters',
            label: 'Semesters',
            render: (regulation: Regulation) => regulation.semesters?.length || 0
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Regulation Management</h1>
                    <p className="text-muted-foreground">Manage curriculum regulations and course mappings</p>
                </div>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Regulation
                </Button>
            </div>

            <DataTable
                data={regulations}
                columns={columns}
                searchable
                searchPlaceholder="Search regulations..."
                actions={(regulation) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/course-assignment')}
                        >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Assign Courses
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(regulation)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(regulation)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingRegulation ? 'Edit Regulation' : 'Create Regulation'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Regulation Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Regulation 2023"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Applies To Batches *</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Select which batches this regulation applies to
                            </p>
                            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                                {batches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No batches available. Create batches first.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {batches.map(batch => {
                                            const assignmentStatus = isBatchAssignedToOther(batch.name);
                                            const isDisabled = assignmentStatus.assigned;

                                            return (
                                                <div
                                                    key={batch.id || batch._id}
                                                    className={`flex items-start space-x-2 p-2 rounded ${isDisabled ? 'bg-muted/50' : ''}`}
                                                >
                                                    <Checkbox
                                                        id={`batch-${batch.id || batch._id}`}
                                                        checked={formData.appliesToBatches.includes(batch.name)}
                                                        onCheckedChange={() => toggleBatch(batch.name)}
                                                        disabled={isDisabled}
                                                    />
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor={`batch-${batch.id || batch._id}`}
                                                            className={`text-sm font-medium leading-none ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                        >
                                                            {batch.name}
                                                        </label>
                                                        {isDisabled && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Already assigned to: <span className="font-medium">{assignmentStatus.regulationName}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {formData.appliesToBatches.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {formData.appliesToBatches.join(', ')}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formData.appliesToBatches.length === 0}>
                                {editingRegulation ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
