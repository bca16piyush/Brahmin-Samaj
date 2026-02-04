import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Lock, Search, ZoomIn, Calendar, Loader2, Play, Video } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  video_url: string | null;
  media_type: string | null;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  category: string | null;
  is_public: boolean;
  created_at: string;
}

export default function Gallery() {
  const { user, isVerified } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Fetch gallery images from database - only if logged in
  const { data: images, isLoading } = useQuery({
    queryKey: ['public-gallery-images', isVerified],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!user,
  });

  // Get unique event names for filter
  const eventTypes = useMemo(() => {
    if (!images) return ['All'];
    const events = new Set(images.map(img => img.event_name || 'Other').filter(Boolean));
    return ['All', ...Array.from(events)];
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!images) return [];
    return images.filter((img) => {
      const matchesSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            img.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEvent = selectedEvent === 'All' || img.event_name === selectedEvent || 
                           (!img.event_name && selectedEvent === 'Other');
      return matchesSearch && matchesEvent;
    });
  }, [images, searchQuery, selectedEvent]);

  // Generate optimized thumbnail URL (add width parameter for Supabase storage)
  const getThumbnailUrl = (url: string) => {
    // For Supabase storage, we can use the transform API
    if (url.includes('supabase')) {
      return `${url}?width=400&height=300&resize=cover`;
    }
    return url;
  };

  // Get video embed URL
  const getVideoEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    return url;
  };

  // Get video thumbnail
  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  // Locked state for non-logged-in users
  if (!user) {
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
                यादें
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              >
                यज्ञ <span className="text-gradient-saffron">गैलरी</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground"
              >
                हमारे समुदाय के यज्ञों और उत्सवों की यादें
              </motion.p>
            </div>

            {/* Locked Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              {/* Decorative background grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] rounded-xl bg-gradient-to-br from-muted/50 to-muted overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay with login prompt */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/30 via-background/60 to-background/30">
                <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-8 md:p-12 text-center shadow-temple max-w-md mx-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-saffron/20 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-primary" />
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
                  <p className="text-xs text-muted-foreground mt-4">
                    खाता नहीं है?{' '}
                    <Link to="/register" className="text-primary hover:underline">
                      पंजीकरण करें
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Gallery Grid */}
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {filteredImages.map((image, index) => {
                const isVideo = image.media_type === 'video' && image.video_url;
                const thumbnailUrl = isVideo 
                  ? getVideoThumbnail(image.video_url!) || image.image_url 
                  : getThumbnailUrl(image.image_url);
                
                return (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        {isVideo && <Video className="w-3 h-3 text-gold" />}
                        <p className="text-xs text-gold">{image.event_name || image.category || 'Gallery'}</p>
                      </div>
                      <p className="text-sm font-medium text-primary-foreground">{image.title}</p>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/90 rounded-full p-2">
                        {isVideo ? <Play className="w-4 h-4 text-foreground" /> : <ZoomIn className="w-4 h-4 text-foreground" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!isLoading && filteredImages.length === 0 && (
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
              {selectedImage.media_type === 'video' && selectedImage.video_url ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={getVideoEmbedUrl(selectedImage.video_url)}
                    title={selectedImage.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[80vh] object-contain bg-black"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-maroon to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3 text-gold" />
                  <p className="text-xs text-gold">{selectedImage.event_name || selectedImage.category || 'Gallery'}</p>
                </div>
                <h3 className="text-xl font-heading font-semibold text-primary-foreground mb-2">
                  {selectedImage.title}
                </h3>
                {selectedImage.description && (
                  <p className="text-sm text-primary-foreground/80 mb-2">
                    {selectedImage.description}
                  </p>
                )}
                {selectedImage.event_date && (
                  <p className="text-sm text-primary-foreground/70">
                    {format(new Date(selectedImage.event_date), 'MMMM d, yyyy')}
                  </p>
                )}
                {isVerified && selectedImage.media_type !== 'video' && (
                  <Button 
                    variant="hero" 
                    size="sm" 
                    className="mt-4"
                    asChild
                  >
                    <a href={selectedImage.image_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download HD
                    </a>
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
