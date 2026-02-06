import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Bed, CalendarCheck, Users, Ban, DollarSign, Plus, Lock, Unlock, Calendar, Mail, Image, Printer, Trash2, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RoomTypeImageUpload } from './RoomTypeImageUpload';
import { useDeleteRoomBooking, useDeleteRoom } from '@/hooks/useDeleteOperations';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { PrintableReport, printReport } from './PrintableReport';
import {
  useRooms,
  useRoomTypes,
  useAllRoomBookings,
  useUpdateBookingStatus,
  useToggleRoomBlock,
  useUpdateRoomTypePrice,
  useCreateRoom,
  BookingStatus,
} from '@/hooks/useRoomBooking';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
  checked_in: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  checked_out: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
};

export function RoomManager() {
  const { data: rooms, isLoading: loadingRooms } = useRooms();
  const { data: roomTypes, isLoading: loadingTypes } = useRoomTypes();
  const { data: bookings, isLoading: loadingBookings } = useAllRoomBookings();
  const updateStatus = useUpdateBookingStatus();
  const toggleBlock = useToggleRoomBlock();
  const updatePrice = useUpdateRoomTypePrice();
  const createRoom = useCreateRoom();
  const deleteRoomBooking = useDeleteRoomBooking();
  const deleteRoom = useDeleteRoom();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');
  const [blockingRoom, setBlockingRoom] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockUntil, setBlockUntil] = useState<Date | undefined>();
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<string | null>(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<string | null>(null);

  // Today's arrivals
  const todayArrivals = bookings?.filter(b => 
    isToday(new Date(b.check_in_date)) && 
    (b.status === 'confirmed' || b.status === 'pending')
  ) || [];

  // Tomorrow's arrivals
  const tomorrowArrivals = bookings?.filter(b => 
    isTomorrow(new Date(b.check_in_date)) && 
    (b.status === 'confirmed' || b.status === 'pending')
  ) || [];

  // Stats
  const totalRooms = rooms?.length || 0;
  const blockedRooms = rooms?.filter(r => r.is_blocked).length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
  const occupiedRooms = bookings?.filter(b => b.status === 'checked_in').length || 0;

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    updateStatus.mutate({ id, status });
    
    // Send email notification for status changes
    const notificationType = status === 'confirmed' ? 'booking_confirmed' 
      : status === 'cancelled' ? 'booking_cancelled'
      : status === 'checked_in' ? 'checked_in'
      : status === 'checked_out' ? 'checked_out'
      : null;
    
    if (notificationType) {
      setSendingNotification(id);
      try {
        await supabase.functions.invoke('send-room-booking-notification', {
          body: { type: notificationType, bookingId: id },
        });
        toast({
          title: 'Notification Sent',
          description: `Email notification sent to guest.`,
        });
      } catch (err) {
        console.error('Failed to send notification:', err);
      } finally {
        setSendingNotification(null);
      }
    }
  };
  const handleBlockRoom = (roomId: string) => {
    toggleBlock.mutate({
      id: roomId,
      is_blocked: true,
      blocked_reason: blockReason,
      blocked_until: blockUntil ? format(blockUntil, 'yyyy-MM-dd') : undefined,
    });
    setBlockingRoom(null);
    setBlockReason('');
    setBlockUntil(undefined);
  };

  const handleUnblockRoom = (roomId: string) => {
    toggleBlock.mutate({ id: roomId, is_blocked: false });
  };

  const handleUpdatePrice = (typeId: string) => {
    const price = parseFloat(newPrice);
    if (price > 0) {
      updatePrice.mutate({ id: typeId, price_per_night: price });
      setEditingPrice(null);
      setNewPrice('');
    }
  };

  const handleAddRoom = () => {
    if (newRoomTypeId && newRoomNumber) {
      createRoom.mutate({
        room_type_id: newRoomTypeId,
        room_number: newRoomNumber,
        floor: parseInt(newRoomFloor) || 1,
      });
      setShowAddRoom(false);
      setNewRoomTypeId('');
      setNewRoomNumber('');
      setNewRoomFloor('1');
    }
  };

  if (loadingRooms || loadingTypes || loadingBookings) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground">{blockedRooms} blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedRooms}</div>
            <p className="text-xs text-muted-foreground">Currently checked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayArrivals.length}</div>
            <p className="text-xs text-muted-foreground">{tomorrowArrivals.length} tomorrow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Arrivals Alert */}
      {todayArrivals.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Today's Arrivals ({format(new Date(), 'dd MMM yyyy')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayArrivals.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <span className="font-medium">Room {booking.rooms?.room_number}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span>{booking.num_guests} guest(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                    {booking.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(booking.id, 'checked_in')}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2">
            <Bed className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Manage room reservations and guest check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.rooms?.room_number}</div>
                              <div className="text-xs text-muted-foreground">
                                {booking.rooms?.room_types?.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(booking.check_in_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{format(new Date(booking.check_out_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{booking.num_guests}</TableCell>
                          <TableCell className="font-medium">₹{booking.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[booking.status]}>
                              {statusLabels[booking.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => handleStatusChange(booking.id, value as BookingStatus)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirm</SelectItem>
                                <SelectItem value="checked_in">Check In</SelectItem>
                                <SelectItem value="checked_out">Check Out</SelectItem>
                                <SelectItem value="cancelled">Cancel</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Room Management</CardTitle>
                <CardDescription>View and manage individual rooms</CardDescription>
              </div>
              <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>Create a new room in the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select value={newRoomTypeId} onValueChange={setNewRoomTypeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Room Number</Label>
                      <Input 
                        value={newRoomNumber} 
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        placeholder="e.g., 101, A-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Floor</Label>
                      <Input 
                        type="number"
                        value={newRoomFloor} 
                        onChange={(e) => setNewRoomFloor(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddRoom} className="w-full">
                      Add Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms?.map((room) => (
                      <TableRow key={room.id} className={room.is_blocked ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell>{room.room_types?.name}</TableCell>
                        <TableCell>{room.floor}</TableCell>
                        <TableCell>
                          {room.is_blocked ? (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                          {room.blocked_reason && (
                            <p className="text-xs text-muted-foreground mt-1">{room.blocked_reason}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {room.is_blocked ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnblockRoom(room.id)}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          ) : (
                            <Dialog 
                              open={blockingRoom === room.id} 
                              onOpenChange={(open) => !open && setBlockingRoom(null)}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setBlockingRoom(room.id)}
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  Block
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Block Room {room.room_number}</DialogTitle>
                                  <DialogDescription>
                                    Block this room for maintenance or other reasons
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Textarea 
                                      value={blockReason}
                                      onChange={(e) => setBlockReason(e.target.value)}
                                      placeholder="e.g., Plumbing maintenance"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Block Until (Optional)</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !blockUntil && "text-muted-foreground"
                                          )}
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          {blockUntil ? format(blockUntil, 'PPP') : 'No end date'}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                          mode="single"
                                          selected={blockUntil}
                                          onSelect={setBlockUntil}
                                          disabled={(date) => date < new Date()}
                                          initialFocus
                                          className="p-3 pointer-events-auto"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <Button 
                                    onClick={() => handleBlockRoom(room.id)}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    Block Room
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Room Types & Pricing</CardTitle>
              <CardDescription>Manage room type images and prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes?.map((type) => (
                  <Card key={type.id} className="overflow-hidden">
                    <div className="relative">
                      {type.image_url ? (
                        <img
                          src={type.image_url}
                          alt={type.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center">
                          <Image className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{type.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{type.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <Badge variant="secondary">{type.capacity} guests</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">Price/Night</span>
                        {editingPrice === type.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-24 h-8"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleUpdatePrice(type.id)}>
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingPrice(null);
                                setNewPrice('');
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">₹{type.price_per_night}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingPrice(type.id);
                                setNewPrice(type.price_per_night.toString());
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="text-sm font-medium mb-2 block">Room Image</Label>
                        <RoomTypeImageUpload 
                          roomTypeId={type.id} 
                          currentImageUrl={type.image_url} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
