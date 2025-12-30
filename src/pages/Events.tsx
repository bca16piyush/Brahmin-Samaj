import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const events = [
  {
    id: 1,
    title: 'Maha Shivaratri Celebrations',
    date: '2025-02-26',
    time: '18:00 - 06:00',
    location: 'Community Temple, Varanasi',
    description: 'Grand night-long celebrations with special abhishek, bhajans, and community prasad.',
    type: 'Festival',
    capacity: 500,
    registered: 342,
    featured: true,
  },
  {
    id: 2,
    title: 'Weekly Satyanarayan Puja',
    date: '2025-01-05',
    time: '10:00 - 12:00',
    location: 'Samaj Bhawan, Lucknow',
    description: 'Join us for the weekly community puja. All families welcome.',
    type: 'Puja',
    capacity: 100,
    registered: 78,
    featured: false,
  },
  {
    id: 3,
    title: 'Makar Sankranti Utsav',
    date: '2025-01-14',
    time: '06:00 - 11:00',
    location: 'Ganga Ghat, Allahabad',
    description: 'Early morning holy dip, surya puja, and distribution of til-gur.',
    type: 'Festival',
    capacity: 300,
    registered: 245,
    featured: true,
  },
  {
    id: 4,
    title: 'Vedic Workshop for Youth',
    date: '2025-01-20',
    time: '14:00 - 17:00',
    location: 'Online (Zoom)',
    description: 'Interactive session on Vedic knowledge for young community members aged 15-25.',
    type: 'Workshop',
    capacity: 50,
    registered: 38,
    featured: false,
  },
  {
    id: 5,
    title: 'Annual General Meeting',
    date: '2025-02-15',
    time: '11:00 - 14:00',
    location: 'Community Hall, Delhi',
    description: 'Annual review meeting for all verified members. Election of new office bearers.',
    type: 'Meeting',
    capacity: 200,
    registered: 156,
    featured: false,
  },
];

const typeColors: Record<string, string> = {
  Festival: 'bg-gold/20 text-gold',
  Puja: 'bg-primary/20 text-primary',
  Workshop: 'bg-accent/20 text-accent-foreground',
  Meeting: 'bg-secondary text-secondary-foreground',
};

export default function Events() {
  const featuredEvents = events.filter((e) => e.featured);
  const upcomingEvents = events.filter((e) => !e.featured);

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
              Community Calendar
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
              Join us in celebrating our traditions and strengthening community bonds
            </motion.p>
          </div>

          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <div className="mb-16">
              <h2 className="font-heading text-2xl font-bold mb-6">Featured Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon to-maroon-light p-8 text-primary-foreground"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                      <Badge className={`${typeColors[event.type]} mb-4`}>
                        {event.type}
                      </Badge>
                      <h3 className="font-heading text-2xl font-bold mb-4">{event.title}</h3>
                      <p className="text-primary-foreground/80 mb-6">{event.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gold" />
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gold" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gold" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gold" />
                          {event.registered} / {event.capacity} registered
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="hero">
                          Register Now
                        </Button>
                        <Link to="/live">
                          <Button variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                            Watch Live
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Events */}
          <div>
            <h2 className="font-heading text-2xl font-bold mb-6">All Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Date Box */}
                    <div className="w-20 h-20 rounded-xl bg-gradient-saffron flex flex-col items-center justify-center text-primary-foreground shrink-0">
                      <span className="text-2xl font-bold">
                        {new Date(event.date).getDate()}
                      </span>
                      <span className="text-xs uppercase">
                        {new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge className={`${typeColors[event.type]} mb-2`}>
                            {event.type}
                          </Badge>
                          <h3 className="font-heading text-lg font-semibold">{event.title}</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="hidden md:flex">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.registered} / {event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}