import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeSearchResponse {
  items?: {
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      liveBroadcastContent: string;
    };
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!youtubeApiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { channelId } = await req.json();

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: 'Channel ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking live status for channel: ${channelId}`);

    // Search for live streams on the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${youtubeApiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData: YouTubeSearchResponse = await searchResponse.json();

    console.log('YouTube API response:', JSON.stringify(searchData));

    const isLive = searchData.items && searchData.items.length > 0;
    let liveVideoId: string | null = null;
    let liveVideoTitle: string | null = null;

    if (isLive && searchData.items) {
      liveVideoId = searchData.items[0].id.videoId;
      liveVideoTitle = searchData.items[0].snippet.title;
      console.log(`Live stream found: ${liveVideoTitle} (${liveVideoId})`);

      // Update any event that's currently live with the video URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          is_live: true, 
          youtube_live_url: `https://www.youtube.com/embed/${liveVideoId}` 
        })
        .eq('is_live', false)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(1);

      if (updateError) {
        console.error('Error updating event:', updateError);
      }
    } else {
      // Mark all events as not live if no stream is active
      const { error: updateError } = await supabase
        .from('events')
        .update({ is_live: false })
        .eq('is_live', true);

      if (updateError) {
        console.error('Error updating events:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        isLive, 
        videoId: liveVideoId, 
        title: liveVideoTitle 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error checking YouTube live status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
