import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Course, Department } from '@/types';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    title: '',
    credits: 3,
    category: 'Core' as 'Core' | 'Elective' | 'Lab' | 'Project',
    description: '',
    semester: 1,
    departmentId: '',
  });

  // Load courses on mount
  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.getCourses();
      const courseList = Array.isArray(response) ? response : (response as any)?.data || [];
      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
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
      if (editingCourse) {
        await api.updateCourse((editingCourse as any)._id || editingCourse.id, formData);
        toast.success('Course updated successfully');
      } else {
        await api.createCourse(formData);
        toast.success('Course created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save course');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);

    // Extract departmentId
    let deptId = '';
    if ((course as any).departmentId) {
      if (typeof (course as any).departmentId === 'object') {
        deptId = (course as any).departmentId._id || (course as any).departmentId.id || '';
      } else {
        deptId = (course as any).departmentId;
      }
    }

    setFormData({
      id: (course as any)._id || course.id,
      code: course.code,
      title: course.title,
      credits: course.credits,
      category: course.category,
      description: course.description || '',
      semester: (course as any).semester || 1,
      departmentId: deptId,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (confirm(`Are you sure you want to delete ${course.title}?`)) {
      try {
        await api.deleteCourse((course as any)._id || course.id);
        toast.success('Course deleted successfully');
        fetchCourses();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      id: '',
      code: '',
      title: '',
      credits: 3,
      category: 'Core',
      description: '',
      semester: 1,
      departmentId: '',
    });
  };

  const columns = [
    { key: 'code', label: 'Course Code' },
    { key: 'title', label: 'Course Title' },
    {
      key: 'category',
      label: 'Category',
      render: (course: Course) => (
        <Badge variant="outline">{course.category}</Badge>
      ),
    },
    { key: 'credits', label: 'Credits' },
    {
      key: 'semester',
      label: 'Semester',
      render: (course: Course) => `Semester ${(course as any).semester || '-'}`
    },
    {
      key: 'departmentId',
      label: 'Department',
      render: (course: Course) => {
        const dept = (course as any).departmentId;
        if (typeof dept === 'object') return dept?.code || dept?.name || '-';
        return dept || '-';
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Manage course catalog - Assign to semesters through regulations</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      <DataTable
        data={courses}
        columns={columns}
        searchable
        searchPlaceholder="Search courses..."
        actions={(course) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(course)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value, id: e.target.value })}
                  placeholder="e.g., CSE101"
                  required
                  disabled={!!editingCourse}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Programming Fundamentals"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                      <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                        {dept.code} - {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester.toString()}
                  onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Course description..."
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCourse ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
