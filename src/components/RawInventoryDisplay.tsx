import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SoapInventoryData, SoapPartInventory } from '../lib/inventory-api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';

// This type allows for both a wrapper format (with soapResponse property)
// and direct SOAP response format (Inventory property directly on the object)
export interface ApiResponse {
  success?: boolean;
  soapResponse?: SoapInventoryData;
  formattedResponse?: Record<string, unknown>;
  message?: string;
  // Allow for direct access to SOAP data properties (from inventory-api.ts:225)
  Inventory?: {
    productId?: string;
    PartInventoryArray?: {
      PartInventory: SoapPartInventory | SoapPartInventory[];
    };
  };
}

interface RawInventoryDisplayProps {
  soapResponse?: ApiResponse;
  isLoading: boolean;
  productName?: string;
  onClose?: () => void;
}

export function RawInventoryDisplay({ soapResponse, isLoading, productName, onClose }: RawInventoryDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('json');
  const navigate = useNavigate();
  
  
  // Debug log to see exact structure
  console.log('Raw soapResponse received in RawInventoryDisplay:', soapResponse);
  
  // Helper: strip HTML tags and decode entities to plain text
  const toPlainText = (html?: string | null): string => {
    if (!html) return '';
    if (typeof window === 'undefined' || typeof document === 'undefined') return html;
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  };
  
  // Helper function to ensure we have an array of part inventory items
  const getPartInventoryArray = (): SoapPartInventory[] => {
    // Check both possible paths for the inventory data
    // Path 1: Direct response from inventory-api.ts:225 (responseData)
    if (soapResponse?.soapResponse?.Inventory?.PartInventoryArray?.PartInventory) {
      const partInventory = soapResponse.soapResponse.Inventory.PartInventoryArray.PartInventory;
      return Array.isArray(partInventory) ? partInventory : [partInventory];
    }
    
    // Path 2: Direct SOAP response structure
    if (soapResponse?.Inventory?.PartInventoryArray?.PartInventory) {
      const partInventory = soapResponse.Inventory.PartInventoryArray.PartInventory;
      return Array.isArray(partInventory) ? partInventory : [partInventory];
    }
    
    return [];
  };

  // Build a mapping of sizes to colors and part details
  const sizeColorMap: Record<string, {color: string, partId: string, description: string}> = {};
  const warehouseMap: Record<string, {id: string, name: string}> = {};
  
  // Get all unique sizes and part details (sanitized)
  getPartInventoryArray().forEach(part => {
    const sizeKey = toPlainText(part.labelSize || '');
    const color = toPlainText(part.partColor || '');
    const description = toPlainText(part.partDescription || '');
    if (sizeKey && color) {
      sizeColorMap[sizeKey] = {
        color,
        partId: part.partId || '',
        description
      };
    }
  });

  // Get all warehouse locations
  getPartInventoryArray().forEach(part => {
    if (part.InventoryLocationArray?.InventoryLocation) {
      const locations = Array.isArray(part.InventoryLocationArray.InventoryLocation) 
        ? part.InventoryLocationArray.InventoryLocation 
        : [part.InventoryLocationArray.InventoryLocation];
      
      locations.forEach(loc => {
        if (loc.inventoryLocationId && loc.inventoryLocationName) {
          warehouseMap[loc.inventoryLocationId] = {
            id: loc.inventoryLocationId,
            name: loc.inventoryLocationName
          };
        }
      });
    }
  });

  // Build the inventory data for cross-table display
  const buildInventoryTable = () => {
    // Create a map of warehouse -> size -> quantity
    const inventoryTable: Record<string, Record<string, number>> = {};
    const sizes = Object.keys(sizeColorMap).sort();
    
    // Initialize table structure
    Object.values(warehouseMap).forEach(warehouse => {
      inventoryTable[warehouse.name] = {};
      sizes.forEach(size => {
        inventoryTable[warehouse.name][size] = 0;
      });
    });
    
    // Fill in quantities (use sanitized size to match keys)
    getPartInventoryArray().forEach(part => {
      const size = toPlainText(part.labelSize || '');
      
      if (part.InventoryLocationArray?.InventoryLocation) {
        const locations = Array.isArray(part.InventoryLocationArray.InventoryLocation)
          ? part.InventoryLocationArray.InventoryLocation
          : [part.InventoryLocationArray.InventoryLocation];
        
        locations.forEach(loc => {
          const qty = parseInt(loc.inventoryLocationQuantity?.Quantity?.value || '0', 10);
          inventoryTable[loc.inventoryLocationName][size] = qty;
        });
      }
    });
    
    return { inventoryTable, sizes };
  };

  const { inventoryTable, sizes } = buildInventoryTable();
  const warehouses = Object.keys(inventoryTable).sort();
  
  // Calculate column totals
  const totals: Record<string, number> = {};
  sizes.forEach(size => {
    totals[size] = warehouses.reduce((sum, wh) => sum + (inventoryTable[wh][size] || 0), 0);
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }
  
  // Check both possible response structures
  const hasInventoryData = Boolean(
    (soapResponse?.soapResponse?.Inventory) || 
    (soapResponse?.Inventory)
  );
  
  if (!soapResponse || !hasInventoryData) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          No raw inventory data available
        </AlertDescription>
      </Alert>
    );
  }
  
  // Build a safe, cleaned title for display
  const rawTitle = productName || 
    soapResponse?.soapResponse?.Inventory?.productId || 
    soapResponse?.Inventory?.productId || 
    'Unknown Product';
  const safeTitle = toPlainText(rawTitle as string);

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              Raw Inventory Data for {safeTitle}
            </CardTitle>
            <CardDescription>
              Showing direct SOAP response data
            </CardDescription>
          </div>
          
         
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="cross-table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cross-table">Cross Table</TabsTrigger>
           
          </TabsList>
          
          <TabsContent value="cross-table">
            {sizes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] border">Warehouse / Size</TableHead>
                      {sizes.map(size => (
                        <TableHead key={size} className="text-center border">
                          {size}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    
                    {/* Warehouse rows */}
                    {warehouses.map(wh => (
                      <TableRow key={wh}>
                        <TableCell className="font-medium border">{wh}</TableCell>
                        {sizes.map(size => {
                          const qty = inventoryTable[wh][size] || 0;
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
                    
                    {/* Totals row */}
                    <TableRow>
                      <TableCell className="font-medium border bg-muted/20">Total</TableCell>
                      {sizes.map(size => {
                        const total = totals[size] || 0;
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
                <AlertDescription>No inventory data available for cross-table display</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="parts">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part ID</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPartInventoryArray().map((part, idx) => {
                    const totalQty = parseInt(part.quantityAvailable?.Quantity?.value || '0', 10);
                    return (
                      <TableRow key={part.partId || idx}>
                        <TableCell>{part.partId || '-'}</TableCell>
                        <TableCell>{part.partColor || '-'}</TableCell>
                        <TableCell>{part.labelSize || '-'}</TableCell>
                        <TableCell>{part.partDescription || '-'}</TableCell>
                        <TableCell className={totalQty === 0 ? 'text-muted-foreground' : totalQty < 10 ? 'text-amber-500' : 'text-green-500 font-medium'}>
                          {totalQty}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="json">
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(soapResponse, null, 2)}
              </pre>
              <div className="mt-4 text-xs text-muted-foreground">
                This is the exact response data logged at inventory-api.ts:225
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
