import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radio, Lock, Play, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function LiveEventsSection() {
  const { user } = useAuth();

  const { data: liveEvents, isLoading } = useQuery({
    queryKey: ['live-events-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', true)
        .order('event_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !liveEvents || liveEvents.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Live Now
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground"
            >
              Live <span className="text-gradient-saffron">Events</span>
            </motion.h2>
          </div>
          <Link to="/live">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1"
            >
              View All Live Events →
            </motion.span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {liveEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300"
            >
              {/* Event Image */}
              <div className="relative aspect-video bg-muted">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-saffron/20">
                    <Play className="w-12 h-12 text-primary/50" />
                  </div>
                )}
                
                {/* Live Badge */}
                <div className="absolute top-3 left-3">
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <Radio className="w-3 h-3" />
                    LIVE
                  </Badge>
                </div>

                {/* Lock overlay for non-authenticated users */}
                {!user && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[3px]">
                    <div className="text-center p-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Sign up to watch</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.event_date), 'PPp')}
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <p className="text-muted-foreground text-sm">
              <Lock className="w-4 h-4 inline mr-1" />
              <Link to="/login" className="text-primary hover:underline">Sign up</Link> to watch live events and recordings
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
