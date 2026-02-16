import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Fetch accommodation locations
export function useAccommodationLocations() {
  return useQuery({
    queryKey: ['accommodation-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accommodation_locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// Fetch rooms with location info
export function useAccommodationRooms(locationId?: string) {
  return useQuery({
    queryKey: ['accommodation-rooms', locationId],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select('*, accommodation_locations(*)')
        .not('location_id', 'is', null)
        .eq('is_active', true)
        .order('room_number');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Fetch rooms available for specific date range
export function useAvailableRoomsForDates(checkIn?: string, checkOut?: string, locationId?: string) {
  return useQuery({
    queryKey: ['available-rooms-dates', checkIn, checkOut, locationId],
    enabled: !!checkIn && !!checkOut,
    queryFn: async () => {
      // Get all active rooms
      let query = supabase
        .from('rooms')
        .select('*, accommodation_locations(*)')
        .not('location_id', 'is', null)
        .eq('is_active', true)
        .order('room_number');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data: allRooms, error: roomsError } = await query;
      if (roomsError) throw roomsError;

      // Get conflicting allocations for the date range
      const { data: conflicting, error: allocError } = await supabase
        .from('room_allocations')
        .select('room_id')
        .eq('status', 'active')
        .lt('check_in_date', checkOut!)
        .gt('check_out_date', checkIn!);

      if (allocError) throw allocError;

      const occupiedRoomIds = new Set((conflicting || []).map(a => a.room_id));
      return (allRooms || []).filter(r => !occupiedRoomIds.has(r.id));
    },
  });
}

// Fetch all room allocations with user & room info
export function useRoomAllocations() {
  return useQuery({
    queryKey: ['room-allocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_allocations')
        .select('*, rooms(*, accommodation_locations(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(a => a.user_id))];
      if (userIds.length === 0) return data?.map(a => ({ ...a, profile: null })) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, mobile')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return (data || []).map(a => ({ ...a, profile: profileMap.get(a.user_id) || null }));
    },
  });
}

// Create accommodation location
export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (location: { name: string; description?: string; address?: string }) => {
      const { error } = await supabase.from('accommodation_locations').insert(location);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-locations'] });
      toast({ title: 'Location Created' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Update location
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; address?: string; is_active?: boolean }) => {
      const { error } = await supabase.from('accommodation_locations').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-locations'] });
      toast({ title: 'Location Updated' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Allocate room to user with date range
export function useAllocateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (allocation: {
      room_id: string;
      user_id: string;
      check_in_date: string;
      check_out_date: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('room_allocations').insert({
        ...allocation,
        allocated_by: user?.id,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms-dates'] });
      toast({ title: 'Room Allocated', description: 'User has been assigned a room for the selected dates.' });
    },
    onError: (e) => toast({ title: 'Allocation Failed', description: e.message, variant: 'destructive' }),
  });
}

// Swap/change room allocation
export function useSwapRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ oldAllocationId, newRoomId, userId, checkInDate, checkOutDate, notes }: {
      oldAllocationId: string;
      newRoomId: string;
      userId: string;
      checkInDate?: string;
      checkOutDate?: string;
      notes?: string;
    }) => {
      const { error: cancelError } = await supabase
        .from('room_allocations')
        .update({ status: 'swapped' })
        .eq('id', oldAllocationId);
      if (cancelError) throw cancelError;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: allocError } = await supabase.from('room_allocations').insert({
        room_id: newRoomId,
        user_id: userId,
        allocated_by: user?.id,
        status: 'active',
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        notes: notes || 'Room swap',
      });
      if (allocError) throw allocError;

      const { data: roomData } = await supabase
        .from('rooms')
        .select('room_number, accommodation_locations(name)')
        .eq('id', newRoomId)
        .single();

      await supabase.from('user_notifications').insert({
        user_id: userId,
        title: 'Room Changed',
        message: `Your room has been changed to Room ${roomData?.room_number || 'N/A'} at ${(roomData as any)?.accommodation_locations?.name || 'Event Venue'}.`,
        type: 'room_changed',
        metadata: { room_id: newRoomId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms-dates'] });
      toast({ title: 'Room Swapped', description: 'User room changed and notified.' });
    },
    onError: (e) => toast({ title: 'Swap Failed', description: e.message, variant: 'destructive' }),
  });
}

// Cancel allocation
export function useCancelAllocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (allocationId: string) => {
      const { error } = await supabase
        .from('room_allocations')
        .update({ status: 'cancelled' })
        .eq('id', allocationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms-dates'] });
      toast({ title: 'Allocation Cancelled' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Bulk import rooms
export function useBulkImportRooms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rooms: { room_number: string; location_id: string; capacity: number; ac_type: string; floor: number; room_type_id: string }[]) => {
      const { error } = await supabase.from('rooms').insert(
        rooms.map(r => ({ ...r, status: 'available', is_active: true }))
      );
      if (error) throw error;
      return rooms.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Import Complete', description: `${count} rooms imported successfully.` });
    },
    onError: (e) => toast({ title: 'Import Failed', description: e.message, variant: 'destructive' }),
  });
}

// Delete a location (only if no active allocations)
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (locationId: string) => {
      // Check for active allocations on rooms in this location
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('location_id', locationId);
      
      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(r => r.id);
        const { data: activeAllocs } = await supabase
          .from('room_allocations')
          .select('id')
          .in('room_id', roomIds)
          .eq('status', 'active')
          .limit(1);
        
        if (activeAllocs && activeAllocs.length > 0) {
          throw new Error('Cannot delete: Users are currently assigned to this property.');
        }
        
        // Delete rooms first
        const { error: roomErr } = await supabase.from('rooms').delete().in('id', roomIds);
        if (roomErr) throw roomErr;
      }
      
      const { error } = await supabase.from('accommodation_locations').delete().eq('id', locationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-locations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      toast({ title: 'Property Deleted' });
    },
    onError: (e) => toast({ title: 'Delete Failed', description: e.message, variant: 'destructive' }),
  });
}

// Delete rooms (bulk)
export function useDeleteRooms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomIds: string[]) => {
      // Check active allocations
      const { data: activeAllocs } = await supabase
        .from('room_allocations')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('status', 'active');
      
      if (activeAllocs && activeAllocs.length > 0) {
        const activeSet = new Set(activeAllocs.map(a => a.room_id));
        const safeIds = roomIds.filter(id => !activeSet.has(id));
        if (safeIds.length === 0) {
          throw new Error('All selected rooms have active allocations.');
        }
        // Delete only safe rooms
        const { error } = await supabase.from('rooms').delete().in('id', safeIds);
        if (error) throw error;
        return { deleted: safeIds.length, skipped: roomIds.length - safeIds.length };
      }
      
      const { error } = await supabase.from('rooms').delete().in('id', roomIds);
      if (error) throw error;
      return { deleted: roomIds.length, skipped: 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      const msg = result.skipped > 0
        ? `Deleted ${result.deleted} rooms. ${result.skipped} skipped (active allocations).`
        : `${result.deleted} rooms deleted.`;
      toast({ title: 'Rooms Deleted', description: msg });
    },
    onError: (e) => toast({ title: 'Delete Failed', description: e.message, variant: 'destructive' }),
  });
}

// Reset all inventory (wipe all rooms and allocations)
export function useResetInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // Delete all allocations first, then rooms, then locations
      const { error: allocErr } = await supabase.from('room_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (allocErr) throw allocErr;
      const { error: roomErr } = await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (roomErr) throw roomErr;
      const { error: locErr } = await supabase.from('accommodation_locations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (locErr) throw locErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-locations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Inventory Reset', description: 'All rooms, allocations, and properties have been cleared.' });
    },
    onError: (e) => toast({ title: 'Reset Failed', description: e.message, variant: 'destructive' }),
  });
}

