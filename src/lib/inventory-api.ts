import { InventoryResponse, InventoryItem, FormattedInventoryTable } from '../types/inventory';

/**
 * Fetches inventory data for a specific product by its slug
 * @param slug The product slug or style number
 * @returns Promise with inventory data
 */
export async function fetchInventory(slug: string): Promise<InventoryResponse> {
  try {
    const response = await fetch(`/api/inventory/${slug}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch inventory: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
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
 * @returns Promise with inventory data
 */
export async function fetchSanMarInventory(styleNumber: string): Promise<InventoryResponse> {
  try {
    // First try to find the product slug if only style number is provided
    const slug = styleNumber;
    
    const response = await fetch(`/api/inventory/${slug}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch SanMar inventory: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching SanMar inventory:', error);
    return {
      rows: [],
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error fetching SanMar inventory'
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
