import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Plus, Trash2, Loader2, Search, Edit, Eye, EyeOff, ExternalLink, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PastEventVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  event_id: '',
  event_name: '',
  event_date: '',
  is_published: true,
  display_order: 0,
};

export function PastEventVideoManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PastEventVideo | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Fetch all past event videos
  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-past-event-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('past_event_videos')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as PastEventVideo[];
    },
  });

  // Fetch events for linking
  const { data: events } = useQuery({
    queryKey: ['admin-events-for-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const selectedEvent = events?.find(e => e.id === data.event_id);
      const payload = {
        title: data.title,
        description: data.description || null,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url || null,
        event_id: data.event_id === 'none' ? null : data.event_id || null,
        event_name: selectedEvent?.title || data.event_name || null,
        event_date: selectedEvent?.event_date ? format(new Date(selectedEvent.event_date), 'yyyy-MM-dd') : data.event_date || null,
        is_published: data.is_published,
        display_order: data.display_order,
      };

      if (data.id) {
        const { error } = await supabase
          .from('past_event_videos')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('past_event_videos')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-past-event-videos'] });
      setShowDialog(false);
      setEditingVideo(null);
      setForm(emptyForm);
      toast({
        title: editingVideo ? 'Video Updated' : 'Video Added',
        description: 'The video has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('past_event_videos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-past-event-videos'] });
      toast({
        title: 'Video Deleted',
        description: 'The video has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle publish
  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('past_event_videos')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-past-event-videos'] });
    },
  });

  const handleEdit = (video: PastEventVideo) => {
    setEditingVideo(video);
    setForm({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      event_id: video.event_id || '',
      event_name: video.event_name || '',
      event_date: video.event_date || '',
      is_published: video.is_published,
      display_order: video.display_order,
    });
    setShowDialog(true);
  };

  const handleAddNew = () => {
    setEditingVideo(null);
    setForm({ ...emptyForm, display_order: (videos?.length || 0) + 1 });
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingVideo ? { ...form, id: editingVideo.id } : form);
  };

  const filteredVideos = videos?.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">Past Event Videos</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Diwali Mahayagya 2024 Highlights"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Video URL * (YouTube/Vimeo)</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the video"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Link to Event (Optional)</Label>
                <Select 
                  value={form.event_id} 
                  onValueChange={(value) => setForm({ ...form, event_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific event</SelectItem>
                    {events?.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {format(new Date(event.event_date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail URL (Optional)</Label>
                <Input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="Auto-generated for YouTube if left blank"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for YouTube videos to auto-fetch thumbnail
                </p>
              </div>

              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Publish immediately</Label>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingVideo ? 'Update Video' : 'Add Video'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos?.filter(v => v.is_published).length || 0}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videos?.filter(v => !v.is_published).length || 0}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Video List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredVideos?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'No videos match your search.' : 'No videos yet. Add your first video to get started.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos?.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="group flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={video.thumbnail_url || getThumbnailFromUrl(video.video_url) || '/placeholder.svg'}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    <Badge variant={video.is_published ? 'default' : 'secondary'}>
                      {video.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {video.event_name && <span className="bg-muted px-2 py-1 rounded">{video.event_name}</span>}
                  {video.event_date && <span>{format(new Date(video.event_date), 'MMM d, yyyy')}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublish.mutate({ id: video.id, is_published: !video.is_published })}
                >
                  {video.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(video)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{video.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(video.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
