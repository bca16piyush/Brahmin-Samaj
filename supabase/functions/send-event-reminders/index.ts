import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  eventTitle: z.string().min(1, 'Event title is required').max(500, 'Event title too long'),
  eventDate: z.string().min(1, 'Event date is required'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    // Parse and validate input
    const body = await req.json();
    const validation = inputSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid input';
      console.error('Validation error:', errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { eventId, eventTitle, eventDate } = validation.data;

    console.log(`Sending reminders for event: ${eventTitle} (${eventId})`);

    // Get all registered users for this event who haven't received a reminder
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        user_id,
        reminder_sent,
        profiles:user_id (name, email, mobile)
      `)
      .eq('event_id', eventId)
      .eq('status', 'registered')
      .eq('reminder_sent', false);

    if (regError) {
      console.error('Error fetching registrations:', regError);
      throw regError;
    }

    console.log(`Found ${registrations?.length || 0} users to notify`);

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(eventDate).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const messageBody = `🙏 Reminder: ${eventTitle}\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n\nWe look forward to seeing you!`;

    let sentCount = 0;
    let failedCount = 0;

    // Send WhatsApp notifications if configured
    if (whatsappToken && phoneNumberId) {
      // Get WhatsApp numbers for registered users
      const userIds = registrations.map(r => r.user_id);
      const { data: subscriptions } = await supabase
        .from('notification_subscriptions')
        .select('user_id, whatsapp_number')
        .in('user_id', userIds)
        .eq('whatsapp_notifications', true)
        .not('whatsapp_number', 'is', null);

      const whatsappMap = new Map(
        subscriptions?.map(s => [s.user_id, s.whatsapp_number]) || []
      );

      for (const reg of registrations) {
        const whatsappNumber = whatsappMap.get(reg.user_id);
        
        if (whatsappNumber) {
          try {
            const formattedPhone = whatsappNumber.replace(/[^0-9]/g, '');
            
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${whatsappToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: formattedPhone,
                  type: 'text',
                  text: {
                    preview_url: false,
                    body: `*Event Reminder*\n\n${messageBody}`,
                  },
                }),
              }
            );

            if (response.ok) {
              sentCount++;
              // Mark reminder as sent
              await supabase
                .from('event_registrations')
                .update({ reminder_sent: true })
                .eq('id', reg.id);
            } else {
              failedCount++;
              console.error(`Failed to send to ${whatsappNumber}:`, await response.text());
            }
          } catch (error) {
            failedCount++;
            console.error(`Error sending to ${whatsappNumber}:`, error);
          }
        }
      }
    }

    // Also update reminder_sent for all registrations even if no WhatsApp
    // This prevents duplicate reminders
    const regIds = registrations.map(r => r.id);
    await supabase
      .from('event_registrations')
      .update({ reminder_sent: true })
      .in('id', regIds);

    console.log(`Reminders sent: ${sentCount} successful, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: registrations.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending reminders:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});