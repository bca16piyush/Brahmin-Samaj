import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Upload, Download, Search, CheckCircle, XCircle, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_CSV_CONTENT = `name,email,mobile,gotra,father_name,native_village
Rajesh Sharma,rajesh@example.com,9876543210,Bharadwaj,Ramesh Sharma,Jaipur
Priya Mishra,priya@example.com,9876543211,Kashyap,Suresh Mishra,Varanasi
Amit Verma,amit@example.com,9876543212,Vashistha,Dinesh Verma,Lucknow`;

interface UserFormData {
  name: string;
  email: string;
  mobile: string;
  gotra?: string;
  father_name?: string;
  native_village?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  gotra: string | null;
  father_name: string | null;
  native_village: string | null;
  verification_status: string | null;
  created_at: string;
}

export function UserManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    mobile: '',
    gotra: '',
    father_name: '',
    native_village: '',
  });
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Fetch all profiles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (userData: UserFormData) => {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: Math.random().toString(36).slice(-12) + 'A1!', // Generate random password
        options: {
          data: {
            name: userData.name,
            mobile: userData.mobile,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with additional fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          gotra: userData.gotra || null,
          father_name: userData.father_name || null,
          native_village: userData.native_village || null,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', mobile: '', gotra: '', father_name: '', native_village: '' });
      toast({
        title: 'User Created',
        description: 'New user has been created successfully. They will receive a confirmation email.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<UserFormData> }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          mobile: userData.mobile,
          gotra: userData.gotra || null,
          father_name: userData.father_name || null,
          native_village: userData.native_village || null,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setShowEditDialog(false);
      setEditingUser(null);
      toast({
        title: 'User Updated',
        description: 'User profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation (deletes profile, auth user remains but profile is removed)
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast({
        title: 'User Deleted',
        description: 'User profile has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk create users mutation
  const bulkCreateUsers = useMutation({
    mutationFn: async (usersData: UserFormData[]) => {
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const userData of usersData) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: Math.random().toString(36).slice(-12) + 'A1!',
            options: {
              data: {
                name: userData.name,
                mobile: userData.mobile,
              },
            },
          });

          if (authError) {
            results.failed++;
            results.errors.push(`${userData.email}: ${authError.message}`);
            continue;
          }

          if (authData.user) {
            // Update profile with additional fields
            await supabase
              .from('profiles')
              .update({
                gotra: userData.gotra || null,
                father_name: userData.father_name || null,
                native_village: userData.native_village || null,
              })
              .eq('id', authData.user.id);

            results.success++;
          }
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${userData.email}: ${err.message}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setBulkResults(results);
      toast({
        title: 'Bulk Upload Complete',
        description: `${results.success} users created, ${results.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      mobile: user.mobile,
      gotra: user.gotra || '',
      father_name: user.father_name || '',
      native_village: user.native_village || '',
    });
    setShowEditDialog(true);
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must have a header row and at least one data row.',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'email', 'mobile'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast({
          title: 'Missing Required Columns',
          description: `CSV must include: ${missingHeaders.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      const usersData: UserFormData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const user: any = {};
        headers.forEach((header, index) => {
          user[header] = values[index] || '';
        });
        
        if (user.name && user.email && user.mobile) {
          usersData.push({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            gotra: user.gotra,
            father_name: user.father_name,
            native_village: user.native_village,
          });
        }
      }

      if (usersData.length === 0) {
        toast({
          title: 'No Valid Users',
          description: 'No valid user data found in the CSV file.',
          variant: 'destructive',
        });
        return;
      }

      bulkCreateUsers.mutate(usersData);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const mobile = user.mobile?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || 
           email.includes(searchTerm.toLowerCase()) || 
           mobile.includes(searchTerm.toLowerCase());
  });

  const verifiedCount = users?.filter(u => u.verification_status === 'verified').length || 0;
  const pendingCount = users?.filter(u => u.verification_status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">User Management</h2>
        <div className="flex gap-2">
          {/* Create User Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile *</Label>
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gotra</Label>
                  <Input
                    value={formData.gotra}
                    onChange={(e) => setFormData({ ...formData, gotra: e.target.value })}
                    placeholder="Gotra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Father's Name</Label>
                  <Input
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Father's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Native Village</Label>
                  <Input
                    value={formData.native_village}
                    onChange={(e) => setFormData({ ...formData, native_village: e.target.value })}
                    placeholder="Native village"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createUser.mutate(formData)}
                  disabled={!formData.name || !formData.email || !formData.mobile || createUser.isPending}
                >
                  {createUser.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Upload Dialog */}
          <Dialog open={showBulkDialog} onOpenChange={(open) => {
            setShowBulkDialog(open);
            if (!open) setBulkResults(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk User Upload</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with user data. Required columns: name, email, mobile.
                  Optional columns: gotra, father_name, native_village.
                </p>
                
                <Button variant="outline" className="w-full" onClick={handleDownloadSampleCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>

                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to upload CSV</span>
                    <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
                  </label>
                </div>

                {bulkCreateUsers.isPending && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing users...</span>
                  </div>
                )}

                {bulkResults && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>{bulkResults.success} users created successfully</span>
                    </div>
                    {bulkResults.failed > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-destructive" />
                          <span>{bulkResults.failed} users failed</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs">
                          {bulkResults.errors.map((err, i) => (
                            <p key={i} className="text-destructive">{err}</p>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Users</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Mobile</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Rows */}
              {filteredUsers?.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-2 font-medium truncate">{user.name}</div>
                  <div className="col-span-3 text-sm text-muted-foreground truncate">{user.email || '-'}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">{user.mobile}</div>
                  <div className="col-span-2">
                    <Badge
                      variant={
                        user.verification_status === 'verified' ? 'default' :
                        user.verification_status === 'pending' ? 'secondary' :
                        user.verification_status === 'rejected' ? 'destructive' : 'outline'
                      }
                      className="text-xs"
                    >
                      {user.verification_status || 'none'}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditUser(user as UserProfile)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.name}'s profile? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingUser(null);
          setFormData({ name: '', email: '', mobile: '', gotra: '', father_name: '', native_village: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Gotra</Label>
              <Input
                value={formData.gotra}
                onChange={(e) => setFormData({ ...formData, gotra: e.target.value })}
                placeholder="Gotra"
              />
            </div>
            <div className="space-y-2">
              <Label>Father's Name</Label>
              <Input
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                placeholder="Father's name"
              />
            </div>
            <div className="space-y-2">
              <Label>Native Village</Label>
              <Input
                value={formData.native_village}
                onChange={(e) => setFormData({ ...formData, native_village: e.target.value })}
                placeholder="Native village"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (editingUser) {
                  updateUser.mutate({ userId: editingUser.id, userData: formData });
                }
              }}
              disabled={!formData.name || !formData.mobile || updateUser.isPending}
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}