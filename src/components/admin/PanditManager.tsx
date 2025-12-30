import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Phone, MapPin, Upload, X, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { usePandits, useCreatePandit, useUpdatePandit, usePanditExpertiseOptions, useCreateExpertiseOption, useDeleteExpertiseOption } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeeklyAvailability {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const initialWeeklyAvailability: WeeklyAvailability = {
  monday: { enabled: false, start: '09:00', end: '18:00' },
  tuesday: { enabled: false, start: '09:00', end: '18:00' },
  wednesday: { enabled: false, start: '09:00', end: '18:00' },
  thursday: { enabled: false, start: '09:00', end: '18:00' },
  friday: { enabled: false, start: '09:00', end: '18:00' },
  saturday: { enabled: false, start: '09:00', end: '18:00' },
  sunday: { enabled: false, start: '09:00', end: '18:00' },
};

interface PanditFormData {
  name: string;
  expertise: string[];
  location: string;
  phone: string;
  whatsapp: string;
  bio: string;
  is_active: boolean;
  photo_url: string | null;
  experience_start_date: string | null;
  weekly_availability: WeeklyAvailability;
}

const initialFormData: PanditFormData = {
  name: '',
  expertise: [],
  location: '',
  phone: '',
  whatsapp: '',
  bio: '',
  is_active: true,
  photo_url: null,
  experience_start_date: null,
  weekly_availability: initialWeeklyAvailability,
};

export function PanditManager() {
  const { data: pandits, isLoading } = usePandits();
  const { data: expertiseOptions } = usePanditExpertiseOptions();
  const createPandit = useCreatePandit();
  const updatePandit = useUpdatePandit();
  const createExpertise = useCreateExpertiseOption();
  const deleteExpertise = useDeleteExpertiseOption();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expertiseDialogOpen, setExpertiseDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PanditFormData>(initialFormData);
  const [newExpertiseName, setNewExpertiseName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (pandit: any) => {
    const weeklyAvail = pandit.weekly_availability || initialWeeklyAvailability;
    setFormData({
      name: pandit.name,
      expertise: pandit.expertise || [],
      location: pandit.location || '',
      phone: pandit.phone || '',
      whatsapp: pandit.whatsapp || '',
      bio: pandit.bio || '',
      is_active: pandit.is_active,
      photo_url: pandit.photo_url || null,
      experience_start_date: pandit.experience_start_date || null,
      weekly_availability: typeof weeklyAvail === 'object' ? weeklyAvail : initialWeeklyAvailability,
    });
    setEditingId(pandit.id);
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pandit-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pandit-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
      toast({
        title: 'Photo Uploaded',
        description: 'Profile photo has been uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleExpertise = (expertise: string) => {
    if (formData.expertise.includes(expertise)) {
      setFormData({
        ...formData,
        expertise: formData.expertise.filter(e => e !== expertise),
      });
    } else {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertise],
      });
    }
  };

  const updateDayAvailability = (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setFormData({
      ...formData,
      weekly_availability: {
        ...formData.weekly_availability,
        [day]: {
          ...formData.weekly_availability[day],
          [field]: value,
        },
      },
    });
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      expertise: formData.expertise,
      location: formData.location,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      bio: formData.bio,
      is_active: formData.is_active,
      photo_url: formData.photo_url,
      experience_start_date: formData.experience_start_date,
      weekly_availability: formData.weekly_availability as any,
      availability: '', // Legacy field
    };

    if (editingId) {
      updatePandit.mutate({ id: editingId, data });
    } else {
      createPandit.mutate(data);
    }
    setDialogOpen(false);
  };

  const handleAddExpertise = () => {
    if (newExpertiseName.trim()) {
      createExpertise.mutate(newExpertiseName.trim());
      setNewExpertiseName('');
    }
  };

  const calculateExperience = (startDate: string | null): string => {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) return 'Less than 1 year';
    return `${years} year${years > 1 ? 's' : ''}`;
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExpertiseDialogOpen(true)}>
            Manage Expertise
          </Button>
          <Button variant="hero" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Pandit
          </Button>
        </div>
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
                <div className="flex items-center gap-3">
                  {pandit.photo_url ? (
                    <img
                      src={pandit.photo_url}
                      alt={pandit.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gold/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xl font-semibold text-muted-foreground">
                        {pandit.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-heading">{pandit.name}</CardTitle>
                      <Badge variant={pandit.is_active ? "default" : "secondary"}>
                        {pandit.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {pandit.experience_start_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{calculateExperience(pandit.experience_start_date)}</span>
                      </div>
                    )}
                  </div>
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

      {/* Pandit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pandit' : 'Add New Pandit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                {formData.photo_url ? (
                  <div className="relative">
                    <img
                      src={formData.photo_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gold/30"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: null })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Pandit name"
              />
            </div>

            {/* Experience Start Date */}
            <div className="space-y-2">
              <Label htmlFor="experience_start_date">Experience Start Date</Label>
              <Input
                id="experience_start_date"
                type="date"
                value={formData.experience_start_date || ''}
                onChange={(e) => setFormData({ ...formData, experience_start_date: e.target.value || null })}
              />
              <p className="text-xs text-muted-foreground">
                Experience will be calculated automatically from this date
              </p>
            </div>

            {/* Expertise Selection */}
            <div className="space-y-2">
              <Label>Expertise</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                {expertiseOptions?.map((option) => (
                  <Badge
                    key={option.id}
                    variant={formData.expertise.includes(option.name) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleExpertise(option.name)}
                  >
                    {option.name}
                    {formData.expertise.includes(option.name) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
                {!expertiseOptions?.length && (
                  <p className="text-sm text-muted-foreground">No expertise options. Add some first.</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
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

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>

            {/* Weekly Availability */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Weekly Availability
              </Label>
              <div className="space-y-2 p-3 border rounded-lg">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.weekly_availability[day]?.enabled || false}
                      onCheckedChange={(checked) => updateDayAvailability(day, 'enabled', !!checked)}
                    />
                    <span className="w-24 capitalize text-sm">{day}</span>
                    <Input
                      type="time"
                      value={formData.weekly_availability[day]?.start || '09:00'}
                      onChange={(e) => updateDayAvailability(day, 'start', e.target.value)}
                      disabled={!formData.weekly_availability[day]?.enabled}
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={formData.weekly_availability[day]?.end || '18:00'}
                      onChange={(e) => updateDayAvailability(day, 'end', e.target.value)}
                      disabled={!formData.weekly_availability[day]?.enabled}
                      className="w-28"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
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

            {/* Active Switch */}
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

      {/* Expertise Management Dialog */}
      <Dialog open={expertiseDialogOpen} onOpenChange={setExpertiseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Expertise Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={newExpertiseName}
                onChange={(e) => setNewExpertiseName(e.target.value)}
                placeholder="New expertise name"
                onKeyDown={(e) => e.key === 'Enter' && handleAddExpertise()}
              />
              <Button
                onClick={handleAddExpertise}
                disabled={!newExpertiseName.trim() || createExpertise.isPending}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expertiseOptions?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>{option.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExpertise.mutate(option.id)}
                    disabled={deleteExpertise.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpertiseDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}