import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, ShieldCheck, Trash2, Edit, Printer, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  useAllAdminUsers, 
  useCreateSubAdmin, 
  useUpdateAdminPermissions, 
  useRemoveAdmin,
  AdminPermission,
  PERMISSION_LABELS,
} from '@/hooks/useAdminPermissions';
import { PrintableReport, printReport } from './PrintableReport';

const ALL_PERMISSIONS: AdminPermission[] = [
  'overview', 'verifications', 'users', 'pandits', 'bookings', 'donations',
  'events', 'registrations', 'news', 'gallery', 'past_videos', 'rooms',
  'inventory', 'bulk_whatsapp', 'security', 'audit_logs', 'site_settings', 'team'
];

export function TeamManager() {
  const { data: adminUsers, isLoading } = useAllAdminUsers();
  const createSubAdmin = useCreateSubAdmin();
  const updatePermissions = useUpdateAdminPermissions();
  const removeAdmin = useRemoveAdmin();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Fetch all non-admin users for adding
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users-for-admin'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, mobile')
        .order('name');
      
      if (error) throw error;
      
      // Filter out users who are already admins
      const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);
      return profiles.filter(p => !adminUserIds.has(p.id));
    },
    enabled: showAddDialog,
  });

  const handleAddAdmin = () => {
    if (!selectedUserId || selectedPermissions.length === 0) return;
    createSubAdmin.mutate(
      { userId: selectedUserId, permissions: selectedPermissions },
      { 
        onSuccess: () => {
          setShowAddDialog(false);
          setSelectedUserId('');
          setSelectedPermissions([]);
        }
      }
    );
  };

  const handleEditAdmin = (admin: any) => {
    setEditingUser(admin);
    setSelectedPermissions(admin.permissions || []);
    setShowEditDialog(true);
  };

  const handleSavePermissions = () => {
    if (!editingUser) return;
    updatePermissions.mutate(
      { userId: editingUser.user_id, permissions: selectedPermissions },
      { 
        onSuccess: () => {
          setShowEditDialog(false);
          setEditingUser(null);
        }
      }
    );
  };

  const handleRemoveAdmin = () => {
    if (!deleteUserId) return;
    removeAdmin.mutate(deleteUserId, {
      onSuccess: () => setDeleteUserId(null),
    });
  };

  const togglePermission = (permission: AdminPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredAdmins = adminUsers?.filter(admin => {
    if (!searchTerm) return true;
    const name = admin.profile?.name?.toLowerCase() || '';
    const email = admin.profile?.email?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const superAdminCount = adminUsers?.filter(a => a.is_super_admin).length || 0;
  const subAdminCount = adminUsers?.filter(a => !a.is_super_admin).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">Team Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => printReport(printRef)}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="hero" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Sub-Admin
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminUsers?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{superAdminCount}</p>
                <p className="text-xs text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subAdminCount}</p>
                <p className="text-xs text-muted-foreground">Sub-Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Admin List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins?.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.profile?.name || 'Unknown'}</TableCell>
                <TableCell>{admin.profile?.email || '-'}</TableCell>
                <TableCell>
                  {admin.is_super_admin ? (
                    <Badge className="bg-gold/20 text-gold border-gold/30">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Super Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Sub-Admin
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {admin.is_super_admin ? (
                    <span className="text-sm text-muted-foreground">All permissions</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {admin.permissions?.length || 0} permissions
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(admin.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  {!admin.is_super_admin && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteUserId(admin.user_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Sub-Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Sub-Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email || user.mobile})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {ALL_PERMISSIONS.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <label
                      htmlFor={permission}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {PERMISSION_LABELS[permission]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={!selectedUserId || selectedPermissions.length === 0 || createSubAdmin.isPending}
            >
              {createSubAdmin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Sub-Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions - {editingUser?.profile?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {ALL_PERMISSIONS.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${permission}`}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <label
                      htmlFor={`edit-${permission}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {PERMISSION_LABELS[permission]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={selectedPermissions.length === 0 || updatePermissions.isPending}
            >
              {updatePermissions.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all admin permissions from this user. They will no longer be able to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Printable Report */}
      <PrintableReport
        ref={printRef}
        title="Team Members Report"
        subtitle="Admin and Sub-Admin List"
        stats={[
          { label: 'Total Admins', value: adminUsers?.length || 0 },
          { label: 'Super Admins', value: superAdminCount },
          { label: 'Sub-Admins', value: subAdminCount },
        ]}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Role</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers?.map(admin => (
              <tr key={admin.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.profile?.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.profile?.email || '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {admin.is_super_admin ? 'Super Admin' : 'Sub-Admin'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {admin.is_super_admin ? 'All' : admin.permissions?.length || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintableReport>
    </div>
  );
}
