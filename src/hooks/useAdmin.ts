import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Pandit = Database['public']['Tables']['pandits']['Row'];
type PanditExpertiseOption = Database['public']['Tables']['pandit_expertise_options']['Row'];
type InKindDonation = Database['public']['Tables']['in_kind_donations']['Row'];
type News = Database['public']['Tables']['news']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

export function usePendingVerifications() {
  return useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useApproveVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          rejection_reason: null,
        })
        .eq('id', userId);
      
      if (error) throw error;

      // Send WhatsApp notification to user
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'verification',
            userId,
            title: 'Verification Approved! ✅',
            body: `Congratulations ${profile?.name || 'Member'}! Your verification has been approved. You now have full access to all community features including live streams, full member profiles, and exclusive content.`,
          },
        });
      } catch (notifyError) {
        console.error('Failed to send WhatsApp notification:', notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      toast({
        title: 'User Approved',
        description: 'The user has been verified successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', userId);
      
      if (error) throw error;

      // Send WhatsApp notification to user
      try {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'verification',
            userId,
            title: 'Verification Update',
            body: `Dear ${profile?.name || 'Member'}, your verification request could not be approved.\n\nReason: ${reason}\n\nPlease update your profile and resubmit for verification.`,
          },
        });
      } catch (notifyError) {
        console.error('Failed to send WhatsApp notification:', notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      toast({
        title: 'User Rejected',
        description: 'The verification request has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Pandit Expertise Options
export function usePanditExpertiseOptions() {
  return useQuery({
    queryKey: ['pandit-expertise-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandit_expertise_options')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PanditExpertiseOption[];
    },
  });
}

export function useCreateExpertiseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('pandit_expertise_options')
        .insert({ name });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pandit-expertise-options'] });
      toast({
        title: 'Expertise Added',
        description: 'The expertise option has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpertiseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pandit_expertise_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pandit-expertise-options'] });
      toast({
        title: 'Expertise Removed',
        description: 'The expertise option has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpertiseOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('pandit_expertise_options')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pandit-expertise-options'] });
      toast({
        title: 'Expertise Updated',
        description: 'The expertise option has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function usePandits() {
  return useQuery({
    queryKey: ['admin-pandits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pandit[];
    },
  });
}

export function useCreatePandit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pandit: Omit<Pandit, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('pandits')
        .insert(pandit);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pandits'] });
      toast({
        title: 'Pandit Added',
        description: 'The pandit profile has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePandit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pandit> }) => {
      const { error } = await supabase
        .from('pandits')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pandits'] });
      queryClient.invalidateQueries({ queryKey: ['active-pandits'] });
      toast({
        title: 'Pandit Updated',
        description: 'The pandit profile has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePandit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pandits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pandits'] });
      queryClient.invalidateQueries({ queryKey: ['active-pandits'] });
      toast({
        title: 'Pandit Deleted',
        description: 'The pandit profile has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useInKindDonations() {
  return useQuery({
    queryKey: ['admin-inkind-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('in_kind_donations')
        .select(`
          *,
          profiles (name, mobile)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}

export function useUpdateDonationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // First get the donation details for notification
      const { data: donation, error: fetchError } = await supabase
        .from('in_kind_donations')
        .select('*, profiles (name, mobile)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update the status
      const { error } = await supabase
        .from('in_kind_donations')
        .update({
          status,
          received_at: status === 'received' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      // Send WhatsApp notification if marking as received
      if (status === 'received' && donation) {
        try {
          await supabase.functions.invoke('send-whatsapp', {
            body: {
              type: 'announcement',
              userId: donation.user_id,
              title: '🎁 Donation Received!',
              body: `Thank you ${donation.profiles?.name || 'dear donor'}! Your donation of ${donation.item_type} (${donation.quantity}) has been received at ${donation.dropoff_location}. We truly appreciate your generosity!`,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
        }
      }

      return donation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inkind-donations'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      toast({
        title: 'Status Updated',
        description: 'The donation status has been updated and the donor has been notified.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useNews() {
  return useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as News[];
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (news: Omit<News, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('news')
        .insert(news);
      
      if (error) throw error;

      // Send WhatsApp notification if enabled
      if (news.send_notification) {
        try {
          await supabase.functions.invoke('send-whatsapp', {
            body: {
              type: 'announcement',
              title: news.is_urgent ? `🚨 URGENT: ${news.title}` : news.title,
              body: news.content,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send WhatsApp notification:', notifyError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast({
        title: 'News Published',
        description: 'The news article has been published successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('events')
        .insert(event);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({
        title: 'Event Created',
        description: 'The event has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      toast({
        title: 'Event Updated',
        description: 'The event has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      toast({
        title: 'Event Deleted',
        description: 'The event has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
