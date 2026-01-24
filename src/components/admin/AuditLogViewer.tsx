import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, User, Activity, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_profile?: {
    name: string;
    email: string;
  } | null;
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approve_verification: { label: 'Approved User', variant: 'default' },
  reject_verification: { label: 'Rejected User', variant: 'destructive' },
  delete_user: { label: 'Deleted User', variant: 'destructive' },
  send_event_reminders: { label: 'Sent Reminders', variant: 'secondary' },
  send_whatsapp_broadcast: { label: 'WhatsApp Broadcast', variant: 'secondary' },
  view_donor_info: { label: 'Viewed Donor Info', variant: 'outline' },
  unauthorized_access_attempt: { label: 'Unauthorized Attempt', variant: 'destructive' },
  rate_limit_exceeded: { label: 'Rate Limit Hit', variant: 'destructive' },
  unauthorized_reminder_attempt: { label: 'Unauthorized Reminder', variant: 'destructive' },
};

const DATE_PRESETS = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Last 7 Days', value: '7days', days: 7 },
  { label: 'Last 30 Days', value: '30days', days: 30 },
  { label: 'Last 90 Days', value: '90days', days: 90 },
  { label: 'All Time', value: 'all', days: null },
];

export function AuditLogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('7days');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch admin users for filter dropdown
  const { data: admins } = useQuery({
    queryKey: ['admin-users-for-filter'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminIds = roles?.map(r => r.user_id) || [];
      if (adminIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', adminIds);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
  });

  // Fetch audit logs with filters
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs', selectedAction, selectedAdmin, datePreset, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply date filter
      const preset = DATE_PRESETS.find(p => p.value === datePreset);
      if (preset && preset.days !== null) {
        const startDate = startOfDay(subDays(new Date(), preset.days));
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply action filter
      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }

      // Apply admin filter
      if (selectedAdmin !== 'all') {
        query = query.eq('admin_id', selectedAdmin);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Fetch admin profiles
      const adminIds = [...new Set(logs?.map(l => l.admin_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', adminIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (logs || []).map(log => ({
        ...log,
        admin_profile: profileMap.get(log.admin_id) || null,
      })) as AuditLog[];
    },
  });

  // Get unique actions from logs for filter
  const uniqueActions = [...new Set(auditLogs?.map(l => l.action) || [])];

  // Filter logs by search term
  const filteredLogs = auditLogs?.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.admin_profile?.name?.toLowerCase().includes(searchLower) ||
      log.admin_profile?.email?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || { label: action.replace(/_/g, ' '), variant: 'outline' as const };
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">Audit Log Viewer</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Action Type */}
            <div className="space-y-2">
              <Label className="text-sm">Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action]?.label || action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Admin User */}
            <div className="space-y-2">
              <Label className="text-sm">Admin User</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="All Admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {admins?.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm">Date Range</Label>
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredLogs?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredLogs?.filter(l => l.action === 'approve_verification').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredLogs?.filter(l => l.action.includes('unauthorized') || l.action.includes('rate_limit')).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Security Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(filteredLogs?.map(l => l.admin_id) || []).size}
                </p>
                <p className="text-sm text-muted-foreground">Active Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs?.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Collapsible
                    open={expandedLogs.has(log.id)}
                    onOpenChange={() => toggleLogExpanded(log.id)}
                  >
                    <div className="border border-border rounded-lg overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex flex-col items-start gap-1">
                              {getActionBadge(log.action)}
                              <span className="text-xs text-muted-foreground">
                                {log.resource_type}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-medium truncate">
                                {log.admin_profile?.name || 'Unknown Admin'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {log.admin_profile?.email}
                              </p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                          {expandedLogs.has(log.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Resource ID:</span>
                              <p className="font-mono text-xs break-all">
                                {log.resource_id || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Timestamp:</span>
                              <p>{format(new Date(log.created_at), 'PPpp')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IP Address:</span>
                              <p className="font-mono text-xs">{log.ip_address || 'Unknown'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">User Agent:</span>
                              <p className="text-xs truncate" title={log.user_agent || undefined}>
                                {log.user_agent?.substring(0, 50) || 'Unknown'}
                                {(log.user_agent?.length || 0) > 50 && '...'}
                              </p>
                            </div>
                          </div>
                          {Object.keys(log.details || {}).length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-sm">Details:</span>
                              <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
