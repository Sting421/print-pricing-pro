import { InventoryResponse, InventoryItem, FormattedInventoryTable } from '../types/inventory';

export interface SoapInventoryLocation {
  inventoryLocationId: string;
  inventoryLocationName: string;
  postalCode: string;
  country: string;
  inventoryLocationQuantity: {
    Quantity: {
      uom: string;
      value: string;
    };
  };
}

export interface SoapPartInventory {
  partId: string;
  mainPart: string;
  partColor: string;
  labelSize: string;
  partDescription: string;
  quantityAvailable: {
    Quantity: {
      uom: string;
      value: string;
    };
  };
  InventoryLocationArray: {
    InventoryLocation: SoapInventoryLocation[] | SoapInventoryLocation;
  };
}

export interface SoapInventoryData {
  Inventory: {
    productId: string;
    PartInventoryArray: {
      PartInventory: SoapPartInventory[] | SoapPartInventory;
    };
  };
}

export interface SoapResponse {
  success: boolean;
  soapResponse: SoapInventoryData;
}

/**
 * Transform SOAP response to cross-table inventory format
 * The cross-table format is used by the UI to display warehouses as rows and sizes as columns
 */
/**
 * Safely formats any SOAP response data into our expected inventory format
 * Handles both direct SOAP responses and wrapped responses
 */
