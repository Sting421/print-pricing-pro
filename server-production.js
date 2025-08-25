import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// Import the original server API routes
import './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Forward all API requests to the existing server
import axios from 'axios';
const API_PORT = process.env.PORT || 3001;

// API proxy middleware
app.all('/api/*', async (req, res) => {
  try {
    // Forward the request to the API server
    const targetUrl = `http://localhost:${API_PORT}${req.url}`;
    
    const options = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: `localhost:${API_PORT}`,
      },
      data: req.method !== 'GET' ? req.body : undefined
    };
    
    const response = await axios(options);
    
    // Set response headers
    Object.keys(response.headers).forEach(key => {
      res.set(key, response.headers[key]);
    });
    
    // Send response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('API Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: true,
      message: `API Error: ${error.message}`
    });
  }
});

// For all other routes, serve the main index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.WEB_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
