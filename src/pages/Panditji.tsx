import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Phone, MessageCircle, Lock, Search, Filter, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const allExpertise = ['Vedic Rituals', 'Astrology', 'Grih Pravesh', 'Marriage', 'Satyanarayan', 'Havan', 'Shradh', 'Mundan'];
const locations = ['Varanasi, UP', 'Allahabad, UP', 'Lucknow, UP', 'Delhi', 'Mumbai', 'Pune'];

const pandits = [
  {
    id: 1,
    name: 'Pt. Ramesh Shastri',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
    expertise: ['Vedic Rituals', 'Astrology'],
    location: 'Varanasi, UP',
    rating: 4.9,
    reviews: 127,
    phone: '+91 98765 43210',
    experience: '25+ years',
    available: true,
    bio: 'Renowned Vedic scholar with expertise in ancient rituals and Jyotish Shastra.',
  },
  {
    id: 2,
    name: 'Pt. Suresh Dwivedi',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
    expertise: ['Grih Pravesh', 'Marriage'],
    location: 'Allahabad, UP',
    rating: 4.8,
    reviews: 89,
    phone: '+91 98765 43211',
    experience: '18 years',
    available: true,
    bio: 'Specialist in auspicious ceremonies and traditional wedding rituals.',
  },
  {
    id: 3,
    name: 'Pt. Anil Tripathi',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    expertise: ['Satyanarayan', 'Havan'],
    location: 'Lucknow, UP',
    rating: 4.7,
    reviews: 64,
    phone: '+91 98765 43212',
    experience: '12 years',
    available: false,
    bio: 'Expert in conducting Satyanarayan Katha and various Havan ceremonies.',
  },
  {
    id: 4,
    name: 'Pt. Vijay Sharma',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
    expertise: ['Shradh', 'Astrology'],
    location: 'Delhi',
    rating: 4.9,
    reviews: 156,
    phone: '+91 98765 43213',
    experience: '30+ years',
    available: true,
    bio: 'Highly respected for Pitru Paksha ceremonies and astrological consultations.',
  },
  {
    id: 5,
    name: 'Pt. Raghunath Mishra',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop',
    expertise: ['Mundan', 'Vedic Rituals'],
    location: 'Mumbai',
    rating: 4.6,
    reviews: 42,
    phone: '+91 98765 43214',
    experience: '15 years',
    available: true,
    bio: 'Known for conducting sacred ceremonies with traditional authenticity.',
  },
  {
    id: 6,
    name: 'Pt. Keshav Pandey',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop',
    expertise: ['Marriage', 'Havan', 'Grih Pravesh'],
    location: 'Pune',
    rating: 4.8,
    reviews: 78,
    phone: '+91 98765 43215',
    experience: '20 years',
    available: true,
    bio: 'Multi-talented priest specializing in various Vedic ceremonies and consultations.',
  },
];

export default function Panditji() {
  const { isVerified } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const filteredPandits = pandits.filter((pandit) => {
    const matchesSearch = pandit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExpertise = selectedExpertise === 'all' || pandit.expertise.includes(selectedExpertise);
    const matchesLocation = selectedLocation === 'all' || pandit.location === selectedLocation;
    return matchesSearch && matchesExpertise && matchesLocation;
  });

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
                {allExpertise.map((exp) => (
                  <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                ))}
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
            Showing {filteredPandits.length} of {pandits.length} Panditji
          </p>

          {/* Pandit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPandits.map((pandit, index) => (
              <motion.div
                key={pandit.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-temple transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={pandit.photo}
                      alt={pandit.name}
                      className="w-24 h-24 rounded-xl object-cover border-2 border-gold/30"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${pandit.available ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
                      {pandit.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {pandit.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-gold text-gold" />
                        <span className="text-sm font-medium">{pandit.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">({pandit.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {pandit.bio}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {pandit.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Experience: {pandit.experience}</span>
                  <span className={pandit.available ? 'text-green-600' : 'text-muted-foreground'}>
                    {pandit.available ? '● Available' : '● Busy'}
                  </span>
                </div>

                {/* Contact Section */}
                {isVerified ? (
                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Call Now
                    </Button>
                    <Button variant="golden" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="blur-lock pointer-events-none">
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" className="flex-1">
                          <Phone className="w-4 h-4 mr-1" />
                          Call Now
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
            ))}
          </div>

          {filteredPandits.length === 0 && (
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
    </Layout>
  );
}