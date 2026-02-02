import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Users, Bed, Search, MapPin, Wifi, Tv, Wind, Droplet } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRoomTypes, useAvailableRooms, Room } from '@/hooks/useRoomBooking';
import { useAuth } from '@/contexts/AuthContext';
import { RoomBookingModal } from '@/components/rooms/RoomBookingModal';
import { MyRoomBookings } from '@/components/rooms/MyRoomBookings';
import { LockedContent } from '@/components/shared/LockedContent';

const amenityIcons: Record<string, React.ReactNode> = {
  'AC': <Wind className="h-4 w-4" />,
  'TV': <Tv className="h-4 w-4" />,
  'Hot Water': <Droplet className="h-4 w-4" />,
  'WiFi': <Wifi className="h-4 w-4" />,
};

export default function Rooms() {
  const { isAuthenticated, isVerified } = useAuth();
  const { data: roomTypes, isLoading: loadingTypes } = useRoomTypes();
  
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const checkInStr = checkInDate ? format(checkInDate, 'yyyy-MM-dd') : null;
  const checkOutStr = checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : null;
  
  const { data: availableRooms, isLoading: loadingRooms } = useAvailableRooms(checkInStr, checkOutStr);

  const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  // Group available rooms by room type
  const roomsByType = availableRooms?.reduce((acc, room) => {
    const typeId = room.room_type_id;
    if (!acc[typeId]) {
      acc[typeId] = {
        type: room.room_types,
        rooms: [],
      };
    }
    acc[typeId].rooms.push(room);
    return acc;
  }, {} as Record<string, { type: any; rooms: Room[] }>) || {};

  return (
    <Layout>
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Room Booking
            </h1>
            <p className="text-muted-foreground">
              Book accommodation for your visit to the temple
            </p>
          </motion.div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Available Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkInDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={(date) => {
                          setCheckInDate(date);
                          if (date && checkOutDate && date >= checkOutDate) {
                            setCheckOutDate(undefined);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkOutDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => !checkInDate || date <= checkInDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end">
                  <div className="w-full text-center p-3 bg-muted rounded-lg">
                    {nights > 0 ? (
                      <span className="font-semibold">{nights} Night{nights > 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-muted-foreground">Select dates</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Types Overview (when no dates selected) */}
          {!checkInDate || !checkOutDate ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Our Accommodations</h2>
              {loadingTypes ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {roomTypes?.map((type) => (
                    <Card key={type.id} className="overflow-hidden">
                      <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Bed className="h-16 w-16 text-primary/40" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Up to {type.capacity} guests</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {type.amenities?.slice(0, 4).map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              {amenityIcons[amenity] || null}
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <span className="text-2xl font-bold">₹{type.price_per_night}</span>
                            <span className="text-muted-foreground">/night</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Available Rooms (when dates selected) */
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Available Rooms ({format(checkInDate, 'dd MMM')} - {format(checkOutDate, 'dd MMM')})
              </h2>
              
              {loadingRooms ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : Object.keys(roomsByType).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(roomsByType).map(([typeId, { type, rooms }]) => (
                    <Card key={typeId}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{type?.name}</CardTitle>
                            <CardDescription>{type?.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">₹{type?.price_per_night}</div>
                            <div className="text-sm text-muted-foreground">per night</div>
                            <div className="text-lg font-semibold text-primary mt-1">
                              Total: ₹{(type?.price_per_night || 0) * nights}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {type?.amenities?.map((amenity: string) => (
                            <Badge key={amenity} variant="secondary" className="gap-1">
                              {amenityIcons[amenity] || null}
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Users className="h-4 w-4" />
                          <span>Capacity: Up to {type?.capacity} guests</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium mr-2">Available Rooms:</span>
                          {rooms.map((room) => (
                            <Badge 
                              key={room.id} 
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => handleBookRoom(room)}
                            >
                              {room.room_number}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        {isVerified ? (
                          <Button 
                            className="w-full"
                            onClick={() => handleBookRoom(rooms[0])}
                          >
                            Book Now - ₹{(type?.price_per_night || 0) * nights} for {nights} night{nights > 1 ? 's' : ''}
                          </Button>
                        ) : (
                          <LockedContent message="Only verified community members can book rooms">
                            <Button className="w-full" disabled>Book Now</Button>
                          </LockedContent>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bed className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No rooms available for the selected dates. Please try different dates.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* My Bookings Section */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <MyRoomBookings />
            </motion.div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {selectedRoom && checkInDate && checkOutDate && (
        <RoomBookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          room={selectedRoom}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          nights={nights}
        />
      )}
    </Layout>
  );
}
