import { useState } from "react";
import { Sticker } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function StickersCalculator() {
  const [formData, setFormData] = useState({
    height: 0,
    width: 0,
    quantity: 0,
    pricePerFoot: 20,
    lamination: false,
    cutting: false,
    weedingCharge: 0
  });

  const calculateStickers = () => {
    const { height, width, quantity, pricePerFoot, lamination, cutting, weedingCharge } = formData;

    // Basic validation and guard against invalid inputs
    if (height <= 0 || width <= 0 || quantity <= 0 || width > 46) {
      return {
        horizontalMax: 0,
        materialLength: "0.00",
        materialCost: "0.00",
        setupFee: "0.00",
        totalCostWithoutLamination: "0.00",
        pricePerStickerWithoutLamination: "0.00",
        pricePerStickerWithLamination: "0.00",
        cuttingCost: "0.00",
        weedingCost: "0.00",
        finalTotalCost: "0.00",
        finalPricePerSticker: "0.00"
      };
    }

    // Constants per new formula
    const usableWidth = 46; // inches
    const setupFee = 100; // fixed dollars

    // New formula calculations
    const horizontalMax = usableWidth / width;
    const materialLength = (quantity * height / 12) * ( width / usableWidth) + 2 ;
    const materialCost = pricePerFoot * materialLength;
    const totalCostWithoutLamination = setupFee + materialCost;
    const pricePerStickerWithoutLamination = totalCostWithoutLamination / quantity;
    const pricePerStickerWithLamination = pricePerStickerWithoutLamination * 1.75;

    // Additional costs
    const cuttingCost = cutting ? quantity * 0.1 : 0; // $0.10 per sticker
    const weedingCost = Math.max(0, Number.isFinite(weedingCharge) ? weedingCharge : 0);

    // Final totals (base price + extras)
    const basePricePerSticker = lamination ? pricePerStickerWithLamination : pricePerStickerWithoutLamination;
    const finalPricePerSticker = basePricePerSticker + (cuttingCost / quantity) + (weedingCost / quantity);
    const finalTotalCost = finalPricePerSticker * quantity;

    return {
      horizontalMax: horizontalMax.toFixed(3),
      materialLength: materialLength.toFixed(3),
      materialCost: materialCost.toFixed(3),
      setupFee: setupFee.toFixed(2),
      totalCostWithoutLamination: totalCostWithoutLamination.toFixed(3),
      pricePerStickerWithoutLamination: pricePerStickerWithoutLamination.toFixed(3),
      pricePerStickerWithLamination: pricePerStickerWithLamination.toFixed(3),
      cuttingCost: cuttingCost.toFixed(2),
      weedingCost: weedingCost.toFixed(2),
      finalTotalCost: finalTotalCost.toFixed(2),
      finalPricePerSticker: finalPricePerSticker.toFixed(2)
    };
  };

  const results = calculateStickers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stickers & Decals Calculator</h1>
          <p className="text-muted-foreground">Calculate pricing for vinyl stickers and decals with material optimization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Sticker Specifications"
            description="Enter dimensions and quantity details"
            icon={Sticker}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max width: 46" (usable roll width)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price-per-foot">Price per Foot ($)</Label>
                  <Input
                    id="price-per-foot"
                    type="number"
                    step="0.01"
                    value={formData.pricePerFoot}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerFoot: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lamination"
                    checked={formData.lamination}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lamination: checked }))}
                  />
                  <Label htmlFor="lamination">Lamination (1.75x multiplier)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="cutting"
                    checked={formData.cutting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, cutting: checked }))}
                  />
                  <Label htmlFor="cutting">Cutting ($0.10 per sticker)</Label>
                </div>
                <div>
                  <Label htmlFor="weedingCharge">Weeding charge ($, optional)</Label>
                  <Input
                    id="weedingCharge"
                    type="number"
                    step="0.01"
                    value={formData.weedingCharge}
                    onChange={(e) => setFormData(prev => ({ ...prev, weedingCharge: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </CalculatorCard>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Calculation Results</CardTitle>
              <CardDescription>Material usage and pricing breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Material Layout</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horizontal Max per Row:</span>
                    <span className="font-medium">{results.horizontalMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material Length Needed:</span>
                    <span className="font-medium">{results.materialLength} ft</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <h4 className="font-medium text-foreground">Base Pricing</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material Cost:</span>
                    <span className="font-medium">${results.materialCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Setup Fee:</span>
                    <span className="font-medium">${results.setupFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total (No Lamination):</span>
                    <span className="font-medium">${results.totalCostWithoutLamination}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <h4 className="font-medium text-foreground">Price Per Sticker</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Without Lamination:</span>
                    <span className="font-medium">${results.pricePerStickerWithoutLamination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With Lamination (1.75x):</span>
                    <span className="font-medium">${results.pricePerStickerWithLamination}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <h4 className="font-medium text-foreground">Additional Services</h4>
                  {formData.cutting && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cutting:</span>
                      <span className="font-medium">${results.cuttingCost}</span>
                    </div>
                  )}
                  {formData.weedingCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weeding:</span>
                      <span className="font-medium">${results.weedingCost}</span>
                    </div>
                  )}
                </div>
                  
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Final Total Cost:</span>
                    <span className="text-accent">${results.finalTotalCost}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Final Price per Sticker:</span>
                    <span>${results.finalPricePerSticker}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Production Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Material Specifications</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Usable material width: 46 inches</li>
                  <li>Default pricing: $20 per linear foot</li>
                  <li>Lamination multiplies base price by 1.75x</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Additional Services</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Cutting service: $0.10 per sticker</li>
                  <li>Weeding may require additional charges</li>
                  <li>Complex designs may affect material usage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}