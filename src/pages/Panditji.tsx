import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Phone, MessageCircle, Lock, Search, Clock, Briefcase } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PanditDetailModal } from '@/components/pandit/PanditDetailModal';
interface WeeklyAvailability {
  [key: string]: {
    enabled?: boolean;
    start?: string;
    end?: string;
  } | undefined;
}

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '18:00';

function useActivePandits() {
  return useQuery({
    queryKey: ['active-pandits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandits')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

function usePanditRatings() {
  return useQuery({
    queryKey: ['pandit-ratings-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandit_reviews')
        .select('pandit_id, rating');
      
      if (error) throw error;
      
      // Calculate average rating per pandit
      const ratings: { [key: string]: { total: number; count: number } } = {};
      data?.forEach((review) => {
        if (!ratings[review.pandit_id]) {
          ratings[review.pandit_id] = { total: 0, count: 0 };
        }
        ratings[review.pandit_id].total += review.rating;
        ratings[review.pandit_id].count += 1;
      });
      
      const averages: { [key: string]: { average: number; count: number } } = {};
      Object.entries(ratings).forEach(([panditId, { total, count }]) => {
        averages[panditId] = { average: Math.round((total / count) * 10) / 10, count };
      });
      
      return averages;
    },
  });
}

function usePanditExpertiseOptions() {
  return useQuery({
    // NOTE: different queryKey than the admin hook to avoid react-query cache type collisions
    queryKey: ['pandit-expertise-option-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pandit_expertise_options')
        .select('name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data ?? []).map((e) => e.name);
    },
  });
}

function timeToMinutes(time: string): number | null {
  const parts = time.split(':');
  if (parts.length < 2) return null;
  const [hours, minutes] = parts.map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function isCurrentlyAvailable(weeklyAvailability: WeeklyAvailability | null): boolean {
  if (!weeklyAvailability || typeof weeklyAvailability !== 'object') return false;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const dayAvailability = weeklyAvailability[currentDay];

  if (!dayAvailability?.enabled) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startStr = dayAvailability.start || DEFAULT_START_TIME;
  const endStr = dayAvailability.end || DEFAULT_END_TIME;

  const startTime = timeToMinutes(startStr);
  const endTime = timeToMinutes(endStr);

  if (startTime === null || endTime === null) return false;

  // Overnight ranges (e.g. 22:00-02:00)
  if (endTime < startTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

function calculateExperience(startDate: string | null): string {
  if (!startDate) return '';
  const start = new Date(startDate);
  const now = new Date();
  const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return 'Less than 1 year';
  return `${years}+ years`;
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAY_ABBREV: { [key: string]: string } = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const DAY_FULL: { [key: string]: string } = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatAvailabilitySchedule(weeklyAvailability: WeeklyAvailability | null): { day: string; abbrev: string; fullName: string; start: string | null; end: string | null }[] {
  const schedule: { day: string; abbrev: string; fullName: string; start: string | null; end: string | null }[] = [];

  DAYS_ORDER.forEach((day) => {
    const avail = weeklyAvailability?.[day];
    const abbrev = DAY_ABBREV[day];
    const fullName = DAY_FULL[day];

    if (avail?.enabled) {
      const start = avail.start || DEFAULT_START_TIME;
      const end = avail.end || DEFAULT_END_TIME;
      schedule.push({ day, abbrev, fullName, start, end });
    } else {
      schedule.push({ day, abbrev, fullName, start: null, end: null });
    }
  });

  return schedule;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function Panditji() {
  const { isVerified } = useAuth();
  const { data: pandits, isLoading } = useActivePandits();
  const { data: expertiseOptions } = usePanditExpertiseOptions();
  const { data: panditRatings } = usePanditRatings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPandit, setSelectedPandit] = useState<any>(null);

  const locations = useMemo(() => {
    if (!pandits) return [];
    const locs = new Set(pandits.map(p => p.location).filter(Boolean));
    return Array.from(locs) as string[];
  }, [pandits]);

  const filteredPandits = useMemo(() => {
    if (!pandits) return [];
    return pandits.filter((pandit) => {
      const matchesSearch = pandit.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesExpertise = selectedExpertise === 'all' || pandit.expertise?.includes(selectedExpertise);
      const matchesLocation = selectedLocation === 'all' || pandit.location === selectedLocation;
      
      // Rating filter
      let matchesRating = true;
      if (selectedRating !== 'all') {
        const rating = panditRatings?.[pandit.id];
        const avgRating = rating?.average || 0;
        const minRating = parseInt(selectedRating);
        matchesRating = avgRating >= minRating;
      }
      
      return matchesSearch && matchesExpertise && matchesLocation && matchesRating;
    });
  }, [pandits, searchQuery, selectedExpertise, selectedLocation, selectedRating, panditRatings]);

  const handleContact = () => {
    if (!isVerified) {
      setShowLoginModal(true);
    }
  };

  return (
    <Layout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              Find a Priest
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Panditji <span className="text-gradient-saffron">Directory</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Connect with experienced and verified priests for all your religious ceremonies
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-card rounded-xl border border-border"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                {expertiseOptions?.map((exp: any) => {
                  const name = typeof exp === 'string' ? exp : exp?.name;
                  if (!name) return null;
                  return (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            {isLoading ? 'Loading...' : `Showing ${filteredPandits.length} Panditji`}
          </p>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Pandit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPandits.map((pandit, index) => {
              const available = isCurrentlyAvailable(pandit.weekly_availability as WeeklyAvailability);
              const experience = calculateExperience(pandit.experience_start_date);
              const schedule = formatAvailabilitySchedule(pandit.weekly_availability as WeeklyAvailability);
              const rating = panditRatings?.[pandit.id];
              
              return (
                <motion.div
                  key={pandit.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Math.min(index, 5) }}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPandit(pandit)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      {pandit.photo_url ? (
                        <img
                          src={pandit.photo_url}
                          alt={pandit.name}
                          className="w-24 h-24 rounded-xl object-cover border-2 border-gold/30"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-gold/30">
                          <span className="text-2xl font-semibold text-muted-foreground">
                            {pandit.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${available ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
                        {pandit.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pandit.location || 'Location not set'}
                      </div>
                      {experience && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {experience} experience
                        </div>
                      )}
                      {/* Rating in directory */}
                      {rating && (
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={Math.round(rating.average)} />
                          <span className="text-xs text-muted-foreground">
                            {rating.average} ({rating.count})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {pandit.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {pandit.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {pandit.expertise?.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Availability Schedule with Tooltips */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Weekly Schedule</span>
                      <span className={`ml-auto ${available ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {available ? '● Available Now' : '● Unavailable'}
                      </span>
                    </div>
                    <TooltipProvider delayDuration={100}>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {schedule.map(({ day, abbrev, fullName, start, end }) => (
                          <Tooltip key={day}>
                            <TooltipTrigger asChild>
                              <div
                                className={`text-center p-1.5 rounded cursor-pointer transition-colors ${start ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                              >
                                <div className="font-medium">{abbrev}</div>
                                <div className="truncate text-[10px]">
                                  {start ? `${start}` : '—'}
                                </div>
                                <div className="truncate text-[10px]">
                                  {start ? `${end}` : ''}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-center">
                              <p className="font-medium">{fullName}</p>
                              <p className="text-xs">
                                {start ? `${start} - ${end}` : 'Not Available'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Contact Section */}
                  {isVerified ? (
                    <div className="flex gap-2">
                      {pandit.phone && (
                        <Button
                          variant="hero"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`tel:${pandit.phone}`, '_self')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                      {pandit.whatsapp && (
                        <Button
                          variant="golden"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(`https://wa.me/${pandit.whatsapp?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="blur-lock pointer-events-none">
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" className="flex-1">
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button variant="secondary" size="sm" className="flex-1">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                        <Button variant="locked" size="sm" className="gap-2" onClick={handleContact}>
                          <Lock className="w-4 h-4" />
                          Verify to Contact
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {!isLoading && filteredPandits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No Panditji found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => {
                setSearchQuery('');
                setSelectedExpertise('all');
                setSelectedLocation('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center">Verification Required</DialogTitle>
            <DialogDescription className="text-center">
              Please register and verify your Brahmin lineage to contact our Panditji directly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowLoginModal(false)}>
              Cancel
            </Button>
            <Link to="/register" className="flex-1">
              <Button variant="hero" className="w-full">
                Register Now
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pandit Detail Modal */}
      <PanditDetailModal
        pandit={selectedPandit}
        open={!!selectedPandit}
        onOpenChange={(open) => !open && setSelectedPandit(null)}
      />
    </Layout>
  );
}