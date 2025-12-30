import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, CheckCircle, XCircle, Bell, MapPin, Clock, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useUpdateAttendance, useSendEventReminders } from '@/hooks/useEventRegistrations';

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
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-semibold">Event Registrations</h2>
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
