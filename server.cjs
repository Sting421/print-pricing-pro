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
    const response = await axios.get(`https://www.sanmar.com/api/inventory/${slug}`, {
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
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching inventory from SanMar API:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
