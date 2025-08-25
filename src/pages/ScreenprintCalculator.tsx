import { useState } from "react";
import { Palette, Search, Loader2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { searchSanMarProducts, SanMarProduct } from "@/lib/sanmar-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ScreenprintCalculator() {
  const { toast } = useToast();
  const [sanmarQuery, setSanmarQuery] = useState("");
  const [sanmarResults, setSanmarResults] = useState<SanMarProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [sortOption, setSortOption] = useState("relevance");
  
  const searchSanMar = async (page = currentPage) => {
    if (!sanmarQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term",
        variant: "destructive"
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
        description: `Found ${products.length} items${pagination ? ` (${pagination.totalResults} total)` : ''}`
      });
    } catch (error) {
      console.error("Error searching SanMar:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      
      // Fallback to direct link if API fails
      const encodedQuery = encodeURIComponent(sanmarQuery);
      setSanmarResults([{
        slug: "",
        code: "",
        styleNumber: "",
        name: `Search results for "${sanmarQuery}"`,
        priceText: "",
        imageUrl: undefined,
        url: `https://www.sanmar.com/search/?text=${encodedQuery}`
      }]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    searchSanMar(page);
  };
  
  const handleSortChange = (value: string) => {
    setSortOption(value);
    searchSanMar(0); // Reset to first page when sort changes
  };

  const [frecklesSupplied, setFrecklesSupplied] = useState({
    shirts: 0,
    dozenCost: 0,
    location1Colors: 1,
    location2Colors: 0,
    artFilmCharges: 0,
    additionalCharges: 0,
    royaltyPercent: 0
  });

  const [customerSupplied, setCustomerSupplied] = useState({
    shirts: 0,
    dozenCost: 0,
    location1Colors: 1,
    location2Colors: 0,
    artFilmCharges: 0,
    additionalCharges: 0,
    royaltyPercent: 0
  });

  // UI string state to allow clearing inputs to empty while typing
  const [frecklesUI, setFrecklesUI] = useState({
    shirts: String(0),
    dozenCost: String(0),
    location1Colors: String(1),
    location2Colors: String(0),
    artFilmCharges: String(0),
    additionalCharges: String(0),
    royaltyPercent: String(0)
  });

  const [customerUI, setCustomerUI] = useState({
    shirts: String(0),
    dozenCost: String(0),
    location1Colors: String(1),
    location2Colors: String(0),
    artFilmCharges: String(0),
    additionalCharges: String(0),
    royaltyPercent: String(0)
  });

  const inkPriceTable = {
    location1: {
      1: 1.00,
      2: 1.35,
      3: 1.70,
      4: 2.05,
      5: 2.40,
      6: 2.75,
      7: 3.10,
      8: 3.45
    },
    location2to6: {
      1: 1.00,
      2: 1.35,
      3: 1.70,
      4: 2.05,
      5: 2.40,
      6: 2.75,
      7: 3.10,
      8: 3.45
    }
  } as const;

  // Screen charge per color
  const SCREEN_CHARGE_BC = 30;
  const SCREEN_CHARGE_CUSTOMER = 35;

  const calculateFrecklesSupplied = () => {
    const { shirts, dozenCost, location1Colors, location2Colors, artFilmCharges, additionalCharges, royaltyPercent } = frecklesSupplied;
    
    const loc1 = Math.max(0, Math.min(8, Number(location1Colors || 0)));
    const loc2 = Math.max(0, Math.min(8, Number(location2Colors || 0)));

    const getInkPrice = (locIndex: number, colors: number) => {
      if (colors <= 0) return 0;
      const table = locIndex === 1 ? inkPriceTable.location1 : inkPriceTable.location2to6;
      return (table as Record<number, number>)[colors] ?? 0;
    };

    const inkPerShirt = getInkPrice(1, loc1) + getInkPrice(2, loc2);
    const totalInkCosts = shirts * inkPerShirt;

    const totalColors = loc1 + loc2;
    const screenCharges = totalColors * SCREEN_CHARGE_BC;

    const shirtCostPerShirt = dozenCost > 0 ? (dozenCost * 1.67) : 0;

    const totalCharges = totalInkCosts + screenCharges + artFilmCharges + additionalCharges;

    const artProdPerShirt = shirts > 0 ? totalCharges / shirts : 0;

    const royaltyAmount = totalCharges * (royaltyPercent / 100);
    const royaltyPerShirt = shirts > 0 ? royaltyAmount / shirts : 0;

    const pricePerShirt = shirtCostPerShirt + artProdPerShirt + royaltyPerShirt;
    const total = shirts * pricePerShirt;

    return {
      inkPerShirt: inkPerShirt.toFixed(2),
      inkCosts: totalInkCosts.toFixed(2),
      screenCharges: screenCharges.toFixed(2),
      artFilmCharges: artFilmCharges.toFixed(2),
      additionalCharges: additionalCharges.toFixed(2),
      totalCharges: totalCharges.toFixed(2),
      artProdPerShirt: artProdPerShirt.toFixed(2),
      shirtCostPerShirt: shirtCostPerShirt.toFixed(2),
      royaltyPerShirt: royaltyPerShirt.toFixed(2),
      royaltyAmount: royaltyAmount.toFixed(2),
      total: total.toFixed(2),
      pricePerShirt: pricePerShirt.toFixed(2)
    };
  };

  const calculateCustomerSupplied = () => {
    const { shirts, dozenCost, location1Colors, location2Colors, artFilmCharges, additionalCharges, royaltyPercent } = customerSupplied;
    
    const loc1 = Math.max(0, Math.min(8, Number(location1Colors || 0)));
    const loc2 = Math.max(0, Math.min(8, Number(location2Colors || 0)));

    const getInkPrice = (locIndex: number, colors: number) => {
      if (colors <= 0) return 0;
      const table = locIndex === 1 ? inkPriceTable.location1 : inkPriceTable.location2to6;
      return (table as Record<number, number>)[colors] ?? 0;
    };

    const inkPerShirt = getInkPrice(1, loc1) + getInkPrice(2, loc2);
    const totalInkCosts = shirts * inkPerShirt;

    const totalColors = loc1 + loc2;
    const screenCharges = totalColors * SCREEN_CHARGE_CUSTOMER;

    const totalCharges = totalInkCosts + screenCharges + artFilmCharges + additionalCharges;

    const artProdPerShirt = shirts > 0 ? totalCharges / shirts : 0;

    const royaltyAmount = totalCharges * (royaltyPercent / 100);
    const royaltyPerShirt = shirts > 0 ? royaltyAmount / shirts : 0;

    const shirtCostPerShirt = dozenCost > 0 ? (dozenCost * 1.67) : 0;
    const pricePerShirt = shirtCostPerShirt + artProdPerShirt + royaltyPerShirt;
    const total = shirts * pricePerShirt;

    return {
      inkPerShirt: inkPerShirt.toFixed(2),
      inkCosts: totalInkCosts.toFixed(2),
      screenCharges: screenCharges.toFixed(2),
      artFilmCharges: artFilmCharges.toFixed(2),
      additionalCharges: additionalCharges.toFixed(2),
      totalCharges: totalCharges.toFixed(2),
      artProdPerShirt: artProdPerShirt.toFixed(2),
      shirtCostPerShirt: shirtCostPerShirt.toFixed(2),
      royaltyPerShirt: royaltyPerShirt.toFixed(2),
      royaltyAmount: royaltyAmount.toFixed(2),
      total: total.toFixed(2),
      pricePerShirt: pricePerShirt.toFixed(2)
    };
  };

  const frecklesResults = calculateFrecklesSupplied();
  const customerResults = calculateCustomerSupplied();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Screenprint Calculator</h1>
          <p className="text-muted-foreground">Calculate pricing for screenprinting services with custom variables</p>
        </div>

        <Tabs defaultValue="freckles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="freckles">BC Apparel Supplied</TabsTrigger>
            <TabsTrigger value="customer">Customer Supplied</TabsTrigger>
          </TabsList>

          <TabsContent value="freckles">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalculatorCard
                title="BC Apparel Supplied Inputs"
                description="Enter details for Freckles-supplied garments"
                icon={Palette}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="freckles-shirts">Number of Shirts</Label>
                      <Input
                        id="freckles-shirts"
                        type="number"
                        value={frecklesUI.shirts}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, shirts: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, shirts: next }));
                          setFrecklesUI(prev => ({ ...prev, shirts: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="freckles-dozen">Dozen Cost ($)</Label>
                      <Input
                        id="freckles-dozen"
                        type="number"
                        step="0.01"
                        value={frecklesUI.dozenCost}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, dozenCost: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, dozenCost: next }));
                          setFrecklesUI(prev => ({ ...prev, dozenCost: String(next) }));
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="freckles-loc1">Location 1 Colors (1-8)</Label>
                      <Input
                        id="freckles-loc1"
                        type="number"
                        min="1"
                        max="8"
                        value={frecklesUI.location1Colors}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, location1Colors: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.min(8, Math.max(1, Math.floor(n))) : 1;
                          setFrecklesSupplied(prev => ({ ...prev, location1Colors: next }));
                          setFrecklesUI(prev => ({ ...prev, location1Colors: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="freckles-loc2">Location 2 Colors (0-8)</Label>
                      <Input
                        id="freckles-loc2"
                        type="number"
                        min="0"
                        max="8"
                        value={frecklesUI.location2Colors}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, location2Colors: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.min(8, Math.max(0, Math.floor(n))) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, location2Colors: next }));
                          setFrecklesUI(prev => ({ ...prev, location2Colors: String(next) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="freckles-art">Art/Film Charges ($)</Label>
                      <Input
                        id="freckles-art"
                        type="number"
                        step="0.01"
                        value={frecklesUI.artFilmCharges}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, artFilmCharges: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, artFilmCharges: next }));
                          setFrecklesUI(prev => ({ ...prev, artFilmCharges: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="freckles-additional">Additional Charges ($)</Label>
                      <Input
                        id="freckles-additional"
                        type="number"
                        step="0.01"
                        value={frecklesUI.additionalCharges}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, additionalCharges: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, additionalCharges: next }));
                          setFrecklesUI(prev => ({ ...prev, additionalCharges: String(next) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="freckles-royalty">Royalty (%)</Label>
                      <Input
                        id="freckles-royalty"
                        type="number"
                        step="0.1"
                        value={frecklesUI.royaltyPercent}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setFrecklesUI(prev => ({ ...prev, royaltyPercent: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setFrecklesSupplied(prev => ({ ...prev, royaltyPercent: next }));
                          setFrecklesUI(prev => ({ ...prev, royaltyPercent: String(next) }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CalculatorCard>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-accent">Results - BC Apparel Supplied</CardTitle>
                  <CardDescription>Calculated pricing breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ink Cost per Shirt:</span>
                      <span className="font-medium">${frecklesResults.inkPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ink Costs (Total):</span>
                      <span className="font-medium">${frecklesResults.inkCosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Screen Charges:</span>
                      <span className="font-medium">${frecklesResults.screenCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Art/Film Charges:</span>
                      <span className="font-medium">${frecklesResults.artFilmCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Charges:</span>
                      <span className="font-medium">${frecklesResults.additionalCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Charges (Ink + Screens + Art + Addl):</span>
                      <span className="font-medium">${frecklesResults.totalCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Art & Prod. per Shirt:</span>
                      <span className="font-medium">${frecklesResults.artProdPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shirt Cost per Shirt:</span>
                      <span className="font-medium">${frecklesResults.shirtCostPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Royalty per Shirt:</span>
                      <span className="font-medium">${frecklesResults.royaltyPerShirt}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Per Shirt:</span>
                        <span className="text-accent">${frecklesResults.pricePerShirt}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total:</span>
                        <span>${frecklesResults.total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalculatorCard
                title="Customer Supplied Inputs"
                description="Enter details for customer-supplied garments"
                icon={Palette}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-shirts">Number of Shirts</Label>
                      <Input
                        id="customer-shirts"
                        type="number"
                        value={customerUI.shirts}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, shirts: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                          setCustomerSupplied(prev => ({ ...prev, shirts: next }));
                          setCustomerUI(prev => ({ ...prev, shirts: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-loc1">Location 1 Colors (1-8)</Label>
                      <Input
                        id="customer-loc1"
                        type="number"
                        min="1"
                        max="8"
                        value={customerUI.location1Colors}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, location1Colors: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.min(8, Math.max(1, Math.floor(n))) : 1;
                          setCustomerSupplied(prev => ({ ...prev, location1Colors: next }));
                          setCustomerUI(prev => ({ ...prev, location1Colors: String(next) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-dozen">Dozen Cost ($)</Label>
                      <Input
                        id="customer-dozen"
                        type="number"
                        step="0.01"
                        value={customerUI.dozenCost}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, dozenCost: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setCustomerSupplied(prev => ({ ...prev, dozenCost: next }));
                          setCustomerUI(prev => ({ ...prev, dozenCost: String(next) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-loc2">Location 2 Colors (0-8)</Label>
                      <Input
                        id="customer-loc2"
                        type="number"
                        min="0"
                        max="8"
                        value={customerUI.location2Colors}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, location2Colors: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.min(8, Math.max(0, Math.floor(n))) : 0;
                          setCustomerSupplied(prev => ({ ...prev, location2Colors: next }));
                          setCustomerUI(prev => ({ ...prev, location2Colors: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-art">Art/Film Charges ($)</Label>
                      <Input
                        id="customer-art"
                        type="number"
                        step="0.01"
                        value={customerUI.artFilmCharges}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, artFilmCharges: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setCustomerSupplied(prev => ({ ...prev, artFilmCharges: next }));
                          setCustomerUI(prev => ({ ...prev, artFilmCharges: String(next) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-additional">Additional Charges ($)</Label>
                      <Input
                        id="customer-additional"
                        type="number"
                        step="0.01"
                        value={customerUI.additionalCharges}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, additionalCharges: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setCustomerSupplied(prev => ({ ...prev, additionalCharges: next }));
                          setCustomerUI(prev => ({ ...prev, additionalCharges: String(next) }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-royalty">Royalty (%)</Label>
                      <Input
                        id="customer-royalty"
                        type="number"
                        step="0.1"
                        value={customerUI.royaltyPercent}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setCustomerUI(prev => ({ ...prev, royaltyPercent: e.target.value }))}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          const n = v === '' ? NaN : Number(v);
                          const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                          setCustomerSupplied(prev => ({ ...prev, royaltyPercent: next }));
                          setCustomerUI(prev => ({ ...prev, royaltyPercent: String(next) }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CalculatorCard>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-accent">Results - Customer Supplied</CardTitle>
                  <CardDescription>Calculated pricing breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ink Cost per Shirt:</span>
                      <span className="font-medium">${customerResults.inkPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ink Costs (Total):</span>
                      <span className="font-medium">${customerResults.inkCosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Screen Charges:</span>
                      <span className="font-medium">${customerResults.screenCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Art/Film Charges:</span>
                      <span className="font-medium">${customerResults.artFilmCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Charges:</span>
                      <span className="font-medium">${customerResults.additionalCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Charges (Ink + Screens + Art + Addl):</span>
                      <span className="font-medium">${customerResults.totalCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Art & Prod. per Shirt:</span>
                      <span className="font-medium">${customerResults.artProdPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shirt Cost per Shirt:</span>
                      <span className="font-medium">${customerResults.shirtCostPerShirt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Royalty per Shirt:</span>
                      <span className="font-medium">${customerResults.royaltyPerShirt}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Per Shirt:</span>
                        <span className="text-accent">${customerResults.pricePerShirt}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total:</span>
                        <span>${customerResults.total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ink Price Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Location 1</h4>
                <div className="space-y-1">
                  {Object.entries(inkPriceTable.location1).map(([colors, price]) => (
                    <div key={`loc1-${colors}`} className="flex justify-between">
                      <span>{colors} color{Number(colors) > 1 ? 's' : ''}:</span>
                      <span className="font-medium">${price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Locations 2-6</h4>
                <div className="space-y-1">
                  {Object.entries(inkPriceTable.location2to6).map(([colors, price]) => (
                    <div key={`loc2-${colors}`} className="flex justify-between">
                      <span>{colors} color{Number(colors) > 1 ? 's' : ''}:</span>
                      <span className="font-medium">${price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">SanMar Product Search</CardTitle>
            <CardDescription>Search for available items on SanMar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <Select
                    value={sortOption}
                    onValueChange={handleSortChange}
                  >
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
                  <Button 
                    onClick={() => searchSanMar(0)}
                    disabled={isSearching || !sanmarQuery.trim()}
                    className="flex items-center gap-2"
                  >
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
                      // Find the best image to display
                      let imageToDisplay = '';
                      
                      // First try to find a thumbnail image from the images array
                      if (result.images && result.images.length > 0) {
                        // Look for thumbnail format first
                        const thumbnailImage = result.images.find(img => img.format === 'thumbnail' && img.url);
                        // If no thumbnail, look for any image with a URL
                        const anyImage = result.images.find(img => img.url);
                        imageToDisplay = thumbnailImage?.url || anyImage?.url || '';
                      }
                      
                      // Fallback to imageUrl if no images array or no valid images found
                      imageToDisplay = imageToDisplay || result.imageUrl || '';
                      
                      return (
                        <Card key={index} className="overflow-hidden flex flex-col">
                          {imageToDisplay && (
                            <div className="relative h-40 overflow-hidden bg-muted">
                              <img 
                                src={imageToDisplay} 
                                alt={result.name} 
                                className="w-full h-full object-contain"
                              />
                              {result.priceText && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                                  {result.priceText}
                                </div>
                              )}
                            </div>
                          )}
                          <CardContent className="p-3 flex-1 flex flex-col">
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-2">{result.name}</h4>
                              {result.code && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Style: {result.styleNumber || result.code}
                                </p>
                              )}
                              {result.priceText && (
                                <p className="text-sm font-medium mt-2">{result.priceText}</p>
                              )}
                            </div>
                            <div className="mt-3">
                              <Button 
                                asChild 
                                variant="outline" 
                                size="sm" 
                                className="w-full flex items-center gap-1"
                              >
                                <a 
                                  href={result.url || `https://www.sanmar.com/p/${result.slug}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
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
                      
                      <div className="text-sm">
                        Page {currentPage + 1} of {totalPages}
                      </div>
                      
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
  );
}