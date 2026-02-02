import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { TrendingUp, Package, Truck, PieChartIcon, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventoryStockBalance, useStockInHistory, useStockOutHistory, InventoryCategory } from '@/hooks/useInventory';

const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  puja_materials: '#f97316',
  food_prasad: '#22c55e',
  other: '#6366f1',
};

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  puja_materials: 'Puja Materials',
  food_prasad: 'Food/Prasad',
  other: 'Other',
};

export function InventoryReports() {
  const { data: stockBalance } = useInventoryStockBalance();
  const { data: stockInHistory } = useStockInHistory();
  const { data: stockOutHistory } = useStockOutHistory();
  const [selectedMonths, setSelectedMonths] = useState('6');

  // Generate monthly usage data
  const monthlyUsageData = useMemo(() => {
    if (!stockOutHistory) return [];

    const months = parseInt(selectedMonths);
    const data: { month: string; total: number; puja_materials: number; food_prasad: number; other: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthItems = stockOutHistory.filter(item => {
        const exitDate = parseISO(item.exit_date);
        return isWithinInterval(exitDate, { start: monthStart, end: monthEnd });
      });

      const byCategory = {
        puja_materials: 0,
        food_prasad: 0,
        other: 0,
      };

      monthItems.forEach(item => {
        const category = (item as any).inventory_items?.category as InventoryCategory;
        if (category && byCategory[category] !== undefined) {
          byCategory[category] += item.quantity;
        }
      });

      data.push({
        month: format(monthDate, 'MMM yyyy'),
        total: monthItems.reduce((sum, item) => sum + item.quantity, 0),
        ...byCategory,
      });
    }

    return data;
  }, [stockOutHistory, selectedMonths]);

  // Generate supplier-wise purchase summary
  const supplierData = useMemo(() => {
    if (!stockInHistory) return [];

    const supplierMap = new Map<string, { count: number; totalQty: number; items: string[] }>();

    stockInHistory.forEach(entry => {
      const supplier = entry.supplier || 'Unknown';
      const existing = supplierMap.get(supplier) || { count: 0, totalQty: 0, items: [] };
      existing.count += 1;
      existing.totalQty += entry.quantity;
      const itemName = (entry as any).inventory_items?.name;
      if (itemName && !existing.items.includes(itemName)) {
        existing.items.push(itemName);
      }
      supplierMap.set(supplier, existing);
    });

    return Array.from(supplierMap.entries())
      .map(([name, data]) => ({
        name,
        purchases: data.count,
        totalQuantity: data.totalQty,
        items: data.items.slice(0, 3).join(', '),
      }))
      .sort((a, b) => b.purchases - a.purchases);
  }, [stockInHistory]);

  // Generate category distribution
  const categoryDistribution = useMemo(() => {
    if (!stockBalance) return [];

    const distribution: Record<InventoryCategory, { items: number; totalStock: number }> = {
      puja_materials: { items: 0, totalStock: 0 },
      food_prasad: { items: 0, totalStock: 0 },
      other: { items: 0, totalStock: 0 },
    };

    stockBalance.forEach(item => {
      if (distribution[item.category]) {
        distribution[item.category].items += 1;
        distribution[item.category].totalStock += item.current_stock;
      }
    });

    return Object.entries(distribution).map(([category, data]) => ({
      name: CATEGORY_LABELS[category as InventoryCategory],
      category: category as InventoryCategory,
      items: data.items,
      totalStock: data.totalStock,
    }));
  }, [stockBalance]);

  // Export report as CSV
  const handleExportReport = () => {
    const lines: string[] = [];
    
    // Monthly Usage Section
    lines.push('=== Monthly Usage Report ===');
    lines.push('Month,Total,Puja Materials,Food/Prasad,Other');
    monthlyUsageData.forEach(row => {
      lines.push(`${row.month},${row.total},${row.puja_materials},${row.food_prasad},${row.other}`);
    });
    
    lines.push('');
    lines.push('=== Supplier Summary ===');
    lines.push('Supplier,Purchases,Total Quantity,Common Items');
    supplierData.forEach(row => {
      lines.push(`"${row.name}",${row.purchases},${row.totalQuantity},"${row.items}"`);
    });

    lines.push('');
    lines.push('=== Category Distribution ===');
    lines.push('Category,Items,Total Stock');
    categoryDistribution.forEach(row => {
      lines.push(`${row.name},${row.items},${row.totalStock}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Inventory Reports
          </h2>
          <p className="text-muted-foreground">Analytics and insights for inventory management</p>
        </div>
        <Button onClick={handleExportReport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage" className="gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Usage
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Monthly Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Usage Trends</CardTitle>
                <CardDescription>Stock consumption over time by category</CardDescription>
              </div>
              <Select value={selectedMonths} onValueChange={setSelectedMonths}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {monthlyUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Bar 
                      dataKey="puja_materials" 
                      name="Puja Materials" 
                      fill={CATEGORY_COLORS.puja_materials} 
                      stackId="a"
                    />
                    <Bar 
                      dataKey="food_prasad" 
                      name="Food/Prasad" 
                      fill={CATEGORY_COLORS.food_prasad} 
                      stackId="a"
                    />
                    <Bar 
                      dataKey="other" 
                      name="Other" 
                      fill={CATEGORY_COLORS.other} 
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No usage data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Purchase Summary</CardTitle>
              <CardDescription>Overview of purchases by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              {supplierData.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supplierData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="purchases" name="Purchases" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Supplier</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Purchases</th>
                          <th className="px-4 py-2 text-center text-sm font-medium">Total Qty</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Common Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierData.map((supplier, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 font-medium">{supplier.name}</td>
                            <td className="px-4 py-2 text-center">{supplier.purchases}</td>
                            <td className="px-4 py-2 text-center">{supplier.totalQuantity}</td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">{supplier.items || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No supplier data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Distribution by Category</CardTitle>
                <CardDescription>Current stock levels across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryDistribution.some(c => c.totalStock > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="totalStock"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stock data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Summary</CardTitle>
                <CardDescription>Items and stock by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryDistribution.map((category) => (
                    <div 
                      key={category.category} 
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[category.category] }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.items} items</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {category.totalStock} units
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
