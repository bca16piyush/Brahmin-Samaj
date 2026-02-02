import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema for bulk messaging
const bulkMessageSchema = z.object({
  recipients: z.array(z.object({
    phone: z.string().min(10, 'Phone number required'),
    name: z.string().optional(),
    customFields: z.record(z.string()).optional(),
  })).min(1, 'At least one recipient required').max(1000, 'Maximum 1000 recipients'),
  messageTemplate: z.string().min(1, 'Message template required').max(2000, 'Message too long'),
  title: z.string().min(1, 'Title required').max(200, 'Title too long'),
  delayMs: z.number().min(1000).max(60000).optional().default(5000), // 1-60 seconds delay, default 5s
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'document', 'pdf']).optional(),
});

// Helper to replace personalization tags in message
function personalizeMessage(template: string, recipient: { name?: string; customFields?: Record<string, string> }): string {
  let message = template;
  
  // Replace {name} tag
  if (recipient.name) {
    message = message.replace(/\{name\}/gi, recipient.name);
  } else {
    message = message.replace(/\{name\}/gi, 'भक्त');
  }
  
  // Replace custom field tags like {field1}, {location}, etc.
  if (recipient.customFields) {
    for (const [key, value] of Object.entries(recipient.customFields)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      message = message.replace(regex, value);
    }
  }
  
  return message;
}

// Helper to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'unauthorized_bulk_whatsapp_attempt',
        resource_type: 'whatsapp',
        resource_id: null,
        details: {},
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = bulkMessageSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid input';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { recipients, messageTemplate, title, delayMs, mediaUrl, mediaType } = validation.data;

    console.log(`Starting bulk WhatsApp: ${recipients.length} recipients, ${delayMs}ms delay, media: ${mediaType || 'none'}`);

    // Log audit event at start
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'bulk_whatsapp_started',
      resource_type: 'whatsapp_bulk',
      resource_id: null,
      details: {
        title,
        recipient_count: recipients.length,
        delay_ms: delayMs,
        has_media: !!mediaUrl,
        media_type: mediaType,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    // Process messages with queued sending
    const results: { phone: string; success: boolean; error?: string }[] = [];
    let successful = 0;
    let failed = 0;

    // Helper function to build message payload
    const buildMessagePayload = (formattedPhone: string, personalizedMessage: string) => {
      const basePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
      };

      // If media is attached, send as media message with caption
      if (mediaUrl && mediaType) {
        const whatsappMediaType = mediaType === 'pdf' ? 'document' : mediaType;
        
        if (whatsappMediaType === 'image') {
          return {
            ...basePayload,
            type: 'image',
            image: {
              link: mediaUrl,
              caption: `*${title}*\n\n${personalizedMessage}`,
            },
          };
        } else if (whatsappMediaType === 'video') {
          return {
            ...basePayload,
            type: 'video',
            video: {
              link: mediaUrl,
              caption: `*${title}*\n\n${personalizedMessage}`,
            },
          };
        } else {
          // document or pdf
          return {
            ...basePayload,
            type: 'document',
            document: {
              link: mediaUrl,
              caption: `*${title}*\n\n${personalizedMessage}`,
              filename: mediaUrl.split('/').pop() || 'document',
            },
          };
        }
      }

      // Default text message
      return {
        ...basePayload,
        type: 'text',
        text: {
          preview_url: false,
          body: `*${title}*\n\n${personalizedMessage}`,
        },
      };
    };

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const formattedPhone = recipient.phone.replace(/[^0-9]/g, '');
      const personalizedMessage = personalizeMessage(messageTemplate, recipient);

      try {
        const messagePayload = buildMessagePayload(formattedPhone, personalizedMessage);
        
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messagePayload),
          }
        );

        if (response.ok) {
          results.push({ phone: recipient.phone, success: true });
          successful++;
          console.log(`[${i + 1}/${recipients.length}] Sent to ${formattedPhone}`);
        } else {
          const errorData = await response.json();
          results.push({ 
            phone: recipient.phone, 
            success: false, 
            error: errorData.error?.message || 'Unknown error' 
          });
          failed++;
          console.error(`[${i + 1}/${recipients.length}] Failed ${formattedPhone}:`, errorData);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.push({ phone: recipient.phone, success: false, error: errorMsg });
        failed++;
        console.error(`[${i + 1}/${recipients.length}] Error ${formattedPhone}:`, err);
      }

      // Add delay between messages (except for the last one)
      if (i < recipients.length - 1) {
        await delay(delayMs);
      }
    }

    // Log completion audit event
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'bulk_whatsapp_completed',
      resource_type: 'whatsapp_bulk',
      resource_id: null,
      details: {
        title,
        total: recipients.length,
        successful,
        failed,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    console.log(`Bulk WhatsApp completed: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: recipients.length,
        sent: successful, 
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in bulk WhatsApp:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
