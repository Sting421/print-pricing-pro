import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryResponse, FormattedInventoryTable } from '../types/inventory';
import { formatInventoryTable, exportToCSV } from '../lib/inventory-api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface InventoryDisplayProps {
  data: InventoryResponse;
  isLoading: boolean;
  productName?: string;
  onExport?: (data: string, filename: string) => void;
}

export function InventoryDisplay({ data, isLoading, productName, onExport }: InventoryDisplayProps) {
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [formattedData, setFormattedData] = useState<FormattedInventoryTable>({
    headers: [],
    warehouses: [],
    data: {},
    totals: {},
    pricing: {}
  });
  
  // Extract unique colors for filtering
  const colors = Array.from(new Set(data.rows.map(item => item.color)))
    .filter(Boolean)
    .sort();

  // Format inventory data when it changes or color selection changes
  useEffect(() => {
    if (!data.rows || data.rows.length === 0) return;
    
    const formatted = formatInventoryTable(data.rows, selectedColor);
    setFormattedData(formatted);
  }, [data.rows, selectedColor]);

  // Function to handle export
  const handleExport = () => {
    if (!formattedData.headers.length) return;
    
    // Generate CSV content
    const csvContent = exportToCSV(formattedData, productName);
    
    // If onExport function is provided, use it
    if (onExport) {
      onExport(csvContent, `inventory-${productName || 'export'}.csv`);
      return;
    }
    
    // Otherwise handle export directly
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-${productName || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate inventory summary statistics
  const totalInventory = Object.values(formattedData.totals).reduce((sum, val) => sum + val, 0);
  const warehouseCount = formattedData.warehouses.length;
  const sizeCount = formattedData.headers.length;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }

  if (data.error || data.rows.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          {data.message || 'No inventory data available'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              Inventory for {productName || 'Product'}
            </CardTitle>
            <CardDescription className="mt-1">
              {totalInventory} total units across {warehouseCount} warehouses, {sizeCount} sizes{colors.length > 1 ? `, ${colors.length} colors` : ''}
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleExport}
              disabled={formattedData.headers.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {colors.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge 
              variant={selectedColor === 'all' ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedColor('all')}
            >
              All Colors
            </Badge>
            {colors.map(color => (
              <Badge
                key={color}
                variant={selectedColor === color ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {formattedData.warehouses.length > 0 && formattedData.headers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] border">Size</TableHead>
                  {formattedData.headers.map(size => (
                    <TableHead key={size} className="text-center border">
                      {size}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Pricing row */}
                {Object.keys(formattedData.pricing).length > 0 && (
                  <TableRow>
                    <TableCell className="font-medium border bg-muted/20">Price ($)</TableCell>
                    {formattedData.headers.map(size => (
                      <TableCell key={`price-${size}`} className="text-center border bg-muted/20">
                        {formattedData.pricing[size] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
                
                {/* Warehouse data rows */}
                {formattedData.warehouses.map(wh => (
                  <TableRow key={wh}>
                    <TableCell className="font-medium border">{wh}</TableCell>
                    {formattedData.headers.map(size => {
                      const qty = formattedData.data[wh][size] || 0;
                      return (
                        <TableCell 
                          key={`${wh}-${size}`} 
                          className={`text-center border ${qty === 0 ? 'text-muted-foreground' : qty < 10 ? 'text-amber-500' : 'text-green-500 font-medium'}`}
                        >
                          {qty}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                
                {/* Total row */}
                <TableRow>
                  <TableCell className="font-medium border bg-muted/20">Total</TableCell>
                  {formattedData.headers.map(size => {
                    const total = formattedData.totals[size] || 0;
                    return (
                      <TableCell 
                        key={`total-${size}`} 
                        className={`text-center font-medium border bg-muted/20 ${total === 0 ? 'text-muted-foreground' : total < 10 ? 'text-amber-500' : 'text-green-500'}`}
                      >
                        {total}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertDescription>No inventory data available for the selected filters</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
