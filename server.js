import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

// Default headers for SanMar API requests
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "X-Requested-With": "XMLHttpRequest",
  "Origin": "https://www.sanmar.com",
  "Content-Type": "application/json;charset=UTF-8"
};

/**
 * Normalize and format inventory data
 */
function formatInventoryResponse(data) {
  if (!data || !data.items || !Array.isArray(data.items)) {
    return { rows: [], error: true, message: "Invalid inventory data structure" };
  }
  
  const rows = [];
  
  data.items.forEach(item => {
    // Process each inventory item
    if (item.inventoryItems && Array.isArray(item.inventoryItems)) {
      item.inventoryItems.forEach(invItem => {
        // Extract the base information from the item
        const baseInfo = {
          style: item.styleCode || item.style || "",
          partId: item.partId || invItem.partId || "",
          color: item.colorName || invItem.colorName || "",
          description: item.description || ""
        };
        
        // Process inventory by warehouse
        if (invItem.warehouseInventory && Array.isArray(invItem.warehouseInventory)) {
          invItem.warehouseInventory.forEach(whInv => {
            if (whInv.inventoryBySize && Array.isArray(whInv.inventoryBySize)) {
              whInv.inventoryBySize.forEach(sizeInv => {
                rows.push({
                  ...baseInfo,
                  size: sizeInv.size || "",
                  warehouseId: whInv.warehouseNo || "",
                  warehouse: whInv.warehouse || "",
                  qty: sizeInv.qtyAvailable || 0,
                  totalAvailable: sizeInv.qtyAvailable || 0,
                  price: item.price || null
                });
              });
            }
          });
        }
      });
    }
  });
  
  return { 
    rows,
    error: rows.length === 0,
    message: rows.length === 0 ? "No inventory data found" : undefined
  };
}

/**
 * Search for products on SanMar
 */
app.post('/api/search', async (req, res) => {
  const { query, page, pageSize, sort } = req.body;
  try {
    const response = await axios.post('https://www.sanmar.com/search/findProducts.json', {
      text: query,
      currentPage: page,
      pageSize: pageSize,
      sort: sort
    }, {
      headers: {
        ...DEFAULT_HEADERS,
        "Referer": `https://www.sanmar.com/search/?text=${encodeURIComponent(query)}`,
        "Cookie": req.headers.cookie || ""
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from SanMar API:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get inventory by product slug
 */
app.get('/api/inventory/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    // First try direct inventory API
    const response = await axios.get(`https://www.sanmar.com/api/inventory/${slug}`, {
      headers: {
        ...DEFAULT_HEADERS,
        "Referer": `https://www.sanmar.com/p/${slug}`,
        "Cookie": req.headers.cookie || ""
      }
    });
    
    // Format the inventory response
    const formattedData = formatInventoryResponse(response.data);
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching inventory from SanMar API:', error.message);
    
    // Try fallback to product detail API which might include some inventory data
    try {
      const detailResponse = await axios.get(`https://www.sanmar.com/api/products/${slug}`, {
        headers: {
          ...DEFAULT_HEADERS,
          "Referer": `https://www.sanmar.com/p/${slug}`,
          "Cookie": req.headers.cookie || ""
        }
      });
      
      // Extract inventory from product detail if available
      if (detailResponse.data && detailResponse.data.product) {
        const productDetail = detailResponse.data.product;
        const inventoryData = {
          items: [{
            styleCode: productDetail.styleCode,
            description: productDetail.name,
            price: productDetail.price,
            inventoryItems: productDetail.inventoryItems || []
          }]
        };
        
        const formattedData = formatInventoryResponse(inventoryData);
        return res.json(formattedData);
      }
      
      // If we got here, no inventory data was found
      res.status(404).json({ rows: [], error: true, message: 'No inventory data available for this product' });
    } catch (fallbackError) {
      console.error('Fallback inventory fetch failed:', fallbackError.message);
      res.status(500).json({ 
        rows: [], 
        error: true, 
        message: `Failed to fetch inventory data: ${error.message}` 
      });
    }
  }
});

/**
 * Get inventory by style number
 */
app.get('/api/inventory-by-style/:styleNumber', async (req, res) => {
  const { styleNumber } = req.params;
  try {
    // Search for the style first to get the slug
    const searchResponse = await axios.post('https://www.sanmar.com/search/findProducts.json', {
      text: styleNumber,
      currentPage: 0,
      pageSize: 10,
      sort: 'relevance'
    }, {
      headers: {
        ...DEFAULT_HEADERS,
        "Referer": `https://www.sanmar.com/search/?text=${encodeURIComponent(styleNumber)}`,
        "Cookie": req.headers.cookie || ""
      }
    });
    
    // Find exact match in search results
    let slug = null;
    if (searchResponse.data && (searchResponse.data.results || searchResponse.data.products)) {
      const results = searchResponse.data.results || searchResponse.data.products;
      const exactMatch = results.find(item => 
        item.styleNumber === styleNumber || 
        item.style === styleNumber || 
        item.code === styleNumber
      );
      
      if (exactMatch && exactMatch.url) {
        // Extract slug from URL
        try {
          const urlParts = exactMatch.url.split('/p/');
          if (urlParts.length > 1) {
            slug = urlParts[1].split(/[\/\?#]/)[0]; // Remove trailing slashes or params
          }
        } catch (e) {
          console.error('Error extracting slug from URL:', e);
        }
      }
    }
    
    if (!slug) {
      return res.status(404).json({ 
        rows: [], 
        error: true, 
        message: `Could not find product with style number: ${styleNumber}` 
      });
    }
    
    // Now that we have a slug, get the inventory
    const inventoryResponse = await axios.get(`https://www.sanmar.com/api/inventory/${slug}`, {
      headers: {
        ...DEFAULT_HEADERS,
        "Referer": `https://www.sanmar.com/p/${slug}`,
        "Cookie": req.headers.cookie || ""
      }
    });
    
    // Format the inventory response
    const formattedData = formatInventoryResponse(inventoryResponse.data);
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching inventory by style number:', error.message);
    res.status(500).json({ 
      rows: [], 
      error: true, 
      message: `Failed to fetch inventory data: ${error.message}` 
    });
  }
});

/**
 * Export inventory to CSV
 */
app.post('/api/export-inventory', (req, res) => {
  const { data, productName } = req.body;
  
  if (!data || !data.headers || !data.warehouses) {
    return res.status(400).json({ error: 'Invalid inventory data for export' });
  }
  
  try {
    // Generate CSV content
    let csvContent = '';
    
    // Header row
    csvContent += ',' + data.headers.join(',') + '\n';
    
    // Pricing row if available
    if (data.pricing) {
      csvContent += 'Price ($),';
      csvContent += data.headers.map(size => data.pricing[size] || '-').join(',') + '\n';
    }
    
    // Warehouse data
    data.warehouses.forEach(warehouse => {
      csvContent += warehouse + ',';
      csvContent += data.headers.map(size => {
        const qty = data.data[warehouse][size];
        return qty !== null && qty !== undefined ? qty : '0';
      }).join(',') + '\n';
    });
    
    // Totals row
    csvContent += 'Total,';
    csvContent += data.headers.map(size => data.totals[size] || '0').join(',') + '\n';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${productName || 'export'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting inventory to CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
