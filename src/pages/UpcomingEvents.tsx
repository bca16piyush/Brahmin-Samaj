import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight, Video, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const typeColors: Record<string, string> = {
  Festival: 'bg-gold/20 text-gold',
  Puja: 'bg-primary/20 text-primary',
  Workshop: 'bg-accent/20 text-accent-foreground',
  Meeting: 'bg-secondary text-secondary-foreground',
  Celebration: 'bg-green-500/20 text-green-600',
  Event: 'bg-muted text-muted-foreground',
  'महायज्ञ (Mahayagya)': 'bg-gold/20 text-gold',
  'लक्षचंडी': 'bg-primary/20 text-primary',
  'अयुतचंडी': 'bg-primary/20 text-primary',
  'सहस्रचंडी': 'bg-primary/20 text-primary',
};

export default function UpcomingEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const featuredEvents = events?.filter((e) => e.is_featured) || [];
  const regularEvents = events?.filter((e) => !e.is_featured) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Calendar className="w-4 h-4" />
              आगामी यज्ञ
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Upcoming <span className="text-gradient-saffron">Events</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Join us for upcoming yagyas and spiritual events
            </motion.p>
          </div>

          {/* Empty State */}
          {(!events || events.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                There are no upcoming events scheduled at the moment. Check back soon!
              </p>
              <Link to="/yagyas">
                <Button variant="outline">
                  View All Yagyas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <div className="mb-16">
              <h2 className="font-heading text-2xl font-bold mb-6">विशेष आगामी यज्ञ</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon to-maroon-light text-primary-foreground"
                  >
                    {event.image_url && (
                      <div className="absolute inset-0">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-maroon via-maroon/80 to-transparent" />
                      </div>
                    )}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
                    <div className="relative z-10 p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={`${typeColors[event.event_type || 'Event'] || typeColors.Event}`}>
                          {event.event_type || 'Event'}
                        </Badge>
                        {event.is_featured && (
                          <Badge className="bg-gold/20 text-gold">Featured</Badge>
                        )}
                      </div>
                      <h3 className="font-heading text-2xl font-bold mb-4">{event.title}</h3>
                      {event.description && (
                        <p className="text-primary-foreground/80 mb-6 line-clamp-2">{event.description}</p>
                      )}
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gold" />
                          {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gold" />
                          {format(new Date(event.event_date), 'h:mm a')}
                          {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gold" />
                            {event.location}
                          </div>
                        )}
                        {event.registration_limit && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-gold" />
                            {event.registration_limit} seats available
                          </div>
                        )}
                      </div>

                      <Link to={`/yagyas/${event.id}`}>
                        <Button variant="hero">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Events */}
          {regularEvents.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">आगामी यज्ञ</h2>
              <div className="space-y-4">
                {regularEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <Link to={`/yagyas/${event.id}`} className="flex flex-col md:flex-row md:items-center">
                      {event.image_url && (
                        <div className="w-full md:w-48 h-32 md:h-full shrink-0">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="p-6 flex flex-col md:flex-row md:items-center gap-4 flex-1">
                        {/* Date Box */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-saffron flex flex-col items-center justify-center text-primary-foreground shrink-0">
                          <span className="text-2xl font-bold">
                            {new Date(event.event_date).getDate()}
                          </span>
                          <span className="text-xs uppercase">
                            {format(new Date(event.event_date), 'MMM')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${typeColors[event.event_type || 'Event'] || typeColors.Event}`}>
                                  {event.event_type || 'Event'}
                                </Badge>
                                {event.youtube_live_url && (
                                  <Badge variant="secondary" className="bg-red-500/20 text-red-600">
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-heading text-lg font-semibold">{event.title}</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="hidden md:flex">
                              View Details
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(event.event_date), 'h:mm a')}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location}
                              </span>
                            )}
                            {event.registration_limit && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {event.registration_limit} seats
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Link to all events */}
          {events && events.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-12"
            >
              <Link to="/yagyas">
                <Button variant="outline" size="lg">
                  View All Yagyas (Including Past)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
