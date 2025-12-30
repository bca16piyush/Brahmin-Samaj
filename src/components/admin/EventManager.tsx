import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Calendar, MapPin, Video, Star, Upload, X, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = ['Festival', 'Puja', 'Workshop', 'Meeting', 'Celebration', 'Event'];
const REGISTRATION_LIMITS = [
  { label: 'Unlimited', value: null },
  { label: '50 people', value: 50 },
  { label: '100 people', value: 100 },
  { label: '200 people', value: 200 },
  { label: '500 people', value: 500 },
  { label: 'Custom', value: 'custom' },
];

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  location: string;
  youtube_live_url: string;
  is_live: boolean;
  is_featured: boolean;
  event_type: string;
  registration_limit: number | null;
  map_url: string;
  image_url: string | null;
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
  event_type: 'Event',
  registration_limit: null,
  map_url: '',
  image_url: null,
};

export function EventManager() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [customLimit, setCustomLimit] = useState('');
  const [limitType, setLimitType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setLimitType(null);
    setCustomLimit('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    const limit = event.registration_limit;
    const matchingLimit = REGISTRATION_LIMITS.find(l => l.value === limit);
    
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : '',
      end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
      location: event.location || '',
      youtube_live_url: event.youtube_live_url || '',
      is_live: event.is_live || false,
      is_featured: event.is_featured || false,
      event_type: event.event_type || 'Event',
      registration_limit: limit,
      map_url: event.map_url || '',
      image_url: event.image_url || null,
    });
    
    if (limit === null) {
      setLimitType(null);
    } else if (matchingLimit) {
      setLimitType(String(limit));
    } else {
      setLimitType('custom');
      setCustomLimit(String(limit));
    }
    
    setEditingId(event.id);
    setDialogOpen(true);
  };

  const handleLimitChange = (value: string) => {
    setLimitType(value);
    if (value === 'custom') {
      setFormData({ ...formData, registration_limit: null });
    } else if (value === '' || value === 'null') {
      setFormData({ ...formData, registration_limit: null });
    } else {
      setFormData({ ...formData, registration_limit: parseInt(value) });
    }
  };

  const handleCustomLimitChange = (value: string) => {
    setCustomLimit(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setFormData({ ...formData, registration_limit: num });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: 'Image uploaded',
        description: 'Event image has been uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: null });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.event_date) return;

    const data = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      youtube_live_url: formData.youtube_live_url,
      is_live: formData.is_live,
      is_featured: formData.is_featured,
      event_type: formData.event_type,
      registration_limit: formData.registration_limit,
      map_url: formData.map_url,
      image_url: formData.image_url,
      event_date: new Date(formData.event_date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      created_by: user?.id || null,
    };

    if (editingId) {
      updateEvent.mutate({ id: editingId, data });
    } else {
      createEvent.mutate(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteEvent.mutate(deleteId);
      setDeleteId(null);
    }
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
            <Card className="border-border shadow-temple overflow-hidden">
              <div className="flex">
                {event.image_url && (
                  <div className="w-32 h-32 shrink-0">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {event.is_featured && <Star className="w-5 h-5 text-gold fill-gold" />}
                        <CardTitle className="text-lg font-heading">{event.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{event.event_type}</Badge>
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
                      <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      {event.registration_limit && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Limit: {event.registration_limit}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(event)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(event.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Event Image</Label>
              {formData.image_url ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={formData.image_url} 
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="event_type">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="map_url">Google Maps Embed URL</Label>
              <Input
                id="map_url"
                value={formData.map_url}
                onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-xs text-muted-foreground">
                Go to Google Maps → Share → Embed a map → Copy the src URL from the iframe
              </p>
            </div>

            <div className="space-y-2">
              <Label>Registration Limit</Label>
              <div className="grid grid-cols-3 gap-2">
                {REGISTRATION_LIMITS.map((limit) => (
                  <Button
                    key={limit.label}
                    type="button"
                    variant={limitType === String(limit.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLimitChange(String(limit.value))}
                  >
                    {limit.label}
                  </Button>
                ))}
              </div>
              {limitType === 'custom' && (
                <Input
                  type="number"
                  value={customLimit}
                  onChange={(e) => handleCustomLimitChange(e.target.value)}
                  placeholder="Enter custom limit"
                  min="1"
                  className="mt-2"
                />
              )}
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

            <div className="flex items-center gap-6">
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}