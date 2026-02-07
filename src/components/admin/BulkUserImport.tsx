import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSecurePassword, sendPasswordResetAfterCreation } from '@/lib/securePassword';
import * as XLSX from 'xlsx';

interface ImportUser {
  name: string;
  email: string;
  mobile: string;
  gotra?: string;
  father_name?: string;
  native_village?: string;
  isDuplicate?: boolean;
  duplicateType?: 'email' | 'mobile' | 'both';
  existingId?: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface BulkUserImportProps {
  onImportComplete?: () => void;
}

export function BulkUserImport({ onImportComplete }: BulkUserImportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importUsers, setImportUsers] = useState<ImportUser[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCSV = file.name.endsWith('.csv');

    if (!isExcel && !isCSV) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an Excel (.xlsx) or CSV file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsChecking(true);
      let parsedUsers: ImportUser[] = [];

      if (isExcel) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          throw new Error('File must have headers and at least one data row');
        }

        const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim());
        const requiredHeaders = ['name', 'email', 'mobile'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        parsedUsers = jsonData.slice(1)
          .filter(row => row.some(cell => cell))
          .map(row => {
            const user: any = {};
            headers.forEach((header, index) => {
              if (header) user[header] = row[index]?.toString() || '';
            });
            return {
              name: user.name || '',
              email: user.email || '',
              mobile: user.mobile || '',
              gotra: user.gotra,
              father_name: user.father_name,
              native_village: user.native_village,
            };
          })
          .filter(u => u.name && u.email && u.mobile);
      } else {
        // CSV parsing
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV must have headers and at least one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['name', 'email', 'mobile'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        parsedUsers = lines.slice(1)
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            const user: any = {};
            headers.forEach((header, index) => {
              user[header] = values[index] || '';
            });
            return {
              name: user.name || '',
              email: user.email || '',
              mobile: user.mobile || '',
              gotra: user.gotra,
              father_name: user.father_name,
              native_village: user.native_village,
            };
          })
          .filter(u => u.name && u.email && u.mobile);
      }

      if (parsedUsers.length === 0) {
        throw new Error('No valid users found in the file');
      }

      // Check for duplicates in database
      const emails = parsedUsers.map(u => u.email);
      const mobiles = parsedUsers.map(u => u.mobile);

      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, email, mobile')
        .or(`email.in.(${emails.map(e => `"${e}"`).join(',')}),mobile.in.(${mobiles.map(m => `"${m}"`).join(',')})`);

      const emailMap = new Map(existingProfiles?.filter(p => p.email).map(p => [p.email!.toLowerCase(), p.id]));
      const mobileMap = new Map(existingProfiles?.map(p => [p.mobile, p.id]));

      // Mark duplicates
      const usersWithDuplicates: ImportUser[] = parsedUsers.map(user => {
        const emailDup = emailMap.has(user.email.toLowerCase());
        const mobileDup = mobileMap.has(user.mobile);
        
        let duplicateType: 'email' | 'mobile' | 'both' | undefined;
        if (emailDup && mobileDup) duplicateType = 'both';
        else if (emailDup) duplicateType = 'email';
        else if (mobileDup) duplicateType = 'mobile';
        
        return {
          ...user,
          isDuplicate: emailDup || mobileDup,
          duplicateType,
          existingId: emailMap.get(user.email.toLowerCase()) || mobileMap.get(user.mobile),
        };
      });

      setImportUsers(usersWithDuplicates);
      setPreviewOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error Parsing File',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const importMutation = useMutation({
    mutationFn: async (users: ImportUser[]): Promise<ImportResult> => {
      const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

      for (const user of users) {
        try {
          if (user.isDuplicate) {
            if (skipDuplicates) {
              result.skipped++;
              continue;
            } else if (user.existingId) {
              // Update existing user
              await supabase
                .from('profiles')
                .update({
                  name: user.name,
                  gotra: user.gotra || null,
                  father_name: user.father_name || null,
                  native_village: user.native_village || null,
                })
                .eq('id', user.existingId);
              result.updated++;
              continue;
            }
          }

          // Create new user
          const tempPassword = generateSecurePassword();
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: tempPassword,
            options: {
              data: {
                name: user.name,
                mobile: user.mobile,
                bulk_uploaded: true,
              },
            },
          });

          if (authError) {
            result.errors.push(`${user.email}: ${authError.message}`);
            continue;
          }

          if (authData.user) {
            await supabase
              .from('profiles')
              .update({
                gotra: user.gotra || null,
                father_name: user.father_name || null,
                native_village: user.native_village || null,
              })
              .eq('id', authData.user.id);

            await sendPasswordResetAfterCreation(supabase, user.email);
            result.created++;
          }
        } catch (err: any) {
          result.errors.push(`${user.email}: ${err.message}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setPreviewOpen(false);
      setImportUsers([]);
      
      toast({
        title: 'Import Complete',
        description: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}${result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ''}`,
      });
      
      onImportComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDownloadSample = () => {
    const sampleData = [
      ['name', 'email', 'mobile', 'gotra', 'father_name', 'native_village'],
      ['Rajesh Sharma', 'rajesh@example.com', '9876543210', 'Bharadwaj', 'Ramesh Sharma', 'Jaipur'],
      ['Priya Mishra', 'priya@example.com', '9876543211', 'Kashyap', 'Suresh Mishra', 'Varanasi'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'sample_users.xlsx');
  };

  const duplicateCount = importUsers.filter(u => u.isDuplicate).length;
  const validCount = importUsers.length - duplicateCount;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk User Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel (.xlsx) or CSV file to import multiple users at once. 
            The system will automatically detect duplicates based on email and mobile number.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadSample}>
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="bulk-import"
            />
            <label htmlFor="bulk-import">
              <Button variant="hero" asChild disabled={isChecking}>
                <span>
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Import Preview - {importUsers.length} Users
            </DialogTitle>
          </DialogHeader>

          {/* Summary */}
          <div className="flex gap-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">{validCount} New</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm">{duplicateCount} Duplicates</span>
            </div>
          </div>

          {/* Duplicate handling option */}
          {duplicateCount > 0 && (
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
              />
              <label htmlFor="skip-duplicates" className="text-sm">
                Skip duplicates (uncheck to update existing records)
              </label>
            </div>
          )}

          {/* User list */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gotra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importUsers.map((user, index) => (
                  <TableRow 
                    key={index}
                    className={user.isDuplicate ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                  >
                    <TableCell>
                      {user.isDuplicate ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {user.duplicateType === 'both' ? 'Email & Mobile' : 
                           user.duplicateType === 'email' ? 'Email exists' : 'Mobile exists'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>{user.gotra || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => importMutation.mutate(importUsers)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {skipDuplicates ? validCount : importUsers.length} Users
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
