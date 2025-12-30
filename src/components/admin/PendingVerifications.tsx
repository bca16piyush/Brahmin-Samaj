import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Phone, MapPin, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePendingVerifications, useApproveVerification, useRejectVerification } from '@/hooks/useAdmin';

export function PendingVerifications() {
  const { data: pendingUsers, isLoading } = usePendingVerifications();
  const approveVerification = useApproveVerification();
  const rejectVerification = useRejectVerification();
  
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (userId: string) => {
    approveVerification.mutate(userId);
  };

  const handleReject = () => {
    if (rejectDialog.userId && rejectionReason.trim()) {
      rejectVerification.mutate({
        userId: rejectDialog.userId,
        reason: rejectionReason,
      });
      setRejectDialog({ open: false, userId: null });
      setRejectionReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pendingUsers?.length) {
    return (
      <Card className="border-border shadow-temple">
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pending verification requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {pendingUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border shadow-temple">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">{user.name}</CardTitle>
                  <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Gotra: {user.gotra || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>Father: {user.father_name || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{user.native_village || 'Not specified'}</span>
                  </div>
                </div>
                
                {user.reference_person && (
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Reference:</strong> {user.reference_person} 
                    {user.reference_mobile && ` (${user.reference_mobile})`}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={approveVerification.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectDialog({ open: true, userId: user.id })}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  {user.mobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`tel:${user.mobile}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, userId: rejectDialog.userId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Input
                id="reason"
                placeholder="Enter reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This reason will be shown to the user
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectVerification.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