export function formatSoapToInventoryResponse(soapData: SoapInventoryData | { soapResponse?: SoapInventoryData }, styleNumber: string): InventoryResponse {
  // Handle case where response is wrapped
  const actualSoapData: SoapInventoryData | undefined = 'soapResponse' in soapData && soapData.soapResponse ? 
    soapData.soapResponse as SoapInventoryData : 
    soapData as SoapInventoryData;
  
  if (!actualSoapData || !actualSoapData.Inventory) {
    return {
      rows: [],
      error: true,
      message: 'No inventory data provided'
    };
  }

  try {
    const rows: InventoryItem[] = [];
    const inventory = actualSoapData.Inventory;
    const productId = inventory.productId || styleNumber;
    
    // If there's no PartInventoryArray, return empty
    if (!inventory.PartInventoryArray || !inventory.PartInventoryArray.PartInventory) {
      return {
        rows: [],
        error: true,
        message: 'No part inventory data found in SOAP response'
      };
    }
    
    // Handle both array and single object structures for PartInventory
    let partList: SoapPartInventory[] = [];
    if (Array.isArray(inventory.PartInventoryArray.PartInventory)) {
      partList = inventory.PartInventoryArray.PartInventory;
    } else {
      // Single object case
      partList = [inventory.PartInventoryArray.PartInventory as SoapPartInventory];
    }
    
    // Create a map to collect data by warehouse and size
    // This helps us organize the data for cross-table format
    const warehouseMap: Map<string, Map<string, InventoryItem>> = new Map();
    const colorMap: Map<string, string> = new Map();
    const sizeSet: Set<string> = new Set();
    
    // Process each part in the inventory
    for (const part of partList) {
      const partId = part.partId || '';
      const partColor = part.partColor || '';
      const labelSize = part.labelSize || '';
      const partDescription = part.partDescription || '';
      
      // Keep track of colors and sizes for later processing
      colorMap.set(labelSize, partColor);
      sizeSet.add(labelSize);
      
      // Get inventory locations
      const inventoryLocationArray = part.InventoryLocationArray;
      if (!inventoryLocationArray || !inventoryLocationArray.InventoryLocation) {
        continue;
      }

      // Handle both array and single object structures for InventoryLocation
      let locationList: SoapInventoryLocation[] = [];
      if (Array.isArray(inventoryLocationArray.InventoryLocation)) {
        locationList = inventoryLocationArray.InventoryLocation;
      } else {
        // Single object case
        locationList = [inventoryLocationArray.InventoryLocation as SoapInventoryLocation];
      }
      
      // Map warehouse names to full location names
      const warehouseLocations: Record<string, string> = {
        'Seattle': 'Seattle, WA',
        'Cincinnati': 'Cincinnati, OH',
        'Dallas': 'Dallas, TX',
        'Reno': 'Reno, NV',
        'Robbinsville': 'Robbinsville, NJ',
        'Jacksonville': 'Jacksonville, FL',
        'Minneapolis': 'Minneapolis, MN',
        'Phoenix': 'Phoenix, AZ',
        'Richmond': 'Richmond, VA'
      };
      
      // Process each location for the current part
      for (const location of locationList) {
        const warehouseId = location.inventoryLocationId || '';
        const warehouseName = location.inventoryLocationName || '';
        const warehouseLocation = warehouseLocations[warehouseName] || `${warehouseName}, ${location.country || 'US'}`;
        const quantity = parseInt(location.inventoryLocationQuantity?.Quantity?.value || '0');
        
        // Get or create warehouse entry in our map
        if (!warehouseMap.has(warehouseLocation)) {
          warehouseMap.set(warehouseLocation, new Map());
        }
        const warehouseSizes = warehouseMap.get(warehouseLocation)!;
        
        // Store inventory data by size for this warehouse
        warehouseSizes.set(labelSize, {
          style: productId,
          partId: partId,
          color: partColor,
          description: partDescription,
          size: labelSize,
          warehouseId: warehouseId,
          warehouse: warehouseLocation,
          qty: quantity,
          totalAvailable: quantity
        });
      }
    }
    
    // Convert the nested maps to rows array in the format expected by the UI
    // Sort sizes alphabetically for consistent display
    const sortedSizes = Array.from(sizeSet).sort();
    
    // For each warehouse, create a row with columns for each size
    warehouseMap.forEach((sizesMap, warehouseName) => {
      // Start with basic warehouse info
      // Use a type with index signature to allow dynamic size properties
      const baseRow: Record<string, string | number | null> = {
        style: productId,
        warehouse: warehouseName,
        description: `Inventory for ${productId}`,
      };
      
      // For each size, create a column with quantity
      sortedSizes.forEach(size => {
        const sizeData = sizesMap.get(size);
        if (sizeData) {
          // Each size becomes a property in the row
          baseRow[size] = sizeData.qty;
        } else {
          // If this warehouse doesn't have this size, set quantity to 0
          baseRow[size] = 0;
        }
      });
      
      // Add the row to our results
      rows.push(baseRow as unknown as InventoryItem);
    });
    
    return {
      rows,
      error: rows.length === 0,
      message: rows.length === 0 ? 'No inventory data found' : undefined,
      sizes: sortedSizes, // Pass the sorted sizes to help the UI know which columns to display
      colors: Array.from(colorMap.entries()) // Pass color info for each size
    };
  } catch (error) {
    console.error('Error formatting SOAP inventory response:', error);
    return {
      rows: [],
      error: true,
      message: `Error formatting inventory data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Fetches inventory data for a specific product by its slug
 * @param slug The product slug or style number
 * @returns Promise with inventory data
 */
export async function fetchInventory(slug: string): Promise<InventoryResponse> {
  try {
    // Extract style number from slug (e.g., 60379_DarkGrey -> 60379)
    const styleNumber = slug.split('_')[0];
    
    console.log(`Fetching inventory from provided SOAP endpoint for style ${styleNumber}`);
    
    // Use the provided absolute endpoint
    const response = await fetch(`/api/sanmar-soap-inventory/${styleNumber}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from WebServicePort endpoint: ${errorText}`);
      throw new Error(`Failed to fetch inventory: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('SOAP endpoint response data:', responseData);
    
    // Transform the SOAP response to match expected format
    if (responseData.soapResponse) {
      return responseData.soapResponse;
    } else if (responseData.formattedResponse) {
      // Log the full structure to debug
      console.log('Raw SOAP response structure:', JSON.stringify(responseData.soapResponse, null, 2));
      // Transform SOAP response to cross-table format expected by the UI
      return formatSoapToInventoryResponse(responseData.soapResponse, styleNumber);
    } else if (responseData.rows) {
      // Already in expected format
      return responseData;
    } else {
      // Return empty structure if no recognizable format
      return {
        rows: [],
        error: true,
        message: 'No inventory data available'
      };
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return {
      rows: [],
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error fetching inventory'
    };
  }
}

/**
 * Fetches inventory data from SanMar API by style number
 * @param styleNumber The product style number
 * @param color Optional color filter
 * @param size Optional size filter
 * @returns Promise with inventory data
 */
/**
 * Fetches inventory data from SanMar WebServicePort endpoint using SOAP
 * @param productId The product style number to query
 * @returns Promise with inventory data
 */
export async function fetchWebServiceInventory(productId: string): Promise<InventoryResponse> {
  try {
    console.log(`Fetching inventory from WebServicePort for style ${productId}`);
    
    // Direct SOAP call to the WebServicePort endpoint
    const response = await fetch('/api/sanmar-webservice/' + productId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WebServicePort request failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.data && !data.data.error) {
      return data.data;
    } else if (data.error) {
      throw new Error(data.message || 'Unknown error from WebServicePort');
    }
    
    return {
      rows: [],
      error: true,
      message: 'No inventory data returned from WebServicePort'
    };
  } catch (error) {
    console.error('WebServicePort error:', error);
    throw error;
  }
}

/**
 * Fetches inventory data from SanMar API by style number
 * @param styleNumber The product style number
 * @param color Optional color filter
 * @param size Optional size filter
 * @returns Promise with inventory data
 */
export async function fetchSanMarInventory(
  styleNumber: string, 
  color?: string, 
  size?: string
): Promise<InventoryResponse> {
  try {
    // First try the WebServicePort endpoint
    try {
      const webServiceData = await fetchWebServiceInventory(styleNumber);
      if (!webServiceData.error && webServiceData.rows.length > 0) {
        console.log('Successfully fetched data from WebServicePort');
        return webServiceData;
      }
    } catch (webServiceError) {
      console.warn('WebServicePort endpoint failed, trying alternative methods:', webServiceError);
    }
    
    // Try PromoStandards SOAP API as first fallback
    try {
      let url = `http://localhost:8080/api/sanmar-soap-inventory/${styleNumber}`;
      
      // Add optional parameters if provided
      const params = new URLSearchParams();
      if (color) params.append('color', color);
      if (size) params.append('size', size);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const soapResponse = await fetch(url);
      
      if (soapResponse.ok) {
        const data = await soapResponse.json();
        if (data.formattedResponse && !data.formattedResponse.error) {
          console.log('Successfully fetched data from PromoStandards SOAP API');
          return data.formattedResponse;
        }
      }
    } catch (soapError) {
      console.warn('PromoStandards SOAP API error, falling back to REST API:', soapError);
    }
    
    // If both SOAP methods fail, use REST API as final fallback
    console.log('Trying REST API fallback for style', styleNumber);
    const response = await fetch(`/api/inventory-by-style/${styleNumber}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch SanMar inventory: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('All inventory fetch methods failed:', error);
    return {
      rows: [], 
      error: true, 
      message: error instanceof Error ? error.message : 'Failed to fetch inventory data'
    };
  }
}

/**
 * Format inventory data into a cross-table format
 * @param rows Inventory items
 * @param selectedColor Optional color to filter by
 * @returns Formatted inventory table structure
 */
export function formatInventoryTable(rows: InventoryItem[], selectedColor?: string): FormattedInventoryTable {
  // If no rows, return empty structure
  if (!rows || rows.length === 0) {
    return {
      headers: [],
      warehouses: [],
      data: {},
      totals: {},
      pricing: {}
    };
  }
  
  // Filter by color if specified
  const filteredRows = selectedColor && selectedColor !== 'all'
    ? rows.filter(row => row.color === selectedColor)
    : rows;
  
  // Extract unique sizes and warehouses
  const sizesSet = new Set<string>();
  const warehousesSet = new Set<string>();
  
  filteredRows.forEach(row => {
    if (row.size) {
      sizesSet.add(row.size.toUpperCase());
    }
    if (row.warehouse) {
      warehousesSet.add(row.warehouse);
    }
  });
  
  // Sort sizes logically
  const sortSizes = (a: string, b: string): number => {
    const sizeOrder: Record<string, number> = {
      'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5
    };
    
    // Handle numeric prefixes (2XL, 3XL, etc.)
    if (a[0]?.match(/\d/) && b[0]?.match(/\d/)) {
      const aNum = parseInt(a[0]);
      const bNum = parseInt(b[0]);
      if (aNum !== bNum) return aNum - bNum;
      return a.substring(1).localeCompare(b.substring(1));
    } else if (a[0]?.match(/\d/)) {
      return 1; // Numeric prefix comes after base sizes
    } else if (b[0]?.match(/\d/)) {
      return -1; // Base sizes come before numeric prefix
    }
    
    return (sizeOrder[a] || 99) - (sizeOrder[b] || 99);
  };

  const headers = Array.from(sizesSet).sort(sortSizes);
  
  // Known warehouse order - most common SanMar warehouses
  const knownOrder = [
    "Dallas, TX",
    "Cincinnati, OH", 
    "Richmond, VA",
    "Jacksonville, FL",
    "Phoenix, AZ", 
    "Reno, NV",
    "Minneapolis, MN",
    "Robbinsville, NJ",
    "Seattle, WA"
  ];
  
  const warehouses = [
    ...knownOrder.filter(w => warehousesSet.has(w)),
    ...Array.from(warehousesSet).filter(w => !knownOrder.includes(w)).sort()
  ];

  // Initialize data structure
  const data: Record<string, Record<string, number | null>> = {};
  const totals: Record<string, number> = {};
  const pricing: Record<string, string> = {};
  
  // Initialize totals and pricing
  headers.forEach(size => {
    totals[size] = 0;
  });

  // Initialize warehouse data
  warehouses.forEach(warehouse => {
    data[warehouse] = {};
    headers.forEach(size => {
      data[warehouse][size] = 0;
    });
  });

  // Fill in the data
  filteredRows.forEach(row => {
    const size = row.size.toUpperCase();
    const warehouse = row.warehouse;
    const qty = row.qty || 0;
    
    if (size && warehouse) {
      data[warehouse][size] = qty;
      totals[size] = (totals[size] || 0) + qty;
    }
    
    // Set pricing if available
    if (row.price !== undefined && size) {
      pricing[size] = typeof row.price === 'number' ? row.price.toFixed(2) : row.price.toString();
    }
  });

  return {
    headers,
    warehouses,
    data,
    totals,
    pricing
  };
}

/**
 * Export inventory data to CSV format
 * @param inventoryTable Formatted inventory table
 * @param productName Optional product name for the filename
 * @returns CSV string
 */
export function exportToCSV(inventoryTable: FormattedInventoryTable, productName?: string): string {
  const { headers, warehouses, data, totals, pricing } = inventoryTable;
  let csvContent = '';
  
  // Header row
  csvContent += ',' + headers.join(',') + '\n';
  
  // Pricing row
  csvContent += 'Price ($),';
  csvContent += headers.map(size => pricing[size] || '-').join(',') + '\n';
  
  // Warehouse data
  warehouses.forEach(warehouse => {
    csvContent += warehouse + ',';
    csvContent += headers.map(size => data[warehouse][size] || '0').join(',') + '\n';
  });
  
  // Totals row
  csvContent += 'Total,';
  csvContent += headers.map(size => totals[size] || '0').join(',') + '\n';
  
  return csvContent;
}
