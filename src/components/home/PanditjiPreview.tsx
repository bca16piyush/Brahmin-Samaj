import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Star, Phone, MessageCircle, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const pandits = [
  {
    id: 1,
    name: 'Pt. Ramesh Shastri',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    expertise: ['Vedic Rituals', 'Astrology'],
    location: 'Varanasi, UP',
    rating: 4.9,
    phone: '+91 98765 43210',
  },
  {
    id: 2,
    name: 'Pt. Suresh Dwivedi',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    expertise: ['Grih Pravesh', 'Marriage'],
    location: 'Allahabad, UP',
    rating: 4.8,
    phone: '+91 98765 43211',
  },
  {
    id: 3,
    name: 'Pt. Anil Tripathi',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    expertise: ['Satyanarayan', 'Havan'],
    location: 'Lucknow, UP',
    rating: 4.7,
    phone: '+91 98765 43212',
  },
];

export function PanditjiPreview() {
  const { isVerified } = useAuth();

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              Find a Priest
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground"
            >
              Our Respected <span className="text-gradient-saffron">Panditji</span>
            </motion.h2>
          </div>
          <Link to="/panditji">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1"
            >
              View All Pandits <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pandits.map((pandit, index) => (
            <motion.div
              key={pandit.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={pandit.photo}
                  alt={pandit.name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gold/30"
                />
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                    {pandit.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {pandit.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <span className="text-sm font-medium">{pandit.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {pandit.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Contact Section - Locked for non-verified */}
              {isVerified ? (
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" className="flex-1">
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="golden" size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="blur-lock pointer-events-none">
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                    <Link to="/register">
                      <Button variant="locked" size="sm" className="gap-2">
                        <Lock className="w-4 h-4" />
                        Register to Contact
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}