import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Video, Share2, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const typeColors: Record<string, string> = {
  Festival: 'bg-gold/20 text-gold',
  Puja: 'bg-primary/20 text-primary',
  Workshop: 'bg-accent/20 text-accent-foreground',
  Meeting: 'bg-secondary text-secondary-foreground',
  Celebration: 'bg-green-500/20 text-green-600',
  Event: 'bg-muted text-muted-foreground',
};

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
    /youtube\.com\/live\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
    }
  }
  
  return null;
}

export default function EventDetail() {
  const { id } = useParams();
  const { isVerified } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title,
          text: event?.description || '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied',
          description: 'Event link has been copied to clipboard.',
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/events">
            <Button variant="hero">Back to Events</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(event.youtube_live_url);
  const isPastEvent = new Date(event.event_date) < new Date();

  return (
    <Layout>
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image */}
              {event.image_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden aspect-video"
                >
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}

              {/* Event Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge className={typeColors[event.event_type || 'Event']}>
                    {event.event_type || 'Event'}
                  </Badge>
                  {event.is_live && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Video className="w-3 h-3 mr-1" />
                      LIVE NOW
                    </Badge>
                  )}
                  {event.is_featured && (
                    <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                      Featured
                    </Badge>
                  )}
                  {isPastEvent && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                </div>

                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {event.title}
                </h1>

                {event.description && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                )}
              </motion.div>

              {/* YouTube Live Embed */}
              {youtubeEmbedUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={youtubeEmbedUrl}
                          title={`${event.title} - Live Stream`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </CardContent>
                  </Card>
                  {event.youtube_live_url && (
                    <a
                      href={event.youtube_live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in YouTube
                    </a>
                  )}
                </motion.div>
              )}

              {/* Map */}
              {event.map_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-heading text-xl font-semibold mb-4">Location</h3>
                  <Card>
                    <CardContent className="p-0">
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={event.map_url}
                          title="Event Location"
                          className="w-full h-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="sticky top-24">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'h:mm a')}
                            {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                          </p>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{event.location}</p>
                            {event.map_url && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Get Directions
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {event.registration_limit && (
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Limited Seats</p>
                            <p className="text-sm text-muted-foreground">
                              Maximum {event.registration_limit} attendees
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {!isPastEvent && (
                        <Button variant="hero" className="w-full" size="lg">
                          Register Now
                        </Button>
                      )}
                      
                      {youtubeEmbedUrl && event.is_live && (
                        <Link to="/live" className="block">
                          <Button variant="outline" className="w-full" size="lg">
                            <Video className="w-4 h-4 mr-2" />
                            Watch Full Screen
                          </Button>
                        </Link>
                      )}

                      <Button variant="outline" className="w-full" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}