// Advanced bulk import with date-range room generation
export function useAdvancedBulkImport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      rooms: { room_number: string; location_id: string; capacity: number; ac_type: string; floor: number; room_type_id: string; available_from?: string; available_to?: string }[];
      newLocations: { name: string; address?: string; category?: string; feeding_system?: string }[];
    }) => {
      // Create new locations first and get their IDs
      const locationMap = new Map<string, string>();
      
      for (const loc of params.newLocations) {
        const { data, error } = await supabase
          .from('accommodation_locations')
          .insert({ name: loc.name, address: loc.address, category: loc.category, feeding_system: loc.feeding_system })
          .select('id')
          .single();
        if (error) throw error;
        locationMap.set(loc.name.toLowerCase().trim(), data.id);
      }

      // Replace placeholder location IDs with real ones
      const finalRooms = params.rooms.map(r => {
        if (r.location_id.startsWith('NEW:')) {
          const locName = r.location_id.replace('NEW:', '').toLowerCase().trim();
          const realId = locationMap.get(locName);
          if (realId) return { ...r, location_id: realId };
        }
        return r;
      });

      // Batch insert rooms (max 500 at a time)
      const batchSize = 500;
      let totalInserted = 0;
      for (let i = 0; i < finalRooms.length; i += batchSize) {
        const batch = finalRooms.slice(i, i + batchSize).map(r => ({
          ...r,
          status: 'available' as const,
          is_active: true,
        }));
        const { error } = await supabase.from('rooms').insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
      }
      
      return totalInserted;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-locations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Import Complete', description: `${count} rooms imported successfully.` });
    },
    onError: (e) => toast({ title: 'Import Failed', description: e.message, variant: 'destructive' }),
  });
}

// User's current active room allocation (date-aware)
export function useMyAllocation() {
  return useQuery({
    queryKey: ['my-allocation'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('room_allocations')
        .select('*, rooms(*, accommodation_locations(*))')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const today = new Date().toISOString().split('T')[0];
      const currentAlloc = data.find(a =>
        (!a.check_in_date || a.check_in_date <= today) &&
        (!a.check_out_date || a.check_out_date > today)
      );

      if (currentAlloc) return { ...currentAlloc, isActive: true };

      const upcoming = data.find(a => a.check_in_date && a.check_in_date > today);
      if (upcoming) return { ...upcoming, isActive: false, isUpcoming: true };

      return { ...data[0], isActive: false, isPast: true };
    },
  });
}

// Fetch accommodation for a specific user (used by scanner)
export function useUserAccommodation(userId?: string) {
  return useQuery({
    queryKey: ['user-accommodation', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('room_allocations')
        .select('*, rooms(room_number, accommodation_locations(name))')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('check_in_date', today)
        .gt('check_out_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
