import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  type: 'event' | 'verification' | 'announcement';
  recipientPhone?: string;
  userId?: string;
  title: string;
  body: string;
}

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

    if (!whatsappToken || !phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message: WhatsAppMessage = await req.json();

    console.log('Sending WhatsApp message:', message);

    let recipients: string[] = [];

    if (message.recipientPhone) {
      // Single recipient
      recipients = [message.recipientPhone];
    } else if (message.userId) {
      // Get specific user's WhatsApp number
      const { data: subscription } = await supabase
        .from('notification_subscriptions')
        .select('whatsapp_number')
        .eq('user_id', message.userId)
        .eq('whatsapp_notifications', true)
        .maybeSingle();

      if (subscription?.whatsapp_number) {
        recipients = [subscription.whatsapp_number];
      }
    } else {
      // Broadcast to all subscribers
      const { data: subscriptions } = await supabase
        .from('notification_subscriptions')
        .select('whatsapp_number')
        .eq('whatsapp_notifications', true)
        .not('whatsapp_number', 'is', null);

      if (subscriptions) {
        recipients = subscriptions
          .map((s) => s.whatsapp_number)
          .filter((n): n is string => n !== null);
      }
    }

    console.log(`Sending to ${recipients.length} recipients`);

    const results = await Promise.allSettled(
      recipients.map(async (phone) => {
        const formattedPhone = phone.replace(/[^0-9]/g, '');
        
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
                body: `*${message.title}*\n\n${message.body}`,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to send to ${phone}:`, errorData);
          throw new Error(`Failed to send to ${phone}`);
        }

        return response.json();
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Messages sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed,
        total: recipients.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
