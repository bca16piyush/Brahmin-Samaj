import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  type: z.enum(['event', 'verification', 'announcement']),
  recipientPhone: z.string().max(20, 'Phone number too long').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(2000, 'Body too long'),
});

// Helper to log audit events
async function logAuditEvent(
  supabase: any,
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, unknown>,
  req: Request
) {
  try {
    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });
    
    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Error in logAuditEvent:', err);
  }
}

// Helper to check rate limit
async function checkRateLimit(
  supabase: any,
  userId: string,
  action: string,
  maxRequests = 10
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      _user_id: userId,
      _action: action,
      _max_requests: maxRequests,
      _window_minutes: 1,
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      return true;
    }
    
    return data === true;
  } catch (err) {
    console.error('Error in checkRateLimit:', err);
    return true;
  }
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
      await logAuditEvent(supabase, user.id, 'unauthorized_whatsapp_attempt', 'whatsapp', null, {}, req);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (20 requests per minute for WhatsApp)
    const withinLimit = await checkRateLimit(supabase, user.id, 'send_whatsapp', 20);
    if (!withinLimit) {
      await logAuditEvent(supabase, user.id, 'rate_limit_exceeded', 'whatsapp', null, {}, req);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const message = validation.data;

    console.log('Sending WhatsApp message:', { type: message.type, title: message.title });

    let recipients: string[] = [];

    if (message.recipientPhone) {
      recipients = [message.recipientPhone];
    } else if (message.userId) {
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
      const { data: subscriptions } = await supabase
        .from('notification_subscriptions')
        .select('whatsapp_number')
        .eq('whatsapp_notifications', true)
        .not('whatsapp_number', 'is', null);

      if (subscriptions) {
        recipients = subscriptions
          .map((s: any) => s.whatsapp_number)
          .filter((n: string | null): n is string => n !== null);
      }
    }

    console.log(`Sending to ${recipients.length} recipients`);

    // Log audit event
    await logAuditEvent(supabase, user.id, 'send_whatsapp', 'notification', null, {
      type: message.type,
      title: message.title,
      recipient_count: recipients.length,
    }, req);

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
