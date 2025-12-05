import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Download, Upload, Users, FileSpreadsheet, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';

interface Student {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    departmentId: string;
    batchId: string;
    section: string;
}

interface FeeComponent {
    name: string;
    amount: number;
}

export default function FeeManagement() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([
        { name: 'Tuition Fee', amount: 0 },
        { name: 'Lab Fee', amount: 0 },
        { name: 'Library Fee', amount: 0 },
        { name: 'Exam Fee', amount: 0 },
    ]);

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fee viewing states
    const [feeRecords, setFeeRecords] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState<Record<string, number>>({});

    // Fetch data from backend
    useEffect(() => {
        fetchDepartments();
        fetchBatches();
        fetchStudents();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.getDepartments();
            const deptList = Array.isArray(response) ? response : (response as any)?.data || [];
            setDepartments(deptList);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await api.getBatches();
            const batchList = Array.isArray(response) ? response : (response as any)?.data || [];
            setBatches(batchList);
        } catch (error) {
            console.error('Error fetching batches:', error);
            toast.error('Failed to load batches');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.getStudents();
            const studentList = Array.isArray(response) ? response : (response as any)?.data || [];
            // Map student data to include class details
            const mappedStudents = studentList.map((s: any) => ({
                id: s._id || s.id,
                rollNo: s.rollNo,
                name: s.name,
                email: s.email,
                departmentId: typeof s.classId === 'object' ? (s.classId.departmentId?._id || s.classId.departmentId?.id || s.classId.departmentId) : '',
                batchId: typeof s.classId === 'object' ? (s.classId.batchId?._id || s.classId.batchId?.id || s.classId.batchId) : '',
                section: typeof s.classId === 'object' ? (s.classId.name || '') : ''
            }));
            setStudents(mappedStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        }
    };

    // Filter students
    useEffect(() => {
        let filtered = students;

        if (selectedDepartment) {
            filtered = filtered.filter(s => s.departmentId === selectedDepartment);
        }
        if (selectedBatch) {
            filtered = filtered.filter(s => s.batchId === selectedBatch);
        }
        if (selectedSection) {
            filtered = filtered.filter(s => s.section === selectedSection);
        }
        if (studentSearch) {
            const search = studentSearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(search) ||
                s.rollNo.toLowerCase().includes(search) ||
                s.email.toLowerCase().includes(search)
            );
        }

        setFilteredStudents(filtered);
    }, [selectedDepartment, selectedBatch, selectedSection, studentSearch, students]);

    const handleStudentToggle = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const handleFeeComponentChange = (index: number, field: 'name' | 'amount', value: string | number) => {
        const updated = [...feeComponents];
        updated[index] = { ...updated[index], [field]: value };
        setFeeComponents(updated);
    };

    const addFeeComponent = () => {
        setFeeComponents([...feeComponents, { name: '', amount: 0 }]);
    };

    const removeFeeComponent = (index: number) => {
        setFeeComponents(feeComponents.filter((_, i) => i !== index));
    };

    const handleBulkCreate = async () => {
        if (selectedStudents.size === 0) {
            toast.error('Please select at least one student');
            return;
        }

        const validComponents = feeComponents.filter(c => c.name && c.amount > 0);
        if (validComponents.length === 0) {
            toast.error('Please add at least one fee component with amount');
            return;
        }

        setIsLoading(true);
        try {
            await api.createBulkFees({
                studentIds: Array.from(selectedStudents),
                year: Number(selectedYear),
                components: validComponents
            });

            toast.success(`Fees created for ${selectedStudents.size} students`);
            setSelectedStudents(new Set());
        } catch (error: any) {
            toast.error(error.message || 'Failed to create fees');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            // Generate Excel template with filtered students
            const data = filteredStudents.map(student => ({
                'Student ID': student.id,
                'Roll No': student.rollNo,
                'Name': student.name,
                'Email': student.email,
                'Department': student.departmentId,
                'Batch': student.batchId,
                'Section': student.section,
                'Year': selectedYear,
                'Tuition Fee': '',
                'Lab Fee': '',
                'Library Fee': '',
                'Exam Fee': '',
                'Other Fee': ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Template');

            // Set column widths
            worksheet['!cols'] = [
                { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
                { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
                { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
            ];

            XLSX.writeFile(workbook, `fee_template_${selectedYear}.xlsx`);
            toast.success('Template downloaded successfully');
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const processExcelUpload = async () => {
        if (!uploadedFile) {
            toast.error('Please select a file first');
            return;
        }

        setIsLoading(true);
        try {
            const data = await uploadedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Transform data for API
            const fees = jsonData.map((row: any) => ({
                studentId: row['Student ID'],
                year: Number(row['Year'] || selectedYear),
                components: [
                    { name: 'Tuition Fee', amount: Number(row['Tuition Fee'] || 0) },
                    { name: 'Lab Fee', amount: Number(row['Lab Fee'] || 0) },
                    { name: 'Library Fee', amount: Number(row['Library Fee'] || 0) },
                    { name: 'Exam Fee', amount: Number(row['Exam Fee'] || 0) },
                    { name: 'Other Fee', amount: Number(row['Other Fee'] || 0) }
                ].filter(c => c.amount > 0)
            }));

            await api.bulkUploadFees({ fees });
            toast.success(`Processed ${fees.length} fee records`);
            setUploadedFile(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to process Excel file');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFees = async () => {
        try {
            const params: any = {};
            if (selectedYear) params.year = selectedYear;

            const response = await api.getFees(params);
            const feeList = Array.isArray(response) ? response : (response as any)?.data || [];
            setFeeRecords(feeList);
        } catch (error) {
            console.error('Error fetching fees:', error);
            toast.error('Failed to load fees');
        }
    };

    const handleRecordPayment = async (feeId: string) => {
        const amount = paymentAmount[feeId];
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsLoading(true);
        try {
            await api.recordFeePayment(feeId, { amount });
            toast.success('Payment recorded successfully');
            setPaymentAmount({ ...paymentAmount, [feeId]: 0 });
            fetchFees(); // Refresh the fee list
        } catch (error: any) {
            toast.error(error.message || 'Failed to record payment');
        } finally {
            setIsLoading(false);
        }
    };

    const totalFeeAmount = feeComponents.reduce((sum, comp) => sum + Number(comp.amount), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Fee Management</h1>
                <p className="text-muted-foreground">Bulk fee creation and Excel-based uploads</p>
            </div>

            <Tabs defaultValue="bulk-select" className="space-y-6">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="bulk-select">
                        <Users className="mr-2 h-4 w-4" />
                        Bulk Select
                    </TabsTrigger>
                    <TabsTrigger value="excel-upload">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Excel Upload
                    </TabsTrigger>
                    <TabsTrigger value="view-fees">
                        <DollarSign className="mr-2 h-4 w-4" />
                        View & Manage
                    </TabsTrigger>
                </TabsList>

                {/* Bulk Select Tab */}
                <TabsContent value="bulk-select" className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Students</CardTitle>
                            <CardDescription>Filter students by department, batch, and section</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>{dept.code}</SelectItem>
                                            ))}\n                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {batches.map(batch => (
                                                <SelectItem key={batch._id || batch.id} value={batch._id || batch.id}>{batch.name}</SelectItem>
                                            ))}\n                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A', 'B', 'C', 'D'].map(sec => (
                                                <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Academic Year</Label>
                                    <Input
                                        type="number"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        placeholder="2024"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Students ({filteredStudents.length})</CardTitle>
                                    <CardDescription>{selectedStudents.size} selected</CardDescription>
                                </div>
                                <Button variant="outline" onClick={handleSelectAll}>
                                    {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students by name, roll no, or email..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {filteredStudents.map(student => {
                                    const isSelected = selectedStudents.has(student.id);

                                    return (
                                        <div
                                            key={student.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                                                }`}
                                            onClick={() => handleStudentToggle(student.id)}
                                        >
                                            <Checkbox checked={isSelected} className="mt-1" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{student.rollNo}</p>
                                                <p className="text-sm truncate">{student.name}</p>
                                                <div className="flex gap-1 mt-1">
                                                    <Badge variant="outline" className="text-xs">{student.departmentId}</Badge>
                                                    <Badge variant="outline" className="text-xs">{student.section}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fee Components */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Fee Components</CardTitle>
                                <Button onClick={addFeeComponent} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Component
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {feeComponents.map((component, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Input
                                        placeholder="Fee name"
                                        value={component.name}
                                        onChange={(e) => handleFeeComponentChange(index, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Amount"
                                        value={component.amount || ''}
                                        onChange={(e) => handleFeeComponentChange(index, 'amount', Number(e.target.value))}
                                        className="w-32"
                                    />
                                    {feeComponents.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFeeComponent(index)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between text-lg font-semibold">
                                    <span>Total Fee Amount:</span>
                                    <span>₹{totalFeeAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleBulkCreate}
                            disabled={isLoading || selectedStudents.size === 0}
                            size="lg"
                        >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Create Fees for {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </TabsContent>

                {/* Excel Upload Tab */}
                <TabsContent value="excel-upload" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Excel Template</CardTitle>
                            <CardDescription>Download template, fill fee details, and upload</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Filters for template */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>{dept.code}</SelectItem>
                                            ))}\n                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Batch</Label>
                                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {batches.map(batch => (
                                                <SelectItem key={batch._id || batch.id} value={batch._id || batch.id}>{batch.name}</SelectItem>
                                            ))}\n                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A', 'B', 'C', 'D'].map(sec => (
                                                <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Academic Year</Label>
                                    <Input
                                        type="number"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        placeholder="2024"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">Download Fee Template</p>
                                    <p className="text-sm text-muted-foreground">
                                        Excel file with {filteredStudents.length} students
                                    </p>
                                </div>
                                <Button onClick={downloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <Label>Upload Completed Template</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={processExcelUpload}
                                        disabled={!uploadedFile || isLoading}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload & Process
                                    </Button>
                                </div>
                                {uploadedFile && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {uploadedFile.name}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* View &  Manage Tab */}
                <TabsContent value="view-fees" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Fee Records</CardTitle>
                                    <CardDescription>View and manage existing fee records</CardDescription>
                                </div>
                                <Button onClick={fetchFees}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Load Fees
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <Label>Filter by Year</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        placeholder="2024"
                                        className="w-32"
                                    />
                                    <Button onClick={fetchFees} variant="outline">Apply Filter</Button>
                                </div>
                            </div>

                            {feeRecords.length > 0 ? (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {feeRecords.map((fee: any) => {
                                        const totalFee = fee.components?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
                                        const remaining = totalFee - (fee.paidAmount || 0);
                                        const feeId = fee._id || fee.id;

                                        return (
                                            <Card key={feeId} className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">Student ID: {fee.studentId}</p>
                                                            <p className="text-sm text-muted-foreground">Year: {fee.year}</p>
                                                        </div>
                                                        <Badge variant={
                                                            fee.status === 'paid' ? 'default' :
                                                                fee.status === 'partially-paid' ? 'secondary' : 'destructive'
                                                        }>
                                                            {fee.status?.toUpperCase() || 'UNPAID'}
                                                        </Badge>
                                                    </div>

                                                    {fee.components && fee.components.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            {fee.components.map((comp: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between">
                                                                    <span className="text-muted-foreground">{comp.name}:</span>
                                                                    <span>₹{comp.amount?.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="pt-2 border-t space-y-1">
                                                        <div className="flex justify-between font-medium">
                                                            <span>Total Fee:</span>
                                                            <span>₹{totalFee.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Paid:</span>
                                                            <span className="text-green-600">₹{(fee.paidAmount || 0).toLocaleString()}</span>
                                                        </div>
                                                        {remaining > 0 && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Remaining:</span>
                                                                <span className="text-red-600">₹{remaining.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {fee.status !== 'paid' && (
                                                        <div className="pt-2 border-t">
                                                            <Label className="text-sm">Record Payment</Label>
                                                            <div className="flex gap-2 mt-2">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Amount"
                                                                    value={paymentAmount[feeId] || ''}
                                                                    onChange={(e) => setPaymentAmount({
                                                                        ...paymentAmount,
                                                                        [feeId]: Number(e.target.value)
                                                                    })}
                                                                    className="flex-1"
                                                                />
                                                                <Button
                                                                    onClick={() => handleRecordPayment(feeId)}
                                                                    disabled={isLoading}
                                                                    size="sm"
                                                                >
                                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                                    Pay
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <DollarSign className="mx-auto h-12 w-12 mb-4" />
                                    <p>No fee records found. Click "Load Fees" to fetch records.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
