import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Gift, Newspaper, Calendar, User2, LayoutDashboard, CalendarCheck, ClipboardList, UsersRound, Image } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { PendingVerifications } from '@/components/admin/PendingVerifications';
import { PanditManager } from '@/components/admin/PanditManager';
import { DonationTracker } from '@/components/admin/DonationTracker';
import { NewsPublisher } from '@/components/admin/NewsPublisher';
import { EventManager } from '@/components/admin/EventManager';
import { BookingManager } from '@/components/admin/BookingManager';
import { RegistrationManager } from '@/components/admin/RegistrationManager';
import { UserManager } from '@/components/admin/UserManager';
import { GalleryManager } from '@/components/admin/GalleryManager';

export default function Admin() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isAdmin, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage community members, content, and operations
            </p>
          </motion.div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 h-auto bg-muted/50 p-2 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="verifications" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Verifications</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersRound className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="pandits" className="flex items-center gap-2">
                <User2 className="w-4 h-4" />
                <span className="hidden sm:inline">Pandits</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Donations</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Registrations</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">News</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview />
            </TabsContent>

            <TabsContent value="verifications">
              <PendingVerifications />
            </TabsContent>

            <TabsContent value="users">
              <UserManager />
            </TabsContent>

            <TabsContent value="pandits">
              <PanditManager />
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManager />
            </TabsContent>

            <TabsContent value="donations">
              <DonationTracker />
            </TabsContent>

            <TabsContent value="events">
              <EventManager />
            </TabsContent>

            <TabsContent value="registrations">
              <RegistrationManager />
            </TabsContent>

            <TabsContent value="news">
              <NewsPublisher />
            </TabsContent>

            <TabsContent value="gallery">
              <GalleryManager />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
