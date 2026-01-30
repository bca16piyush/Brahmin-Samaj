import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Star, Phone, MessageCircle, Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export function PanditjiPreview() {
  const {
    user,
    isVerified
  } = useAuth();

  // Fetch active pandits from database - only if logged in
  // Uses pandits_public view for secure access - masks phone/whatsapp unless user has confirmed booking
  const {
    data: pandits,
    isLoading
  } = useQuery({
    queryKey: ['active-pandits-preview'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('pandits_public').select('*').eq('is_active', true).limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user // Only fetch if user is logged in
  });
  const isLoggedIn = !!user;
  return <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              पुरोहित खोजें
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
          }} className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              हमारे आदरणीय <span className="text-gradient-saffron font-sans">पंडितजी</span>
            </motion.h2>
          </div>
          {isLoggedIn && <Link to="/panditji">
              <motion.span initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }} className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1">
                सभी पंडितजी देखें <ArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>}
        </div>

        {/* Locked State for non-authenticated users */}
        {!isLoggedIn ? <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="relative">
            {/* Decorative placeholder cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((_, index) => <div key={index} className="p-6 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-muted-foreground/40" />
                        <div className="h-4 bg-muted rounded w-8" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-muted rounded-full w-16" />
                    <div className="h-6 bg-muted rounded-full w-20" />
                    <div className="h-6 bg-muted rounded-full w-14" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 bg-muted rounded flex-1" />
                    <div className="h-9 bg-muted rounded flex-1" />
                  </div>
                </div>)}
            </div>

            {/* Overlay with login prompt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 text-center shadow-temple max-w-md mx-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-saffron/20 to-gold/20 flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-3">
                  पंडितजी की जानकारी देखें
                </h3>
                <p className="text-muted-foreground mb-6">
                  विशेषज्ञ पुरोहितों की सूची, उनकी विशेषताएं और संपर्क जानकारी के लिए लॉगिन करें
                </p>
                <Link to="/login">
                  <Button variant="hero" size="lg" className="gap-2">
                    <Lock className="w-4 h-4" />
                    लॉगिन करें
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div> : isLoading ? <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div> : !pandits || pandits.length === 0 ? <div className="text-center py-12 text-muted-foreground">
            अभी कोई पंडितजी उपलब्ध नहीं हैं।
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pandits.map((pandit, index) => <motion.div key={pandit.id} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.1
        }} className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <img src={pandit.photo_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop'} alt={pandit.name} className="w-20 h-20 rounded-xl object-cover border-2 border-gold/30" />
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                      {pandit.name}
                    </h3>
                    {pandit.location && <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {pandit.location}
                      </div>}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {pandit.expertise?.slice(0, 3).map(skill => <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>)}
                </div>

                {/* Contact Section - Locked for non-verified */}
                {isVerified ? <div className="flex gap-2">
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <a href={`tel:${pandit.phone}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </a>
                    </Button>
                    <Button variant="golden" size="sm" className="flex-1" asChild>
                      <a href={`https://wa.me/${pandit.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </a>
                    </Button>
                  </div> : <div className="relative">
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
                          Verify to Contact
                        </Button>
                      </Link>
                    </div>
                  </div>}
              </motion.div>)}
          </div>}
      </div>
    </section>;
}