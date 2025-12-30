import * as React from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Star, MapPin, Phone, MessageCircle, Clock, Briefcase, Calendar, Send, Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { usePanditReviews, usePanditAverageRating, useCreateReview, useUpdateReview, useDeleteReview, useCreateBooking } from '@/hooks/usePanditBookings';
import { usePanditExpertiseOptions } from '@/hooks/useAdmin';

interface WeeklyAvailability {
  [key: string]: {
    enabled?: boolean;
    start?: string;
    end?: string;
  } | undefined;
}

interface Pandit {
  id: string;
  name: string;
  photo_url: string | null;
  expertise: string[] | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  experience_start_date: string | null;
  weekly_availability: WeeklyAvailability | null;
}

interface Props {
  pandit: Pandit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'fill-gold text-gold' : 'text-muted-foreground'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRate?.(star)}
        />
      ))}
    </div>
  );
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

const DAY_NAMES: { [key: string]: string } = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatSchedule(weeklyAvailability: WeeklyAvailability | null): { day: string; time: string | null }[] {
  return DAYS_ORDER.map((dayKey) => {
    const avail = weeklyAvailability?.[dayKey];
    const dayName = DAY_NAMES[dayKey];

    if (avail?.enabled) {
      return { day: dayName, time: `${avail.start || '09:00'} - ${avail.end || '18:00'}` };
    }
    return { day: dayName, time: null };
  });
}

