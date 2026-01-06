import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Bell, Check, ChevronRight, Share, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { isAuthenticated } = useAuth();
  const { 
    isSupported: isPushSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe,
    isLoading: pushLoading 
  } = usePushNotifications();

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error('Install prompt not available. Try refreshing the page.');
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-cream to-background py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-saffron mb-6">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Install Brahmin Samaj
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get quick access to events, notifications, and community updates right from your home screen.
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Install Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Download className="w-6 h-6 text-primary" />
                    Install App
                  </CardTitle>
                  <CardDescription>
                    {isInstalled 
                      ? 'The app is already installed on your device!' 
                      : 'Add this app to your home screen for quick access'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isInstalled ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Check className="w-6 h-6 text-green-600" />
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        App is installed and ready to use!
                      </span>
                    </div>
                  ) : deferredPrompt ? (
                    <Button 
                      onClick={handleInstallClick} 
                      variant="hero" 
                      size="lg" 
                      className="w-full sm:w-auto"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install Now
                    </Button>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {isIOS ? (
                        <p>Use the install instructions below to add this app to your home screen.</p>
                      ) : (
                        <p>Install button will appear when available. Try the manual instructions below.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Push Notifications Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border border-border bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-primary" />
                    Push Notifications
                  </CardTitle>
                  <CardDescription>
                    Get notified about events, live streams, and important announcements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isPushSupported ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground text-sm">
                        Push notifications are not supported on this browser. Try using Chrome, Firefox, or Edge.
                      </p>
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground text-sm">
                        Please <a href="/login" className="text-primary underline">login</a> to enable push notifications.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Enable notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {isSubscribed ? 'You will receive event reminders' : 'Get alerts for upcoming events'}
                        </p>
                      </div>
                      <Switch
                        checked={isSubscribed}
                        onCheckedChange={handlePushToggle}
                        disabled={pushLoading}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* iOS Instructions */}
            {isIOS && !isInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-border bg-card/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Install on iPhone/iPad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for <Share className="w-4 h-4 inline" /> at the bottom of Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for <Plus className="w-4 h-4 inline" /> Add to Home Screen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap "Add" to confirm</p>
                        <p className="text-sm text-muted-foreground">
                          The app icon will appear on your home screen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Android Instructions */}
            {isAndroid && !isInstalled && !deferredPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-border bg-card/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Install on Android</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap the menu button</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for <MoreVertical className="w-4 h-4 inline" /> in Chrome's top-right corner
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap "Add to Home screen"</p>
                        <p className="text-sm text-muted-foreground">
                          Or "Install app" if available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap "Add" to confirm</p>
                        <p className="text-sm text-muted-foreground">
                          The app will be added to your home screen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && !isInstalled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-border bg-card/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Install on Desktop</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Look for the install icon in the address bar</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome, Edge, and other browsers show an install icon
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Click "Install" when prompted</p>
                        <p className="text-sm text-muted-foreground">
                          The app will open in its own window
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border border-border bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Why Install?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { title: 'Quick Access', desc: 'Launch instantly from your home screen' },
                      { title: 'Works Offline', desc: 'Browse cached content without internet' },
                      { title: 'Push Notifications', desc: 'Never miss an event or update' },
                      { title: 'Full Screen', desc: 'Immersive experience without browser UI' },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <ChevronRight className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">{feature.title}</p>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
