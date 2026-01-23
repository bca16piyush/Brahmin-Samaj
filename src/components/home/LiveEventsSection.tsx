import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radio, Lock, Play, Calendar, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    enabled: !!user, // Only fetch if user is logged in
  });

  // Check if there are any live events (for non-logged in users, we show the section anyway)
  const hasLiveEvents = user ? (liveEvents && liveEvents.length > 0) : true;

  if (!hasLiveEvents && user) {
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
              लाइव <span className="text-gradient-saffron">यज्ञ</span>
            </motion.h2>
          </div>
          {user && (
            <Link to="/live">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1"
              >
                सभी लाइव यज्ञ देखें →
              </motion.span>
            </Link>
          )}
        </div>

        {/* Locked State for non-authenticated users */}
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Decorative placeholder cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden bg-muted/30 border border-border"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <Play className="w-12 h-12 text-muted-foreground/30" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="gap-1 opacity-50">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay with login prompt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 text-center shadow-temple max-w-md mx-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-destructive/20 to-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Flame className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-3">
                  लाइव यज्ञ देखें
                </h3>
                <p className="text-muted-foreground mb-6">
                  महायज्ञों की लाइव स्ट्रीमिंग और रिकॉर्डिंग देखने के लिए लॉगिन करें
                </p>
                <Link to="/login">
                  <Button variant="hero" size="lg" className="gap-2">
                    <Lock className="w-4 h-4" />
                    लॉगिन करें
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {liveEvents?.map((event, index) => (
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
        )}
      </div>
    </section>
  );
}
