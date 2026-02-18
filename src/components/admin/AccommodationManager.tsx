import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Building2, Bed, Users, Plus, Upload, Search, ArrowRightLeft, X, MapPin, CalendarIcon, Trash2, AlertTriangle, RotateCcw, Download } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
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
  useDeleteLocation,
  useDeleteRooms,
  useResetInventory,
  useAdvancedBulkImport,
} from '@/hooks/useAccommodation';
import { useRoomTypes } from '@/hooks/useRoomBooking';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-600 border-green-500/20',
  occupied: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
};

// Parse dd.mm.yy date format to YYYY-MM-DD
function parseDateHeader(dateStr: string): string | null {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (!match) return null;
  const day = match[1];
  const month = match[2];
  let year = match[3];
  if (year.length === 2) year = '20' + year;
  return `${year}-${month}-${day}`;
}

// Generate a prefix from hotel name (e.g., "Hotel New Park" -> "NP")
function generatePrefix(name: string): string {
  const words = name.replace(/^(hotel|the|shri|shree)\s+/i, '').split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.slice(0, 2).toUpperCase() || 'RM';
}

// Parse date range from column header like "Rooms (05.03.26 to 20.04.26)"
function parseDateRange(header: string): { from: string; to: string } | null {
  const matches = header.match(/(\d{2}\.\d{2}\.\d{2,4})\s*to\s*(\d{2}\.\d{2}\.\d{2,4})/i);
  if (!matches) return null;
  const from = parseDateHeader(matches[1]);
  const to = parseDateHeader(matches[2]);
  if (!from || !to) return null;
  return { from, to };
}

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
  const deleteLocation = useDeleteLocation();
  const deleteRooms = useDeleteRooms();
  const resetInventory = useResetInventory();
  const advancedBulkImport = useAdvancedBulkImport();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
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

  // Delete state
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [deleteLocId, setDeleteLocId] = useState<string | null>(null);
  const [showDeleteRoomsConfirm, setShowDeleteRoomsConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Import preview state
  const [importPreview, setImportPreview] = useState<{
    newLocations: { name: string; address?: string; category?: string; feeding_system?: string }[];
    rooms: { room_number: string; location_id: string; capacity: number; ac_type: string; floor: number; room_type_id: string; available_from?: string; available_to?: string }[];
    summary: string[];
  } | null>(null);

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

  // Toggle room selection
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  };

  const toggleAllRooms = () => {
    if (selectedRoomIds.size === paginatedRooms.length) {
      setSelectedRoomIds(new Set());
    } else {
      setSelectedRoomIds(new Set(paginatedRooms.map(r => r.id)));
    }
  };

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

  // Advanced Import: parse Excel/CSV with date-range columns
  const handleAdvancedImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const defaultRoomTypeId = roomTypes?.[0]?.id;
    if (!defaultRoomTypeId) {
      toast({ title: 'No room types available. Create one first.', variant: 'destructive' });
      return;
    }

    try {
      // Parse file into a 2D array of rows
      let rows: string[][] = [];
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      if (isCSV) {
        const text = await file.text();
        // Parse CSV: handle quoted fields with commas
        rows = text.split(/\r?\n/).filter(line => line.trim()).map(line => {
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue; }
            current += ch;
          }
          cells.push(current.trim());
          return cells;
        });
      } else {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.default.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast({ title: 'No worksheet found', variant: 'destructive' });
          return;
        }
        worksheet.eachRow({ includeEmpty: false }, (row) => {
          const cells: string[] = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            while (cells.length < colNumber - 1) cells.push('');
            cells.push(String(cell.value || '').trim());
          });
          rows.push(cells);
        });
      }

      if (rows.length < 2) {
        toast({ title: 'File has no data rows', variant: 'destructive' });
        return;
      }

      // Headers from first row
      const headers = rows[0];

      // Identify columns
      const categoryIdx = headers.findIndex(h => /category/i.test(h));
      const hotelIdx = headers.findIndex(h => /hotel\s*name/i.test(h));
      const addressIdx = headers.findIndex(h => /address/i.test(h));
      const feedingIdx = headers.findIndex(h => /feeding/i.test(h));

      // Find date range columns
      const dateRangeColumns: { colIdx: number; from: string; to: string }[] = [];
      headers.forEach((h, idx) => {
        if (!h) return;
        const range = parseDateRange(h);
        if (range) dateRangeColumns.push({ colIdx: idx, ...range });
      });

      if (hotelIdx === -1) {
        toast({ title: 'Missing "Hotel Name" column in the file', variant: 'destructive' });
        return;
      }

      if (dateRangeColumns.length === 0) {
        toast({ title: 'No date range columns found (e.g., "Rooms (05.03.26 to 20.04.26)")', variant: 'destructive' });
        return;
      }

      // Build location lookup
      const existingLocMap = new Map((locations || []).map(l => [l.name.toLowerCase().trim(), l.id]));
      const newLocationsMap = new Map<string, { name: string; address?: string; category?: string; feeding_system?: string }>();
      const allRooms: typeof importPreview extends null ? never : NonNullable<typeof importPreview>['rooms'] = [];
      const summary: string[] = [];

      // Process data rows (skip header at index 0)
      for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const hotelName = (row[hotelIdx] || '').trim();
        if (!hotelName) continue;

        const address = addressIdx >= 0 ? (row[addressIdx] || '').trim() : '';
        const category = categoryIdx >= 0 ? (row[categoryIdx] || '').trim() : '';
        const feeding = feedingIdx >= 0 ? (row[feedingIdx] || '').trim() : '';

        let locationId = existingLocMap.get(hotelName.toLowerCase().trim());
        if (!locationId) {
          if (!newLocationsMap.has(hotelName.toLowerCase().trim())) {
            newLocationsMap.set(hotelName.toLowerCase().trim(), { name: hotelName, address, category, feeding_system: feeding });
          }
          locationId = 'NEW:' + hotelName;
        }

        const prefix = generatePrefix(hotelName);

        for (const drc of dateRangeColumns) {
          const cellValue = row[drc.colIdx] || '0';
          const numRooms = parseInt(cellValue);
          if (!numRooms || numRooms <= 0) continue;

          for (let i = 1; i <= numRooms; i++) {
            allRooms.push({
              room_number: `${prefix}-${String(i).padStart(3, '0')}`,
              location_id: locationId!,
              capacity: 2,
              ac_type: 'non_ac',
              floor: 1,
              room_type_id: defaultRoomTypeId,
              available_from: drc.from,
              available_to: drc.to,
            });
          }

          summary.push(`${hotelName}: ${numRooms} rooms (${drc.from} to ${drc.to})`);
        }
      }

      if (allRooms.length === 0) {
        toast({ title: 'No rooms found in the file. Check format.', variant: 'destructive' });
        return;
      }

      setImportPreview({
        newLocations: Array.from(newLocationsMap.values()),
        rooms: allRooms,
        summary,
      });

    } catch (err) {
      console.error('Import parse error:', err);
      toast({ title: 'Import Error', description: 'Failed to parse file. Ensure it is a valid Excel/CSV.', variant: 'destructive' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [roomTypes, locations, toast]);

  const confirmAdvancedImport = () => {
    if (!importPreview) return;
    advancedBulkImport.mutate({
      rooms: importPreview.rooms,
      newLocations: importPreview.newLocations,
    });
    setImportPreview(null);
    setShowAdvancedImport(false);
  };

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
                <CardDescription>{filteredRooms.length} rooms {selectedRoomIds.size > 0 && `(${selectedRoomIds.size} selected)`}</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedLocation} onValueChange={v => { setSelectedLocation(v); setPage(0); setSelectedRoomIds(new Set()); }}>
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

                {/* Export CSV */}
                <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                  const csvRows = [['Room Number', 'Property', 'Status', 'AC Type', 'Capacity', 'Floor', 'Available From', 'Available To']];
                  (filteredRooms || []).forEach((r: any) => {
                    csvRows.push([
                      r.room_number,
                      r.accommodation_locations?.name || '',
                      r.status || '',
                      r.ac_type || '',
                      String(r.capacity || ''),
                      String(r.floor || ''),
                      r.available_from || '',
                      r.available_to || '',
                    ]);
                  });
                  const csv = csvRows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `room-inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'Exported', description: `${filteredRooms.length} rooms exported as CSV.` });
                }}>
                  <Download className="h-4 w-4" />Export CSV
                </Button>

                {/* Import Inventory Dialog */}
                <Dialog open={showAdvancedImport} onOpenChange={(o) => { setShowAdvancedImport(o); if (!o) setImportPreview(null); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2"><Upload className="h-4 w-4" />Import Inventory</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Import Inventory from Excel</DialogTitle>
                      <DialogDescription>
                        Upload Excel with columns: Category, Hotel Name, Address, Feeding System Name, and date-range columns like "Rooms (05.03.26 to 20.04.26)"
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {!importPreview ? (
                        <>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-3">Upload Excel (.xlsx) or CSV (.csv) file</p>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleAdvancedImport} className="hidden" />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                          </div>
                          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">Expected format:</p>
                            <p>• <b>Hotel Name</b> → Creates/links to a property</p>
                            <p>• <b>Category</b> → Tags the property category</p>
                            <p>• <b>Rooms (dd.mm.yy to dd.mm.yy)</b> → Number of rooms for that date range</p>
                            <p>• Room numbers auto-generated (e.g., NP-001 to NP-038)</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2">Import Preview</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              <b>{importPreview.rooms.length}</b> rooms from <b>{importPreview.newLocations.length + (locations?.length || 0)}</b> properties
                            </p>
                            {importPreview.newLocations.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-foreground">New Properties:</p>
                                {importPreview.newLocations.map((l, i) => (
                                  <Badge key={i} variant="outline" className="mr-1 mt-1 text-xs">{l.name}</Badge>
                                ))}
                              </div>
                            )}
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {importPreview.summary.map((s, i) => (
                                <p key={i} className="text-xs text-muted-foreground">• {s}</p>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setImportPreview(null)}>Cancel</Button>
                            <Button className="flex-1" onClick={confirmAdvancedImport} disabled={advancedBulkImport.isPending}>
                              {advancedBulkImport.isPending ? 'Importing...' : `Import ${importPreview.rooms.length} Rooms`}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Bulk Delete Selected */}
                {selectedRoomIds.size > 0 && (
                  <Button size="sm" variant="destructive" className="gap-2" onClick={() => setShowDeleteRoomsConfirm(true)}>
                    <Trash2 className="h-4 w-4" />Delete ({selectedRoomIds.size})
                  </Button>
                )}

                {/* Reset Inventory */}
                <Button size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw className="h-4 w-4" />Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={paginatedRooms.length > 0 && selectedRoomIds.size === paginatedRooms.length}
                          onCheckedChange={toggleAllRooms}
                        />
                      </TableHead>
                      <TableHead>Room #</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRooms.map(room => (
                      <TableRow key={room.id} className={selectedRoomIds.has(room.id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRoomIds.has(room.id)}
                            onCheckedChange={() => toggleRoomSelection(room.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{room.room_number}</TableCell>
                        <TableCell className="text-sm">{(room as any).accommodation_locations?.name || '-'}</TableCell>
                        <TableCell>{(room as any).capacity || 2} pax</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {(room as any).ac_type === 'ac' ? 'AC' : 'Non-AC'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(room as any).available_from && (room as any).available_to
                            ? `${(room as any).available_from} → ${(room as any).available_to}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[(room as any).status || 'available'] || ''}>
                            {((room as any).status || 'available').charAt(0).toUpperCase() + ((room as any).status || 'available').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0"
                            onClick={() => { setSelectedRoomIds(new Set([room.id])); setShowDeleteRoomsConfirm(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedRooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No rooms found</TableCell>
                      </TableRow>
                    )}
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{loc.name}</span>
                        {!loc.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        {(loc as any).category && <Badge variant="outline" className="text-xs">{(loc as any).category}</Badge>}
                      </div>
                      {loc.address && <p className="text-xs text-muted-foreground mt-1">{loc.address}</p>}
                      {loc.description && <p className="text-sm text-muted-foreground mt-1">{loc.description}</p>}
                      {(loc as any).feeding_system && (
                        <p className="text-xs text-muted-foreground mt-1">Feeding: {(loc as any).feeding_system}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0"
                      onClick={() => setDeleteLocId(loc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Delete Location Confirm */}
      <DeleteConfirmDialog
        open={!!deleteLocId}
        onOpenChange={(o) => { if (!o) setDeleteLocId(null); }}
        onConfirm={() => {
          if (deleteLocId) {
            deleteLocation.mutate(deleteLocId);
            setDeleteLocId(null);
          }
        }}
        title="Delete Property"
        description="This will permanently delete this property and all its rooms. If users are currently assigned, the deletion will be blocked."
        isLoading={deleteLocation.isPending}
      />

      {/* Delete Rooms Confirm */}
      <DeleteConfirmDialog
        open={showDeleteRoomsConfirm}
        onOpenChange={setShowDeleteRoomsConfirm}
        onConfirm={() => {
          deleteRooms.mutate(Array.from(selectedRoomIds));
          setSelectedRoomIds(new Set());
          setShowDeleteRoomsConfirm(false);
        }}
        title={`Delete ${selectedRoomIds.size} Room(s)`}
        description="Rooms with active allocations will be skipped. This action cannot be undone."
        isLoading={deleteRooms.isPending}
      />

      {/* Reset Inventory Confirm */}
      <Dialog open={showResetConfirm} onOpenChange={(o) => { setShowResetConfirm(o); if (!o) setResetConfirmText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Entire Inventory
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL rooms, allocations, and properties. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              Type <b>RESET</b> below to confirm.
            </div>
            <Input
              value={resetConfirmText}
              onChange={e => setResetConfirmText(e.target.value)}
              placeholder='Type "RESET" to confirm'
            />
            <Button
              variant="destructive"
              className="w-full"
              disabled={resetConfirmText !== 'RESET' || resetInventory.isPending}
              onClick={() => {
                resetInventory.mutate();
                setShowResetConfirm(false);
                setResetConfirmText('');
              }}
            >
              {resetInventory.isPending ? 'Resetting...' : 'Reset All Inventory'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
