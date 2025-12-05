import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

interface BulkUploadProps {
    onUpload: (data: any[]) => Promise<void>;
    templateHeaders: string[];
    entityName: string;
}

export function BulkUpload({ onUpload, templateHeaders, entityName }: BulkUploadProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const downloadTemplate = () => {
        const csv = Papa.unparse([templateHeaders]);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entityName.toLowerCase()}_template.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Template downloaded');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setIsUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    await onUpload(results.data);
                    toast.success(`${entityName} uploaded successfully`);
                    setIsOpen(false);
                } catch (error: any) {
                    toast.error(error.message || 'Upload failed');
                } finally {
                    setIsUploading(false);
                }
            },
            error: (error) => {
                toast.error(`CSV parse error: ${error.message}`);
                setIsUploading(false);
            }
        });

        // Reset input
        event.target.value = '';
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Upload {entityName}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-medium">Step 1: Download Template</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Download the CSV template with required columns
                            </p>
                            <Button onClick={downloadTemplate} variant="outline" className="w-full">
                                Download Template
                            </Button>
                        </div>

                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-medium">Step 2: Upload Filled CSV</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Fill the template and upload the CSV file
                            </p>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-sm file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground file:text-sm hover:file:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {isUploading && (
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                <p className="mt-2 text-sm">Uploading...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
