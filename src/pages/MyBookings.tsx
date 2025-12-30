import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, User, AlertCircle, CheckCircle, XCircle, X, CalendarCheck, Ticket, Video, Package, Gift } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBookings } from '@/hooks/usePanditBookings';
import { useMyEventRegistrations, useCancelRegistration } from '@/hooks/useEventRegistrations';
import { useMyDonations } from '@/hooks/useUserDonations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertCircle, label: 'Pending' },
  confirmed: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle, label: 'Cancelled' },
  registered: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Registered' },
  pledged: { color: 'bg-gold/10 text-gold border-gold/30', icon: AlertCircle, label: 'Pledged' },
  received: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle, label: 'Received' },
};

export default function MyBookings() {
  const { isAuthenticated, isVerified, isLoading: authLoading } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = useUserBookings();
  const { data: eventRegistrations, isLoading: registrationsLoading } = useMyEventRegistrations();
  const { data: donations, isLoading: donationsLoading } = useMyDonations();
  const cancelRegistration = useCancelRegistration();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [cancelBooking, setCancelBooking] = useState<any>(null);
  const [cancelEvent, setCancelEvent] = useState<any>(null);
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

  const handleCancelEventRegistration = () => {
    if (!cancelEvent) return;
    cancelRegistration.mutate(
      { registrationId: cancelEvent.id, eventId: cancelEvent.event_id },
      { onSuccess: () => setCancelEvent(null) }
    );
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

  const isLoading = bookingsLoading || registrationsLoading || donationsLoading;

  const upcomingBookings = bookings?.filter(b => 
    b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.booking_date) >= new Date()
  ) || [];
  
  const pastBookings = bookings?.filter(b => 
    b.status === 'completed' || b.status === 'cancelled' || new Date(b.booking_date) < new Date()
  ) || [];

  const upcomingEventRegs = eventRegistrations?.filter(r => {
    const event = r.events as any;
    return event && new Date(event.event_date) >= new Date();
  }) || [];

  const pastEventRegs = eventRegistrations?.filter(r => {
    const event = r.events as any;
    return event && new Date(event.event_date) < new Date();
  }) || [];

  const pendingDonations = donations?.filter(d => d.status === 'pledged') || [];
  const receivedDonations = donations?.filter(d => d.status === 'received') || [];

  const hasBookings = (bookings?.length || 0) > 0;
  const hasEventRegs = (eventRegistrations?.length || 0) > 0;
  const hasDonations = (donations?.length || 0) > 0;

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
              View and manage your pandit bookings and event registrations
            </motion.p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !hasBookings && !hasEventRegs && !hasDonations ? (
            <div className="text-center py-12">
              <CalendarCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-heading text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings, event registrations, or donations yet.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/panditji">
                  <Button variant="hero">Find a Pandit</Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline">Browse Events</Button>
                </Link>
                <Link to="/donations">
                  <Button variant="outline">Make a Donation</Button>
                </Link>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="bookings" className="space-y-6">
              <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Pandit</span> Bookings
                  {hasBookings && <Badge variant="secondary" className="ml-1">{bookings?.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  <span className="hidden sm:inline">Event</span> Registrations
                  {hasEventRegs && <Badge variant="secondary" className="ml-1">{eventRegistrations?.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="donations" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Donations
                  {hasDonations && <Badge variant="secondary" className="ml-1">{donations?.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* Pandit Bookings Tab */}
              <TabsContent value="bookings" className="space-y-8">
                {!hasBookings ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No pandit bookings yet.</p>
                    <Link to="/panditji">
                      <Button variant="hero">Find a Pandit</Button>
                    </Link>
                  </div>
                ) : (
                  <>
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
                          {pastBookings.map((booking) => {
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
                  </>
                )}
              </TabsContent>

              {/* Event Registrations Tab */}
              <TabsContent value="events" className="space-y-8">
                {!hasEventRegs ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No event registrations yet.</p>
                    <Link to="/events">
                      <Button variant="hero">Browse Events</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Upcoming Event Registrations */}
                    {upcomingEventRegs.length > 0 && (
                      <div>
                        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                          <Ticket className="w-5 h-5 text-primary" />
                          Upcoming Events
                        </h2>
                        <div className="space-y-4">
                          {upcomingEventRegs.map((reg, index) => {
                            const event = reg.events as any;
                            if (!event) return null;
                            
                            return (
                              <motion.div
                                key={reg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className="border-border">
                                  <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div className="flex items-start gap-4">
                                        {event.image_url ? (
                                          <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-20 h-20 rounded-lg object-cover"
                                          />
                                        ) : (
                                          <div className="w-20 h-20 rounded-lg bg-gradient-saffron flex items-center justify-center text-primary-foreground">
                                            <Calendar className="w-8 h-8" />
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary">{event.event_type}</Badge>
                                            {event.is_live && (
                                              <Badge variant="destructive" className="animate-pulse">
                                                <Video className="w-3 h-3 mr-1" />
                                                LIVE
                                              </Badge>
                                            )}
                                          </div>
                                          <h3 className="font-heading text-lg font-semibold">
                                            {event.title}
                                          </h3>
                                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-4 h-4" />
                                              {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-4 h-4" />
                                              {format(new Date(event.event_date), 'h:mm a')}
                                            </div>
                                            {event.location && (
                                              <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {event.location}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <Badge className={statusConfig.registered.color}>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Registered
                                        </Badge>
                                        <div className="flex gap-2">
                                          <Link to={`/events/${event.id}`}>
                                            <Button variant="outline" size="sm">
                                              View Event
                                            </Button>
                                          </Link>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setCancelEvent({ ...reg, event_id: event.id, event })}
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Past Event Registrations */}
                    {pastEventRegs.length > 0 && (
                      <div>
                        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-5 h-5" />
                          Past Events
                        </h2>
                        <div className="space-y-4 opacity-75">
                          {pastEventRegs.map((reg) => {
                            const event = reg.events as any;
                            if (!event) return null;
                            
                            return (
                              <Card key={reg.id} className="border-border">
                                <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                      {event.image_url ? (
                                        <img
                                          src={event.image_url}
                                          alt={event.title}
                                          className="w-14 h-14 rounded-lg object-cover grayscale"
                                        />
                                      ) : (
                                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                          <Calendar className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div>
                                        <h3 className="font-medium">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground">{event.event_type}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {format(new Date(event.event_date), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {reg.attended ? (
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Attended
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">
                                          Registered
                                        </Badge>
                                      )}
                                      <Link to={`/events/${event.id}`}>
                                        <Button variant="ghost" size="sm">
                                          View
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Donations Tab */}
              <TabsContent value="donations" className="space-y-8">
                {!hasDonations ? (
                  <div className="text-center py-12">
                    <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No donations pledged yet.</p>
                    <Link to="/donations">
                      <Button variant="hero">Make a Donation</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Pending Donations */}
                    {pendingDonations.length > 0 && (
                      <div>
                        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-gold" />
                          Pledged Donations (Pending)
                        </h2>
                        <div className="space-y-4">
                          {pendingDonations.map((donation: any, index: number) => {
                            const config = statusConfig[donation.status] || statusConfig.pledged;
                            const StatusIcon = config.icon;

                            return (
                              <motion.div
                                key={donation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Card className="border-border">
                                  <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                                          <Package className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                          <h3 className="font-heading text-lg font-semibold">
                                            {donation.item_type}
                                          </h3>
                                          <p className="text-primary font-medium">{donation.quantity}</p>
                                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                              <MapPin className="w-4 h-4" />
                                              {donation.dropoff_location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-4 h-4" />
                                              Pledged: {format(new Date(donation.created_at), 'MMM d, yyyy')}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <Badge className={config.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {config.label}
                                      </Badge>
                                    </div>
                                    {donation.notes && (
                                      <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                        "{donation.notes}"
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

                    {/* Received Donations */}
                    {receivedDonations.length > 0 && (
                      <div>
                        <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5" />
                          Received Donations
                        </h2>
                        <div className="space-y-4 opacity-75">
                          {receivedDonations.map((donation: any) => {
                            const config = statusConfig[donation.status] || statusConfig.received;
                            const StatusIcon = config.icon;

                            return (
                              <Card key={donation.id} className="border-border">
                                <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                      </div>
                                      <div>
                                        <h3 className="font-medium">{donation.item_type}</h3>
                                        <p className="text-sm text-muted-foreground">{donation.quantity}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Received: {donation.received_at ? format(new Date(donation.received_at), 'MMM d, yyyy') : 'N/A'}
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
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>

      {/* Cancel Booking Dialog */}
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

      {/* Cancel Event Registration Dialog */}
      <Dialog open={!!cancelEvent} onOpenChange={() => setCancelEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration for this event?
            </DialogDescription>
          </DialogHeader>
          {cancelEvent && (
            <div className="py-4">
              <p className="font-medium">{cancelEvent.event?.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(cancelEvent.event?.event_date), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelEvent(null)}>
              Keep Registration
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelEventRegistration}
              disabled={cancelRegistration.isPending}
            >
              {cancelRegistration.isPending ? 'Cancelling...' : 'Cancel Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
