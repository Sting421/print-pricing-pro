import { useState } from "react";
import { Search, Loader2, ExternalLink, ChevronLeft, ChevronRight, Package, FileSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchSanMarProducts, SanMarProduct } from "@/lib/sanmar-api";
import { fetchInventory, fetchSanMarInventory } from "@/lib/inventory-api";
import { InventoryDisplay } from "@/components/InventoryDisplay";
import { InventoryResponse } from "@/types/inventory";

export default function StockTracking() {
  const { toast } = useToast();

  // SanMar search state
  const [sanmarQuery, setSanmarQuery] = useState("");
  const [sanmarResults, setSanmarResults] = useState<SanMarProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize] = useState(24);
  const [sortOption, setSortOption] = useState("relevance");
  const [searchMode, setSearchMode] = useState<"product" | "style">("product");
  const [styleNumber, setStyleNumber] = useState("");
  
  // Inventory state
  const [selectedProduct, setSelectedProduct] = useState<SanMarProduct | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryResponse | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const searchSanMar = async (page = currentPage) => {
    if (!sanmarQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);

      const { products, pagination } = await searchSanMarProducts(
        sanmarQuery,
        page,
        pageSize,
        sortOption
      );

      setSanmarResults(products);

      if (pagination) {
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalResults(pagination.totalResults);
      }

      toast({
        title: "Search completed",
        description: `Found ${products.length} items${pagination ? ` (${pagination.totalResults} total)` : ''}`,
      });
    } catch (error) {
      console.error("Error searching SanMar:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });

      // Fallback to direct link if API fails
      const encodedQuery = encodeURIComponent(sanmarQuery);
      setSanmarResults([
        {
          slug: "",
          code: "",
          styleNumber: "",
          name: `Search results for "${sanmarQuery}"`,
          priceText: "",
          imageUrl: undefined,
          url: `https://www.sanmar.com/search/?text=${encodedQuery}`,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageChange = (page: number) => {
    searchSanMar(page);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    searchSanMar(0);
  };

  const checkInventory = async (product: SanMarProduct) => {
    if (!product.slug) {
      toast({
        title: "Cannot check inventory",
        description: "This product doesn't have a valid identifier",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedProduct(product);
      setIsLoadingInventory(true);
      
      const data = await fetchInventory(product.slug);
      setInventoryData(data);
      
      if (data.error || data.rows.length === 0) {
        toast({
          title: "Inventory check failed",
          description: data.message || "No inventory data available",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking inventory:", error);
      toast({
        title: "Inventory check failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setInventoryData({
        rows: [],
        error: true,
        message: error instanceof Error ? error.message : "Failed to check inventory"
      });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Check inventory directly by style number
  const checkInventoryByStyle = async () => {
    if (!styleNumber.trim()) {
      toast({
        title: "Style number required",
        description: "Please enter a valid style number",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingInventory(true);
      setSelectedProduct({
        slug: "",
        code: "",
        styleNumber: styleNumber,
        name: `Style ${styleNumber}`,
        priceText: "",
        imageUrl: ""
      });

      const data = await fetchSanMarInventory(styleNumber);
      setInventoryData(data);

      if (data.error || data.rows.length === 0) {
        toast({
          title: "Inventory check failed",
          description: data.message || "No inventory data available for this style number",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inventory loaded",
          description: `Found inventory data for style ${styleNumber}`,
        });
      }
    } catch (error) {
      console.error("Error checking inventory by style:", error);
      toast({
        title: "Inventory check failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setInventoryData({
        rows: [],
        error: true,
        message: error instanceof Error ? error.message : "Failed to check inventory"
      });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stock Tracking</h1>
          <p className="text-muted-foreground">Track in-house inventory and look up products from SanMar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
       
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-xl font-bold">SanMar Product Search</CardTitle>
              <CardDescription>Search for available items or check inventory by style number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Tabs defaultValue="product" className="w-full" onValueChange={(value) => setSearchMode(value as "product" | "style")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="product">Search Products</TabsTrigger>
                    <TabsTrigger value="style">Search by Style #</TabsTrigger>
                  </TabsList>
                  <TabsContent value="product">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Search for products (e.g., t-shirt, polo, hoodie)"
                          value={sanmarQuery}
                          onChange={(e) => setSanmarQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              searchSanMar(0);
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={sortOption} onValueChange={handleSortChange}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                            <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                            <SelectItem value="name-asc">Name: A to Z</SelectItem>
                            <SelectItem value="name-desc">Name: Z to A</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => searchSanMar(0)} disabled={isSearching || !sanmarQuery.trim()} className="flex items-center gap-2">
                          {isSearching ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="style">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter style number (e.g., 3001C, PC61, G500)"
                          value={styleNumber}
                          onChange={(e) => setStyleNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              checkInventoryByStyle();
                            }
                          }}
                        />
                      </div>
                      <Button 
                        onClick={checkInventoryByStyle} 
                        disabled={isLoadingInventory || !styleNumber.trim()} 
                        className="flex items-center gap-2"
                      >
                        {isLoadingInventory ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FileSearch className="h-4 w-4" />
                            Check Inventory
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {sanmarResults.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Search Results</h3>
                      {totalResults > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Showing {sanmarResults.length} of {totalResults} items
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sanmarResults.map((result, index) => {
                        let imageToDisplay = '';
                        if (result.images && result.images.length > 0) {
                          const thumbnailImage = result.images.find((img) => img.format === 'thumbnail' && img.url);
                          const anyImage = result.images.find((img) => img.url);
                          imageToDisplay = thumbnailImage?.url || anyImage?.url || '';
                        }
                        imageToDisplay = imageToDisplay || result.imageUrl || '';

                        return (
                          <Card key={index} className="overflow-hidden flex flex-col">
                            {imageToDisplay && (
                              <div className="relative h-40 overflow-hidden bg-muted">
                                <img src={imageToDisplay} alt={result.name} className="w-full h-full object-contain" />
                                
                              </div>
                            )}
                            <CardContent className="p-3 flex-1 flex flex-col">
                              <div className="flex-1">
                                <h4 className="font-medium line-clamp-2">{result.name}</h4>
                                {result.code && (
                                  <p className="text-xs text-muted-foreground mt-1">Style: {result.styleNumber || result.code}</p>
                                )}
                                {result.priceText && <p className="text-sm font-medium mt-2">{result.priceText}</p>}
                              </div>
                              <div className="mt-3 space-y-2">
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="w-full flex items-center gap-1"
                                  onClick={() => checkInventory(result)}
                                  disabled={isLoadingInventory && selectedProduct?.slug === result.slug}
                                >
                                  {isLoadingInventory && selectedProduct?.slug === result.slug ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <Package className="h-3 w-3" />
                                      Check Inventory
                                    </>
                                  )}
                                </Button>
                                
                                <Button asChild variant="outline" size="sm" className="w-full flex items-center gap-1">
                                  <a href={result.url || `https://www.sanmar.com/p/${result.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                    View on SanMar
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {selectedProduct && inventoryData && (
                      <div className="mt-6">
                        <InventoryDisplay 
                          data={inventoryData} 
                          isLoading={isLoadingInventory}
                          productName={`${selectedProduct.styleNumber || selectedProduct.code} - ${selectedProduct.name}`}
                        />
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0 || isSearching}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="text-sm">Page {currentPage + 1} of {totalPages}</div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage >= totalPages - 1 || isSearching}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
