import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, CheckCircle, XCircle, Bell, MapPin, Clock, User, Search, UserPlus, Upload, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useUpdateAttendance, useSendEventReminders } from '@/hooks/useEventRegistrations';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_REGISTRATION_CSV = `user_email,user_name,user_mobile
rajesh@example.com,Rajesh Sharma,9876543210
priya@example.com,Priya Mishra,9876543211
amit@example.com,Amit Verma,9876543212`;

// Admin-specific hook to fetch registrations with profile data
function useAdminEventRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ['admin-event-registrations', eventId],
    queryFn: async () => {
      // First get registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (regError) throw regError;
      if (!registrations || registrations.length === 0) return [];

      // Then get profiles for those users
      const userIds = registrations.map(r => r.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, mobile, email')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Merge data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return registrations.map(reg => ({
        ...reg,
        profiles: profileMap.get(reg.user_id) || null,
      }));
    },
    enabled: !!eventId,
  });
}

export function RegistrationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [manualForm, setManualForm] = useState({ email: '', name: '', mobile: '' });
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Fetch all events for the dropdown
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch registrations for selected event using admin-specific query
  const { data: registrations, isLoading: registrationsLoading } = useAdminEventRegistrations(selectedEventId || undefined);
  const updateAttendance = useUpdateAttendance();
  const sendReminders = useSendEventReminders();

  const selectedEvent = events?.find(e => e.id === selectedEventId);
  const upcomingEvents = events?.filter(e => new Date(e.event_date) >= new Date()) || [];
  const pastEvents = events?.filter(e => new Date(e.event_date) < new Date()) || [];

  const filteredRegistrations = registrations?.filter(reg => {
    if (!searchTerm) return true;
    const profile = reg.profiles as any;
    const name = profile?.name?.toLowerCase() || '';
    const mobile = profile?.mobile?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || mobile.includes(searchTerm.toLowerCase());
  });

  const handleAttendanceToggle = (registrationId: string, currentAttended: boolean) => {
    if (!selectedEventId) return;
    updateAttendance.mutate({
      registrationId,
      attended: !currentAttended,
      eventId: selectedEventId,
    });
  };

  const handleSendReminders = () => {
    if (!selectedEvent) return;
    sendReminders.mutate({
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventDate: selectedEvent.event_date,
    });
  };

  const manualRegister = useMutation({
    mutationFn: async (data: { email: string; name: string; mobile: string }) => {
      if (!selectedEventId) throw new Error('No event selected');

      // First find or create user by email
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      let userId: string;

      if (existingProfiles) {
        userId = existingProfiles.id;
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: Math.random().toString(36).slice(-12) + 'A1!',
          options: {
            data: {
              name: data.name,
              mobile: data.mobile,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');
        userId = authData.user.id;
      }

      // Register for event
      const { error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: selectedEventId,
          user_id: userId,
          status: 'registered',
        });

      if (regError) throw regError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', selectedEventId] });
      setShowManualDialog(false);
      setManualForm({ email: '', name: '', mobile: '' });
      toast({
        title: 'Registration Added',
        description: 'User has been registered for the event.',
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

  // Bulk registration mutation
  const bulkRegister = useMutation({
    mutationFn: async (usersData: { email: string; name: string; mobile: string }[]) => {
      if (!selectedEventId) throw new Error('No event selected');
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const userData of usersData) {
        try {
          // Find or create user
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userData.email)
            .maybeSingle();

          let userId: string;

          if (existingProfile) {
            userId = existingProfile.id;
          } else {
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
            if (!authData.user) {
              results.failed++;
              results.errors.push(`${userData.email}: Failed to create user`);
              continue;
            }
            userId = authData.user.id;
          }

          // Register for event
          const { error: regError } = await supabase
            .from('event_registrations')
            .insert({
              event_id: selectedEventId,
              user_id: userId,
              status: 'registered',
            });

          if (regError) {
            results.failed++;
            results.errors.push(`${userData.email}: ${regError.message}`);
            continue;
          }

          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${userData.email}: ${err.message}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', selectedEventId] });
      setBulkResults(results);
      toast({
        title: 'Bulk Registration Complete',
        description: `${results.success} registered, ${results.failed} failed.`,
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

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_REGISTRATION_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_event_registrations.csv';
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
          description: 'CSV must have a header row and at least one data row.',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['user_email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast({
          title: 'Missing Required Columns',
          description: 'CSV must include: user_email',
          variant: 'destructive',
        });
        return;
      }

      const usersData: { email: string; name: string; mobile: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        if (row.user_email) {
          usersData.push({
            email: row.user_email,
            name: row.user_name || '',
            mobile: row.user_mobile || '',
          });
        }
      }

      if (usersData.length === 0) {
        toast({
          title: 'No Valid Data',
          description: 'No valid registration data found in the CSV file.',
          variant: 'destructive',
        });
        return;
      }

      bulkRegister.mutate(usersData);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const attendedCount = registrations?.filter(r => r.attended).length || 0;
  const registeredCount = registrations?.length || 0;

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">Event Registrations</h2>
        {selectedEventId && (
          <div className="flex gap-2">
            {/* Export CSV Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!registrations || registrations.length === 0) return;
                const headers = ['Name', 'Email', 'Mobile', 'Registered At', 'Attended', 'Reminder Sent'];
                const rows = registrations.map(reg => {
                  const profile = reg.profiles as any;
                  return [
                    profile?.name || '',
                    profile?.email || '',
                    profile?.mobile || '',
                    format(new Date(reg.registered_at), 'yyyy-MM-dd HH:mm'),
                    reg.attended ? 'Yes' : 'No',
                    reg.reminder_sent ? 'Yes' : 'No',
                  ].join(',');
                });
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `registrations_${selectedEvent?.title?.replace(/\s+/g, '_') || 'event'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              disabled={!registrations || registrations.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            {/* Manual Registration Dialog */}
            <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Registration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manual Registration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Register a user for: <strong>{selectedEvent?.title}</strong>
                  </p>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (for new users)</Label>
                    <Input
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile (for new users)</Label>
                    <Input
                      value={manualForm.mobile}
                      onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => manualRegister.mutate(manualForm)}
                    disabled={!manualForm.email || manualRegister.isPending}
                  >
                    {manualRegister.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register User'
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
                <Button variant="hero" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Registration Upload</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file to register multiple users for: <strong>{selectedEvent?.title}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Required column: user_email. Optional: user_name, user_mobile
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
                      id="registration-csv-upload"
                    />
                    <label
                      htmlFor="registration-csv-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">Click to upload CSV</span>
                    </label>
                  </div>

                  {bulkRegister.isPending && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing registrations...</span>
                    </div>
                  )}

                  {bulkResults && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>{bulkResults.success} users registered</span>
                      </div>
                      {bulkResults.failed > 0 && (
                        <>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-destructive" />
                            <span>{bulkResults.failed} failed</span>
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
        )}
      </div>

      {/* Event Selector */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event to manage registrations" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingEvents.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Upcoming Events</div>
                      {upcomingEvents.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {pastEvents.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Past Events</div>
                      {pastEvents.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedEvent && new Date(selectedEvent.event_date) >= new Date() && (
              <Button
                variant="outline"
                onClick={handleSendReminders}
                disabled={sendReminders.isPending || registeredCount === 0}
              >
                <Bell className="w-4 h-4 mr-2" />
                {sendReminders.isPending ? 'Sending...' : 'Send Reminders'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Event Details & Stats */}
      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{registeredCount}</p>
                  <p className="text-sm text-muted-foreground">Total Registered</p>
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
                  <p className="text-2xl font-bold">{attendedCount}</p>
                  <p className="text-sm text-muted-foreground">Attended</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {selectedEvent.registration_limit 
                      ? selectedEvent.registration_limit - registeredCount 
                      : '∞'}
                  </p>
                  <p className="text-sm text-muted-foreground">Spots Left</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registrations List */}
      {selectedEventId && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg">Registered Users</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {registrationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredRegistrations?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No registrations match your search.' : 'No registrations yet for this event.'}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                  <div className="col-span-1">Attended</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Mobile</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Registered At</div>
                  <div className="col-span-1">Reminder</div>
                </div>

                {/* Rows */}
                {filteredRegistrations?.map((reg, index) => {
                  const profile = reg.profiles as any;
                  return (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="col-span-1 flex items-center">
                        <Checkbox
                          checked={reg.attended || false}
                          onCheckedChange={() => handleAttendanceToggle(reg.id, reg.attended || false)}
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{profile?.name || 'Unknown'}</span>
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                        {profile?.mobile || '-'}
                      </div>
                      <div className="col-span-3 flex items-center text-sm text-muted-foreground truncate">
                        {profile?.email || '-'}
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                        {format(new Date(reg.registered_at), 'MMM d, h:mm a')}
                      </div>
                      <div className="col-span-1 flex items-center">
                        {reg.reminder_sent ? (
                          <Badge variant="secondary" className="text-xs">Sent</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedEventId && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select an event to view and manage registrations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
