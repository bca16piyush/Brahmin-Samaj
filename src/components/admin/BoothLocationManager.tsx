import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export function BoothLocationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: booths, isLoading } = useQuery({
    queryKey: ['admin-booth-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booth_locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('booth_locations').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booth-locations'] });
      setNewName('');
      toast({ title: 'Booth added successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('booth_locations').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booth-locations'] });
      setEditingId(null);
      toast({ title: 'Booth renamed successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('booth_locations').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booth-locations'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('booth_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booth-locations'] });
      toast({ title: 'Booth deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Manage Booth Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) addMutation.mutate(newName.trim());
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="New booth name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newName.trim() || addMutation.isPending}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </form>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : booths?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No booth locations yet</p>
        ) : (
          <div className="space-y-2">
            {booths?.map((booth) => (
              <div
                key={booth.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                {editingId === booth.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (editName.trim()) updateMutation.mutate({ id: booth.id, name: editName.trim() });
                      }}
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-foreground">{booth.name}</span>
                    <Badge variant={booth.is_active ? 'default' : 'secondary'} className="text-xs">
                      {booth.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={booth.is_active ?? true}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: booth.id, is_active: checked })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(booth.id);
                        setEditName(booth.name);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this booth location?')) deleteMutation.mutate(booth.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
