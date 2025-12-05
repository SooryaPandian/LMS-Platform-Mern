import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MyFees() {
    const [fees, setFees] = useState<any[]>([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isLoading, setIsLoading] = useState(true);

    // For parents, get the selected child's ID, otherwise use logged-in student's ID
    const getStudentId = () => {
        if (user.role === 'parent') {
            return localStorage.getItem('selectedChildId') || '';
        }
        return user._id || '';
    };

    const studentId = getStudentId();

    useEffect(() => {
        if (studentId) {
            fetchFees();
        } else {
            setIsLoading(false);
        }
    }, [studentId]);

    const fetchFees = async () => {
        try {
            const response = await api.getStudentFees(studentId);
            const feeList = Array.isArray(response) ? response : (response as any)?.data || [];
            setFees(feeList);
        } catch (error: any) {
            console.error('Error fetching fees:', error);
            toast.error(error.message || 'Failed to load fee details');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTotals = () => {
        const total = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        const paid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
        const pending = total - paid;
        return { total, paid, pending };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Paid':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'Pending':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'Overdue':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'text-green-600 bg-green-50';
            case 'Pending':
                return 'text-yellow-600 bg-yellow-50';
            case 'Overdue':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    const totals = calculateTotals();
    const title = user.role === 'parent' ? "Child's Fee Details" : "Fee Details";
    const subtitle = user.role === 'parent' ? "View your child's fee status and payment history" : "View your fee status and payment history";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Fees
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totals.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Academic Year</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Paid Amount
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{totals.paid.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Received</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Amount
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">₹{totals.pending.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Due</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fee Breakdown</CardTitle>
                    <CardDescription>{fees.length} fee components</CardDescription>
                </CardHeader>
                <CardContent>
                    {fees.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="mx-auto h-12 w-12 mb-4" />
                            <p>No fee records found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fees.map((fee) => (
                                <Card key={fee._id || fee.id}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            {getStatusIcon(fee.status)}
                                            <div>
                                                <p className="font-medium">{fee.componentName || 'Fee Component'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Year: {fee.year || 'N/A'}
                                                    {fee.dueDate && ` • Due: ${new Date(fee.dueDate).toLocaleDateString()}`}
                                                </p>
                                                {fee.paidDate && (
                                                    <p className="text-xs text-green-600">
                                                        Paid on: {new Date(fee.paidDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{(fee.amount || 0).toLocaleString()}</p>
                                            {fee.paidAmount > 0 && fee.paidAmount < fee.amount && (
                                                <p className="text-sm text-yellow-600">
                                                    Partial: ₹{(fee.paidAmount || 0).toLocaleString()}</p>
                                            )}
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(fee.status)}`}>
                                                {fee.status || 'Pending'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
