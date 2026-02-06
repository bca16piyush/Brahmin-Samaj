import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, ArrowUpCircle, ArrowDownCircle, History, AlertTriangle, TrendingUp, MessageSquare, Loader2, Printer, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryStockBalance, InventoryCategory } from '@/hooks/useInventory';
import { StockInForm } from './StockInForm';
import { StockOutForm } from './StockOutForm';
import { InventoryItemForm } from './InventoryItemForm';
import { TransactionHistory } from './TransactionHistory';
import { InventoryReports } from './InventoryReports';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDeleteInventoryItem } from '@/hooks/useDeleteOperations';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { PrintableReport, printReport } from '../PrintableReport';

const categoryLabels: Record<InventoryCategory, string> = {
  puja_materials: 'Puja Materials',
  food_prasad: 'Food/Prasad',
  other: 'Other',
};

export function InventoryDashboard() {
  const { data: stockBalance, isLoading } = useInventoryStockBalance();
  const deleteItem = useDeleteInventoryItem();
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [showStockOutForm, setShowStockOutForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const lowStockItems = stockBalance?.filter(item => item.is_low_stock) || [];
  const totalItems = stockBalance?.length || 0;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteItem.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleSendLowStockAlerts = async () => {
    if (lowStockItems.length === 0) {
      toast({
        title: 'No Low Stock Items',
        description: 'There are no items below minimum stock level.',
      });
      return;
    }

    setSendingAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-low-stock-alerts');
      
      if (error) throw error;

      if (data.sent > 0) {
        toast({
          title: 'Alerts Sent',
          description: `Low stock alert sent to ${data.sent} admin(s).`,
        });
      } else {
        toast({
          title: 'No Recipients',
          description: 'No admin users have WhatsApp notifications enabled.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to send alerts:', error);
      toast({
        title: 'Failed to Send Alerts',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSendingAlerts(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card className={lowStockItems.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-destructive' : ''}`}>
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground mb-2">Items below minimum level</p>
            {lowStockItems.length > 0 && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full gap-2"
                onClick={handleSendLowStockAlerts}
                disabled={sendingAlerts}
              >
                {sendingAlerts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Send WhatsApp Alert
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              size="sm" 
              className="w-full gap-2"
              onClick={() => setShowStockInForm(true)}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Stock In
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowStockOutForm(true)}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Stock Out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Manage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full gap-2"
              onClick={() => setShowItemForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Inventory Management</h2>
        <Button variant="outline" size="sm" onClick={() => printReport(printRef)} className="gap-2">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </div>
      
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            Current Stock
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Stock Balance</CardTitle>
              <CardDescription>
                Real-time stock levels calculated from all entries and exits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockBalance && stockBalance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Stock In</TableHead>
                        <TableHead className="text-center">Stock Out</TableHead>
                        <TableHead className="text-center">Current Stock</TableHead>
                        <TableHead className="text-center">Min Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockBalance.map((item) => (
                        <TableRow 
                          key={item.id}
                          className={item.is_low_stock ? 'bg-destructive/10' : ''}
                        >
                          <TableCell className="font-medium">
                            {item.name}
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categoryLabels[item.category]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 dark:text-emerald-400">
                            +{item.total_stock_in} {item.unit}
                          </TableCell>
                          <TableCell className="text-center text-destructive">
                            -{item.total_stock_out} {item.unit}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {item.current_stock} {item.unit}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {item.min_stock_level} {item.unit}
                          </TableCell>
                          <TableCell>
                            {item.is_low_stock ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory items yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowItemForm(true)}
                  >
                    Add Your First Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="reports">
          <InventoryReports />
        </TabsContent>
      </Tabs>

      {/* Modals/Dialogs */}
      <StockInForm open={showStockInForm} onOpenChange={setShowStockInForm} />
      <StockOutForm open={showStockOutForm} onOpenChange={setShowStockOutForm} />
      <InventoryItemForm open={showItemForm} onOpenChange={setShowItemForm} />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Item"
        description="Are you sure you want to delete this item? All related stock transactions will also be deleted. This action cannot be undone."
        isLoading={deleteItem.isPending}
      />

      {/* Printable Report */}
      <div className="hidden">
        <PrintableReport
          ref={printRef}
          title="Inventory Stock Report"
          subtitle={`Total ${totalItems} items`}
          stats={[
            { label: 'Total Items', value: totalItems },
            { label: 'Low Stock', value: lowStockItems.length },
            { label: 'In Stock', value: totalItems - lowStockItems.length },
            { label: 'Categories', value: '3' },
          ]}
        >
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock In</th>
                <th>Stock Out</th>
                <th>Current Stock</th>
                <th>Min Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockBalance?.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{categoryLabels[item.category]}</td>
                  <td className="text-center">+{item.total_stock_in} {item.unit}</td>
                  <td className="text-center">-{item.total_stock_out} {item.unit}</td>
                  <td className="text-center font-bold">{item.current_stock} {item.unit}</td>
                  <td className="text-center">{item.min_stock_level} {item.unit}</td>
                  <td>
                    <span className={`badge ${item.is_low_stock ? 'badge-cancelled' : 'badge-confirmed'}`}>
                      {item.is_low_stock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintableReport>
      </div>
    </motion.div>
  );
}
