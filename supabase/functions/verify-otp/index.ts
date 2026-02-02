import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sanitize phone number to standard format
function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
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

    const { mobile, otp, type } = await req.json();

    // Validate input
    if (!mobile || typeof mobile !== "string") {
      return new Response(
        JSON.stringify({ error: "Mobile number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otp || typeof otp !== "string" || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format. Must be 6 digits." }),
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

    // Find user with this mobile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .or(`mobile.eq.${sanitizedMobile},mobile.eq.+${sanitizedMobile},mobile.ilike.%${sanitizedMobile.slice(-10)}`)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP or mobile number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate OTP hash to compare
    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(otp + sanitizedMobile)
    );
    const otpHashHex = Array.from(new Uint8Array(otpHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Find the OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("admin_id", profile.id)
      .eq("action", "otp_generated")
      .eq("resource_type", "password_reset")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No OTP found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const details = otpRecord.details as { otp_hash: string; expires_at: string; verified?: boolean };

    // Check if already verified
    if (details.verified) {
      return new Response(
        JSON.stringify({ error: "OTP already used. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(details.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP hash
    if (details.otp_hash !== otpHashHex) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP. Please check and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("admin_audit_logs")
      .update({
        details: { ...details, verified: true, verified_at: new Date().toISOString() },
      })
      .eq("id", otpRecord.id);

    // Create a verification token for password reset
    const verificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification token
    await supabase.from("admin_audit_logs").insert({
      admin_id: profile.id,
      action: "otp_verified",
      resource_type: "password_reset",
      resource_id: profile.id,
      details: {
        verification_token: verificationToken,
        mobile: sanitizedMobile,
        expires_at: tokenExpiry.toISOString(),
        used: false,
      },
    });

    console.log(`OTP verified for user ${profile.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        verification_token: verificationToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
