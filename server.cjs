const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.sanmar.com",
        "Referer": `https://www.sanmar.com/search/?text=${encodeURIComponent(query)}`,
        "Content-Type": "application/json;charset=UTF-8",
        "Cookie": req.headers.cookie || ""
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from SanMar API:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventory/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const response = await axios.get(`https://www.sanmar.com/p/${slug}/checkInventoryJson?pantWaistSize=`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.sanmar.com",
        "Referer": `https://www.sanmar.com/p/${slug}`,
        "Cookie": req.headers.cookie || ""
      }
    });
    
    // Parse the inventory data into our standardized format
    const parsedData = parseWebJsonInventory(response.data, slug);
    res.json(parsedData);
  } catch (error) {
    console.error('Error fetching inventory from SanMar API:', error.message);
    res.status(500).json({
      rows: [],
      error: true,
      message: `Failed to fetch inventory for ${slug}: ${error.message}`
    });
  }
});

/**
 * Parse SanMar WebJSON inventory response into standardized format
 */
function parseWebJsonInventory(data, slug) {
  try {
    const rows = [];
    
    // Extract style number from the data
    const styleNumber = data.styleNumber || slug;
    
    // Process each color in the inventory data
    if (data.colors && Array.isArray(data.colors)) {
      data.colors.forEach(color => {
        const colorName = color.name || 'Unknown';
        const colorCode = color.code || '';
        
        // Process sizes for this color
        if (color.sizes && Array.isArray(color.sizes)) {
          color.sizes.forEach(size => {
            const sizeName = size.name || 'Unknown';
            
            // Process warehouses for this size/color
            if (size.warehouses && Array.isArray(size.warehouses)) {
              size.warehouses.forEach(warehouse => {
                const warehouseName = warehouse.name || 'Unknown';
                const warehouseId = warehouse.id || '';
                const quantity = warehouse.quantity !== undefined ? parseInt(warehouse.quantity, 10) : null;
                
                // Create inventory item
                rows.push({
                  style: styleNumber,
                  partId: `${styleNumber}-${colorCode}-${sizeName}`,
                  color: colorName,
                  size: sizeName,
                  description: `${styleNumber} ${colorName} ${sizeName}`,
                  warehouseId: warehouseId,
                  warehouse: warehouseName,
                  qty: quantity,
                  totalAvailable: quantity
                });
              });
            }
          });
        }
      });
    }
    
    return {
      rows,
      error: rows.length === 0,
      message: rows.length === 0 ? 'No inventory data found' : undefined
    };
  } catch (error) {
    console.error('Error parsing inventory data:', error);
    return {
      rows: [],
      error: true,
      message: `Error parsing inventory: ${error.message}`
    };
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
