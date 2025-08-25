import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';
import dotenv from 'dotenv';  // Import dotenv

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Log if .env file was loaded
console.log('Current directory:', process.cwd());
console.log('.env path:', path.resolve(process.cwd(), '.env'));

// SanMar API credentials from environment variables
const SANMAR_CUSTOMER_NUMBER = process.env.SANMAR_CUSTOMER_NUMBER || 'DEMO';
const SANMAR_USERNAME = process.env.SANMAR_USERNAME || 'DEMO';
const SANMAR_PASSWORD = process.env.SANMAR_PASSWORD || 'DEMO';
const SANMAR_USE_TEST = process.env.SANMAR_USE_TEST === 'true';
const SANMAR_BACKEND = process.env.SANMAR_BACKEND || 'promostandards';
const HTTP_TIMEOUT_SECONDS = parseInt(process.env.HTTP_TIMEOUT_SECONDS || '30', 10) * 1000; // Convert to ms

// Debug credentials and configuration
console.log('Environment variables:', {
  SANMAR_CUSTOMER_NUMBER: process.env.SANMAR_CUSTOMER_NUMBER || 'NOT SET',
  SANMAR_USERNAME: process.env.SANMAR_USERNAME || 'NOT SET', 
  SANMAR_PASSWORD: process.env.SANMAR_PASSWORD || 'NOT SET',
  SANMAR_USE_TEST: process.env.SANMAR_USE_TEST || 'NOT SET',
  SANMAR_BACKEND: process.env.VITE_SANMAR_BACKEND || 'NOT SET',
  HTTP_TIMEOUT_SECONDS: process.env.VITE_HTTP_TIMEOUT_SECONDS || 'NOT SET'
});

console.log('SanMar configuration:', {
  customerNumber: SANMAR_CUSTOMER_NUMBER,
  username: SANMAR_USERNAME,
  password: SANMAR_PASSWORD,
  useTestEnv: SANMAR_USE_TEST,
  backend: SANMAR_BACKEND,
  timeoutMs: HTTP_TIMEOUT_SECONDS
});

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

// SOAP API headers
const SOAP_HEADERS = {
  "Content-Type": "text/xml;charset=UTF-8",
  "Accept": "text/xml",
  "SOAPAction": ""
};

// XML parser
const parser = new xml2js.Parser({
  explicitArray: false,
  ignoreAttrs: true,
  tagNameProcessors: [xml2js.processors.stripPrefix]
});

/**
 * Convert XML to JSON
 */
async function parseXmlResponse(xmlData) {
  try {
    const result = await parser.parseStringPromise(xmlData);
    return result;
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw new Error('Failed to parse XML response');
  }
}

/**
 * Create a SOAP envelope for SanMar API calls
 */
