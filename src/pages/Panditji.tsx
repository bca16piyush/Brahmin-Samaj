import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Phone, MessageCircle, Lock, Search, Clock, Briefcase } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PanditDetailModal } from '@/components/pandit/PanditDetailModal';
interface WeeklyAvailability {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

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

function isCurrentlyAvailable(weeklyAvailability: WeeklyAvailability | null): boolean {
  if (!weeklyAvailability || typeof weeklyAvailability !== 'object') return false;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const dayAvailability = weeklyAvailability[currentDay];
  
  if (!dayAvailability?.enabled || !dayAvailability?.start || !dayAvailability?.end) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startParts = dayAvailability.start.split(':');
  const endParts = dayAvailability.end.split(':');
  
  if (startParts.length < 2 || endParts.length < 2) return false;
  
  const [startHour, startMin] = startParts.map(Number);
  const [endHour, endMin] = endParts.map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
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

function formatAvailabilitySchedule(weeklyAvailability: WeeklyAvailability | null): string[] {
  if (!weeklyAvailability || typeof weeklyAvailability !== 'object') return [];
  
  const dayAbbrev: { [key: string]: string } = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  
  const schedule: string[] = [];
  Object.entries(weeklyAvailability).forEach(([day, avail]) => {
    if (avail?.enabled && avail?.start && avail?.end) {
      schedule.push(`${dayAbbrev[day]}: ${avail.start}-${avail.end}`);
    }
  });
  
  return schedule;
}

export default function Panditji() {
  const { isVerified } = useAuth();
  const { data: pandits, isLoading } = useActivePandits();
  const { data: expertiseOptions } = usePanditExpertiseOptions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
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
      return matchesSearch && matchesExpertise && matchesLocation;
    });
  }, [pandits, searchQuery, selectedExpertise, selectedLocation]);

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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {pandit.location || 'Location not set'}
                      </div>
                      {experience && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5" />
                          {experience} experience
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

                  {/* Availability Status */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{schedule.length > 0 ? schedule.slice(0, 2).join(', ') : 'Schedule not set'}</span>
                    </div>
                    <span className={available ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {available ? '● Available Now' : '● Unavailable'}
                    </span>
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