import { motion } from 'framer-motion';
import { Play, Calendar, Clock, Lock, Video, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveStream } from '@/hooks/useLiveStream';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
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

export default function Live() {
  const { isVerified } = useAuth();
  const { liveEvents, upcomingEvents, isLoading, isLive } = useLiveStream();

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium mb-4 ${
                isLive 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isLive && <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
              {isLive ? `${liveEvents.length} Live Now` : 'Live Streaming'}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Community <span className="text-gradient-saffron">Live Events</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Watch live pujas, ceremonies, and community events from anywhere
            </motion.p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="w-full aspect-video rounded-2xl" />
              <Skeleton className="w-full h-24 rounded-xl" />
            </div>
          )}

          {/* Not Verified Message */}
          {!isLoading && !isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-maroon shadow-temple">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-primary-foreground/50" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-primary-foreground mb-4">
                    Verified Members Only
                  </h2>
                  <p className="text-primary-foreground/70 max-w-md mb-6">
                    Live streaming is available exclusively for verified community members. Complete your verification to watch.
                  </p>
                  <Link to="/register">
                    <Button variant="hero">
                      Get Verified
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Live Events Section */}
          {!isLoading && isVerified && isLive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8 mb-16"
            >
              {liveEvents.map((event, index) => {
                const embedUrl = getYouTubeEmbedUrl(event.youtube_live_url);
                
                return (
                  <div
                    key={event.id}
                    className="max-w-4xl mx-auto"
                  >
                    {/* Video Player */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-maroon shadow-temple">
                      {embedUrl ? (
                        <>
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            LIVE
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                          <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                            <Video className="w-10 h-10 text-primary-foreground/50" />
                          </div>
                          <h2 className="font-heading text-xl font-bold text-primary-foreground mb-2">
                            {event.title}
                          </h2>
                          <p className="text-primary-foreground/70">
                            Video stream unavailable
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="mt-4 p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-heading text-lg font-semibold">{event.title}</h3>
                            <Badge variant="destructive" className="animate-pulse">
                              LIVE
                            </Badge>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(event.event_date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {event.location && (
                              <span>{event.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {event.youtube_live_url && (
                            <a
                              href={event.youtube_live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                YouTube
                              </Button>
                            </a>
                          )}
                          <Link to={`/events/${event.id}`}>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* No Live Events */}
          {!isLoading && isVerified && !isLive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-maroon shadow-temple">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                    <Video className="w-10 h-10 text-primary-foreground/50" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-primary-foreground mb-4">
                    No Live Streams
                  </h2>
                  <p className="text-primary-foreground/70 max-w-md">
                    There are no live events right now. Check the upcoming events below.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="font-heading text-2xl font-bold text-center mb-8">
                Upcoming Events
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {upcomingEvents.slice(0, 6).map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                      {index === 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold font-medium">
                          Next
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-semibold mb-2">{event.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description || 'Join us for this upcoming event.'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.event_date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      <Clock className="w-3 h-3 ml-2" />
                      {new Date(event.event_date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {upcomingEvents.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">No upcoming events scheduled. Check back soon!</p>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}