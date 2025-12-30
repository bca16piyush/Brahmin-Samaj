import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, User, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllBookings, useUpdateBookingStatus } from '@/hooks/usePanditBookings';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  confirmed: 'bg-green-500/10 text-green-600 border-green-500/30',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

export function BookingManager() {
  const { data: bookings, isLoading } = useAllBookings();
  const updateStatus = useUpdateBookingStatus();
  
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleOpenUpdate = (booking: any) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setAdminNotes(booking.admin_notes || '');
  };

  const handleUpdateStatus = () => {
    if (!selectedBooking) return;
    
    updateStatus.mutate({
      id: selectedBooking.id,
      status: newStatus,
      admin_notes: adminNotes,
    }, {
      onSuccess: () => setSelectedBooking(null),
    });
  };

  const pendingCount = bookings?.filter(b => b.status === 'pending').length || 0;

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
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-semibold">Booking Requests</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </div>
      </div>

      {bookings?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No booking requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking, index) => {
            const StatusIcon = statusIcons[booking.status] || AlertCircle;
            
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[booking.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {booking.status}
                          </Badge>
                          <Badge variant="outline">{booking.ceremony_type}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                          </div>
                          {booking.booking_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.booking_time}</span>
                            </div>
                          )}
                          {booking.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.profiles?.name || 'Unknown'}</span>
                          </div>
                          {booking.profiles?.mobile && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.profiles.mobile}</span>
                            </div>
                          )}
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{booking.pandits?.name || 'Unknown Pandit'}</span>
                        </div>
                        
                        {booking.message && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            "{booking.message}"
                          </p>
                        )}
                        
                        {booking.admin_notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Admin notes: {booking.admin_notes}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUpdate(booking)}
                      >
                        Update
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this booking..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}