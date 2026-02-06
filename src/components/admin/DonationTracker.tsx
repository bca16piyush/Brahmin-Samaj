import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Check, Clock, Phone, MapPin, Home, Gift, CheckCircle, BarChart3, Printer, Trash2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInKindDonations, useUpdateDonationStatus } from '@/hooks/useAdmin';
import { useDeleteInKindDonation } from '@/hooks/useDeleteOperations';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { PrintableReport, printReport } from './PrintableReport';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function ItemSummary({ donations }: { donations: any[] }) {
  const itemSummary = useMemo(() => {
    const summary: Record<string, { pledged: number; received: number; quantities: string[] }> = {};
    
    donations.forEach((d) => {
      if (!summary[d.item_type]) {
        summary[d.item_type] = { pledged: 0, received: 0, quantities: [] };
      }
      if (d.status === 'pledged') {
        summary[d.item_type].pledged += 1;
      } else if (d.status === 'received') {
        summary[d.item_type].received += 1;
      }
      summary[d.item_type].quantities.push(d.quantity);
    });
    
    return summary;
  }, [donations]);

  if (Object.keys(itemSummary).length === 0) return null;

  return (
    <Card className="border-border shadow-temple mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Items Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(itemSummary).map(([item, data]) => (
            <div key={item} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="font-medium text-sm text-foreground">{item}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold">
                  {data.pledged} pending
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                  {data.received} received
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DonationSummary({ donations }: { donations: any[] }) {
  const totalDonations = donations.length;
  const pledgedCount = donations.filter((d) => d.status === 'pledged').length;
  const receivedCount = donations.filter((d) => d.status === 'received').length;
  const uniqueDonors = [...new Set(donations.map((d) => d.user_id))].length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-border shadow-temple">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalDonations}</p>
          <p className="text-xs text-muted-foreground">Total Donations</p>
        </CardContent>
      </Card>
      <Card className="border-border shadow-temple">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <p className="text-2xl font-bold text-foreground">{pledgedCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>
      <Card className="border-border shadow-temple">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{receivedCount}</p>
          <p className="text-xs text-muted-foreground">Received</p>
        </CardContent>
      </Card>
      <Card className="border-border shadow-temple">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{uniqueDonors}</p>
          <p className="text-xs text-muted-foreground">Unique Donors</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function DonationTracker() {
  const { data: donations, isLoading } = useInKindDonations();
  const updateStatus = useUpdateDonationStatus();
  const deleteDonation = useDeleteInKindDonation();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);

  const handleMarkReceived = (id: string) => {
    updateStatus.mutate({ id, status: 'received' });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDonation.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleSendReceipt = async (donation: any) => {
    setSendingReceipt(donation.id);
    try {
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          type: 'announcement',
          userId: donation.user_id,
          title: '🎁 Donation Receipt',
          body: `Thank you ${donation.profiles?.name || 'dear donor'}! Your pledge of ${donation.item_type} (${donation.quantity}) has been recorded. Status: ${donation.status}. Drop-off: ${donation.dropoff_location}.\n\nReceipt generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}.`,
        },
      });
      toast({
        title: 'Receipt Sent',
        description: 'Donation receipt has been sent via WhatsApp.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Send Receipt',
        description: 'Could not send receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingReceipt(null);
    }
  };

  const pledgedCount = donations?.filter((d) => d.status === 'pledged').length || 0;
  const receivedCount = donations?.filter((d) => d.status === 'received').length || 0;
  const uniqueDonors = [...new Set(donations?.map((d) => d.user_id) || [])].length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donations?.length) {
    return (
      <div>
        <DonationSummary donations={[]} />
        <Card className="border-border shadow-temple">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No in-kind donations yet</p>
          </CardContent>
        </Card>
      </div>
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">In-Kind Donations</h2>
        <Button variant="outline" size="sm" onClick={() => printReport(printRef)} className="gap-2">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </div>

      <DonationSummary donations={donations} />
      <ItemSummary donations={donations} />
      
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(donation.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendReceipt(donation)}
                      disabled={sendingReceipt === donation.id}
                      title="Send Receipt"
                    >
                      <Receipt className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(donation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{donation.dropoff_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Pledged: {format(new Date(donation.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {(donation.donor_phone || donation.profiles?.mobile) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{donation.donor_phone || donation.profiles?.mobile}</span>
                    </div>
                  )}
                  {donation.donor_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <Home className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{donation.donor_address}</span>
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Donation"
        description="Are you sure you want to delete this donation record? This action cannot be undone."
        isLoading={deleteDonation.isPending}
      />

      {/* Printable Report */}
      <div className="hidden">
        <PrintableReport
          ref={printRef}
          title="In-Kind Donations Report"
          subtitle={`Total ${donations?.length || 0} donations`}
          stats={[
            { label: 'Total Donations', value: donations?.length || 0 },
            { label: 'Pending', value: pledgedCount },
            { label: 'Received', value: receivedCount },
            { label: 'Unique Donors', value: uniqueDonors },
          ]}
        >
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Donor</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Drop-off Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donations?.map((donation) => (
                <tr key={donation.id}>
                  <td>{format(new Date(donation.created_at), 'dd MMM yyyy')}</td>
                  <td>{donation.profiles?.name || 'Anonymous'}</td>
                  <td>{donation.item_type}</td>
                  <td>{donation.quantity}</td>
                  <td>{donation.dropoff_location}</td>
                  <td>
                    <span className={`badge badge-${donation.status}`}>
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintableReport>
      </div>
    </div>
  );
}
