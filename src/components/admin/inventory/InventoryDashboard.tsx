import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, ArrowUpCircle, ArrowDownCircle, History, AlertTriangle, TrendingUp } from 'lucide-react';
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

const categoryLabels: Record<InventoryCategory, string> = {
  puja_materials: 'Puja Materials',
  food_prasad: 'Food/Prasad',
  other: 'Other',
};

export function InventoryDashboard() {
  const { data: stockBalance, isLoading } = useInventoryStockBalance();
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [showStockOutForm, setShowStockOutForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  const lowStockItems = stockBalance?.filter(item => item.is_low_stock) || [];
  const totalItems = stockBalance?.length || 0;

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
            <p className="text-xs text-muted-foreground">Items below minimum level</p>
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
                          <TableCell className="text-center text-green-600">
                            +{item.total_stock_in} {item.unit}
                          </TableCell>
                          <TableCell className="text-center text-red-600">
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
    </motion.div>
  );
}
