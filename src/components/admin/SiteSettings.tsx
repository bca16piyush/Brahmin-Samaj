import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Link as LinkIcon, Type, Save, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSiteConfig, useUpdateSiteConfig, HomepageButton } from '@/hooks/useSiteConfig';
import { Link } from 'react-router-dom';

export function SiteSettings() {
  const { data: config, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();
  
  const [buttonConfig, setButtonConfig] = useState<HomepageButton>({
    text: 'About Guruji',
    url: '/about',
    enabled: true,
  });

  useEffect(() => {
    if (config?.homepage_cta_button) {
      setButtonConfig(config.homepage_cta_button);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate({
      key: 'homepage_cta_button',
      value: buttonConfig,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              onClick={handleSave} 
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

        {/* More settings can be added here */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>More site settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
