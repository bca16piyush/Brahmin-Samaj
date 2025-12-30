import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useEventRegistrations(eventId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profiles:user_id (name, mobile, email)
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useMyRegistration(eventId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-registration', eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!user?.id,
  });
}

export function useRegistrationCount(eventId?: string) {
  return useQuery({
    queryKey: ['registration-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'registered');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['my-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['registration-count', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      toast({
        title: 'Registration Successful',
        description: 'You have been registered for this event.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message?.includes('duplicate') 
          ? 'You are already registered for this event.'
          : error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ registrationId, eventId }: { registrationId: string; eventId: string }) => {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['my-registration', eventId] });
      queryClient.invalidateQueries({ queryKey: ['registration-count', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
      toast({
        title: 'Registration Cancelled',
        description: 'Your registration has been cancelled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMyEventRegistrations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-event-registrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events:event_id (*)
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      registrationId, 
      attended, 
      eventId 
    }: { 
      registrationId: string; 
      attended: boolean; 
      eventId: string;
    }) => {
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended })
        .eq('id', registrationId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      toast({
        title: 'Attendance Updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSendEventReminders() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, eventTitle, eventDate }: { 
      eventId: string; 
      eventTitle: string;
      eventDate: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-event-reminders', {
        body: { eventId, eventTitle, eventDate },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Reminders Sent',
        description: `Sent reminders to ${data.sent || 0} registered users.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Send Reminders',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
