import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { bookingSchema, reviewSchema, validateOrThrow } from '@/lib/validation';

interface ReviewData {
  pandit_id: string;
  rating: number;
  review_text?: string;
  ceremony_type?: string;
}

interface BookingData {
  pandit_id: string;
  ceremony_type: string;
  booking_date: string;
  booking_time?: string;
  location?: string;
  message?: string;
}

export function usePanditReviews(panditId: string) {
  return useQuery({
    queryKey: ['pandit-reviews', panditId],
    queryFn: async () => {
      // Get reviews only - profiles are not publicly accessible for privacy
      const { data: reviews, error } = await supabase
        .from('pandit_reviews')
        .select('*')
        .eq('pandit_id', panditId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!reviews || reviews.length === 0) return [];
      
      // Return reviews with anonymous profile display for privacy
      return reviews.map(r => ({
        ...r,
        profiles: { id: r.user_id, name: 'Community Member' },
      }));
    },
    enabled: !!panditId,
  });
}

export function useUserReviewForPandit(panditId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-pandit-review', panditId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('pandit_reviews')
        .select('*')
        .eq('pandit_id', panditId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!panditId && !!user,
  });
}

export function usePanditAverageRating(panditId: string) {
  return useQuery({
    queryKey: ['pandit-avg-rating', panditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandit_reviews')
        .select('rating')
        .eq('pandit_id', panditId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) return { average: 0, count: 0 };
      
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: Math.round((sum / data.length) * 10) / 10,
        count: data.length,
      };
    },
    enabled: !!panditId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: ReviewData) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate input - throws on validation failure
      const validated = validateOrThrow(reviewSchema, review);
      
      const { error } = await supabase
        .from('pandit_reviews')
        .insert({
          pandit_id: validated.pandit_id,
          rating: validated.rating,
          review_text: validated.review_text || null,
          ceremony_type: validated.ceremony_type || null,
          user_id: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pandit-reviews', variables.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-avg-rating', variables.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-ratings-all'] });
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: 'Already Reviewed',
          description: 'You have already reviewed this Pandit.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, pandit_id, rating, review_text, ceremony_type }: { id: string; pandit_id: string; rating: number; review_text?: string; ceremony_type?: string }) => {
      const { error } = await supabase
        .from('pandit_reviews')
        .update({ rating, review_text, ceremony_type })
        .eq('id', id);
      
      if (error) throw error;
      return { pandit_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pandit-reviews', data.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-avg-rating', data.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-ratings-all'] });
      toast({
        title: 'Review Updated',
        description: 'Your review has been updated.',
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

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, pandit_id }: { id: string; pandit_id: string }) => {
      const { error } = await supabase
        .from('pandit_reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { pandit_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pandit-reviews', data.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-avg-rating', data.pandit_id] });
      queryClient.invalidateQueries({ queryKey: ['pandit-ratings-all'] });
      toast({
        title: 'Review Deleted',
        description: 'Your review has been removed.',
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

export function useUserBookings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pandit_bookings')
        .select(`
          *,
          pandits:pandit_id (name, photo_url)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      // First get bookings with pandit info
      const { data: bookings, error } = await supabase
        .from('pandit_bookings')
        .select(`
          *,
          pandits:pandit_id (name, photo_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Then fetch profiles for each unique user_id
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, mobile')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return bookings.map(b => ({
        ...b,
        profiles: profileMap.get(b.user_id) || null,
      }));
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (booking: BookingData) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate input - throws on validation failure
      const validated = validateOrThrow(bookingSchema, booking);
      
      const { error } = await supabase
        .from('pandit_bookings')
        .insert({
          pandit_id: validated.pandit_id,
          ceremony_type: validated.ceremony_type,
          booking_date: validated.booking_date,
          booking_time: validated.booking_time || null,
          location: validated.location || null,
          message: validated.message || null,
          user_id: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Booking Requested',
        description: 'Your booking request has been submitted. You will be notified once confirmed.',
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

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('pandit_bookings')
        .update({ status, admin_notes })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Status Updated',
        description: 'The booking status has been updated.',
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