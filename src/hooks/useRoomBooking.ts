import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export type RoomType = 'dormitory' | 'standard' | 'deluxe' | 'ac' | 'non_ac';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface RoomTypeInfo {
  id: string;
  name: string;
  type: RoomType;
  description: string | null;
  capacity: number;
  price_per_night: number;
  amenities: string[];
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_type_id: string;
  room_number: string;
  floor: number;
  notes: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room_types?: RoomTypeInfo;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  guest_names: string[] | null;
  total_amount: number | null;
  status: BookingStatus;
  special_requests: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  rooms?: Room & { room_types?: RoomTypeInfo };
}

// Fetch all room types
export function useRoomTypes() {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('is_active', true)
        .order('price_per_night', { ascending: true });
      
      if (error) throw error;
      return data as RoomTypeInfo[];
    },
  });
}

// Fetch all rooms with their types
export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `)
        .eq('is_active', true)
        .order('room_number', { ascending: true });
      
      if (error) throw error;
      return data as Room[];
    },
  });
}

// Fetch available rooms for given dates
export function useAvailableRooms(checkIn: string | null, checkOut: string | null) {
  return useQuery({
    queryKey: ['available-rooms', checkIn, checkOut],
    queryFn: async () => {
      if (!checkIn || !checkOut) return [];

      // First get all active rooms
      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (*)
        `)
        .eq('is_active', true)
        .eq('is_blocked', false);
      
      if (roomsError) throw roomsError;

      // Then get bookings that overlap with the date range
      const { data: overlappingBookings, error: bookingsError } = await supabase
        .from('room_bookings')
        .select('room_id')
        .not('status', 'in', '("cancelled","checked_out")')
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn);
      
      if (bookingsError) throw bookingsError;

      const bookedRoomIds = new Set(overlappingBookings?.map(b => b.room_id) || []);
      
      // Filter out booked rooms
      const availableRooms = (allRooms || []).filter(room => !bookedRoomIds.has(room.id));
      
      return availableRooms as Room[];
    },
    enabled: !!checkIn && !!checkOut,
  });
}

// Fetch user's bookings
export function useMyRoomBookings() {
  return useQuery({
    queryKey: ['my-room-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('room_bookings')
        .select(`
          *,
          rooms (
            *,
            room_types (*)
          )
        `)
        .eq('user_id', user.id)
        .order('check_in_date', { ascending: false });
      
      if (error) throw error;
      return data as RoomBooking[];
    },
  });
}

// Create a booking
export function useCreateRoomBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booking: {
      room_id: string;
      check_in_date: string;
      check_out_date: string;
      num_guests: number;
      guest_names?: string[];
      total_amount: number;
      special_requests?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to book a room');

      const { error } = await supabase
        .from('room_bookings')
        .insert({
          ...booking,
          user_id: user.id,
          status: 'pending',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-room-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['all-room-bookings'] });
      toast({
        title: 'Booking Requested',
        description: 'Your room booking has been submitted for confirmation.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cancel a booking
export function useCancelRoomBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('room_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-room-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['all-room-bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled.',
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

// Admin: Fetch all bookings
export function useAllRoomBookings() {
  return useQuery({
    queryKey: ['all-room-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_bookings')
        .select(`
          *,
          rooms (
            *,
            room_types (*)
          )
        `)
        .order('check_in_date', { ascending: true });
      
      if (error) throw error;
      return data as RoomBooking[];
    },
  });
}

// Admin: Update booking status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: BookingStatus; admin_notes?: string }) => {
      const { error } = await supabase
        .from('room_bookings')
        .update({ status, admin_notes })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-room-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-room-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      toast({
        title: 'Booking Updated',
        description: 'Booking status has been updated.',
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

// Admin: Block/Unblock room
export function useToggleRoomBlock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_blocked, blocked_reason, blocked_until }: {
      id: string;
      is_blocked: boolean;
      blocked_reason?: string;
      blocked_until?: string;
    }) => {
      const { error } = await supabase
        .from('rooms')
        .update({
          is_blocked,
          blocked_reason: is_blocked ? blocked_reason : null,
          blocked_until: is_blocked ? blocked_until : null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      toast({
        title: variables.is_blocked ? 'Room Blocked' : 'Room Unblocked',
        description: variables.is_blocked 
          ? 'Room has been blocked for maintenance.'
          : 'Room is now available for booking.',
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

// Admin: Update room type price
export function useUpdateRoomTypePrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, price_per_night }: { id: string; price_per_night: number }) => {
      const { error } = await supabase
        .from('room_types')
        .update({ price_per_night })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast({
        title: 'Price Updated',
        description: 'Room type price has been updated.',
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

// Admin: Create room
export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (room: { room_type_id: string; room_number: string; floor?: number; notes?: string }) => {
      const { error } = await supabase
        .from('rooms')
        .insert(room);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({
        title: 'Room Created',
        description: 'New room has been added.',
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

// Admin: Create room type
export function useCreateRoomType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomType: Omit<RoomTypeInfo, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('room_types')
        .insert(roomType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast({
        title: 'Room Type Created',
        description: 'New room type has been added.',
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
