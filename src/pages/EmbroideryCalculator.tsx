import { useState } from "react";
import { Calculator } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function EmbroideryCalculator() {
  const [formData, setFormData] = useState({
    garmentCost: 0,
    location1Stitches: 0,
    location2Stitches: 0,
    location3Stitches: 0,
    puff: false,
    customerSupplied: false
  });

  const calculateEmbroidery = () => {
    const { garmentCost, location1Stitches, location2Stitches, location3Stitches, puff, customerSupplied } = formData;
    
    // Base rates based on customer supplied
    const baseRateFreckles = puff ? 10 : 7;
    const baseRateCustomer = puff ? 15.5 : 12.5;
    const baseRate = customerSupplied ? baseRateCustomer : baseRateFreckles;
    
    const locations = [
      { stitches: location1Stitches, active: location1Stitches > 0 },
      { stitches: location2Stitches, active: location2Stitches > 0 },
      { stitches: location3Stitches, active: location3Stitches > 0 }
    ];

    let totalEmbroideryPrice = 0;
    const locationPrices: number[] = [];

    locations.forEach((location) => {
      if (location.active) {
        let locationPrice = baseRate;
        
        // Add $1 for each additional 1000 stitches over the base
        if (location.stitches > 1000) {
          const additionalThousands = Math.floor((location.stitches - 1000) / 1000);
          locationPrice += additionalThousands;
        }
        
        locationPrices.push(locationPrice);
        totalEmbroideryPrice += locationPrice;
      } else {
        locationPrices.push(0);
      }
    });

    const totalPrice = garmentCost + totalEmbroideryPrice;

    return {
      location1Price: locationPrices[0].toFixed(2),
      location2Price: locationPrices[1].toFixed(2),
      location3Price: locationPrices[2].toFixed(2),
      totalEmbroideryPrice: totalEmbroideryPrice.toFixed(2),
      garmentCost: garmentCost.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  };

  const results = calculateEmbroidery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Embroidery Calculator</h1>
          <p className="text-muted-foreground">Calculate pricing for embroidery services with stitch counts and locations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Embroidery Inputs"
            description="Enter garment details and embroidery specifications"
            icon={Calculator}
          >
            <div className="space-y-6">
              <div>
                <Label htmlFor="garment-cost">Garment Cost ($)</Label>
                <Input
                  id="garment-cost"
                  type="number"
                  step="0.01"
                  value={formData.garmentCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, garmentCost: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Embroidery Locations</h3>
                
                <div>
                  <Label htmlFor="location1">Location 1 Stitches</Label>
                  <Input
                    id="location1"
                    type="number"
                    value={formData.location1Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location1Stitches: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location2">Location 2 Stitches</Label>
                  <Input
                    id="location2"
                    type="number"
                    value={formData.location2Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location2Stitches: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location3">Location 3 Stitches</Label>
                  <Input
                    id="location3"
                    type="number"
                    value={formData.location3Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location3Stitches: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="puff"
                    checked={formData.puff}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, puff: checked }))}
                  />
                  <Label htmlFor="puff">Puff Embroidery</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="customer-supplied"
                    checked={formData.customerSupplied}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, customerSupplied: checked }))}
                  />
                  <Label htmlFor="customer-supplied">Customer Supplied Garment</Label>
                </div>
              </div>
            </div>
          </CalculatorCard>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Embroidery Results</CardTitle>
              <CardDescription>Calculated pricing breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Location Pricing</h4>
                  
                  {formData.location1Stitches > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location 1 ({formData.location1Stitches} stitches):</span>
                      <span className="font-medium">${results.location1Price}</span>
                    </div>
                  )}
                  
                  {formData.location2Stitches > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location 2 ({formData.location2Stitches} stitches):</span>
                      <span className="font-medium">${results.location2Price}</span>
                    </div>
                  )}
                  
                  {formData.location3Stitches > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location 3 ({formData.location3Stitches} stitches):</span>
                      <span className="font-medium">${results.location3Price}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garment Cost:</span>
                    <span className="font-medium">${results.garmentCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Embroidery:</span>
                    <span className="font-medium">${results.totalEmbroideryPrice}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total Price:</span>
                    <span className="text-accent">${results.totalPrice}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pricing Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Freckles Supplied Garments</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Regular: $7 base rate</li>
                  <li>Puff: $10 base rate</li>
                  <li>+$1 per additional 1,000 stitches</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Customer Supplied Garments</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Regular: $12.50 base rate</li>
                  <li>Puff: $15.50 base rate</li>
                  <li>+$1 per additional 1,000 stitches</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}