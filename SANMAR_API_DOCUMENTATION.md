# SanMar API Integration Documentation

This document outlines how the SanMar SOAP API has been integrated into the Print Pricing Pro application.

## Implementation Approaches

The application implements two approaches to access SanMar's inventory data:

### 1. Server-Side Proxy (Default & Recommended)

The server-side proxy approach routes all SanMar API calls through our Express server. This method:

- **Hides credentials** from the client-side code
- **Avoids CORS issues** that occur with direct browser-to-SanMar calls
- **Simplifies error handling** and provides consistent JSON responses
- **Allows for caching** and rate limiting if needed

### 2. Direct SOAP Calls (Alternative)

For environments where a server proxy isn't feasible, we've added support for direct browser-to-SanMar API calls. This approach:

- Makes SOAP requests directly from the browser
- Requires a CORS proxy due to SanMar's CORS restrictions
- Falls back to the server-side proxy if direct calls fail
- Requires exposing API credentials in frontend environment variables

## SanMar Endpoints

The application can use two types of SanMar endpoints:

1. **PromoStandards Inventory Service**
   - Production: `https://ws.sanmar.com:8080/promostandards/InventoryServiceBindingV2final?WSDL`
   - Test: `https://wstest.sanmar.com:8080/promostandards/InventoryServiceBindingV2final?WSDL`

2. **SanMar Web Service**
   - Production: `https://ws.sanmar.com:8080/SanMarWebService/SanMarWebServicePort?wsdl`
   - Test: `https://wstest.sanmar.com:8080/SanMarWebService/SanMarWebServicePort?wsdl`

## Configuration

### Environment Variables

The application uses environment variables to configure API access. These should be set in a `.env` file (not committed to version control).

#### Server-Side Variables (Backend)
```
# SanMar API Credentials - Server Side
SANMAR_CUSTOMER_NUMBER=YOUR_CUSTOMER_NUMBER
SANMAR_USERNAME=YOUR_USERNAME
SANMAR_PASSWORD=YOUR_PASSWORD

# API Configuration
SANMAR_USE_TEST=true|false
SANMAR_BACKEND=promostandards|webservice
HTTP_TIMEOUT_SECONDS=30
```

#### Frontend Variables (Client)
```
# API Base URL Configuration
VITE_API_BASE_URL=  # Empty for production relative URLs

# Direct SanMar API Access (Optional)
VITE_USE_DIRECT_SANMAR=false
VITE_SANMAR_USERNAME=YOUR_USERNAME
VITE_SANMAR_PASSWORD=YOUR_PASSWORD
VITE_SANMAR_CUSTOMER_NUMBER=YOUR_CUSTOMER_NUMBER
VITE_SANMAR_USE_TEST=true|false
VITE_CORS_PROXY_URL=https://your-cors-proxy.com/
```

## Security Considerations

1. **Credentials Protection**:
   - The server-side proxy approach keeps credentials secure
   - If using direct SOAP calls, consider using a tokenization service

2. **CORS Handling**:
   - The server proxy automatically handles CORS
   - Direct calls require a CORS proxy service

3. **Error Handling**:
   - Both approaches implement fallbacks and error reporting
   - The UI displays appropriate error messages to users

## Testing the Implementation

To test the SanMar API integration:

1. Set up environment variables with valid SanMar credentials
2. Visit the Raw Inventory Detail page with a valid product ID
3. Check browser console logs for API call information
4. Verify inventory data is displayed correctly

## Troubleshooting

Common issues and solutions:

1. **Authentication Failures**:
   - Verify credentials in environment variables
   - Check SanMar account permissions

2. **CORS Errors**:
   - When using direct calls, ensure CORS proxy is properly configured
   - Try the server-side proxy approach instead

3. **Empty Inventory Results**:
   - Verify product ID exists in SanMar's catalog
   - Check if color parameter is correctly formatted
