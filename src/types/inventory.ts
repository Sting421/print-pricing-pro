export interface InventoryItem {
  style: string;
  partId: string;
  color: string;
  size: string;
  description: string;
  warehouseId: string;
  warehouse: string;
  qty: number | null;
  totalAvailable: number | null;
  price?: number | string;
}

export interface InventoryResponse {
  rows: InventoryItem[];
  error?: boolean;
  message?: string;
}

/**
 * Formatted inventory data structure for cross table display
 */
export interface FormattedInventoryTable {
  headers: string[]; // Size values
  warehouses: string[]; // Warehouse names
  data: Record<string, Record<string, number | null>>; // warehouse -> size -> qty
  totals: Record<string, number>; // size -> total qty
  pricing: Record<string, string>; // size -> price
}

export interface InventoryQueryParams {
  productId?: string;
  style?: string;
  color?: string;
  size?: string;
  labelSizes?: string[];
  partColors?: string[];
  partIds?: string[];
  byWarehouse?: boolean;
  warehouseNo?: string;
}