function createSoapEnvelope(method, params) {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:impl="http://impl.webservice.integration.sanmar.com/">
    <soapenv:Header />
    <soapenv:Body>
      <impl:${method}>
        ${params}
      </impl:${method}>
    </soapenv:Body>
  </soapenv:Envelope>`;
}

/**
 * Make a SOAP API call to SanMar
 */
async function callSanMarSoapApi(endpoint, method, params) {
  try {
    const soapEnvelope = createSoapEnvelope(method, params);
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: SOAP_HEADERS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    const jsonData = await parseXmlResponse(response.data);
    return jsonData;
  } catch (error) {
    console.error(`Error calling SanMar SOAP API (${method}):`, error.message);
    throw error;
  }
}

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
    // First try the REST API approach
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
      
      if (slug) {
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
        return res.json(formattedData);
      }
    } catch (restError) {
      console.log('REST API approach failed, falling back to SOAP API:', restError.message);
      // If REST approach fails, continue to SOAP approach
    }
    
    // If we get here, try the SOAP API approach
    // Use the getInventoryByStyleColorSize SOAP method
    const soapEndpoint = 'https://ws.sanmar.com:8080/SanMarWebService/SanMarInventoryServicePort';
    const method = 'getInventoryByStyleColorSize';
    
    // Creating the SOAP request params
    const soapParams = `
      <arg0>
        <style>${styleNumber}</style>
      </arg0>
      <arg1>
        <sanMarCustomerNumber>${SANMAR_CUSTOMER_NUMBER}</sanMarCustomerNumber>
        <sanMarUserName>${SANMAR_USERNAME}</sanMarUserName>
        <sanMarUserPassword>${SANMAR_PASSWORD}</sanMarUserPassword>
      </arg1>
    `;
    
    const soapResponse = await callSanMarSoapApi(soapEndpoint, method, soapParams);
    
    // Process SOAP response
    if (soapResponse && soapResponse.Envelope && soapResponse.Envelope.Body) {
      const responseBody = soapResponse.Envelope.Body;
      const inventoryResponse = responseBody[`${method}Response`];
      
      if (inventoryResponse && inventoryResponse.return) {
        // Format the inventory response from SOAP to match our expected format
        const soapInventory = inventoryResponse.return;
        
        // Map SOAP response to our expected structure
        let items = [];
        if (!soapInventory.errorOccured && soapInventory.inventoryItems) {
          const invItems = Array.isArray(soapInventory.inventoryItems.inventoryItem) 
            ? soapInventory.inventoryItems.inventoryItem 
            : [soapInventory.inventoryItems.inventoryItem];
          
          items = invItems.map(item => ({
            styleCode: styleNumber,
            description: item.description || styleNumber,
            inventoryItems: [{
              partId: item.partId,
              colorName: item.colorDescription,
              warehouseInventory: item.warehouseQty.map(whItem => ({
                warehouseNo: whItem.warehouseNo,
                warehouse: `Warehouse ${whItem.warehouseNo}`,
                inventoryBySize: [{
                  size: item.size,
                  qtyAvailable: whItem.qty
                }]
              }))
            }]
          }));
        }
        
        const formattedData = formatInventoryResponse({ items });
        return res.json(formattedData);
      }
    }
    
    // If we get here, neither approach worked
    res.status(404).json({ 
      rows: [], 
      error: true, 
      message: `Could not find inventory for style number: ${styleNumber}` 
    });
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
 * Endpoint for WebServicePort SOAP API calls using the specified WSDL
 * Support both GET and POST for flexibility
 */
app.all('/api/sanmar-webservice/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    // Using the WebServicePort endpoint as specified
    const soapEndpoint = 'https://ws.sanmar.com:8080/SanMarWebService/SanMarWebServicePort';
    
    // Creating the SOAP envelope using the provided template
    const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.promostandards.org/WSDL/Inventory/2.0.0/" xmlns:shar="http://www.promostandards.org/WSDL/Inventory/2.0.0/SharedObjects/">
      <soapenv:Header />
      <soapenv:Body>
        <ns:GetInventoryLevelsRequest>
          <shar:wsVersion>2.0.0</shar:wsVersion>
          <shar:id>${SANMAR_USERNAME}</shar:id>
          <shar:password>${SANMAR_PASSWORD}</shar:password>
          <shar:productId>${productId}</shar:productId>
        </ns:GetInventoryLevelsRequest>
      </soapenv:Body>
    </soapenv:Envelope>`;
    
    // Make the SOAP request
    const response = await axios.post(
      soapEndpoint,
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': ''
        },
        timeout: HTTP_TIMEOUT_SECONDS
      }
    );
    
    // Parse the XML response
    const result = await parseXmlResponse(response.data);
    console.log('WebServicePort response:', JSON.stringify(result, null, 2));
    
    // Format and return the response
    res.json({
      success: true,
      rawResponse: result,
      data: formatSoapInventoryResponse(result, productId)
    });
    
  } catch (error) {
    console.error('Error calling SanMar WebServicePort:', error.message);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * Dedicated SOAP API endpoint for SanMar inventory
 */
app.get('/api/sanmar-soap-inventory/:styleNumber', async (req, res) => {
  const { styleNumber } = req.params;
  const { color, size } = req.query;
  
  try {
    // Use the PromoStandards InventoryServiceBindingV2final endpoint
    const soapEndpoint = 'https://ws.sanmar.com:8080/promostandards/InventoryServiceBindingV2final';
    
    // Create the SOAP envelope with the correct format
    const soapEnvelope = createGetInventoryByStyleNumberEnvelope(styleNumber, color, size);
    
    // Make the SOAP request
    const response = await axios.post(
      soapEndpoint,
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://www.promostandards.org/WSDL/Inventory/2.0.0/getInventoryLevels'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    // Parse the XML response
    const soapResponse = await parseXmlResponse(response.data);
    
    if (soapResponse && soapResponse.Envelope && soapResponse.Envelope.Body) {
      const responseBody = soapResponse.Envelope.Body;
      
      // Look for GetInventoryLevelsResponse in the PromoStandards response
      const inventoryResponse = responseBody['GetInventoryLevelsResponse'] || responseBody['ns:GetInventoryLevelsResponse'];
      
      if (inventoryResponse) {
        // Format the response for client consumption
        const formattedResponse = formatSoapInventoryResponse(inventoryResponse, styleNumber);
        return res.json({
          success: true,
          soapResponse: inventoryResponse,
          formattedResponse: formattedResponse
        });
      }
    }
    
    res.status(404).json({ error: true, message: 'No inventory data found' });
  } catch (error) {
    console.error('Error fetching SanMar SOAP inventory:', error.message);
    res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * Format SOAP inventory response to match our expected structure
 * Handles PromoStandards Inventory 2.0.0 format
 */
function formatSoapInventoryResponse(soapData, styleNumber) {
  if (!soapData) {
    return {
      rows: [],
      error: true,
      message: 'No data in SOAP response'
    };
  }
  
  try {
    const rows = [];
    
    // Navigate through the PromoStandards response structure
    const inventoryLevels = soapData['shar:Product'] || soapData['Product'];
    
    if (!inventoryLevels) {
      console.log('PromoStandards response format unexpected:', JSON.stringify(soapData, null, 2));
      return {
        rows: [],
        error: true,
        message: 'Inventory data not found in response'
      };
    }
    
    // Handle array or single item response
    const productList = Array.isArray(inventoryLevels) ? inventoryLevels : [inventoryLevels];
    
    productList.forEach(product => {
      // Get product ID and description
      const productId = product['shar:productId'] || product.productId || styleNumber;
      const productDesc = product['shar:productName'] || product.productName || '';
      
      // Get inventory locations
      const partInventoryArray = product['shar:PartInventoryArray'] || product.PartInventoryArray;
      if (!partInventoryArray) return;
      
      const partInventory = partInventoryArray['shar:PartInventory'] || partInventoryArray.PartInventory;
      if (!partInventory) return;
      
      // Handle array or single item
      const partList = Array.isArray(partInventory) ? partInventory : [partInventory];
      
      partList.forEach(part => {
        // Get color and size info
        const partId = part['shar:partId'] || part.partId || '';
        const partColor = part['shar:partColor'] || part.partColor || '';
        const partColorName = part['shar:partColorName'] || part.partColorName || '';
        const partSize = part['shar:partSize'] || part.partSize || '';
        const partSizeName = part['shar:partSizeName'] || part.partSizeName || '';
        
        // Get inventory quantities
        const quantityInfo = part['shar:Quantity'] || part.Quantity;
        if (!quantityInfo) return;
        
        // Get warehouse information
        const warehouseId = quantityInfo['shar:warehouseId'] || quantityInfo.warehouseId || '';
        const warehouseName = quantityInfo['shar:warehouseName'] || quantityInfo.warehouseName || '';
        
        // Map warehouse IDs to locations (for display purposes)
        const warehouseLocations = {
          '1': 'Seattle, WA',
          '2': 'Cincinnati, OH',
          '3': 'Dallas, TX',
          '4': 'Reno, NV',
          '5': 'Robbinsville, NJ',
          '6': 'Jacksonville, FL',
          '7': 'Minneapolis, MN',
          '12': 'Phoenix, AZ',
          '31': 'Richmond, VA'
        };
        
        const warehouseLocation = warehouseName || warehouseLocations[warehouseId] || `Warehouse ${warehouseId}`;
        
        // Get actual quantity
        const quantityAvailable = parseInt(quantityInfo['shar:quantityAvailable'] || quantityInfo.quantityAvailable || 0);
        
        // Create formatted row
        rows.push({
          style: productId,
          partId: partId,
          color: partColorName || partColor,
          description: productDesc,
          size: partSizeName || partSize,
          warehouseId: warehouseId,
          warehouse: warehouseLocation,
          qty: quantityAvailable,
          totalAvailable: quantityAvailable
        });
      });
    });
    
    return {
      rows,
      error: rows.length === 0,
      message: rows.length === 0 ? 'No inventory data found' : undefined
    };
  } catch (error) {
    console.error('Error formatting PromoStandards inventory response:', error);
    return {
      rows: [],
      error: true,
      message: 'Error formatting inventory data: ' + error.message
    };
  }
}

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

/**
 * Create a SOAP envelope for getInventoryLevels PromoStandards request
 */
function createGetInventoryByStyleNumberEnvelope(styleNumber, color, size) {
  // Format follows the exact example from the SanMar documentation
  if (color && size) {
    // Query Type 1: Search by productId, labelSize, and partColor
    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:ns="http://www.promostandards.org/WSDL/Inventory/2.0.0/"
xmlns:shar="http://www.promostandards.org/WSDL/Inventory/2.0.0/SharedObjects/">
<soapenv:Header />
<soapenv:Body>
<ns:GetInventoryLevelsRequest>
<shar:wsVersion>2.0.0</shar:wsVersion>
<shar:id>${SANMAR_USERNAME}</shar:id>
<shar:password>${SANMAR_PASSWORD}</shar:password>
<shar:productId>${styleNumber}</shar:productId>
<shar:Filter>
<shar:LabelSizeArray>
<shar:labelSize>${size}</shar:labelSize>
</shar:LabelSizeArray>
<shar:PartColorArray>
<shar:partColor>${color}</shar:partColor>
</shar:PartColorArray>
</shar:Filter>
</ns:GetInventoryLevelsRequest>
</soapenv:Body>
</soapenv:Envelope>`;
  } else {
    // Query Type 2: Search by productId only
    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:ns="http://www.promostandards.org/WSDL/Inventory/2.0.0/"
xmlns:shar="http://www.promostandards.org/WSDL/Inventory/2.0.0/SharedObjects/">
<soapenv:Header />
<soapenv:Body>
<ns:GetInventoryLevelsRequest>
<shar:wsVersion>2.0.0</shar:wsVersion>
<shar:id>${SANMAR_USERNAME}</shar:id>
<shar:password>${SANMAR_PASSWORD}</shar:password>
<shar:productId>${styleNumber}</shar:productId>
</ns:GetInventoryLevelsRequest>
</soapenv:Body>
</soapenv:Envelope>`;
  }
}

// Add debugging endpoint
app.get('/api/debug/sanmar-soap/:styleNumber', async (req, res) => {
  const { styleNumber } = req.params;
  const { color, size } = req.query;
  
  try {
    console.log(`Debug request for style ${styleNumber} (color: ${color || 'any'}, size: ${size || 'any'})`);
    console.log(`Using credentials - Username: ${SANMAR_USERNAME}, Password: ${SANMAR_PASSWORD}`);
    
    // Create SOAP envelope
    const soapEnvelope = createGetInventoryByStyleNumberEnvelope(styleNumber, color, size);
    
    // Show the raw SOAP request
    const debugInfo = {
      soapRequest: soapEnvelope,
      requestHeaders: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.promostandards.org/WSDL/Inventory/2.0.0/getInventoryLevels'
      },
      environment: {
        isTestMode: SANMAR_USE_TEST,
        backend: SANMAR_BACKEND,
        timeout: HTTP_TIMEOUT_SECONDS
      },
      styleNumber,
      color: color || 'any',
      size: size || 'any'
    };
    
    // Use production URL for now (test URL having DNS issues)
    // TODO: Restore test URL once DNS issues are resolved
    const baseUrl = 'https://ws.sanmar.com:8080/promostandards/';
    
    const serviceEndpoint = `${baseUrl}InventoryServiceBindingV2final`;
    console.log(`Using SanMar endpoint: ${serviceEndpoint}`);
    
    // Make the actual SOAP request
    const soapResponse = await axios.post(
      serviceEndpoint,
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://www.promostandards.org/WSDL/Inventory/2.0.0/getInventoryLevels'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: HTTP_TIMEOUT_SECONDS  // Use the configured timeout
      }
    );
    
    console.log('SOAP API Raw Response:', soapResponse.data);
    
    // Parse the XML response
    const result = await parseXmlResponse(soapResponse.data);
    console.log('Parsed SOAP response:', JSON.stringify(result, null, 2));
    
    // Return both raw and formatted data
    res.json({
      debugInfo,
      rawXmlResponse: soapResponse.data,
      parsedResponse: result,
      formattedResponse: formatSoapInventoryResponse(result)
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      error: true,
      message: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
