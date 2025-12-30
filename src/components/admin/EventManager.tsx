import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Calendar, MapPin, Video, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEvents, useCreateEvent, useUpdateEvent } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  location: string;
  youtube_live_url: string;
  is_live: boolean;
  is_featured: boolean;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  event_date: '',
  end_date: '',
  location: '',
  youtube_live_url: '',
  is_live: false,
  is_featured: false,
};

export function EventManager() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { user } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : '',
      end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
      location: event.location || '',
      youtube_live_url: event.youtube_live_url || '',
      is_live: event.is_live,
      is_featured: event.is_featured,
    });
    setEditingId(event.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.event_date) return;

    const data = {
      ...formData,
      event_date: new Date(formData.event_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      created_by: user?.id || null,
      image_url: null,
    };

    if (editingId) {
      updateEvent.mutate({ id: editingId, data });
    } else {
      createEvent.mutate(data);
    }
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-xl font-semibold">Events</h2>
        <Button variant="hero" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="space-y-4">
        {events?.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border shadow-temple">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {event.is_featured && <Star className="w-5 h-5 text-gold fill-gold" />}
                    <CardTitle className="text-lg font-heading">{event.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.is_live && (
                      <Badge variant="destructive">
                        <Video className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    )}
                    {event.is_featured && (
                      <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(event)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {!events?.length && (
          <Card className="border-border shadow-temple">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No events created yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Start Date & Time *</Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube Live URL</Label>
              <Input
                id="youtube"
                value={formData.youtube_live_url}
                onChange={(e) => setFormData({ ...formData, youtube_live_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
                />
                <Label htmlFor="live">Is Live Now</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.event_date || createEvent.isPending || updateEvent.isPending}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
