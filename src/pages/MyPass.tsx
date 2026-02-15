import { useEffect, useRef, useCallback } from 'react';
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
import { User, ShieldCheck, Download, Bed, MapPin, Bell, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMyAllocation } from '@/hooks/useAccommodation';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function MyPass() {
  const { isAuthenticated, isLoading, profile, isVerified } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: allocation } = useMyAllocation();
  const { data: notifications } = useUserNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

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

  const uid = profile.id?.slice(0, 8).toUpperCase() || 'N/A';
  const roomNumber = (allocation as any)?.rooms?.room_number;
  const locationName = (allocation as any)?.rooms?.accommodation_locations?.name;
  const checkIn = allocation?.check_in_date;
  const checkOut = allocation?.check_out_date;
  const isActiveStay = (allocation as any)?.isActive === true;
  const isUpcoming = (allocation as any)?.isUpcoming === true;
  const hasAllocation = !!allocation;

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card ref={cardRef} className="w-[340px] sm:w-[380px] overflow-hidden border-2 border-primary/30 shadow-temple">
              {/* Header */}
              <div className="bg-gradient-saffron px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-primary-foreground font-heading text-2xl font-bold">ॐ</span>
                </div>
                <h2 className="font-heading text-lg font-bold text-primary-foreground">
                  Official Mahayagya Entry Pass
                </h2>
                <p className="text-primary-foreground/80 text-xs mt-0.5">Digital Gate Pass</p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 flex flex-col items-center gap-5 bg-card">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>

                {/* Name */}
                <div className="text-center">
                  <h3 className="font-heading text-xl font-bold text-foreground">{profile.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {isVerified ? (
                      <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Member
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {profile.verification_status === 'pending' ? 'Verification Pending' : 'Not Verified'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* UID */}
                <div className="w-full text-center bg-muted rounded-xl py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Registration ID</p>
                  <p className="font-heading text-2xl font-bold tracking-widest text-foreground">{uid}</p>
                </div>

                {/* Accommodation Section */}
                {hasAllocation && roomNumber ? (
                  <div className={`w-full border rounded-xl py-3 px-4 ${isActiveStay ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Bed className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">My Stay</span>
                      {isActiveStay && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] ml-auto" variant="outline">Active</Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] ml-auto" variant="outline">Upcoming</Badge>
                      )}
                      {!isActiveStay && !isUpcoming && (
                        <Badge className="bg-muted text-muted-foreground text-[10px] ml-auto" variant="outline">Expired</Badge>
                      )}
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

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCode value={profile.id || uid} size={180} level="H" />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Show this pass at the entry gate for verification
                </p>
              </div>

              {/* Footer */}
              <div className="bg-accent px-6 py-3 text-center">
                <p className="text-accent-foreground text-xs font-medium">
                  महायज्ञ • Mahayagya Community
                </p>
              </div>
            </Card>

            {/* Download Button */}
            <div className="mt-6 flex justify-center">
              <Button onClick={downloadAsPDF} className="bg-gradient-saffron text-primary-foreground gap-2">
                <Download className="w-4 h-4" />
                Download Pass (PDF)
              </Button>
            </div>

            {/* Notifications Section */}
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
        </div>
      </section>
    </Layout>
  );
}
