import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Gift, Newspaper, Calendar, User2, LayoutDashboard, CalendarCheck, ClipboardList, UsersRound, Image, FileText, Shield, Package, Bed, Send, Video, Settings, UserCog } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions, useHasPermission } from '@/hooks/useAdminPermissions';
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
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { InventoryDashboard } from '@/components/admin/inventory/InventoryDashboard';
import { RoomManager } from '@/components/admin/RoomManager';
import { BulkWhatsAppMessaging } from '@/components/admin/BulkWhatsAppMessaging';
import { PastEventVideoManager } from '@/components/admin/PastEventVideoManager';
import { TeamManager } from '@/components/admin/TeamManager';
import { SiteSettings } from '@/components/admin/SiteSettings';

export default function Admin() {
  const {
    isAdmin,
    isLoading,
    isAuthenticated
  } = useAuth();
  const { data: permissions } = useAdminPermissions();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isAdmin, isLoading, isAuthenticated, navigate]);
  if (isLoading) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>;
  }
  if (!isAdmin) {
    return null;
  }
  return <Layout>
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="mb-8">
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
                <span className="hidden sm:inline">Brahmin</span>
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
                <span className="hidden sm:inline">Yagyas</span>
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
              <TabsTrigger value="past-videos" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Past Event Live</span>
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                <span className="hidden sm:inline">Rooms</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="bulk-whatsapp" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk WhatsApp</span>
              </TabsTrigger>
              {/* Super Admin only tabs */}
              {permissions?.is_super_admin && (
                <>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">Team</span>
                  </TabsTrigger>
                  <TabsTrigger value="site-settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Site Settings</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="audit-logs" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Audit Logs</span>
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

            <TabsContent value="past-videos">
              <PastEventVideoManager />
            </TabsContent>

            <TabsContent value="rooms">
              <RoomManager />
            </TabsContent>

            <TabsContent value="inventory">
              <InventoryDashboard />
            </TabsContent>

            <TabsContent value="bulk-whatsapp">
              <BulkWhatsAppMessaging />
            </TabsContent>

            {permissions?.is_super_admin && (
              <>
                <TabsContent value="team">
                  <TeamManager />
                </TabsContent>

                <TabsContent value="site-settings">
                  <SiteSettings />
                </TabsContent>
              </>
            )}

            <TabsContent value="security">
              <SecurityDashboard />
            </TabsContent>

            <TabsContent value="audit-logs">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>;
}