export const PanditDetailModal = React.forwardRef<HTMLDivElement, Props>(function PanditDetailModal({ pandit, open, onOpenChange }, ref) {
  const { isVerified, user } = useAuth();
  const { data: reviews } = usePanditReviews(pandit?.id || '');
  const { data: ratingData } = usePanditAverageRating(pandit?.id || '');
  const { data: expertiseOptions } = usePanditExpertiseOptions();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const createBooking = useCreateBooking();
  
  const [activeTab, setActiveTab] = useState('book');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewCeremony, setReviewCeremony] = useState('');
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingCeremony, setBookingCeremony] = useState('');
  const [bookingLocation, setBookingLocation] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  if (!pandit) return null;

  const experience = calculateExperience(pandit.experience_start_date);
  const schedule = formatSchedule(pandit.weekly_availability);

  const handleSubmitReview = () => {
    if (editingReview) {
      updateReview.mutate({
        id: editingReview.id,
        pandit_id: pandit.id,
        rating: reviewRating,
        review_text: reviewText || undefined,
        ceremony_type: reviewCeremony || undefined,
      }, {
        onSuccess: () => {
          resetReviewForm();
        },
      });
    } else {
      createReview.mutate({
        pandit_id: pandit.id,
        rating: reviewRating,
        review_text: reviewText || undefined,
        ceremony_type: reviewCeremony || undefined,
      }, {
        onSuccess: () => {
          resetReviewForm();
        },
      });
    }
  };

  const resetReviewForm = () => {
    setReviewText('');
    setReviewCeremony('');
    setReviewRating(5);
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewText(review.review_text || '');
    setReviewCeremony(review.ceremony_type || '');
    setShowReviewForm(true);
    setActiveTab('reviews');
  };

  const handleDeleteReview = () => {
    if (deleteReviewId && pandit) {
      deleteReview.mutate({ id: deleteReviewId, pandit_id: pandit.id }, {
        onSuccess: () => setDeleteReviewId(null),
      });
    }
  };

  const handleSubmitBooking = () => {
    if (!bookingDate || !bookingCeremony) return;
    
    createBooking.mutate({
      pandit_id: pandit.id,
      ceremony_type: bookingCeremony,
      booking_date: bookingDate,
      booking_time: bookingTime || undefined,
      location: bookingLocation || undefined,
      message: bookingMessage || undefined,
    }, {
      onSuccess: () => {
        setBookingDate('');
        setBookingTime('');
        setBookingCeremony('');
        setBookingLocation('');
        setBookingMessage('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{pandit.name}</DialogTitle>
        </DialogHeader>
        
        {/* Profile Header */}
        <div className="flex items-start gap-4 pb-4 border-b">
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
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-bold text-foreground">{pandit.name}</h2>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {pandit.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {pandit.location}
                </div>
              )}
              {experience && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {experience}
                </div>
              )}
            </div>
            
            {/* Rating with See Reviews & Write Review buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(ratingData?.average || 0)} />
                <span className="text-sm font-medium">{ratingData?.average || 0}</span>
                <span className="text-sm text-muted-foreground">({ratingData?.count || 0})</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('reviews')}
                >
                  See Reviews
                </Button>
                {user && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActiveTab('reviews');
                      setShowReviewForm(true);
                    }}
                  >
                    Write Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Expertise */}
        {pandit.bio && (
          <p className="text-muted-foreground">{pandit.bio}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {pandit.expertise?.map((skill) => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>

        {/* Schedule - show all 7 days */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            Availability Schedule
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {schedule.map(({ day, time }) => (
              <div key={day} className="flex justify-between">
                <span className="text-muted-foreground">{day}</span>
                <span className={time ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {time || 'Off'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Buttons */}
        {isVerified && (
          <div className="flex gap-2">
            {pandit.phone && (
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => window.open(`tel:${pandit.phone}`, '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            )}
            {pandit.whatsapp && (
              <Button
                variant="golden"
                className="flex-1"
                onClick={() => window.open(`https://wa.me/${pandit.whatsapp?.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            )}
          </div>
        )}

        {/* Tabs for Booking & Reviews */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({ratingData?.count || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book" className="space-y-4 mt-4">
            {isVerified ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Time</Label>
                    <Input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Ceremony Type *</Label>
                  <Select value={bookingCeremony} onValueChange={setBookingCeremony}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ceremony" />
                    </SelectTrigger>
                    <SelectContent>
                      {expertiseOptions?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                    placeholder="Where should the ceremony be held?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Message</Label>
                  <Textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Any special requirements or details..."
                    rows={3}
                  />
                </div>
                
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleSubmitBooking}
                  disabled={!bookingDate || !bookingCeremony || createBooking.isPending}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Booking
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Please verify your account to book appointments.</p>
                <Button variant="hero" onClick={() => window.location.href = '/register'}>
                  Register & Verify
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4 mt-4">
            {/* Write/Edit Review - available for any logged-in user */}
            {user && showReviewForm && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{editingReview ? 'Edit Review' : 'Write a Review'}</h4>
                  <Button variant="ghost" size="sm" onClick={resetReviewForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Your Rating:</span>
                  <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
                </div>
                <Input
                  value={reviewCeremony}
                  onChange={(e) => setReviewCeremony(e.target.value)}
                  placeholder="Ceremony type (e.g., Wedding, Puja)"
                  maxLength={100}
                />
                <div className="space-y-1">
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value.slice(0, 1000))}
                    placeholder="Share your experience..."
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">{reviewText.length}/1000</p>
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={createReview.isPending || updateReview.isPending}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {editingReview ? 'Update Review' : 'Submit Review'}
                </Button>
              </div>
            )}
            
            {user && !showReviewForm && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowReviewForm(true)}
              >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            )}
            
            {!user && (
              <div className="p-4 border rounded-lg text-center">
                <p className="text-muted-foreground mb-2">Log in to leave a review</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
                  Log In
                </Button>
              </div>
            )}
            
            {/* Reviews List */}
            <div className="space-y-4">
              {reviews?.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No reviews yet. Be the first to review!</p>
              )}
              {reviews?.map((review: any) => {
                const isOwnReview = user?.id === review.user_id;
                
                return (
                  <div key={review.id} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.profiles?.name || 'Anonymous'}</span>
                        {review.ceremony_type && (
                          <Badge variant="outline" className="text-xs">{review.ceremony_type}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwnReview && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditReview(review)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteReviewId(review.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                    {review.review_text && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.review_text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
});

PanditDetailModal.displayName = 'PanditDetailModal';