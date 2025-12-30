import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Calendar, Clock, Bell, ExternalLink, Lock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const upcomingEvents = [
  {
    id: 1,
    title: 'Maha Shivaratri Special Puja',
    date: '2025-02-26',
    time: '18:00',
    description: 'Live broadcast of the grand Maha Shivaratri celebrations.',
  },
  {
    id: 2,
    title: 'Weekly Satyanarayan Katha',
    date: '2025-01-05',
    time: '10:00',
    description: 'Join us for the weekly Satyanarayan Puja and Katha.',
  },
  {
    id: 3,
    title: 'Makar Sankranti Celebrations',
    date: '2025-01-14',
    time: '06:00',
    description: 'Early morning puja and community celebrations.',
  },
];

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 justify-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-saffron flex items-center justify-center mb-2">
            <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
              {value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs md:text-sm text-muted-foreground capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export default function Live() {
  const { isVerified } = useAuth();
  const [isLive, setIsLive] = useState(false); // Simulated - would be from API

  const nextEvent = upcomingEvents[0];

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Live Streaming
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

          {/* Main Player Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-maroon shadow-temple">
              {isLive && isVerified ? (
                // YouTube Embed Placeholder
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  {!isVerified ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                        <Play className="w-10 h-10 text-primary-foreground/50" />
                      </div>
                      <h2 className="font-heading text-2xl font-bold text-primary-foreground mb-4">
                        No Live Stream
                      </h2>
                      <p className="text-primary-foreground/70 max-w-md mb-6">
                        There's no live event right now. Check the upcoming events below.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Next Event Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <div className="p-8 rounded-2xl bg-card border border-border shadow-temple text-center">
              <h3 className="font-heading text-xl font-semibold mb-2">Next Event</h3>
              <p className="text-2xl font-heading font-bold text-gradient-saffron mb-6">
                {nextEvent.title}
              </p>
              
              <CountdownTimer targetDate={`${nextEvent.date}T${nextEvent.time}`} />
              
              <div className="flex items-center justify-center gap-4 mt-6 text-muted-foreground">
                <span className="flex items-center gap-1 text-sm">
                  <Calendar className="w-4 h-4" />
                  {new Date(nextEvent.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  {nextEvent.time} IST
                </span>
              </div>

              <Button variant="golden" className="mt-6">
                <Bell className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-heading text-2xl font-bold text-center mb-8">
              Upcoming Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
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
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    <Clock className="w-3 h-3 ml-2" />
                    {event.time} IST
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}