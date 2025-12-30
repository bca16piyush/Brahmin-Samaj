import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  youtube_live_url: string | null;
  is_live: boolean;
  location: string | null;
}

export function useLiveStream() {
  const { data: liveEvent, isLoading: isLoadingLive } = useQuery({
    queryKey: ['live-event'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', true)
        .maybeSingle();

      if (error) throw error;
      return data as LiveEvent | null;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as LiveEvent[];
    },
  });

  const nextEvent = upcomingEvents?.[0] || null;

  return {
    liveEvent,
    upcomingEvents: upcomingEvents || [],
    nextEvent,
    isLoading: isLoadingLive || isLoadingUpcoming,
    isLive: !!liveEvent,
  };
}
