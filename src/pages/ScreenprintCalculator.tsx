import { useState } from "react";
import { Palette } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScreenprintCalculator() {
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
    const screenCharges = totalColors * 30;

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
    const { shirts, location1Colors, location2Colors, artFilmCharges, additionalCharges, royaltyPercent } = customerSupplied;
    
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
    const screenCharges = totalColors * 30;

    const totalCharges = totalInkCosts + screenCharges + artFilmCharges + additionalCharges;

    const artProdPerShirt = shirts > 0 ? totalCharges / shirts : 0;

    const royaltyAmount = totalCharges * (royaltyPercent / 100);
    const royaltyPerShirt = shirts > 0 ? royaltyAmount / shirts : 0;

    const pricePerShirt = artProdPerShirt + royaltyPerShirt;
    const total = shirts * pricePerShirt;

    return {
      inkPerShirt: inkPerShirt.toFixed(2),
      inkCosts: totalInkCosts.toFixed(2),
      screenCharges: screenCharges.toFixed(2),
      artFilmCharges: artFilmCharges.toFixed(2),
      additionalCharges: additionalCharges.toFixed(2),
      totalCharges: totalCharges.toFixed(2),
      artProdPerShirt: artProdPerShirt.toFixed(2),
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
      </div>
    </div>
  );
}