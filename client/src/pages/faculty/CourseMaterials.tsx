import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

export default function CourseMaterials() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('all');

    const [formData, setFormData] = useState({
        courseId: '',
        unit: '1',
        title: '',
        description: '',
        files: [] as File[]
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchMaterials();
        }
    }, [selectedCourse, selectedUnit]);

    const fetchCourses = async () => {
        try {
            const response = await api.getCourseAllocations();
            const allocations = Array.isArray(response) ? response : (response as any)?.data || [];

            // Extract unique courses
            const uniqueCourses = new Map();
            allocations.forEach((alloc: any) => {
                const course = typeof alloc.courseId === 'object' ? alloc.courseId : null;
                if (course && course._id) {
                    uniqueCourses.set(course._id, course);
                }
            });

            setCourses(Array.from(uniqueCourses.values()));
        } catch (error: any) {
            toast.error(error.message || 'Failed to load courses');
        }
    };

    const fetchMaterials = async () => {
        try {
            setIsLoading(true);
            const params: any = { courseId: selectedCourse };
            if (selectedUnit !== 'all') params.unit = selectedUnit;

            const response = await api.getCourseMaterials(params);
            const materialList = Array.isArray(response) ? response : (response as any)?.data || [];
            setMaterials(materialList);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load materials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, files: Array.from(e.target.files) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.files.length === 0) {
            toast.error('Please select at least one file');
            return;
        }

        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            // Append all files
            formData.files.forEach(file => {
                formDataToSend.append('files', file);
            });
            formDataToSend.append('courseId', formData.courseId);
            formDataToSend.append('unit', formData.unit);
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);

            await api.uploadCourseMaterial(formDataToSend);
            toast.success('Materials uploaded successfully');
            setDialogOpen(false);
            setFormData({ courseId: '', unit: '1', title: '', description: '', files: [] });
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload materials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this material?')) return;

        try {
            await api.deleteCourseMaterial(id);
            toast.success('Material deleted');
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete material');
        }
    };

    // Group materials by unit
    const groupedMaterials = materials.reduce((acc: any, material: any) => {
        const unit = material.unit || 1;
        if (!acc[unit]) acc[unit] = [];
        acc[unit].push(material);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Course Materials</h1>
                    <p className="text-muted-foreground">Upload and manage course materials by unit</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Materials
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Materials</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course._id || course.id} value={course._id || course.id}>
                                            {course.code} - {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Unit (Optional)</Label>
                            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All units" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Units</SelectItem>
                                    {[1, 2, 3, 4, 5].map(unit => (
                                        <SelectItem key={unit} value={unit.toString()}>Unit {unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedCourse && (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(unit => {
                        const unitMaterials = groupedMaterials[unit] || [];
                        if (selectedUnit === 'all' || selectedUnit === unit.toString()) {
                            return (
                                <Card key={unit}>
                                    <CardHeader>
                                        <CardTitle>Unit {unit}</CardTitle>
                                        <CardDescription>{unitMaterials.length} materials</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {unitMaterials.length > 0 ? (
                                            <div className="grid gap-3">
                                                {unitMaterials.map((material: any) => (
                                                    <div
                                                        key={material._id || material.id}
                                                        className="flex items-center justify-between p-4 border rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">{material.title}</p>
                                                                <p className="text-sm text-muted-foreground">{material.description}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {material.fileName} • {(material.fileSize / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <a href={`${SERVER_URL}${material.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(material._id || material.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No materials uploaded for this unit</p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {!selectedCourse && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Select a course to view materials</p>
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload Course Materials</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select
                                value={formData.courseId}
                                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course._id || course.id} value={course._id || course.id}>
                                            {course.code} - {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Unit *</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(unit => (
                                        <SelectItem key={unit} value={unit.toString()}>Unit {unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Lecture Notes - Chapter 1"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the material"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Files * (You can select multiple files)</Label>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                                multiple
                                required
                            />
                            {formData.files.length > 0 && (
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p className="font-medium">{formData.files.length} file(s) selected:</p>
                                    {formData.files.map((file, idx) => (
                                        <p key={idx}>
                                            • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Uploading...' : `Upload ${formData.files.length > 0 ? `(${formData.files.length})` : ''}`}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
