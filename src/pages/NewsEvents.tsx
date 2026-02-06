import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight, Bell, AlertTriangle, Newspaper } from 'lucide-react';
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
  'सहस्रचंडी': 'bg-primary/20 text-primary'
};
export default function NewsEvents() {
  // Fetch upcoming events
  const {
    data: events,
    isLoading: eventsLoading
  } = useQuery({
    queryKey: ['upcoming-events-page'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const {
        data,
        error
      } = await supabase.from('events').select('*').gte('event_date', now).order('event_date', {
        ascending: true
      }).limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Fetch news
  const {
    data: news,
    isLoading: newsLoading
  } = useQuery({
    queryKey: ['news-items'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('news').select('*').order('created_at', {
        ascending: false
      }).limit(6);
      if (error) throw error;
      return data;
    }
  });
  const featuredEvents = events?.filter(e => e.is_featured) || [];
  const regularEvents = events?.filter(e => !e.is_featured) || [];
  const isLoading = eventsLoading || newsLoading;
  if (isLoading) {
    return <Layout>
         <div className="flex items-center justify-center py-24">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
       </Layout>;
  }
  return <Layout>
       {/* Hero Section */}
       <section className="py-12 lg:py-16 bg-gradient-to-b from-cream to-background">
         <div className="container mx-auto px-4">
           <div className="text-center max-w-3xl mx-auto">
             <motion.span initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
               <Newspaper className="w-4 h-4" />
               समाचार एवं आगामी यज्ञ
             </motion.span>
             <motion.h1 initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1
          }} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
               News & <span className="text-gradient-saffron">Upcoming Events</span>
             </motion.h1>
             <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }} className="text-lg text-muted-foreground">
               Stay updated with the latest news and upcoming yagyas
             </motion.p>
           </div>
         </div>
       </section>
 
       {/* Featured Upcoming Events Section */}
       <section className="py-12 lg:py-16">
         <div className="container mx-auto px-4">
           <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">
             विशेष आगामी यज्ञ
           </motion.h2>
 
           {featuredEvents.length === 0 && regularEvents.length === 0 ? <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center py-12 bg-muted/30 rounded-2xl">
               <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="font-heading text-lg font-semibold mb-2">No Upcoming Events</h3>
               <p className="text-muted-foreground">Check back soon for new events!</p>
             </motion.div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {(featuredEvents.length > 0 ? featuredEvents : regularEvents.slice(0, 2)).map((event, index) => <motion.div key={event.id} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon to-maroon-light text-primary-foreground group">
                   {/* Background Image */}
                   {event.image_url && <div className="absolute inset-0">
                       <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" />
                       <div className="absolute inset-0 bg-gradient-to-t from-maroon via-maroon/80 to-maroon/40" />
                     </div>}
                   
                   {/* Decorative Element */}
                   <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
                   
                   {/* Content */}
                   <div className="relative z-10 p-6 lg:p-8">
                     <div className="flex flex-wrap items-center gap-2 mb-4">
                       <Badge className={`${typeColors[event.event_type || 'Event'] || typeColors.Event} border-0`}>
                         {event.event_type || 'Event'}
                       </Badge>
                       {event.is_featured && <Badge className="bg-gold/30 text-gold border-0">Featured</Badge>}
                     </div>
                     
                     <h3 className="font-heading text-xl lg:text-2xl font-bold mb-3 line-clamp-2">
                       {event.title}
                     </h3>
                     
                     {event.description && <p className="text-primary-foreground/80 mb-5 line-clamp-2 text-sm lg:text-base">
                         {event.description}
                       </p>}
                     
                     <div className="space-y-2 mb-6">
                       <div className="flex items-center gap-2 text-sm">
                         <Calendar className="w-4 h-4 text-gold shrink-0" />
                         <span>{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</span>
                       </div>
                       <div className="flex items-center gap-2 text-sm">
                         <Clock className="w-4 h-4 text-gold shrink-0" />
                         <span>
                           {format(new Date(event.event_date), 'h:mm a')}
                           {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                         </span>
                       </div>
                       {event.location && <div className="flex items-center gap-2 text-sm">
                           <MapPin className="w-4 h-4 text-gold shrink-0" />
                           <span className="line-clamp-1">{event.location}</span>
                         </div>}
                       {event.registration_limit && <div className="flex items-center gap-2 text-sm">
                           <Users className="w-4 h-4 text-gold shrink-0" />
                           <span>{event.registration_limit} seats available</span>
                         </div>}
                     </div>
 
                     <Link to={`/yagyas/${event.id}`}>
                       <Button variant="hero" size="lg" className="group/btn">
                         View Details
                         <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                       </Button>
                     </Link>
                   </div>
                 </motion.div>)}
             </div>}
 
           {/* More Events List */}
           {regularEvents.length > (featuredEvents.length > 0 ? 0 : 2) && <div className="mt-10">
               <h3 className="font-heading text-xl font-semibold mb-6">More Upcoming Events</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {(featuredEvents.length > 0 ? regularEvents : regularEvents.slice(2)).map((event, index) => <motion.div key={event.id} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.05
            }}>
                     <Link to={`/yagyas/${event.id}`} className="block p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all group">
                       <div className="flex items-start gap-4">
                         <div className="w-14 h-14 rounded-xl bg-gradient-saffron flex flex-col items-center justify-center text-primary-foreground shrink-0">
                           <span className="text-lg font-bold leading-none">
                             {new Date(event.event_date).getDate()}
                           </span>
                           <span className="text-[10px] uppercase">
                             {format(new Date(event.event_date), 'MMM')}
                           </span>
                         </div>
                         <div className="flex-1 min-w-0">
                           <Badge className={`${typeColors[event.event_type || 'Event'] || typeColors.Event} mb-2 text-xs`}>
                             {event.event_type || 'Event'}
                           </Badge>
                           <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                             {event.title}
                           </h4>
                           <p className="text-sm text-muted-foreground mt-1">
                             {format(new Date(event.event_date), 'h:mm a')}
                             {event.location && ` • ${event.location}`}
                           </p>
                         </div>
                       </div>
                     </Link>
                   </motion.div>)}
               </div>
             </div>}
         </div>
       </section>
 
       {/* News Section */}
       <section className="py-12 lg:py-16 bg-cream">
         <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
             <div>
               <motion.span initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                 <Bell className="w-4 h-4" />
                 Latest Updates
               </motion.span>
               <motion.h2 initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.1
            }} className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                 Community News
               </motion.h2>
             </div>
           </div>
 
           {!news || news.length === 0 ? <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center py-12 bg-card rounded-2xl border border-border">
               <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="font-heading text-lg font-semibold mb-2">No News Yet</h3>
               <p className="text-muted-foreground">Check back soon for community updates!</p>
              </motion.div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {news.map((item, index) => (
                 <motion.article
                   key={item.id}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: index * 0.1 }}
                   className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
                 >
                   <div className="flex items-start justify-between gap-3 mb-3">
                     <div className="flex items-center gap-2">
                       <Newspaper className="w-5 h-5 text-primary" />
                       {item.is_urgent && (
                         <Badge variant="destructive" className="gap-1">
                           <AlertTriangle className="w-3 h-3" />
                           Urgent
                         </Badge>
                       )}
                     </div>
                     <span className="text-xs text-muted-foreground">
                       {format(new Date(item.created_at!), 'MMM d, yyyy')}
                     </span>
                   </div>
                   <h3 className="font-heading text-lg font-semibold mb-2 text-foreground">
                     {item.title}
                   </h3>
                   <p className="text-muted-foreground text-sm line-clamp-3">
                     {item.content}
                   </p>
                 </motion.article>
               ))}
             </div>}
         </div>
       </section>
 
       {/* CTA */}
       <section className="py-12 lg:py-16">
         <div className="container mx-auto px-4 text-center">
           <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="max-w-2xl mx-auto">
             <h3 className="font-heading text-2xl font-bold mb-4">
               Want to see all events?
             </h3>
             <p className="text-muted-foreground mb-6">
               Browse our complete list of yagyas including past ceremonies
             </p>
             <Link to="/yagyas">
               <Button variant="outline" size="lg">
                 View All Yagyas
                 <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
             </Link>
           </motion.div>
         </div>
       </section>
     </Layout>;
}