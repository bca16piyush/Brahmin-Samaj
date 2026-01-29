import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface BookingNotificationRequest {
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed';
  bookingId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminAlertEmail = Deno.env.get('ADMIN_ALERT_EMAIL');
    const whatsappToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization - allow both admin and service role calls
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    // For admin-triggered notifications, verify admin role
    if (user) {
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
    }

    const { type, bookingId }: BookingNotificationRequest = await req.json();

    if (!bookingId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch booking details with user and pandit info
    const { data: booking, error: bookingError } = await supabase
      .from('pandit_bookings')
      .select(`
        *,
        pandits:pandit_id (name, phone, whatsapp)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name, email, mobile')
      .eq('id', booking.user_id)
      .single();

    // Fetch user's notification preferences
    const { data: userSubscription } = await supabase
      .from('notification_subscriptions')
      .select('whatsapp_number, whatsapp_notifications, email_notifications')
      .eq('user_id', booking.user_id)
      .maybeSingle();

    const results = {
      userEmailSent: false,
      userWhatsAppSent: false,
      adminEmailSent: false,
      adminWhatsAppSent: false,
    };

    const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Prepare notification content based on type
    let userSubject = '';
    let userMessage = '';
    let adminSubject = '';
    let adminMessage = '';

    switch (type) {
      case 'new_booking':
        userSubject = '🙏 Booking Request Submitted';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nYour booking request has been submitted successfully!\n\n📋 Details:\n• Ceremony: ${booking.ceremony_type}\n• Pandit: ${booking.pandits?.name || 'TBD'}\n• Date: ${bookingDate}${booking.booking_time ? `\n• Time: ${booking.booking_time}` : ''}${booking.location ? `\n• Location: ${booking.location}` : ''}\n\nYou will be notified once your booking is confirmed.\n\n🙏 ॐ नमः शिवाय`;
        
        adminSubject = '🔔 New Booking Request';
        adminMessage = `New booking request received!\n\n👤 User: ${userProfile?.name || 'Unknown'}\n📞 Mobile: ${userProfile?.mobile || 'N/A'}\n📧 Email: ${userProfile?.email || 'N/A'}\n\n📋 Booking Details:\n• Ceremony: ${booking.ceremony_type}\n• Pandit: ${booking.pandits?.name || 'TBD'}\n• Date: ${bookingDate}${booking.booking_time ? `\n• Time: ${booking.booking_time}` : ''}${booking.location ? `\n• Location: ${booking.location}` : ''}${booking.message ? `\n• Message: ${booking.message}` : ''}\n\nPlease review and confirm this booking in the admin panel.`;
        break;

      case 'booking_confirmed':
        userSubject = '✅ Booking Confirmed!';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nGreat news! Your booking has been confirmed! 🎉\n\n📋 Confirmed Details:\n• Ceremony: ${booking.ceremony_type}\n• Pandit: ${booking.pandits?.name}\n• Date: ${bookingDate}${booking.booking_time ? `\n• Time: ${booking.booking_time}` : ''}${booking.location ? `\n• Location: ${booking.location}` : ''}\n\n📞 Pandit Contact (now available in your bookings):\n• Phone: ${booking.pandits?.phone || 'Contact via app'}\n• WhatsApp: ${booking.pandits?.whatsapp || 'Contact via app'}\n\nThank you for choosing our services. May your ceremony be blessed!\n\n🙏 ॐ नमः शिवाय`;
        break;

      case 'booking_cancelled':
        userSubject = '❌ Booking Cancelled';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nYour booking has been cancelled.\n\n📋 Cancelled Booking:\n• Ceremony: ${booking.ceremony_type}\n• Pandit: ${booking.pandits?.name}\n• Date: ${bookingDate}\n\n${booking.admin_notes ? `📝 Note: ${booking.admin_notes}\n\n` : ''}If you have any questions, please contact us.\n\n🙏 ॐ नमः शिवाय`;
        break;

      case 'booking_completed':
        userSubject = '🎉 Booking Completed';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nYour ceremony has been marked as completed. We hope it was a blessed experience!\n\n📋 Completed Booking:\n• Ceremony: ${booking.ceremony_type}\n• Pandit: ${booking.pandits?.name}\n• Date: ${bookingDate}\n\nPlease consider leaving a review for the Pandit to help other community members.\n\n🙏 ॐ नमः शिवाय`;
        break;
    }

    // Send email to user if Resend is configured
    if (resendApiKey && userProfile?.email && (type === 'new_booking' || type === 'booking_confirmed' || type === 'booking_cancelled' || type === 'booking_completed')) {
      try {
        const resend = new Resend(resendApiKey);
        
        // For user notifications, only send if email notifications enabled or no preference set
        const shouldSendEmail = !userSubscription || userSubscription.email_notifications !== false;
        
        if (shouldSendEmail) {
          await resend.emails.send({
            from: 'Temple <noreply@resend.dev>',
            to: [userProfile.email],
            subject: userSubject,
            html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${userMessage}</pre>`,
          });
          results.userEmailSent = true;
          console.log('User email sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send user email:', emailError);
      }
    }

    // Send email to admin for new bookings
    if (resendApiKey && adminAlertEmail && type === 'new_booking') {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'Temple Admin <noreply@resend.dev>',
          to: [adminAlertEmail],
          subject: adminSubject,
          html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${adminMessage}</pre>`,
        });
        results.adminEmailSent = true;
        console.log('Admin email sent successfully');
      } catch (emailError) {
        console.error('Failed to send admin email:', emailError);
      }
    }

    // Send WhatsApp to user if configured and enabled
    if (whatsappToken && phoneNumberId && userSubscription?.whatsapp_number && userSubscription.whatsapp_notifications) {
      try {
        const formattedPhone = userSubscription.whatsapp_number.replace(/[^0-9]/g, '');
        
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
                body: `*${userSubject}*\n\n${userMessage}`,
              },
            }),
          }
        );

        if (response.ok) {
          results.userWhatsAppSent = true;
          console.log('User WhatsApp sent successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to send user WhatsApp:', errorData);
        }
      } catch (whatsappError) {
        console.error('Failed to send user WhatsApp:', whatsappError);
      }
    }

    // Log audit event
    if (user) {
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: `booking_notification_${type}`,
          resource_type: 'booking',
          resource_id: bookingId,
          details: {
            booking_id: bookingId,
            notification_type: type,
            user_email_sent: results.userEmailSent,
            user_whatsapp_sent: results.userWhatsAppSent,
            admin_email_sent: results.adminEmailSent,
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    }

    console.log('Notification results:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending booking notification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
