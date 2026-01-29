import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const approveVerificationSchema = z.object({
  action: z.literal('approve_verification'),
  userId: z.string().uuid('Invalid user ID'),
});

const rejectVerificationSchema = z.object({
  action: z.literal('reject_verification'),
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().min(1, 'Rejection reason is required').max(500, 'Reason too long'),
});

const deleteUserSchema = z.object({
  action: z.literal('delete_user'),
  userId: z.string().uuid('Invalid user ID'),
});

const inputSchema = z.discriminatedUnion('action', [
  approveVerificationSchema,
  rejectVerificationSchema,
  deleteUserSchema,
]);

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
      return true; // Allow on error to not block legitimate requests
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

    // Verify authorization
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

    // Verify admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      await logAuditEvent(supabase, user.id, 'unauthorized_access_attempt', 'admin_operations', null, {}, req);
      
      // Send security alert email
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-security-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            eventType: 'unauthorized_access_attempt',
            userId: user.id,
            userEmail: user.email,
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: { attempted_action: 'admin_operations' },
          }),
        });
      } catch (alertError) {
        console.error('Failed to send security alert:', alertError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, user.id, 'admin_operations', 30);
    if (!withinLimit) {
      await logAuditEvent(supabase, user.id, 'rate_limit_exceeded', 'admin_operations', null, {}, req);
      
      // Send security alert email for rate limit
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-security-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            eventType: 'rate_limit_exceeded',
            userId: user.id,
            userEmail: user.email,
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            details: { action: 'admin_operations', limit: 30 },
          }),
        });
      } catch (alertError) {
        console.error('Failed to send security alert:', alertError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = inputSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid input';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input = validation.data;

    // Handle different actions
    switch (input.action) {
      case 'approve_verification': {
        // Get user profile for notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, mobile')
          .eq('id', input.userId)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update verification status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            rejection_reason: null,
          })
          .eq('id', input.userId);

        if (updateError) {
          throw updateError;
        }

        // Log audit event
        await logAuditEvent(supabase, user.id, 'approve_verification', 'profile', input.userId, {
          target_user_name: profile.name,
        }, req);

        // Send WhatsApp notification (optional, don't fail if this fails)
        try {
          const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
          const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
          
          if (whatsappToken && phoneNumberId && profile.mobile) {
            const formattedPhone = profile.mobile.replace(/[^0-9]/g, '');
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
                  body: `*Verification Approved! ✅*\n\nCongratulations ${profile.name}! Your verification has been approved. You now have full access to all community features including live streams, full member profiles, and exclusive content.`,
                },
              }),
            });
          }
        } catch (notifyError) {
          console.error('Failed to send WhatsApp notification:', notifyError);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User verification approved' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reject_verification': {
        // Get user profile for notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, mobile')
          .eq('id', input.userId)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update verification status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'rejected',
            rejection_reason: input.reason,
          })
          .eq('id', input.userId);

        if (updateError) {
          throw updateError;
        }

        // Log audit event
        await logAuditEvent(supabase, user.id, 'reject_verification', 'profile', input.userId, {
          target_user_name: profile.name,
          rejection_reason: input.reason,
        }, req);

        // Send WhatsApp notification
        try {
          const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
          const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
          
          if (whatsappToken && phoneNumberId && profile.mobile) {
            const formattedPhone = profile.mobile.replace(/[^0-9]/g, '');
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
                  body: `*Verification Update*\n\nDear ${profile.name}, your verification request could not be approved.\n\nReason: ${input.reason}\n\nPlease update your profile and resubmit for verification.`,
                },
              }),
            });
          }
        } catch (notifyError) {
          console.error('Failed to send WhatsApp notification:', notifyError);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User verification rejected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        // Get user profile for logging
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', input.userId)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log audit event BEFORE deletion
        await logAuditEvent(supabase, user.id, 'delete_user', 'user', input.userId, {
          deleted_user_name: profile.name,
          deleted_user_email: profile.email,
        }, req);

        // Delete user from auth (this will cascade to profiles via trigger)
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(input.userId);

        if (deleteAuthError) {
          console.error('Failed to delete auth user:', deleteAuthError);
          // Try to delete just the profile if auth deletion fails
          const { error: deleteProfileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', input.userId);

          if (deleteProfileError) {
            throw deleteProfileError;
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in admin operations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
