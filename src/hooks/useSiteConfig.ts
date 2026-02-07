import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface HomepageButton {
  text: string;
  url: string;
  enabled: boolean;
}

export interface SiteConfig {
  homepage_cta_button: HomepageButton;
}

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('*');
      
      if (error) throw error;
      
      // Convert array to object
      const config: Record<string, any> = {};
      data.forEach((item: any) => {
        config[item.config_key] = item.config_value;
      });
      
      return config as SiteConfig;
    },
  });
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('site_config')
        .update({ 
          config_value: value,
          updated_by: user?.id,
        })
        .eq('config_key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-config'] });
      toast({ title: 'Settings Saved', description: 'Site configuration has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
