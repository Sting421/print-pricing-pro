import { quote as encodeURIComponentRFC3986 } from './utils';

// Types for SanMar API
export interface SanMarProduct {
  slug: string;
  code: string;
  styleNumber: string;
  name: string;
  priceText: string;
  imageUrl?: string;
  url?: string; // Direct URL to product page
  images?: {
    imageType?: string;
    url?: string;
    format?: string;
    altText?: string | null;
  }[];
}

export interface SanMarSearchResponse {
  results?: SanMarSearchResult[];
  products?: SanMarSearchResult[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface SanMarSearchResult {
  code?: string;
  name?: string;
  displayPriceText?: string;
  salePriceText?: string;
  originalPriceText?: string;
  styleNumber?: string;
  style?: string;
  url?: string;
  pdpUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  images?: {
    imageType?: string;
    format?: string;
    url?: string;
    altText?: string | null;
    galleryIndex?: number | null;
    width?: number | null;
    location?: string | null;
    mediaCode?: string | null;
  }[];
}

// Default headers for SanMar API requests
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "X-Requested-With": "XMLHttpRequest",
  "Origin": "https://www.sanmar.com",
  "Content-Type": "application/json;charset=UTF-8",
};

/**
 * Build headers for SanMar API requests
 */
export function buildHeadersForQuery(query: string): Record<string, string> {
  const headers = { ...DEFAULT_HEADERS };
  headers["Referer"] = `https://www.sanmar.com/search/?text=${encodeURIComponentRFC3986(query)}`;
  
  // In a real app, you might get these from environment variables or local storage
  const cookie = localStorage.getItem("SANMAR_WEBJSON_COOKIE") || "";
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  
  const extraHeadersStr = localStorage.getItem("SANMAR_WEBJSON_HEADERS") || "";
  if (extraHeadersStr) {
    try {
      const extraHeaders = JSON.parse(extraHeadersStr);
      Object.assign(headers, extraHeaders);
    } catch (e) {
      console.error("Failed to parse extra headers:", e);
    }
  }
  
  return headers;
}

/**
 * Search for products on SanMar using our proxy server
 */
export async function findProducts(
  query: string, 
  page: number = 0, 
  pageSize: number = 24, 
  sort: string = "relevance"
): Promise<SanMarSearchResponse> {
  // Use our proxy server instead of direct API call
  const url = "http://localhost:3001/api/search";
  const body = {
    query,
    page,
    pageSize,
    sort,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error searching SanMar:", error);
    throw error;
  }
}

/**
 * Parse search results into a simplified format
 */
export function parseSearchResults(data: SanMarSearchResponse): SanMarProduct[] {
  const results: SanMarProduct[] = [];
  const items = data.results || data.products || [];
  
  for (const item of items) {
    const code = item.code || "";
    const name = item.name || "";
    const price = item.displayPriceText || item.salePriceText || item.originalPriceText || "";
    const styleNumber = item.styleNumber || item.style || code;
    let slug = "";
    const url = item.url || item.pdpUrl || "";
    
    if (url && url.includes("/p/")) {
      try {
        const slugPart = url.split("/p/")[1];
        // Remove path segments after slug as well as query/hash fragments
        const cleanSlugPart = slugPart.split("?")[0].split("#")[0];
        slug = cleanSlugPart.split("/")[0].replace(/\//g, "");
      } catch (e) {
        slug = code;
      }
    } else {
      slug = code;
    }
    
    results.push({
      slug,
      code,
      styleNumber,
      name,
      priceText: price,
      imageUrl: item.imageUrl || item.thumbnailUrl,
      images: item.images || [],
      url: url || `https://www.sanmar.com/p/${slug}`
    });
  }
  
  return results;
}

/**
 * Convenience function to search and parse results in one call
 */
export async function searchSanMarProducts(
  query: string,
  page: number = 0,
  pageSize: number = 24,
  sort: string = "relevance"
): Promise<{ products: SanMarProduct[], pagination?: SanMarSearchResponse['pagination'] }> {
  try {
    const response = await findProducts(query, page, pageSize, sort);
    const products = parseSearchResults(response);
    return { 
      products, 
      pagination: response.pagination 
    };
  } catch (error) {
    console.error("Error in searchSanMarProducts:", error);
    throw error;
  }
}
