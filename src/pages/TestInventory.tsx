import { useState } from "react";
import { Button } from "../components/ui/button";
import { fetchInventory } from "../lib/inventory-api";

// Type definition for raw SOAP response
interface RawApiResponse {
  success?: boolean;
  soapResponse?: Record<string, unknown>;
  rows?: Array<Record<string, unknown>>;
  error?: boolean;
  message?: string;
}

export default function TestInventory() {
  const [styleNumber, setStyleNumber] = useState("3001");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResponse(null);
      
      console.log("Fetching inventory for style:", styleNumber);
      // Cast the result to unknown first, then to Record to avoid type issues
      const result = await fetchInventory(styleNumber) as unknown as Record<string, unknown>;
      
      // Log and store the raw response
      console.log("Raw inventory API response:", result);
      setResponse(result);
      
      // Check for errors in the response
      if (result.error === true) {
        setError(result.message as string || "Error fetching inventory");
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Raw SOAP Inventory API Test</h1>
      
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          value={styleNumber}
          onChange={(e) => setStyleNumber(e.target.value)}
          placeholder="Enter style number"
          className="px-4 py-2 border rounded-md"
        />
        <Button onClick={handleFetchInventory} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch Inventory"}
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-md">
          <p>Loading inventory data...</p>
        </div>
      )}
      
      {response && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Raw SOAP Response</h2>
          
          {/* Display response structure info */}
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Response Structure:</h3>
            <ul className="list-disc list-inside">
              {Object.keys(response).map(key => (
                <li key={key} className="mb-1">
                  <span className="font-medium">{key}:</span> {typeof response[key] === 'object' 
                    ? `Object with ${response[key] ? Object.keys(response[key] as object).length : 0} properties` 
                    : String(response[key])}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Full raw JSON display */}
          <div className="bg-gray-100 p-4 rounded-md overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
          
          {/* Show SOAP response specifically if available */}
          {response.soapResponse && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">SOAP Response Data:</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(response.soapResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
