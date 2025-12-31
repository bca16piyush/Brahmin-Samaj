import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const galleryImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=400&h=300&fit=crop',
    title: 'Diwali Celebration 2024',
    event: 'Diwali',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1545696563-af4afe23829a?w=400&h=300&fit=crop',
    title: 'Navratri Garba Night',
    event: 'Navratri',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=300&fit=crop',
    title: 'Annual Havan Ceremony',
    event: 'Havan',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=400&h=300&fit=crop',
    title: 'Community Wedding',
    event: 'Wedding',
  },
];

export function GalleryPreview() {
  const { user } = useAuth();

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
              Memories
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground"
            >
              Event <span className="text-gradient-saffron">Gallery</span>
            </motion.h2>
          </div>
          <Link to="/gallery">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-primary hover:text-primary/80 font-medium mt-4 md:mt-0 inline-flex items-center gap-1"
            >
              View Full Gallery <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </div>

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
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs text-gold mb-1">{image.event}</p>
                <p className="text-sm font-medium text-primary-foreground">{image.title}</p>
              </div>
              {/* Lock overlay for non-authenticated users */}
              {!user && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Sign up to view</p>
                  </div>
                </div>
              )}
              {user && (
                <button className="absolute top-3 right-3 bg-background/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                  <Download className="w-4 h-4 text-foreground" />
                </button>
              )}
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
              <Link to="/login" className="text-primary hover:underline">Sign up</Link> to view and download event photos
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}