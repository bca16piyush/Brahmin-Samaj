import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a 6-digit OTP
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

// Validate phone number format
function validatePhoneNumber(phone: string): boolean {
  // Allow formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX (10 digits)
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 12;
}

// Sanitize phone number to standard format
function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  if (!cleaned.startsWith("91") && cleaned.length === 12) {
    // Already has country code
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    // Good
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mobile, type } = await req.json();

    // Validate input
    if (!mobile || typeof mobile !== "string") {
      return new Response(
        JSON.stringify({ error: "Mobile number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validatePhoneNumber(mobile)) {
      return new Response(
        JSON.stringify({ error: "Invalid mobile number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type !== "password_reset") {
      return new Response(
        JSON.stringify({ error: "Invalid OTP type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedMobile = sanitizePhoneNumber(mobile);

    // Check if user exists with this mobile number
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, mobile")
      .or(`mobile.eq.${sanitizedMobile},mobile.eq.+${sanitizedMobile},mobile.ilike.%${sanitizedMobile.slice(-10)}`)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(
        JSON.stringify({ error: "Error looking up user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this number, an OTP has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 3 OTPs per mobile per 10 minutes
    const { data: withinLimit, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        _user_id: profile.id,
        _action: "otp_send",
        _max_requests: 3,
        _window_minutes: 10,
      }
    );

    if (rateLimitError) {
      console.error("Rate limit error:", rateLimitError);
    } else if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in rate_limits table with special action
    // We'll use a simple approach: store OTP hash in details column
    // For production, you'd want a dedicated OTP table
    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(otp + sanitizedMobile)
    );
    const otpHashHex = Array.from(new Uint8Array(otpHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store in a simple key-value format using admin_audit_logs for OTP tracking
    // This is a workaround - in production, create a dedicated otp_codes table
    await supabase.from("admin_audit_logs").insert({
      admin_id: profile.id,
      action: "otp_generated",
      resource_type: "password_reset",
      resource_id: profile.id,
      details: {
        otp_hash: otpHashHex,
        mobile: sanitizedMobile,
        expires_at: expiresAt.toISOString(),
      },
    });

    // Send OTP via Twilio SMS
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured. Please use email-based password reset." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const toNumber = sanitizedMobile.startsWith("+") ? sanitizedMobile : `+${sanitizedMobile}`;

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: toNumber,
        Body: `Your password reset OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
      }),
    });

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error("Twilio error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send OTP. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ${toNumber.slice(0, -4)}****`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
