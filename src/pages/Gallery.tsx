import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, Search, X, ZoomIn } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const allImages = [
  { id: 1, src: 'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=800', title: 'Diwali Celebration 2024', event: 'Diwali', date: '2024-11-01' },
  { id: 2, src: 'https://images.unsplash.com/photo-1545696563-af4afe23829a?w=800', title: 'Navratri Garba Night', event: 'Navratri', date: '2024-10-15' },
  { id: 3, src: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800', title: 'Annual Havan Ceremony', event: 'Havan', date: '2024-09-20' },
  { id: 4, src: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=800', title: 'Community Wedding', event: 'Wedding', date: '2024-08-10' },
  { id: 5, src: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800', title: 'Janmashtami Celebrations', event: 'Janmashtami', date: '2024-08-26' },
  { id: 6, src: 'https://images.unsplash.com/photo-1545696563-af4afe23829a?w=800', title: 'Durga Puja Aarti', event: 'Navratri', date: '2024-10-12' },
  { id: 7, src: 'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=800', title: 'New Year Puja 2025', event: 'Other', date: '2025-01-01' },
  { id: 8, src: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800', title: 'Satyanarayan Puja', event: 'Havan', date: '2024-12-15' },
];

const eventTypes = ['All', 'Diwali', 'Navratri', 'Havan', 'Wedding', 'Janmashtami', 'Other'];

export default function Gallery() {
  const { isVerified } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [selectedImage, setSelectedImage] = useState<typeof allImages[0] | null>(null);

  const filteredImages = allImages.filter((img) => {
    const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === 'All' || img.event === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              Memories
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Event <span className="text-gradient-saffron">Gallery</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Relive our cherished moments from community celebrations
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-8 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((event) => (
                  <SelectItem key={event} value={event}>{event}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {!isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-center mb-8 max-w-xl mx-auto"
            >
              <Lock className="w-5 h-5 inline mr-2 text-gold" />
              <span className="text-sm text-foreground">
                High-resolution downloads available for verified members only
              </span>
            </motion.div>
          )}

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(image)}
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
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-background/90 rounded-full p-2">
                    <ZoomIn className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No photos found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => {
                setSearchQuery('');
                setSelectedEvent('All');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-maroon to-transparent">
                <p className="text-xs text-gold mb-1">{selectedImage.event}</p>
                <h3 className="text-xl font-heading font-semibold text-primary-foreground mb-2">
                  {selectedImage.title}
                </h3>
                <p className="text-sm text-primary-foreground/70">
                  {new Date(selectedImage.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {isVerified && (
                  <Button variant="hero" size="sm" className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Download HD
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}