import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// YouTube channel ID - can be configured per deployment
const YOUTUBE_CHANNEL_ID = 'YOUR_CHANNEL_ID';

export async function checkYouTubeLive(): Promise<{
  isLive: boolean;
  videoId: string | null;
  title: string | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('check-youtube-live', {
      body: { channelId: YOUTUBE_CHANNEL_ID },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to check YouTube live status:', error);
    return { isLive: false, videoId: null, title: null };
  }
}

export async function sendWhatsAppNotification(params: {
  type: 'event' | 'verification' | 'announcement';
  recipientPhone?: string;
  userId?: string;
  title: string;
  body: string;
}): Promise<{ success: boolean; sent?: number; failed?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return { success: false };
  }
}

export function useNotifications() {
  const { toast } = useToast();

  const notifyUpcomingEvent = async (event: {
    title: string;
    date: string;
    location?: string;
  }) => {
    const result = await sendWhatsAppNotification({
      type: 'event',
      title: `📅 Upcoming Event: ${event.title}`,
      body: `Join us for ${event.title}\n\n📆 ${new Date(event.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}\n⏰ ${new Date(event.date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}${event.location ? `\n📍 ${event.location}` : ''}`,
    });

    if (result.success) {
      toast({
        title: 'Notifications Sent',
        description: `Sent to ${result.sent} subscribers`,
      });
    } else {
      toast({
        title: 'Notification Failed',
        description: 'Failed to send WhatsApp notifications',
        variant: 'destructive',
      });
    }

    return result;
  };

  const notifyLiveStream = async (eventTitle: string) => {
    const result = await sendWhatsAppNotification({
      type: 'event',
      title: '🔴 LIVE NOW',
      body: `${eventTitle} is now live! Watch now on our website.`,
    });

    return result;
  };

  return {
    notifyUpcomingEvent,
    notifyLiveStream,
    sendWhatsAppNotification,
    checkYouTubeLive,
  };
}
