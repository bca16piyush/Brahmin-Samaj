import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Link as LinkIcon, Type, Save, Loader2, Eye, Video, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSiteConfig, useUpdateSiteConfig, HomepageButton, QuickLiveStream } from '@/hooks/useSiteConfig';
import { Link } from 'react-router-dom';

// Convert YouTube watch URL to embed format
const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  
  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  
  // Live URL: https://www.youtube.com/live/VIDEO_ID
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) {
    return `https://www.youtube.com/embed/${liveMatch[1]}`;
  }
  
  return url;
};

export function SiteSettings() {
  const { data: config, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();
  
  const [buttonConfig, setButtonConfig] = useState<HomepageButton>({
    text: 'About Guruji',
    url: '/about',
    enabled: true,
  });

  const [liveStreamConfig, setLiveStreamConfig] = useState<QuickLiveStream>({
    youtube_url: '',
    title: 'Live Stream',
    enabled: false,
  });

  useEffect(() => {
    if (config?.homepage_cta_button) {
      setButtonConfig(config.homepage_cta_button);
    }
    if (config?.quick_live_stream) {
      setLiveStreamConfig(config.quick_live_stream);
    }
  }, [config]);

  const handleSaveButton = () => {
    updateConfig.mutate({
      key: 'homepage_cta_button',
      value: buttonConfig,
    });
  };

  const handleSaveLiveStream = () => {
    const embedUrl = convertToEmbedUrl(liveStreamConfig.youtube_url);
    updateConfig.mutate({
      key: 'quick_live_stream',
      value: { ...liveStreamConfig, youtube_url: embedUrl },
    });
  };

  const handleToggleLive = (enabled: boolean) => {
    const updatedConfig = { ...liveStreamConfig, enabled };
    setLiveStreamConfig(updatedConfig);
    const embedUrl = convertToEmbedUrl(updatedConfig.youtube_url);
    updateConfig.mutate({
      key: 'quick_live_stream',
      value: { ...updatedConfig, youtube_url: embedUrl },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const embedPreviewUrl = convertToEmbedUrl(liveStreamConfig.youtube_url);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-semibold">Site Settings</h2>
        <Link to="/" target="_blank">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview Site
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Quick Live Stream */}
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Live Stream</CardTitle>
                  <CardDescription>
                    Directly input a YouTube Live URL to show on the /live page
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveStreamConfig.enabled && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
                <Switch
                  checked={liveStreamConfig.enabled}
                  onCheckedChange={handleToggleLive}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stream Settings */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Stream Title
                </Label>
                <Input
                  value={liveStreamConfig.title}
                  onChange={(e) => setLiveStreamConfig({ ...liveStreamConfig, title: e.target.value })}
                  placeholder="e.g., Live Puja, Mahayagya Live"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  YouTube URL
                </Label>
                <Input
                  value={liveStreamConfig.youtube_url}
                  onChange={(e) => setLiveStreamConfig({ ...liveStreamConfig, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... या https://youtube.com/live/..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste any YouTube URL - it will be auto-converted to embed format
                </p>
              </div>
            </div>

            {/* Preview */}
            {embedPreviewUrl && (
              <div className="space-y-2">
                <Label className="text-sm">Preview</Label>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={embedPreviewUrl}
                    title="YouTube live preview"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Embed URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">{embedPreviewUrl}</code>
                </p>
              </div>
            )}

            <Button 
              onClick={handleSaveLiveStream} 
              className="w-full"
              variant={liveStreamConfig.enabled ? "destructive" : "default"}
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {liveStreamConfig.enabled ? 'Update Live Stream' : 'Save Stream Settings'}
                </>
              )}
            </Button>

            <div className="text-center">
              <Link to="/live" target="_blank">
                <Button variant="link" size="sm">
                  View Live Page →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Homepage CTA Button */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Homepage CTA Button</CardTitle>
                <CardDescription>
                  Customize the main call-to-action button on the homepage
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview */}
            <div className="bg-maroon/10 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Preview:</p>
              <Button 
                variant="outline" 
                className={`bg-primary-foreground/10 text-primary border-primary/30 hover:bg-primary-foreground/20 ${!buttonConfig.enabled ? 'opacity-50' : ''}`}
                disabled={!buttonConfig.enabled}
              >
                {buttonConfig.text || 'Button Text'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Links to: {buttonConfig.url || '/'}
              </p>
            </div>

            {/* Settings */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Button</Label>
                  <p className="text-sm text-muted-foreground">Show or hide this button on the homepage</p>
                </div>
                <Switch
                  checked={buttonConfig.enabled}
                  onCheckedChange={(enabled) => setButtonConfig({ ...buttonConfig, enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Button Text
                </Label>
                <Input
                  value={buttonConfig.text}
                  onChange={(e) => setButtonConfig({ ...buttonConfig, text: e.target.value })}
                  placeholder="e.g., About Guruji, Donate Now, Contact Us"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Target URL/Route
                </Label>
                <Input
                  value={buttonConfig.url}
                  onChange={(e) => setButtonConfig({ ...buttonConfig, url: e.target.value })}
                  placeholder="e.g., /about, /donate, /contact"
                />
                <p className="text-xs text-muted-foreground">
                  Use relative paths like /about or full URLs like https://example.com
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSaveButton} 
              className="w-full"
              disabled={updateConfig.isPending}
            >
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
