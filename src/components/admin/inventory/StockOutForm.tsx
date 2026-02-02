import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowDownCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useInventoryStockBalance, useCreateStockOut } from '@/hooks/useInventory';

const stockOutSchema = z.object({
  item_id: z.string().min(1, 'Please select an item'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  purpose: z.string().optional(),
  customer_name: z.string().optional(),
  exit_date: z.date(),
  notes: z.string().optional(),
});

type StockOutFormData = z.infer<typeof stockOutSchema>;

interface StockOutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commonPurposes = [
  'Daily Puja',
  'Special Event',
  'Prasad Distribution',
  'Festival Preparation',
  'Given to Devotee',
  'Expired/Damaged',
  'Other',
];

export function StockOutForm({ open, onOpenChange }: StockOutFormProps) {
  const { data: stockBalance, isLoading: loadingItems } = useInventoryStockBalance();
  const createStockOut = useCreateStockOut();

  const form = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      item_id: '',
      quantity: 1,
      purpose: '',
      customer_name: '',
      exit_date: new Date(),
      notes: '',
    },
  });

  const selectedItemId = form.watch('item_id');
  const selectedItem = stockBalance?.find(item => item.id === selectedItemId);
  const maxQuantity = selectedItem?.current_stock || 0;

  const onSubmit = async (data: StockOutFormData) => {
    if (data.quantity > maxQuantity) {
      form.setError('quantity', { 
        message: `Cannot exceed available stock (${maxQuantity} ${selectedItem?.unit})` 
      });
      return;
    }

    await createStockOut.mutateAsync({
      item_id: data.item_id,
      quantity: data.quantity,
      purpose: data.purpose || null,
      customer_name: data.customer_name || null,
      exit_date: format(data.exit_date, 'yyyy-MM-dd'),
      notes: data.notes || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-600" />
            Stock Out (Exit)
          </DialogTitle>
          <DialogDescription>
            Record stock usage, sales, or distribution
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingItems ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : stockBalance && stockBalance.length > 0 ? (
                        stockBalance.map((item) => (
                          <SelectItem 
                            key={item.id} 
                            value={item.id}
                            disabled={item.current_stock <= 0}
                          >
                            {item.name} - Available: {item.current_stock} {item.unit}
                            {item.current_stock <= 0 && ' (Out of Stock)'}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No items available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantity * 
                    {selectedItem && (
                      <span className="text-muted-foreground ml-2">
                        (Available: {maxQuantity} {selectedItem.unit})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1}
                      max={maxQuantity}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonPurposes.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Given To (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of person or event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exit_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details about this stock exit..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={createStockOut.isPending}
              >
                {createStockOut.isPending ? 'Recording...' : 'Record Exit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
