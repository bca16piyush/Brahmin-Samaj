import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Building2, Bed, Users, Plus, Upload, Search, ArrowRightLeft, X, MapPin, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  useAccommodationLocations,
  useAccommodationRooms,
  useRoomAllocations,
  useCreateLocation,
  useAllocateRoom,
  useSwapRoom,
  useCancelAllocation,
  useBulkImportRooms,
  useAvailableRoomsForDates,
} from '@/hooks/useAccommodation';
import { useRoomTypes } from '@/hooks/useRoomBooking';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-600 border-green-500/20',
  occupied: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
};

export function AccommodationManager() {
  const { data: locations, isLoading: loadingLocs } = useAccommodationLocations();
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const { data: rooms, isLoading: loadingRooms } = useAccommodationRooms(selectedLocation === 'all' ? undefined : selectedLocation);
  const { data: allocations } = useRoomAllocations();
  const { data: roomTypes } = useRoomTypes();
  const createLocation = useCreateLocation();
  const allocateRoom = useAllocateRoom();
  const swapRoom = useSwapRoom();
  const cancelAllocation = useCancelAllocation();
  const bulkImport = useBulkImportRooms();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocAddr, setNewLocAddr] = useState('');
  const [allocUserId, setAllocUserId] = useState('');
  const [allocRoomId, setAllocRoomId] = useState('');
  const [allocNotes, setAllocNotes] = useState('');
  const [allocCheckIn, setAllocCheckIn] = useState<Date | undefined>();
  const [allocCheckOut, setAllocCheckOut] = useState<Date | undefined>();
  const [allocLocationFilter, setAllocLocationFilter] = useState<string>('all');
  const [swapAllocationId, setSwapAllocationId] = useState('');
  const [swapNewRoomId, setSwapNewRoomId] = useState('');
  const [swapUserId, setSwapUserId] = useState('');
  const [swapCheckIn, setSwapCheckIn] = useState<Date | undefined>();
  const [swapCheckOut, setSwapCheckOut] = useState<Date | undefined>();
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date-based available rooms for allocation
  const checkInStr = allocCheckIn ? format(allocCheckIn, 'yyyy-MM-dd') : undefined;
  const checkOutStr = allocCheckOut ? format(allocCheckOut, 'yyyy-MM-dd') : undefined;
  const { data: availableRoomsForDates } = useAvailableRoomsForDates(
    checkInStr, checkOutStr,
    allocLocationFilter === 'all' ? undefined : allocLocationFilter
  );

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Stats
  const totalRooms = rooms?.length || 0;
  const occupiedRooms = rooms?.filter(r => (r as any).status === 'occupied').length || 0;
  const availableRooms = rooms?.filter(r => (r as any).status === 'available').length || 0;

  // Location stats
  const locationStats = (locations || []).map(loc => {
    const locRooms = rooms?.filter(r => r.location_id === loc.id) || [];
    return {
      ...loc,
      total: locRooms.length,
      occupied: locRooms.filter(r => (r as any).status === 'occupied').length,
      available: locRooms.filter(r => (r as any).status === 'available').length,
    };
  });

  // Filtered & paginated rooms
  const filteredRooms = (rooms || []).filter(r =>
    r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r as any).ac_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r as any).status?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedRooms = filteredRooms.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredRooms.length / pageSize);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) { setUserSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, name, mobile')
      .or(`name.ilike.%${query}%,mobile.ilike.%${query}%`)
      .limit(10);
    setUserSearchResults(data || []);
  }, []);

  // Handle bulk import CSV
  const handleBulkImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedLocation || selectedLocation === 'all') {
      toast({ title: 'Select a location first', variant: 'destructive' });
      return;
    }

    const defaultRoomTypeId = roomTypes?.[0]?.id;
    if (!defaultRoomTypeId) {
      toast({ title: 'No room types available. Create one first.', variant: 'destructive' });
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Support "Property Name" column - if present, match to location or use selected
      const propertyIdx = headers.findIndex(h => h.includes('property') || h.includes('location'));
      const roomNumberIdx = headers.findIndex(h => (h.includes('room') && h.includes('no')) || h.includes('room_number') || h === 'room');
      const capacityIdx = headers.findIndex(h => h.includes('capacity') || h.includes('beds') || h.includes('pax'));
      const acIdx = headers.findIndex(h => h.includes('ac') || h.includes('type'));
      const floorIdx = headers.findIndex(h => h.includes('floor'));

      if (roomNumberIdx === -1) {
        toast({ title: 'CSV must have a "Room No" or "room_number" column', variant: 'destructive' });
        return;
      }

      // Build location lookup map
      const locationMap = new Map((locations || []).map(l => [l.name.toLowerCase().trim(), l.id]));

      const roomsToImport = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        // Try to match property name to a location
        let locId = selectedLocation;
        if (propertyIdx !== -1 && cols[propertyIdx]) {
          const matched = locationMap.get(cols[propertyIdx].toLowerCase().trim());
          if (matched) locId = matched;
        }

        return {
          room_number: cols[roomNumberIdx] || '',
          location_id: locId,
          capacity: parseInt(cols[capacityIdx] || '2') || 2,
          ac_type: cols[acIdx]?.toLowerCase().includes('ac') && !cols[acIdx]?.toLowerCase().includes('non') ? 'ac' : 'non_ac',
          floor: parseInt(cols[floorIdx] || '1') || 1,
          room_type_id: defaultRoomTypeId,
        };
      }).filter(r => r.room_number);

      if (roomsToImport.length === 0) {
        toast({ title: 'No valid rooms found in file', variant: 'destructive' });
        return;
      }

      bulkImport.mutate(roomsToImport);
      setShowBulkImport(false);
    } catch (err) {
      toast({ title: 'Import Error', description: 'Failed to parse file', variant: 'destructive' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedLocation, roomTypes, locations, bulkImport, toast]);

  const handleAllocate = () => {
    if (!allocUserId || !allocRoomId || !allocCheckIn || !allocCheckOut) return;
    allocateRoom.mutate({
      room_id: allocRoomId,
      user_id: allocUserId,
      check_in_date: format(allocCheckIn, 'yyyy-MM-dd'),
      check_out_date: format(allocCheckOut, 'yyyy-MM-dd'),
      notes: allocNotes,
    });
    setShowAllocate(false);
    setAllocUserId(''); setAllocRoomId(''); setAllocNotes('');
    setAllocCheckIn(undefined); setAllocCheckOut(undefined);
    setUserSearchResults([]); setUserSearchQuery('');
  };

  const handleSwap = () => {
    if (!swapAllocationId || !swapNewRoomId || !swapUserId) return;
    swapRoom.mutate({
      oldAllocationId: swapAllocationId,
      newRoomId: swapNewRoomId,
      userId: swapUserId,
      checkInDate: swapCheckIn ? format(swapCheckIn, 'yyyy-MM-dd') : undefined,
      checkOutDate: swapCheckOut ? format(swapCheckOut, 'yyyy-MM-dd') : undefined,
    });
    setShowSwap(false);
    setSwapAllocationId(''); setSwapNewRoomId(''); setSwapUserId('');
    setSwapCheckIn(undefined); setSwapCheckOut(undefined);
  };

  if (loadingLocs || loadingRooms) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalRooms}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupied Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{occupiedRooms}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{availableRooms}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{locations?.length || 0}</div></CardContent>
        </Card>
      </div>

      {/* Location breakdown */}
      {locationStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {locationStats.map(loc => (
            <Card key={loc.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedLocation(loc.id)}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{loc.name}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Total: <b className="text-foreground">{loc.total}</b></span>
                  <span>Occupied: <b className="text-blue-600">{loc.occupied}</b></span>
                  <span>Available: <b className="text-green-600">{loc.available}</b></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2"><Bed className="h-4 w-4" />Rooms</TabsTrigger>
          <TabsTrigger value="allocations" className="gap-2"><Users className="h-4 w-4" />Allocations</TabsTrigger>
          <TabsTrigger value="locations" className="gap-2"><Building2 className="h-4 w-4" />Properties</TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Room Inventory</CardTitle>
                <CardDescription>{filteredRooms.length} rooms</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-[200px]" />
                </div>

                {/* Assign Room Dialog */}
                <Dialog open={showAllocate} onOpenChange={(o) => { setShowAllocate(o); if (!o) { setAllocCheckIn(undefined); setAllocCheckOut(undefined); setAllocRoomId(''); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Assign Room</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Room to User</DialogTitle>
                      <DialogDescription>Select dates first — only rooms available for those dates will be shown</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {/* User Search */}
                      <div className="space-y-2">
                        <Label>Search User</Label>
                        <Input placeholder="Name or mobile..." value={userSearchQuery} onChange={e => searchUsers(e.target.value)} />
                        {userSearchResults.length > 0 && (
                          <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                            {userSearchResults.map(u => (
                              <button key={u.id} onClick={() => { setAllocUserId(u.id); setUserSearchQuery(u.name); setUserSearchResults([]); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${allocUserId === u.id ? 'bg-primary/10' : ''}`}>
                                {u.name} <span className="text-muted-foreground">({u.mobile})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Check-in Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !allocCheckIn && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {allocCheckIn ? format(allocCheckIn, "dd MMM yyyy") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={allocCheckIn} onSelect={setAllocCheckIn} initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Check-out Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !allocCheckOut && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {allocCheckOut ? format(allocCheckOut, "dd MMM yyyy") : "Select"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={allocCheckOut} onSelect={setAllocCheckOut}
                                disabled={(date) => allocCheckIn ? date <= allocCheckIn : false}
                                initialFocus className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Property filter */}
                      <div className="space-y-2">
                        <Label>Filter by Property</Label>
                        <Select value={allocLocationFilter} onValueChange={setAllocLocationFilter}>
                          <SelectTrigger><SelectValue placeholder="All Properties" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Properties</SelectItem>
                            {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Available Room */}
                      <div className="space-y-2">
                        <Label>Available Room {allocCheckIn && allocCheckOut ? `(${availableRoomsForDates?.length || 0} available)` : ''}</Label>
                        <Select value={allocRoomId} onValueChange={setAllocRoomId} disabled={!allocCheckIn || !allocCheckOut}>
                          <SelectTrigger><SelectValue placeholder={allocCheckIn && allocCheckOut ? "Select room..." : "Select dates first"} /></SelectTrigger>
                          <SelectContent>
                            {(availableRoomsForDates || []).map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.room_number} - {(r as any).accommodation_locations?.name || 'Unknown'} ({(r as any).ac_type === 'ac' ? 'AC' : 'Non-AC'}, {r.capacity || 2} pax)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea value={allocNotes} onChange={e => setAllocNotes(e.target.value)} />
                      </div>
                      <Button onClick={handleAllocate} className="w-full" disabled={!allocUserId || !allocRoomId || !allocCheckIn || !allocCheckOut}>
                        Assign Room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Bulk Import Dialog */}
                <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2"><Upload className="h-4 w-4" />Bulk Import</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Import Rooms</DialogTitle>
                      <DialogDescription>Upload a CSV with columns: Property Name, Room No, Type, Capacity</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {selectedLocation === 'all' && (
                        <div className="space-y-2">
                          <Label>Default Property (if not in CSV)</Label>
                          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger><SelectValue placeholder="Choose property" /></SelectTrigger>
                            <SelectContent>
                              {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">Upload CSV file</p>
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleBulkImport} className="hidden" />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CSV format: Property Name (optional), Room No, Capacity, AC Type (AC/Non-AC), Floor
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room #</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRooms.map(room => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell className="text-sm">{(room as any).accommodation_locations?.name || '-'}</TableCell>
                        <TableCell>{(room as any).capacity || 2} pax</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {(room as any).ac_type === 'ac' ? 'AC' : 'Non-AC'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[(room as any).status || 'available'] || ''}>
                            {((room as any).status || 'available').charAt(0).toUpperCase() + ((room as any).status || 'available').slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Room Allocations</CardTitle>
                <CardDescription>Current and past room assignments with dates</CardDescription>
              </div>
              <Dialog open={showSwap} onOpenChange={setShowSwap}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2"><ArrowRightLeft className="h-4 w-4" />Swap Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Swap/Change Room</DialogTitle>
                    <DialogDescription>Move a user from one room to another with new dates</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Current Allocation</Label>
                      <Select value={swapAllocationId} onValueChange={(v) => {
                        setSwapAllocationId(v);
                        const alloc = allocations?.find(a => a.id === v);
                        if (alloc) {
                          setSwapUserId(alloc.user_id);
                          if (alloc.check_in_date) setSwapCheckIn(new Date(alloc.check_in_date));
                          if (alloc.check_out_date) setSwapCheckOut(new Date(alloc.check_out_date));
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select current assignment..." /></SelectTrigger>
                        <SelectContent>
                          {allocations?.filter(a => a.status === 'active').map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {(a as any).profile?.name || 'Unknown'} → Room {(a as any).rooms?.room_number}
                              {a.check_in_date && ` (${a.check_in_date} to ${a.check_out_date})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>New Check-in</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !swapCheckIn && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {swapCheckIn ? format(swapCheckIn, "dd MMM") : "Select"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={swapCheckIn} onSelect={setSwapCheckIn} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>New Check-out</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !swapCheckOut && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {swapCheckOut ? format(swapCheckOut, "dd MMM") : "Select"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={swapCheckOut} onSelect={setSwapCheckOut}
                              disabled={(d) => swapCheckIn ? d <= swapCheckIn : false}
                              initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>New Room</Label>
                      <Select value={swapNewRoomId} onValueChange={setSwapNewRoomId}>
                        <SelectTrigger><SelectValue placeholder="Select new room..." /></SelectTrigger>
                        <SelectContent>
                          {(rooms || []).filter(r => (r as any).status === 'available').map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.room_number} - {(r as any).accommodation_locations?.name || 'Unknown'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSwap} className="w-full" disabled={!swapAllocationId || !swapNewRoomId}>
                      Confirm Swap
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
                      <TableHead>User</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations?.map(alloc => {
                      const today = new Date().toISOString().split('T')[0];
                      const isCurrentlyActive = alloc.status === 'active' &&
                        (!alloc.check_in_date || alloc.check_in_date <= today) &&
                        (!alloc.check_out_date || alloc.check_out_date > today);

                      return (
                        <TableRow key={alloc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{(alloc as any).profile?.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{(alloc as any).profile?.mobile}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{(alloc as any).rooms?.room_number || '-'}</TableCell>
                          <TableCell className="text-sm">{(alloc as any).rooms?.accommodation_locations?.name || '-'}</TableCell>
                          <TableCell className="text-sm">{alloc.check_in_date || '-'}</TableCell>
                          <TableCell className="text-sm">{alloc.check_out_date || '-'}</TableCell>
                          <TableCell>
                            {alloc.status === 'active' ? (
                              <Badge variant="outline" className={isCurrentlyActive ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                                {isCurrentlyActive ? 'Active' : 'Scheduled'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                {alloc.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {alloc.status === 'active' && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelAllocation.mutate(alloc.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!allocations || allocations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No allocations yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Manage event venues and lodging areas</CardDescription>
              </div>
              <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Property</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Property</DialogTitle>
                    <DialogDescription>Add a new venue or lodging area</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="e.g., Hotel Pushkar Palace" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={newLocDesc} onChange={e => setNewLocDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={newLocAddr} onChange={e => setNewLocAddr(e.target.value)} />
                    </div>
                    <Button onClick={() => {
                      if (newLocName) {
                        createLocation.mutate({ name: newLocName, description: newLocDesc, address: newLocAddr });
                        setShowAddLocation(false);
                        setNewLocName(''); setNewLocDesc(''); setNewLocAddr('');
                      }
                    }} className="w-full">Create Property</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locations?.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{loc.name}</span>
                        {!loc.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      {loc.address && <p className="text-xs text-muted-foreground mt-1">{loc.address}</p>}
                      {loc.description && <p className="text-sm text-muted-foreground mt-1">{loc.description}</p>}
                    </div>
                  </div>
                ))}
                {(!locations || locations.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No properties yet. Add one to get started.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
