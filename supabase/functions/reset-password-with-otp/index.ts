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

// Validate password strength
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mobile, newPassword } = await req.json();

    // Validate input
    if (!mobile || typeof mobile !== "string") {
      return new Response(
        JSON.stringify({ error: "Mobile number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
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
        JSON.stringify({ error: "User not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for valid verified OTP token (within last 15 minutes)
    const { data: verificationRecord, error: verificationError } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("admin_id", profile.id)
      .eq("action", "otp_verified")
      .eq("resource_type", "password_reset")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verificationError || !verificationRecord) {
      return new Response(
        JSON.stringify({ error: "No verified OTP found. Please verify your OTP first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const details = verificationRecord.details as { 
      verification_token: string; 
      expires_at: string; 
      used: boolean;
      mobile: string;
    };

    // Check if token was already used
    if (details.used) {
      return new Response(
        JSON.stringify({ error: "Password reset token already used. Please request a new OTP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(details.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Password reset session expired. Please request a new OTP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check mobile matches
    if (details.mobile !== sanitizedMobile) {
      return new Response(
        JSON.stringify({ error: "Mobile number mismatch. Please start over." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark verification token as used
    await supabase
      .from("admin_audit_logs")
      .update({
        details: { ...details, used: true, used_at: new Date().toISOString() },
      })
      .eq("id", verificationRecord.id);

    // Log the password reset
    await supabase.from("admin_audit_logs").insert({
      admin_id: profile.id,
      action: "password_reset_completed",
      resource_type: "password_reset",
      resource_id: profile.id,
      details: {
        method: "otp",
        mobile: sanitizedMobile.slice(0, -4) + "****", // Masked for privacy
      },
    });

    console.log(`Password reset completed for user ${profile.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
