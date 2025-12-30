import { motion } from 'framer-motion';
import { Package, Check, Clock, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInKindDonations, useUpdateDonationStatus } from '@/hooks/useAdmin';
import { format } from 'date-fns';

export function DonationTracker() {
  const { data: donations, isLoading } = useInKindDonations();
  const updateStatus = useUpdateDonationStatus();

  const handleMarkReceived = (id: string) => {
    updateStatus.mutate({ id, status: 'received' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donations?.length) {
    return (
      <Card className="border-border shadow-temple">
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No in-kind donations yet</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pledged':
        return <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">Pledged</Badge>;
      case 'received':
        return <Badge variant="default" className="bg-primary/10 text-primary">Received</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {donations.map((donation: any, index: number) => (
        <motion.div
          key={donation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border shadow-temple">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-heading">
                    {donation.item_type} - {donation.quantity}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    From: {donation.profiles?.name || 'Anonymous'}
                  </p>
                </div>
                {getStatusBadge(donation.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{donation.dropoff_location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Pledged: {format(new Date(donation.created_at), 'MMM d, yyyy')}</span>
                </div>
                {donation.profiles?.mobile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{donation.profiles.mobile}</span>
                  </div>
                )}
              </div>

              {donation.notes && (
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Notes:</strong> {donation.notes}
                </p>
              )}

              {donation.status === 'pledged' && (
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => handleMarkReceived(donation.id)}
                  disabled={updateStatus.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark as Received
                </Button>
              )}

              {donation.status === 'received' && donation.received_at && (
                <p className="text-sm text-primary">
                  ✓ Received on {format(new Date(donation.received_at), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
