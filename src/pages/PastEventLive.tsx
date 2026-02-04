import { motion } from 'framer-motion';
import { Video, Calendar, Play, ExternalLink, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PastEventVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  event_name: string | null;
  event_date: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

export default function PastEventLive() {
  const [selectedVideo, setSelectedVideo] = useState<PastEventVideo | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['public-past-event-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('past_event_videos')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as PastEventVideo[];
    },
  });

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    return url;
  };

  const getThumbnailFromUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    return null;
  };

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
              <Video className="w-4 h-4" />
              संपन्न यज्ञ
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Past Event <span className="text-gradient-saffron">Live</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Watch recordings of our past yagyas and spiritual events
            </motion.p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!videos || videos.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">No Videos Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Videos from our past events will appear here. Check back soon!
              </p>
            </motion.div>
          )}

          {/* Video Grid */}
          {!isLoading && videos && videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  {/* Thumbnail */}
                  <div 
                    className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <img
                      src={video.thumbnail_url || getThumbnailFromUrl(video.video_url) || '/placeholder.svg'}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {video.event_name && (
                      <Badge variant="secondary" className="mb-2">
                        {video.event_name}
                      </Badge>
                    )}
                    <h3 className="font-heading text-lg font-semibold mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    {video.event_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(video.event_date), 'MMMM d, yyyy')}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Watch Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          {selectedVideo && (
            <div className="relative">
              <div className="aspect-video">
                <iframe
                  src={getVideoEmbedUrl(selectedVideo.video_url)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6 bg-gradient-to-t from-maroon to-maroon/90 text-primary-foreground">
                {selectedVideo.event_name && (
                  <Badge className="bg-gold/20 text-gold mb-2">{selectedVideo.event_name}</Badge>
                )}
                <h3 className="font-heading text-xl font-semibold mb-2">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-primary-foreground/80 text-sm">{selectedVideo.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
