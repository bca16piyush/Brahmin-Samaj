import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Bed, Users, Plus, Upload, Search, ArrowRightLeft, X, MapPin } from 'lucide-react';
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
  const [swapAllocationId, setSwapAllocationId] = useState('');
  const [swapNewRoomId, setSwapNewRoomId] = useState('');
  const [swapUserId, setSwapUserId] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle bulk import CSV/XLSX
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

      const roomNumberIdx = headers.findIndex(h => h.includes('room') && h.includes('no') || h.includes('room_number') || h === 'room');
      const capacityIdx = headers.findIndex(h => h.includes('capacity') || h.includes('beds'));
      const acIdx = headers.findIndex(h => h.includes('ac') || h.includes('type'));
      const floorIdx = headers.findIndex(h => h.includes('floor'));

      if (roomNumberIdx === -1) {
        toast({ title: 'CSV must have a "Room No" or "room_number" column', variant: 'destructive' });
        return;
      }

      const roomsToImport = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          room_number: cols[roomNumberIdx] || '',
          location_id: selectedLocation,
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
  }, [selectedLocation, roomTypes, bulkImport, toast]);

  // Available rooms for allocation
  const availableRoomsList = (rooms || []).filter(r => (r as any).status === 'available');

  const handleAllocate = () => {
    if (!allocUserId || !allocRoomId) return;
    allocateRoom.mutate({ room_id: allocRoomId, user_id: allocUserId, notes: allocNotes });
    setShowAllocate(false);
    setAllocUserId('');
    setAllocRoomId('');
    setAllocNotes('');
    setUserSearchResults([]);
    setUserSearchQuery('');
  };

  const handleSwap = () => {
    if (!swapAllocationId || !swapNewRoomId || !swapUserId) return;
    swapRoom.mutate({ oldAllocationId: swapAllocationId, newRoomId: swapNewRoomId, userId: swapUserId });
    setShowSwap(false);
    setSwapAllocationId('');
    setSwapNewRoomId('');
    setSwapUserId('');
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
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{occupiedRooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableRooms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations?.length || 0}</div>
          </CardContent>
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
          <TabsTrigger value="locations" className="gap-2"><Building2 className="h-4 w-4" />Locations</TabsTrigger>
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
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search rooms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-[200px]" />
                </div>
                <Dialog open={showAllocate} onOpenChange={setShowAllocate}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Assign Room</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Room to User</DialogTitle>
                      <DialogDescription>Search for a user and assign an available room</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
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
                      <div className="space-y-2">
                        <Label>Available Room</Label>
                        <Select value={allocRoomId} onValueChange={setAllocRoomId}>
                          <SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger>
                          <SelectContent>
                            {availableRoomsList.map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.room_number} - {(r as any).accommodation_locations?.name || 'Unknown'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea value={allocNotes} onChange={e => setAllocNotes(e.target.value)} />
                      </div>
                      <Button onClick={handleAllocate} className="w-full" disabled={!allocUserId || !allocRoomId}>
                        Assign Room
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2"><Upload className="h-4 w-4" />Bulk Import</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Import Rooms</DialogTitle>
                      <DialogDescription>Upload a CSV file with columns: Room No, Capacity, AC Type, Floor</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {selectedLocation === 'all' && (
                        <div className="space-y-2">
                          <Label>Select Location</Label>
                          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger><SelectValue placeholder="Choose location" /></SelectTrigger>
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
                        CSV format: Room No, Capacity, AC Type (AC/Non-AC), Floor
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
                      <TableHead>Location</TableHead>
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
                        <TableCell>{(room as any).capacity || 2}</TableCell>
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
                <CardDescription>Current and past room assignments</CardDescription>
              </div>
              <Dialog open={showSwap} onOpenChange={setShowSwap}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2"><ArrowRightLeft className="h-4 w-4" />Swap Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Swap/Change Room</DialogTitle>
                    <DialogDescription>Move a user from one room to another</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Current Allocation</Label>
                      <Select value={swapAllocationId} onValueChange={(v) => {
                        setSwapAllocationId(v);
                        const alloc = allocations?.find(a => a.id === v);
                        if (alloc) setSwapUserId(alloc.user_id);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select current assignment..." /></SelectTrigger>
                        <SelectContent>
                          {allocations?.filter(a => a.status === 'active').map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {(a as any).profile?.name || 'Unknown'} → Room {(a as any).rooms?.room_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>New Room</Label>
                      <Select value={swapNewRoomId} onValueChange={setSwapNewRoomId}>
                        <SelectTrigger><SelectValue placeholder="Select new room..." /></SelectTrigger>
                        <SelectContent>
                          {availableRoomsList.map(r => (
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
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations?.map(alloc => (
                      <TableRow key={alloc.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{(alloc as any).profile?.name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{(alloc as any).profile?.mobile}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{(alloc as any).rooms?.room_number || '-'}</TableCell>
                        <TableCell className="text-sm">{(alloc as any).rooms?.accommodation_locations?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alloc.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                            {alloc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alloc.status === 'active' && (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelAllocation.mutate(alloc.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!allocations || allocations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No allocations yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Accommodation Locations</CardTitle>
                <CardDescription>Manage event venues and lodging areas</CardDescription>
              </div>
              <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Location</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Location</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="e.g., Pushkar Ashram" />
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
                    }} className="w-full">Create Location</Button>
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
                  <div className="text-center py-8 text-muted-foreground">No locations yet. Add one to get started.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
