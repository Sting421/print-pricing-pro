import React, { useState, useEffect } from 'react';
import { ApiResponse } from '../components/RawInventoryDisplay';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RawInventoryDisplay } from '../components/RawInventoryDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function RawInventoryDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<ApiResponse | null>(null);
  
  // Get product details from URL params
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const productColor = searchParams.get('color');
  
  // Generate image URL based on product ID and color
  const getImageUrl = () => {
    if (!productId) return null;
    
    // Format for SanMar image URLs
    // e.g.: https://www.alphabroder.com/media/hires/PC850_black_z.jpg
    // This is a placeholder pattern - adjust based on actual vendor image URL pattern
    const colorSlug = productColor?.toLowerCase().replace(/\s+/g, '') || '';
    const baseImageUrl = `https://www.alphabroder.com/media/hires/${productId}`;
    
    return `${baseImageUrl}_${colorSlug}_z.jpg`;
  };
  
  useEffect(() => {
    async function loadInventoryData() {
      if (!productId) {
        setError('No product ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Directly use the inventory-api.ts:349 implementation (PromoStandards SOAP API)
        // instead of fetchSanMarInventory which includes fallbacks
        let url = `/api/sanmar-soap-inventory/${productId}`;
        
        // Add optional parameters if provided
        const params = new URLSearchParams();
        if (productColor) params.append('color', productColor);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        console.log(`Fetching inventory from: ${url}`);
        const soapResponse = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!soapResponse.ok) {
          // Check if we got HTML instead of JSON
          const contentType = soapResponse.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('Received HTML instead of JSON. API endpoint misconfiguration detected.');
          }
          throw new Error(`Failed to fetch inventory data: ${soapResponse.statusText}`);
        }
        
        const data = await soapResponse.json();
        console.log('API response:', data);
        setInventoryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadInventoryData();
  }, [productId, productColor]);
  
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-4 flex items-center gap-2"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {productName || productId || 'Product Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {getImageUrl() ? (
              <div className="relative">
                <img 
                  src={getImageUrl() || '/placeholder.svg'} 
                  alt={`${productName || productId} ${productColor || ''}`}
                  className="max-h-96 object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center">
                  {productId} {productColor ? `- ${productColor}` : ''}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 w-full bg-muted rounded-md">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading product data...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Style Number:</div>
                  <div>{productId}</div>
                  
                  <div className="font-medium">Product Name:</div>
                  <div>{productName || 'N/A'}</div>
                  
                  <div className="font-medium">Color:</div>
                  <div>{productColor || 'N/A'}</div>
                  
                  {/* Additional product info could be displayed here */}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Raw Inventory Display */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading inventory data...</span>
        </div>
      ) : (
        <RawInventoryDisplay 
          soapResponse={inventoryData} 
          isLoading={isLoading} 
          productName={productName || productId}
        />
      )}
    </div>
  );
}
