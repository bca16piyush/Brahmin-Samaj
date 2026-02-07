import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Bell, Calendar, Users, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNews, useCreateNews, useUpdateNews, useDeleteNews } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type News = Database['public']['Tables']['news']['Row'];

export function NewsPublisher() {
  const { data: newsItems, isLoading } = useNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  const { user } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_urgent: false,
    send_notification: false,
  });

  // Fetch subscriber count for broadcast confirmation
  const { data: subscriberCount } = useQuery({
    queryKey: ['whatsapp-subscriber-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notification_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_notifications', true)
        .not('whatsapp_number', 'is', null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: dialogOpen,
  });

  const openCreateDialog = () => {
    setEditingNews(null);
    setFormData({ title: '', content: '', is_urgent: false, send_notification: false });
    setDialogOpen(true);
  };

  const openEditDialog = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      content: news.content,
      is_urgent: news.is_urgent || false,
      send_notification: false, // Don't resend notification on edit
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    // If creating new and notification is enabled, show confirmation dialog first
    if (!editingNews && formData.send_notification && subscriberCount && subscriberCount > 0) {
      setConfirmBroadcastOpen(true);
      return;
    }
    
    executeSubmit();
  };

  const executeSubmit = () => {
    if (editingNews) {
      // Update existing news
      updateNews.mutate({
        id: editingNews.id,
        data: {
          title: formData.title,
          content: formData.content,
          is_urgent: formData.is_urgent,
        },
      });
    } else {
      // Create new news
      createNews.mutate({
        ...formData,
        created_by: user?.id || null,
      });
    }
    setDialogOpen(false);
    setConfirmBroadcastOpen(false);
    setEditingNews(null);
    setFormData({ title: '', content: '', is_urgent: false, send_notification: false });
  };

  const handleDelete = (id: string) => {
    deleteNews.mutate(id);
    setDeleteId(null);
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
        <h2 className="font-heading text-xl font-semibold">News & Announcements</h2>
        <Button variant="hero" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Publish News
        </Button>
      </div>

      <div className="space-y-4">
        {newsItems?.map((news, index) => (
          <motion.div
            key={news.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border shadow-temple">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {news.is_urgent && (
                      <AlertTriangle className="w-5 h-5 text-maroon" />
                    )}
                    <CardTitle className="text-lg font-heading">{news.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {news.is_urgent && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                    {news.send_notification && (
                      <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                        <Bell className="w-3 h-3 mr-1" />
                        Notified
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(news)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(news.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{news.content}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(news.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {!newsItems?.length && (
          <Card className="border-border shadow-temple">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No news published yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit News' : 'Publish News'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="News title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="News content"
                rows={4}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="urgent"
                  checked={formData.is_urgent}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked })}
                />
                <Label htmlFor="urgent">Mark as Urgent</Label>
              </div>
              {!editingNews && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="notify"
                    checked={formData.send_notification}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
                  />
                  <Label htmlFor="notify">Send Notification</Label>
                </div>
              )}
            </div>
            {!editingNews && formData.send_notification && subscriberCount !== undefined && subscriberCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  This will send a WhatsApp message to <strong>{subscriberCount}</strong> subscriber{subscriberCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim() || createNews.isPending || updateNews.isPending}
            >
              {editingNews ? 'Update' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this news article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Broadcast Confirmation Dialog */}
      <AlertDialog open={confirmBroadcastOpen} onOpenChange={setConfirmBroadcastOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Confirm Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to send a WhatsApp notification to <strong className="text-foreground">{subscriberCount}</strong> subscriber{subscriberCount !== 1 ? 's' : ''}.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{formData.is_urgent ? `🚨 URGENT: ${formData.title}` : formData.title}</p>
                <p className="text-sm mt-1 line-clamp-3">{formData.content}</p>
              </div>
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ This action cannot be undone. All subscribers will receive this message immediately.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSubmit}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Yes, Send to {subscriberCount} Subscribers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
