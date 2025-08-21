import { useState } from "react";
import { Calculator } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmbroideryCalculator() {
  const [formData, setFormData] = useState({
    garmentCost: "",
    artRate: "75",
    artHours: "",
    location1Stitches: "",
    location2Stitches: "",
    location3Stitches: ""
  });

  const calculateEmbroidery = () => {
    const { garmentCost, artRate, artHours, location1Stitches, location2Stitches, location3Stitches } = formData;

    const garmentCostNum = parseFloat(garmentCost || "0");
    const artRateNum = parseFloat(artRate || "0");
    const artHoursNum = parseFloat(artHours || "0");
    const artFee = (isNaN(artRateNum) ? 0 : artRateNum) * (isNaN(artHoursNum) ? 0 : artHoursNum);

    const loc1 = Number(location1Stitches || 0);
    const loc2 = Number(location2Stitches || 0);
    const loc3 = Number(location3Stitches || 0);

    const costForStitches = (stitches: number) => Math.max(7, Math.ceil((stitches / 1000) * 0.875));

    const locations = [
      { stitches: loc1, active: loc1 > 0 },
      { stitches: loc2, active: loc2 > 0 },
      { stitches: loc3, active: loc3 > 0 }
    ];

    let totalEmbroideryPrice = 0;
    const locationPrices: number[] = [];

    locations.forEach((location) => {
      if (location.active) {
        const locationPrice = costForStitches(location.stitches);
        locationPrices.push(locationPrice);
        totalEmbroideryPrice += locationPrice;
      } else {
        locationPrices.push(0);
      }
    });

    const totalPrice = garmentCostNum + artFee + totalEmbroideryPrice;

    const locationTotals = locationPrices.map((lp) => ((garmentCostNum * 1.67) + artFee + lp).toFixed(2));

    return {
      location1Price: locationPrices[0].toFixed(2),
      location1Total: locationTotals[0],
      location2Price: locationPrices[1].toFixed(2),
      location2Total: locationTotals[1],
      location3Price: locationPrices[2].toFixed(2),
      location3Total: locationTotals[2],
      totalEmbroideryPrice: totalEmbroideryPrice.toFixed(2),
      garmentCost: garmentCostNum.toFixed(2),
      artFee: artFee.toFixed(2),
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
                  onChange={(e) => setFormData(prev => ({ ...prev, garmentCost: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="art-rate">Art Rate ($/hr)</Label>
                  <Input
                    id="art-rate"
                    type="number"
                    step="0.01"
                    value={formData.artRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, artRate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="art-hours">Art Hours</Label>
                  <Input
                    id="art-hours"
                    type="number"
                    step="0.01"
                    value={formData.artHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, artHours: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Embroidery Locations</h3>
                
                <div>
                  <Label htmlFor="location1">Location 1 Stitches</Label>
                  <Input
                    id="location1"
                    type="number"
                    value={formData.location1Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location1Stitches: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location2">Location 2 Stitches</Label>
                  <Input
                    id="location2"
                    type="number"
                    value={formData.location2Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location2Stitches: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location3">Location 3 Stitches</Label>
                  <Input
                    id="location3"
                    type="number"
                    value={formData.location3Stitches}
                    onChange={(e) => setFormData(prev => ({ ...prev, location3Stitches: e.target.value }))}
                  />
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
                  
                  {Number(formData.location1Stitches) > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location 1 ({formData.location1Stitches} stitches):</span>
                        <span className="font-medium">${results.location1Price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location 1 Total (incl. garment + art):</span>
                        <span className="font-medium">${results.location1Total}</span>
                      </div>
                    </div>
                  )}
                  
                  {Number(formData.location2Stitches) > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location 2 ({formData.location2Stitches} stitches):</span>
                        <span className="font-medium">${results.location2Price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location 2 Total (incl. garment + art):</span>
                        <span className="font-medium">${results.location2Total}</span>
                      </div>
                    </div>
                  )}
                  
                  {Number(formData.location3Stitches) > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location 3 ({formData.location3Stitches} stitches):</span>
                        <span className="font-medium">${results.location3Price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location 3 Total (incl. garment + art):</span>
                        <span className="font-medium">${results.location3Total}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garment Cost:</span>
                    <span className="font-medium">${results.garmentCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Art Fee:</span>
                    <span className="font-medium">${results.artFee}</span>
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
                <h4 className="font-medium mb-2">Formula</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Total = Garment Cost + Art Fee + Sum(Embroidery Costs)</li>
                  <li>Art Fee = Art Rate ($/hr) × Art Hours</li>
                  <li>Embroidery Cost per location = max(7, ceil(stitches / 1000 × 0.875))</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Garment: $21.99, Art: 0.1964 hr × $75 = $14.73</li>
                  <li>1 location (e.g., 8000 stitches → $7): total = $43.72</li>
                  <li>2 locations (+10,000 stitches → $9): total = $52.72</li>
                  <li>3 locations (+8000 stitches → $7): total = $59.72</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}