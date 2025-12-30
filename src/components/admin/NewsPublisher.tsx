import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Bell, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNews, useCreateNews } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function NewsPublisher() {
  const { data: newsItems, isLoading } = useNews();
  const createNews = useCreateNews();
  const { user } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_urgent: false,
    send_notification: false,
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    createNews.mutate({
      ...formData,
      created_by: user?.id || null,
    });
    setDialogOpen(false);
    setFormData({ title: '', content: '', is_urgent: false, send_notification: false });
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
        <Button variant="hero" onClick={() => setDialogOpen(true)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish News</DialogTitle>
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
              <div className="flex items-center gap-2">
                <Switch
                  id="notify"
                  checked={formData.send_notification}
                  onCheckedChange={(checked) => setFormData({ ...formData, send_notification: checked })}
                />
                <Label htmlFor="notify">Send Notification</Label>
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
              disabled={!formData.title.trim() || !formData.content.trim() || createNews.isPending}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
