import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays } from 'date-fns';
import { Bed, Users, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Room, useCreateRoomBooking } from '@/hooks/useRoomBooking';

const bookingSchema = z.object({
  num_guests: z.number().min(1, 'At least 1 guest required'),
  guest_names: z.string().optional(),
  special_requests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface RoomBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
}

export function RoomBookingModal({
  open,
  onOpenChange,
  room,
  checkInDate,
  checkOutDate,
  nights,
}: RoomBookingModalProps) {
  const createBooking = useCreateRoomBooking();
  const roomType = room.room_types;
  const pricePerNight = roomType?.price_per_night || 0;
  const totalAmount = pricePerNight * nights;
  const maxGuests = roomType?.capacity || 2;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      num_guests: 1,
      guest_names: '',
      special_requests: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    const guestNamesArray = data.guest_names
      ? data.guest_names.split(',').map(name => name.trim()).filter(Boolean)
      : undefined;

    await createBooking.mutateAsync({
      room_id: room.id,
      check_in_date: format(checkInDate, 'yyyy-MM-dd'),
      check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
      num_guests: data.num_guests,
      guest_names: guestNamesArray,
      total_amount: totalAmount,
      special_requests: data.special_requests || undefined,
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Book Room {room.room_number}
          </DialogTitle>
          <DialogDescription>
            {roomType?.name} - {roomType?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Booking Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>Check-in</span>
            </div>
            <span className="font-medium">{format(checkInDate, 'EEE, dd MMM yyyy')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>Check-out</span>
            </div>
            <span className="font-medium">{format(checkOutDate, 'EEE, dd MMM yyyy')}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">Duration</span>
            <Badge variant="secondary">{nights} Night{nights > 1 ? 's' : ''}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Rate</span>
            <span>₹{pricePerNight} × {nights} nights</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Amount</span>
            <span className="text-primary">₹{totalAmount}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="num_guests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Number of Guests *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxGuests}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Maximum {maxGuests} guests allowed</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guest_names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Names (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter names separated by commas"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or requests..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
