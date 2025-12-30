import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, User, AlertCircle, CheckCircle, XCircle, X, CalendarCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBookings } from '@/hooks/usePanditBookings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertCircle, label: 'Pending' },
  confirmed: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle, label: 'Cancelled' },
};

export default function MyBookings() {
  const { isAuthenticated, isVerified, isLoading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useUserBookings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [cancelBooking, setCancelBooking] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('pandit_bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelBooking.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      setCancelBooking(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <CalendarCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">Login Required</h1>
            <p className="text-muted-foreground mb-6">Please login to view your bookings.</p>
            <Link to="/login">
              <Button variant="hero">Login</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  // Show verification required message
  if (!authLoading && isAuthenticated && !isVerified) {
    return (
      <Layout>
        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">Verification Required</h1>
            <p className="text-muted-foreground mb-6">
              Your account needs to be verified to make and view bookings.
            </p>
            <Link to="/register">
              <Button variant="hero">Complete Verification</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const upcomingBookings = bookings?.filter(b => 
    b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.booking_date) >= new Date()
  ) || [];
  
  const pastBookings = bookings?.filter(b => 
    b.status === 'completed' || b.status === 'cancelled' || new Date(b.booking_date) < new Date()
  ) || [];

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              My <span className="text-gradient-saffron">Bookings</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              View and manage your pandit booking requests
            </motion.p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bookings?.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't made any booking requests yet.
              </p>
              <Link to="/panditji">
                <Button variant="hero">Find a Pandit</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Bookings
                  </h2>
                  <div className="space-y-4">
                    {upcomingBookings.map((booking, index) => {
                      const config = statusConfig[booking.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border-border">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  {booking.pandits?.photo_url ? (
                                    <img
                                      src={booking.pandits.photo_url}
                                      alt={booking.pandits?.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                      <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-heading text-lg font-semibold">
                                      {booking.pandits?.name || 'Unknown Pandit'}
                                    </h3>
                                    <p className="text-primary font-medium">{booking.ceremony_type}</p>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}
                                      </div>
                                      {booking.booking_time && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {booking.booking_time}
                                        </div>
                                      )}
                                      {booking.location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          {booking.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className={config.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                  {booking.status === 'pending' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setCancelBooking(booking)}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {booking.message && (
                                <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  "{booking.message}"
                                </p>
                              )}
                              {booking.admin_notes && (
                                <p className="mt-2 text-sm italic text-muted-foreground">
                                  Admin note: {booking.admin_notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    Past Bookings
                  </h2>
                  <div className="space-y-4 opacity-75">
                    {pastBookings.map((booking, index) => {
                      const config = statusConfig[booking.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      
                      return (
                        <Card key={booking.id} className="border-border">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                {booking.pandits?.photo_url ? (
                                  <img
                                    src={booking.pandits.photo_url}
                                    alt={booking.pandits?.name}
                                    className="w-12 h-12 rounded-lg object-cover grayscale"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-medium">{booking.pandits?.name || 'Unknown Pandit'}</h3>
                                  <p className="text-sm text-muted-foreground">{booking.ceremony_type}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Badge className={config.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelBooking} onOpenChange={() => setCancelBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancelBooking && (
            <div className="py-4">
              <p className="font-medium">{cancelBooking.ceremony_type}</p>
              <p className="text-sm text-muted-foreground">
                with {cancelBooking.pandits?.name} on {format(new Date(cancelBooking.booking_date), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelBooking(null)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}