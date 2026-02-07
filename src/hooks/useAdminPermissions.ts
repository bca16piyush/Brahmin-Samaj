import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AdminPermission = 
  | 'overview'
  | 'verifications'
  | 'users'
  | 'pandits'
  | 'bookings'
  | 'donations'
  | 'events'
  | 'registrations'
  | 'news'
  | 'gallery'
  | 'past_videos'
  | 'rooms'
  | 'inventory'
  | 'bulk_whatsapp'
  | 'security'
  | 'audit_logs'
  | 'site_settings'
  | 'team';

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  overview: 'Overview Dashboard',
  verifications: 'User Verifications',
  users: 'User Management',
  pandits: 'Brahmin Management',
  bookings: 'Booking Management',
  donations: 'Donation Tracking',
  events: 'Yagya Management',
  registrations: 'Event Registrations',
  news: 'News Publishing',
  gallery: 'Gallery Management',
  past_videos: 'Past Event Videos',
  rooms: 'Room Management',
  inventory: 'Inventory Management',
  bulk_whatsapp: 'Bulk WhatsApp',
  security: 'Security Dashboard',
  audit_logs: 'Audit Logs',
  site_settings: 'Site Settings',
  team: 'Team Management',
};

export interface AdminUser {
  id: string;
  user_id: string;
  permissions: AdminPermission[];
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    name: string;
    email: string | null;
    mobile: string;
  };
}

export function useAdminPermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-permissions', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as AdminUser | null;
    },
    enabled: !!user,
  });
}

export function useIsSuperAdmin() {
  const { data: permissions } = useAdminPermissions();
  return permissions?.is_super_admin ?? false;
}

export function useHasPermission(permission: AdminPermission) {
  const { data: permissions } = useAdminPermissions();
  if (!permissions) return false;
  return permissions.is_super_admin || permissions.permissions?.includes(permission);
}

export function useAllAdminUsers() {
  return useQuery({
    queryKey: ['all-admin-users'],
    queryFn: async () => {
      const { data: admins, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles for all admin users
      const userIds = admins.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, mobile')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return admins.map(admin => ({
        ...admin,
        profile: profileMap.get(admin.user_id),
      })) as AdminUser[];
    },
  });
}

export function useCreateSubAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: AdminPermission[] }) => {
      // First add the user to user_roles as admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
      
      if (roleError) throw roleError;

      // Then add to admin_permissions
      const { error } = await supabase
        .from('admin_permissions')
        .insert({
          user_id: userId,
          permissions,
          is_super_admin: false,
          created_by: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-admin-users'] });
      toast({ title: 'Sub-Admin Created', description: 'The user has been granted admin access.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAdminPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, permissions, isSuperAdmin }: { 
      userId: string; 
      permissions: AdminPermission[];
      isSuperAdmin?: boolean;
    }) => {
      const { error } = await supabase
        .from('admin_permissions')
        .update({ 
          permissions,
          is_super_admin: isSuperAdmin ?? false,
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-admin-users'] });
      toast({ title: 'Permissions Updated', description: 'Admin permissions have been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Remove from admin_permissions
      const { error: permError } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('user_id', userId);
      
      if (permError) throw permError;

      // Remove from user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-admin-users'] });
      toast({ title: 'Admin Removed', description: 'The user is no longer an admin.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
