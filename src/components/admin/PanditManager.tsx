import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePandits, useCreatePandit, useUpdatePandit } from '@/hooks/useAdmin';

interface PanditFormData {
  name: string;
  expertise: string[];
  location: string;
  phone: string;
  whatsapp: string;
  availability: string;
  bio: string;
  is_active: boolean;
}

const initialFormData: PanditFormData = {
  name: '',
  expertise: [],
  location: '',
  phone: '',
  whatsapp: '',
  availability: '',
  bio: '',
  is_active: true,
};

export function PanditManager() {
  const { data: pandits, isLoading } = usePandits();
  const createPandit = useCreatePandit();
  const updatePandit = useUpdatePandit();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PanditFormData>(initialFormData);
  const [expertiseInput, setExpertiseInput] = useState('');

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setExpertiseInput('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (pandit: any) => {
    setFormData({
      name: pandit.name,
      expertise: pandit.expertise || [],
      location: pandit.location || '',
      phone: pandit.phone || '',
      whatsapp: pandit.whatsapp || '',
      availability: pandit.availability || '',
      bio: pandit.bio || '',
      is_active: pandit.is_active,
    });
    setExpertiseInput((pandit.expertise || []).join(', '));
    setEditingId(pandit.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const expertise = expertiseInput.split(',').map(e => e.trim()).filter(Boolean);
    const data = { ...formData, expertise, photo_url: null };

    if (editingId) {
      updatePandit.mutate({ id: editingId, data });
    } else {
      createPandit.mutate(data);
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
        <h2 className="font-heading text-xl font-semibold">Pandit Directory</h2>
        <Button variant="hero" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Pandit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pandits?.map((pandit, index) => (
          <motion.div
            key={pandit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border shadow-temple">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">{pandit.name}</CardTitle>
                  <Badge variant={pandit.is_active ? "default" : "secondary"}>
                    {pandit.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {pandit.expertise?.map((exp: string) => (
                      <Badge key={exp} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                  {pandit.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{pandit.location}</span>
                    </div>
                  )}
                  {pandit.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{pandit.phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(pandit)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pandit' : 'Add New Pandit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Pandit name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">Expertise (comma-separated)</Label>
              <Input
                id="expertise"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="Vedic Rituals, Astrology, Yagna"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="e.g., Mon-Fri, 9 AM - 6 PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={!formData.name.trim() || createPandit.isPending || updatePandit.isPending}
            >
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
