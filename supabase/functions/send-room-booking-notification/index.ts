import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RoomBookingNotificationRequest {
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'checked_in' | 'checked_out';
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

    const { type, bookingId }: RoomBookingNotificationRequest = await req.json();

    if (!bookingId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch booking details with room and user info
    const { data: booking, error: bookingError } = await supabase
      .from('room_bookings')
      .select(`
        *,
        rooms (
          room_number,
          floor,
          room_types (
            name,
            type,
            amenities
          )
        )
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

    const results = {
      userEmailSent: false,
      adminEmailSent: false,
    };

    const checkInDate = new Date(booking.check_in_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const checkOutDate = new Date(booking.check_out_date).toLocaleDateString('en-IN', {
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

    const roomInfo = `Room ${booking.rooms?.room_number} (${booking.rooms?.room_types?.name || 'Standard'})`;

    switch (type) {
      case 'new_booking':
        userSubject = '🏠 Room Booking Request Submitted';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nYour room booking request has been submitted successfully!\n\n📋 Booking Details:\n• Room: ${roomInfo}\n• Check-in: ${checkInDate}\n• Check-out: ${checkOutDate}\n• Guests: ${booking.num_guests}\n• Total Amount: ₹${booking.total_amount || 'TBD'}\n\nYou will be notified once your booking is confirmed.\n\n🙏 ॐ नमः शिवाय`;
        
        adminSubject = '🔔 New Room Booking Request';
        adminMessage = `New room booking request received!\n\n👤 Guest: ${userProfile?.name || 'Unknown'}\n📞 Mobile: ${userProfile?.mobile || 'N/A'}\n📧 Email: ${userProfile?.email || 'N/A'}\n\n🏠 Booking Details:\n• Room: ${roomInfo}\n• Check-in: ${checkInDate}\n• Check-out: ${checkOutDate}\n• Guests: ${booking.num_guests}\n• Total Amount: ₹${booking.total_amount || 'TBD'}${booking.special_requests ? `\n• Special Requests: ${booking.special_requests}` : ''}\n\nPlease review and confirm this booking in the admin panel.`;
        break;

      case 'booking_confirmed':
        userSubject = '✅ Room Booking Confirmed!';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nGreat news! Your room booking has been confirmed! 🎉\n\n📋 Confirmed Booking:\n• Room: ${roomInfo}\n• Floor: ${booking.rooms?.floor || 'Ground'}\n• Check-in: ${checkInDate}\n• Check-out: ${checkOutDate}\n• Guests: ${booking.num_guests}\n• Total Amount: ₹${booking.total_amount}\n\n📌 Important Information:\n• Check-in time: 12:00 PM onwards\n• Check-out time: Before 11:00 AM\n• Please carry a valid ID proof\n\nThank you for choosing our dharamshala. We look forward to your stay!\n\n🙏 ॐ नमः शिवाय`;
        break;

      case 'booking_cancelled':
        userSubject = '❌ Room Booking Cancelled';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nYour room booking has been cancelled.\n\n📋 Cancelled Booking:\n• Room: ${roomInfo}\n• Check-in: ${checkInDate}\n• Check-out: ${checkOutDate}\n\n${booking.admin_notes ? `📝 Note: ${booking.admin_notes}\n\n` : ''}If you have any questions, please contact us.\n\n🙏 ॐ नमः शिवाय`;
        break;

      case 'checked_in':
        userSubject = '🔑 Welcome! You are checked in';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nWelcome! You have been successfully checked in.\n\n📋 Your Stay Details:\n• Room: ${roomInfo}\n• Floor: ${booking.rooms?.floor || 'Ground'}\n• Check-out: ${checkOutDate}\n\nWe hope you have a pleasant and blessed stay!\n\n🙏 ॐ नमः शिवाय`;
        break;

      case 'checked_out':
        userSubject = '🙏 Thank You for Your Stay!';
        userMessage = `नमस्कार ${userProfile?.name || 'भक्त'},\n\nThank you for staying with us! We hope you had a blessed experience.\n\n📋 Completed Stay:\n• Room: ${roomInfo}\n• Check-in: ${checkInDate}\n• Check-out: ${checkOutDate}\n\nWe look forward to welcoming you again soon.\n\n🙏 ॐ नमः शिवाय`;
        break;
    }

    // Send email to user
    if (resendApiKey && userProfile?.email) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: 'Temple <noreply@resend.dev>',
          to: [userProfile.email],
          subject: userSubject,
          html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${userMessage}</pre>`,
        });
        results.userEmailSent = true;
        console.log('User email sent successfully');
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

    // Log audit event
    if (user) {
      try {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: `room_booking_notification_${type}`,
          resource_type: 'room_booking',
          resource_id: bookingId,
          details: {
            booking_id: bookingId,
            notification_type: type,
            room_number: booking.rooms?.room_number,
            user_email_sent: results.userEmailSent,
            admin_email_sent: results.adminEmailSent,
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    }

    console.log('Room booking notification results:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending room booking notification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
