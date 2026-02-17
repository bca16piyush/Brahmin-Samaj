import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Download, Bed, MapPin, Bell, CalendarDays, Camera, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMyAllocation } from '@/hooks/useAccommodation';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

function PhotoUploadGate({ onUploaded }: { onUploaded: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be under 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      toast({ title: 'Photo uploaded successfully!' });
      onUploaded();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <Card className="border-2 border-primary/30 shadow-temple overflow-hidden">
        <div className="bg-gradient-saffron px-6 py-4 text-center">
          <span className="text-primary-foreground font-heading text-2xl font-bold">ॐ</span>
          <h2 className="font-heading text-lg font-bold text-primary-foreground mt-1">Photo Required</h2>
        </div>
        <div className="px-6 py-10 flex flex-col items-center gap-5 bg-card">
          <div className="w-28 h-28 rounded-full bg-muted border-4 border-dashed border-primary/30 flex items-center justify-center">
            <Camera className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-heading text-lg font-bold text-foreground">Upload Your Photo</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              A profile photo is mandatory for your Digital Gate Pass. This helps volunteers verify your identity at entry gates.
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleUpload} className="hidden" />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-saffron text-primary-foreground gap-2 w-full max-w-xs"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Choose Photo'}
          </Button>
          <p className="text-xs text-muted-foreground">Max 5MB • JPG, PNG supported</p>
        </div>
      </Card>
    </motion.div>
  );
}

function PassCard({ profile, allocation }: { profile: any; allocation: any }) {
  const { isVerified } = useAuth();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const uid = profile.id?.slice(0, 8).toUpperCase() || 'N/A';
  const roomNumber = allocation?.rooms?.room_number;
  const locationName = allocation?.rooms?.accommodation_locations?.name;
  const checkIn = allocation?.check_in_date;
  const checkOut = allocation?.check_out_date;
  const isActiveStay = allocation?.isActive === true;
  const isUpcoming = allocation?.isUpcoming === true;
  const hasAllocation = !!allocation && !!roomNumber;

  const downloadAsPDF = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [95, 170] });
      pdf.addImage(imgData, 'PNG', 0, 0, 95, 170);
      pdf.save(`Mahayagya-Pass-${profile?.id?.slice(0, 8) || 'pass'}.pdf`);
      toast({ title: 'Pass downloaded successfully!' });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({ title: 'Download failed', description: 'Please try again', variant: 'destructive' });
    }
  }, [profile, toast]);

  return (
    <>
      <Card ref={cardRef} className="w-[340px] sm:w-[380px] overflow-hidden border-2 border-primary/30 shadow-temple">
        <div className="bg-gradient-saffron px-6 py-4 text-center">
          <span className="text-primary-foreground font-heading text-2xl font-bold">ॐ</span>
          <h2 className="font-heading text-lg font-bold text-primary-foreground">Official Mahayagya Entry Pass</h2>
          <p className="text-primary-foreground/80 text-xs mt-0.5">Digital Gate Pass</p>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-5 bg-card">
          <div className="w-28 h-28 rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-heading text-xl font-bold text-foreground">{profile.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              {isVerified ? (
                <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                  <ShieldCheck className="w-3 h-3" />Verified Member
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {profile.verification_status === 'pending' ? 'Verification Pending' : 'Not Verified'}
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full text-center bg-muted rounded-xl py-3 px-4">
            <p className="text-xs text-muted-foreground mb-1">Registration ID</p>
            <p className="font-heading text-2xl font-bold tracking-widest text-foreground">{uid}</p>
          </div>

          {hasAllocation ? (
            <div className={`w-full border rounded-xl py-3 px-4 ${isActiveStay ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Bed className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">My Stay</span>
                {isActiveStay && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] ml-auto" variant="outline">Active</Badge>}
                {isUpcoming && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] ml-auto" variant="outline">Upcoming</Badge>}
                {!isActiveStay && !isUpcoming && <Badge className="bg-muted text-muted-foreground text-[10px] ml-auto" variant="outline">Expired</Badge>}
              </div>
              <p className="font-heading text-lg font-bold text-foreground">Room {roomNumber}</p>
              {locationName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{locationName}</span>
                </div>
              )}
              {(checkIn || checkOut) && (
                <div className="flex items-center gap-1 mt-1">
                  <CalendarDays className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {checkIn ? format(new Date(checkIn), 'dd MMM') : '?'} — {checkOut ? format(new Date(checkOut), 'dd MMM yyyy') : '?'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Accommodation</span>
              </div>
              <p className="text-sm text-muted-foreground">No Active Stay</p>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCode value={profile.id || uid} size={180} level="H" />
          </div>
          <p className="text-xs text-muted-foreground text-center">Show this pass at the entry gate for verification</p>
        </div>
        <div className="bg-accent px-6 py-3 text-center">
          <p className="text-accent-foreground text-xs font-medium">महायज्ञ • Mahayagya Community</p>
        </div>
      </Card>
      <div className="mt-6 flex justify-center">
        <Button onClick={downloadAsPDF} className="bg-gradient-saffron text-primary-foreground gap-2">
          <Download className="w-4 h-4" />Download Pass (PDF)
        </Button>
      </div>
    </>
  );
}

export default function MyPass() {
  const { isAuthenticated, isLoading, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: allocation } = useMyAllocation();
  const { data: notifications } = useUserNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="w-80 h-[500px] rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const hasPhoto = !!profile.avatar_url;

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 flex flex-col items-center">
          {!hasPhoto ? (
            <PhotoUploadGate onUploaded={refreshProfile} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center">
              <PassCard profile={profile} allocation={allocation} />

              {notifications && notifications.length > 0 && (
                <div className="mt-8 w-full max-w-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground">Recent Notifications</h3>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`p-3 rounded-lg border border-border ${!n.is_read ? 'bg-primary/5' : 'bg-card'}`}>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
