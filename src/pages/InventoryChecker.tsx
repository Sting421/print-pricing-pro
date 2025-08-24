import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RawInventoryDisplay } from '@/components/RawInventoryDisplay';
import { SoapInventoryData, SoapPartInventory } from '@/lib/inventory-api';

// Match the ApiResponse interface from RawInventoryDisplay
interface ApiResponse {
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

export default function InventoryChecker() {
  const [styleNumber, setStyleNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [soapResponse, setSoapResponse] = useState<ApiResponse | null>(null);
  
  const handleCheckInventory = async () => {
    if (!styleNumber.trim()) {
      setError('Please enter a style number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the localhost endpoint to fetch SOAP inventory data
      const response = await fetch(`http://localhost:8080/api/sanmar-soap-inventory/${styleNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw response data:', data);
      
      // Get the raw responseData directly as it would be logged in inventory-api.ts:225
      // We want to use exactly what's logged at that point
      setSoapResponse(data);
      
      if (!data) {
        setError('No SOAP response data available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data');
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSoapResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Raw Inventory Checker</h1>
          <p className="text-muted-foreground">View raw SOAP inventory data for products</p>
        </div>

        <Card className="shadow-medium mb-6">
          <CardHeader>
            <CardTitle>Check Product Inventory</CardTitle>
            <CardDescription>Enter a product style number to check inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <Label htmlFor="style-number" className="mb-2">Style Number</Label>
                <Input
                  id="style-number"
                  placeholder="e.g. 64000"
                  value={styleNumber}
                  onChange={(e) => setStyleNumber(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCheckInventory} 
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⟳</span> Checking...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Search className="h-4 w-4 mr-2" /> Check Inventory
                    </span>
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {soapResponse && (
          <RawInventoryDisplay 
            soapResponse={soapResponse} 
            isLoading={isLoading} 
            productName={styleNumber}
            onClose={handleClear}
          />
        )}

        {/* Popular styles section */}
        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Popular Style Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['64000', '3001C', '88000', '5000'].map(style => (
                <Button 
                  key={style} 
                  variant="outline"
                  onClick={() => {
                    setStyleNumber(style);
                    handleCheckInventory();
                  }}
                  className="justify-start"
                >
                  {style}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Click a style number to instantly check its inventory.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
