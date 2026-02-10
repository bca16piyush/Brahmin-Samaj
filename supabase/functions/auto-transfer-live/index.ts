import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find events that were live but have ended (end_date passed or event_date + 6 hours passed)
    const now = new Date().toISOString();
    
    const { data: liveEvents, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("is_live", true);

    if (fetchError) throw fetchError;

    const transferred: string[] = [];

    for (const event of liveEvents || []) {
      const endTime = event.end_date || new Date(new Date(event.event_date).getTime() + 6 * 60 * 60 * 1000).toISOString();
      
      if (new Date(endTime) < new Date(now)) {
        // Event has ended - transfer to past_event_videos if it has a YouTube URL
        if (event.youtube_live_url) {
          // Check if already exists in past_event_videos
          const { data: existing } = await supabase
            .from("past_event_videos")
            .select("id")
            .eq("event_id", event.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("past_event_videos").insert({
              title: event.title,
              description: event.description,
              video_url: event.youtube_live_url,
              event_id: event.id,
              event_name: event.title,
              event_date: event.event_date.split("T")[0],
              is_published: true,
            });
          }
        }

        // Turn off live status
        await supabase
          .from("events")
          .update({ is_live: false })
          .eq("id", event.id);

        transferred.push(event.title);
      }
    }

    // Also check quick_live_stream in site_config
    const { data: config } = await supabase
      .from("site_config")
      .select("*")
      .eq("config_key", "quick_live_stream")
      .maybeSingle();

    if (config?.config_value?.enabled && config?.config_value?.youtube_url) {
      // We don't auto-disable quick live - admin controls that manually
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transferred,
        message: `${transferred.length} event(s) transferred to past events` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
