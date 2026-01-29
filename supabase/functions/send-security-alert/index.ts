import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SecurityAlertRequest {
  eventType: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminAlertEmail = Deno.env.get("ADMIN_ALERT_EMAIL");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminAlertEmail) {
      console.error("ADMIN_ALERT_EMAIL not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Admin email not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const alertData: SecurityAlertRequest = await req.json();
    const {
      eventType,
      userId,
      userName,
      userEmail,
      ipAddress,
      userAgent,
      details,
      timestamp = new Date().toISOString(),
    } = alertData;

    // Validate required fields
    if (!eventType || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: eventType and userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format the event type for display
    const eventTypeFormatted = eventType.replace(/_/g, ' ').toUpperCase();
    const formattedTimestamp = new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Kolkata',
    });

    // Determine severity level
    const criticalEvents = ['unauthorized_access_attempt', 'rate_limit_exceeded', 'unauthorized_reminder_attempt'];
    const isCritical = criticalEvents.includes(eventType);
    const severityLabel = isCritical ? '🚨 CRITICAL' : '⚠️ WARNING';
    const severityColor = isCritical ? '#dc2626' : '#f59e0b';

    // Build details HTML
    let detailsHtml = '';
    if (details && Object.keys(details).length > 0) {
      detailsHtml = `
        <h3 style="color: #374151; margin-top: 20px;">Additional Details:</h3>
        <pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px;">${JSON.stringify(details, null, 2)}</pre>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: ${severityColor}; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${severityLabel} Security Alert</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
              <h2 style="color: #111827; margin-top: 0;">Event: ${eventTypeFormatted}</h2>
              
              <div style="background: #fef3c7; border-left: 4px solid ${severityColor}; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: #92400e;">
                  A security event has been detected that requires your attention.
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 140px;">Time:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500;">${formattedTimestamp}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">User ID:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: monospace; font-size: 13px;">${userId}</td>
                </tr>
                ${userName ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">User Name:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${userName}</td>
                </tr>
                ` : ''}
                ${userEmail ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">User Email:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${userEmail}</td>
                </tr>
                ` : ''}
                ${ipAddress ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">IP Address:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: monospace;">${ipAddress}</td>
                </tr>
                ` : ''}
                ${userAgent ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">User Agent:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 12px; word-break: break-all;">${userAgent}</td>
                </tr>
                ` : ''}
              </table>
              
              ${detailsHtml}
              
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Please review this event in the Admin Dashboard audit logs for more information.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated security alert from Heritage Connect Suite
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Security Alerts <onboarding@resend.dev>",
        to: [adminAlertEmail],
        subject: `${severityLabel} Security Alert: ${eventTypeFormatted}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.message || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Security alert email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending security alert:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
