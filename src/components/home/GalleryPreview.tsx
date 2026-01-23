import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Lock, Camera, Images } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function GalleryPreview() {
  const { user } = useAuth();

  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['gallery-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              यादें
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground"
            >
              यज्ञ <span className="text-gradient-saffron">गैलरी</span>
            </motion.h2>
          </div>
          {user && (
            <Link to="/gallery">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1"
              >
                पूरी गैलरी देखें <ArrowRight className="w-4 h-4" />
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
            {/* Decorative background pattern */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] rounded-xl bg-gradient-to-br from-muted/50 to-muted overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay with login prompt */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 md:p-12 text-center shadow-temple max-w-md mx-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-saffron/20 flex items-center justify-center mx-auto mb-6">
                  <Images className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-3">
                  यज्ञ गैलरी देखें
                </h3>
                <p className="text-muted-foreground mb-6">
                  हमारे समुदाय के यज्ञों, उत्सवों और आध्यात्मिक आयोजनों की तस्वीरें देखने के लिए लॉगिन करें
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !galleryImages || galleryImages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            अभी गैलरी में कोई तस्वीर नहीं है।
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
              >
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs text-gold mb-1">{image.event_name || image.category}</p>
                  <p className="text-sm font-medium text-primary-foreground">{image.title}</p>
                </div>
                <button className="absolute top-3 right-3 bg-background/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                  <Download className="w-4 h-4 text-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
