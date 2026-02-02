import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Download, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactionHistory } from '@/hooks/useInventory';

export function TransactionHistory() {
  const { data: transactions, isLoading } = useTransactionHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  const filteredTransactions = transactions?.filter((tx) => {
    const matchesSearch = 
      tx.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const exportToCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const headers = ['Date', 'Type', 'Item', 'Quantity', 'Unit', 'Details', 'Notes', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => [
        tx.date,
        tx.type === 'in' ? 'Stock In' : 'Stock Out',
        `"${tx.item_name}"`,
        tx.quantity,
        tx.unit,
        `"${tx.details || ''}"`,
        `"${tx.notes || ''}"`,
        format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm:ss'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Complete audit trail of all stock entries and exits
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item, details, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value: 'all' | 'in' | 'out') => setTypeFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="in">Stock In Only</SelectItem>
              <SelectItem value="out">Stock Out Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Table */}
        {filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={`${tx.type}-${tx.id}`}>
                    <TableCell>
                      {tx.type === 'in' ? (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <ArrowUpCircle className="h-3 w-3" />
                          IN
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <ArrowDownCircle className="h-3 w-3" />
                          OUT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{tx.item_name}</TableCell>
                    <TableCell className="text-center">
                      <span className={tx.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'in' ? '+' : '-'}{tx.quantity} {tx.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {tx.details || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {tx.notes || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || typeFilter !== 'all' 
              ? 'No transactions match your filters.'
              : 'No transactions recorded yet. Start by adding stock entries.'}
          </div>
        )}

        {/* Summary */}
        {filteredTransactions && filteredTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
            <span>
              {filteredTransactions.filter(t => t.type === 'in').length} entries, {' '}
              {filteredTransactions.filter(t => t.type === 'out').length} exits
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
