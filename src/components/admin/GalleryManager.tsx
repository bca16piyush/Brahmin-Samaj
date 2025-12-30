import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload, Trash2, Loader2, Search, Calendar, Eye, EyeOff, CheckCircle, XCircle, ImagePlus } from 'lucide-react';
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

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  event_id: string | null;
  event_name: string | null;
  event_date: string | null;
  category: string | null;
  is_public: boolean;
  created_at: string;
}

export function GalleryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    event_id: '',
    category: '',
    is_public: true,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Fetch all gallery images
  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ['admin-gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Fetch all events for the dropdown
  const { data: events } = useQuery({
    queryKey: ['admin-events-for-gallery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Upload images mutation
  const uploadImages = useMutation({
    mutationFn: async (files: File[]) => {
      const results = { success: 0, failed: 0, errors: [] as string[] };
      setUploadProgress({ current: 0, total: files.length });

      const selectedEvent = events?.find(e => e.id === uploadForm.event_id);
      const folderPath = uploadForm.event_id 
        ? `events/${uploadForm.event_id}`
        : 'general';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });

        try {
          // Generate unique filename
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${folderPath}/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file);

          if (uploadError) {
            results.failed++;
            results.errors.push(`${file.name}: ${uploadError.message}`);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

          // Insert gallery record
          const { error: insertError } = await supabase
            .from('gallery')
            .insert({
              title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
              description: uploadForm.description || null,
              image_url: urlData.publicUrl,
              event_id: uploadForm.event_id || null,
              event_name: selectedEvent?.title || null,
              event_date: selectedEvent?.event_date ? format(new Date(selectedEvent.event_date), 'yyyy-MM-dd') : null,
              category: uploadForm.category || null,
              is_public: uploadForm.is_public,
            });

          if (insertError) {
            results.failed++;
            results.errors.push(`${file.name}: ${insertError.message}`);
            continue;
          }

          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${file.name}: ${err.message}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      setShowUploadDialog(false);
      setSelectedFiles([]);
      setUploadForm({ title: '', description: '', event_id: '', category: '', is_public: true });
      toast({
        title: 'Upload Complete',
        description: `${results.success} images uploaded, ${results.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete image mutation
  const deleteImage = useMutation({
    mutationFn: async (image: GalleryImage) => {
      // Extract file path from URL
      const urlParts = image.image_url.split('/gallery/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('gallery').remove([filePath]);
      }

      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', image.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      toast({
        title: 'Image Deleted',
        description: 'The image has been removed from the gallery.',
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

  // Toggle visibility mutation
  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { error } = await supabase
        .from('gallery')
        .update({ is_public })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: 'Invalid Files',
        description: 'Some files were skipped. Only image files are allowed.',
        variant: 'destructive',
      });
    }
    
    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    uploadImages.mutate(selectedFiles);
  };

  const filteredImages = images?.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          img.event_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEventFilter === 'all' || img.event_id === selectedEventFilter;
    return matchesSearch && matchesEvent;
  });

  const totalImages = images?.length || 0;
  const publicImages = images?.filter(i => i.is_public).length || 0;
  const privateImages = totalImages - publicImages;
  const uniqueEvents = new Set(images?.map(i => i.event_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-heading text-xl font-semibold">Gallery Management</h2>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <ImagePlus className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Gallery Images</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Event (Optional)</Label>
                <Select 
                  value={uploadForm.event_id} 
                  onValueChange={(value) => setUploadForm({ ...uploadForm, event_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific event</SelectItem>
                    {events?.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {format(new Date(event.event_date), 'MMM d, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title (for all images)</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Diwali Celebration 2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Brief description of the images"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Input
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  placeholder="e.g., Festival, Wedding, Puja"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Make images public</Label>
                <Switch
                  checked={uploadForm.is_public}
                  onCheckedChange={(checked) => setUploadForm({ ...uploadForm, is_public: checked })}
                />
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="gallery-upload"
                />
                <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to select images</span>
                  <span className="text-xs text-muted-foreground mt-1">Multiple images supported</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <p className="font-medium mb-2">{selectedFiles.length} image(s) selected:</p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, i) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">{file.name}</p>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading {uploadProgress.current} of {uploadProgress.total}...</span>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalImages}</p>
                <p className="text-sm text-muted-foreground">Total Images</p>
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
                <p className="text-2xl font-bold">{publicImages}</p>
                <p className="text-sm text-muted-foreground">Public</p>
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
                <p className="text-2xl font-bold">{privateImages}</p>
                <p className="text-sm text-muted-foreground">Private</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueEvents}</p>
                <p className="text-sm text-muted-foreground">Events Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events?.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {imagesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredImages?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm || selectedEventFilter !== 'all' 
            ? 'No images match your filters.' 
            : 'No images in gallery yet. Upload some images to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages?.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-xs text-white/70 truncate">{image.event_name || 'General'}</p>
                <p className="text-sm font-medium text-white truncate">{image.title}</p>
              </div>

              {/* Visibility badge */}
              <div className="absolute top-2 left-2">
                <Badge 
                  variant={image.is_public ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {image.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Badge>
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleVisibility.mutate({ id: image.id, is_public: !image.is_public })}
                >
                  {image.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Image</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{image.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteImage.mutate(image)}
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
