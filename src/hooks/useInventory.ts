import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for inventory system
export type InventoryCategory = 'puja_materials' | 'food_prasad' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  min_stock_level: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StockIn {
  id: string;
  item_id: string;
  quantity: number;
  supplier: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface StockOut {
  id: string;
  item_id: string;
  quantity: number;
  purpose: string | null;
  customer_name: string | null;
  exit_date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface InventoryStockBalance {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  min_stock_level: number;
  description: string | null;
  is_active: boolean;
  total_stock_in: number;
  total_stock_out: number;
  current_stock: number;
  is_low_stock: boolean;
}

// Fetch all inventory items
export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

// Fetch stock balance view (calculated current stock)
export function useInventoryStockBalance() {
  return useQuery({
    queryKey: ['inventory-stock-balance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_stock_balance')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as InventoryStockBalance[];
    },
  });
}

// Create inventory item
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('inventory_items')
        .insert({ ...item, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-balance'] });
      toast({
        title: 'Item Added',
        description: 'Inventory item has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update inventory item
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      const { error } = await supabase
        .from('inventory_items')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-balance'] });
      toast({
        title: 'Item Updated',
        description: 'Inventory item has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete inventory item (soft delete by setting is_active = false)
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-balance'] });
      toast({
        title: 'Item Removed',
        description: 'Inventory item has been deactivated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Stock In mutation
export function useCreateStockIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (stockIn: Omit<StockIn, 'id' | 'created_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stock_in')
        .insert({ ...stockIn, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      toast({
        title: 'Stock Added',
        description: 'Stock entry has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Stock Out mutation
export function useCreateStockOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (stockOut: Omit<StockOut, 'id' | 'created_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stock_out')
        .insert({ ...stockOut, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-out-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      toast({
        title: 'Stock Removed',
        description: 'Stock exit has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Fetch transaction history (combined stock in and out)
export function useTransactionHistory() {
  return useQuery({
    queryKey: ['transaction-history'],
    queryFn: async () => {
      // Fetch stock in entries
      const { data: stockInData, error: stockInError } = await supabase
        .from('stock_in')
        .select(`
          id,
          item_id,
          quantity,
          supplier,
          purchase_date,
          notes,
          created_at,
          inventory_items (name, unit)
        `)
        .order('created_at', { ascending: false });
      
      if (stockInError) throw stockInError;

      // Fetch stock out entries
      const { data: stockOutData, error: stockOutError } = await supabase
        .from('stock_out')
        .select(`
          id,
          item_id,
          quantity,
          purpose,
          customer_name,
          exit_date,
          notes,
          created_at,
          inventory_items (name, unit)
        `)
        .order('created_at', { ascending: false });
      
      if (stockOutError) throw stockOutError;

      // Combine and format transactions
      const stockInFormatted = (stockInData || []).map((entry: any) => ({
        id: entry.id,
        type: 'in' as const,
        item_name: entry.inventory_items?.name || 'Unknown',
        unit: entry.inventory_items?.unit || 'units',
        quantity: entry.quantity,
        date: entry.purchase_date,
        details: entry.supplier ? `Supplier: ${entry.supplier}` : null,
        notes: entry.notes,
        created_at: entry.created_at,
      }));

      const stockOutFormatted = (stockOutData || []).map((entry: any) => ({
        id: entry.id,
        type: 'out' as const,
        item_name: entry.inventory_items?.name || 'Unknown',
        unit: entry.inventory_items?.unit || 'units',
        quantity: entry.quantity,
        date: entry.exit_date,
        details: entry.purpose || entry.customer_name || null,
        notes: entry.notes,
        created_at: entry.created_at,
      }));

      // Combine and sort by created_at
      const combined = [...stockInFormatted, ...stockOutFormatted];
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return combined;
    },
  });
}
