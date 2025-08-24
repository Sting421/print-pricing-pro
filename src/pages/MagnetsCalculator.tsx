import { useState } from "react";
import { Magnet, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MagnetsCalculator() {
  const navigate = useNavigate();
  const [inventoryId, setInventoryId] = useState<string>("64000"); // Default style number
  const [form, setForm] = useState({
    heightIn: "3.5",
    widthIn: "3",
    quantity: "500",
    pricePerFoot: "20",
    materialWidthIn: "22" // default max material width in inches
  });

  const calculate = () => {
    const h = Number(form.heightIn) || 0; // inches
    const w = Number(form.widthIn) || 0; // inches
    const q = Math.max(0, Math.floor(Number(form.quantity) || 0));
    const p = Number(form.pricePerFoot) || 0; // $ per foot
    const m = Number(form.materialWidthIn) || 22; // inches (default 22)

    const horizontalFit = w > 0 ? m / w : 0; // informational

    // minimal material length in feet: q * (w/m) * (h/12)
    const minimalLengthFt = w > 0 && m > 0 ? (q * (w / m) * (h / 12)) : 0;

    // Add 1 foot for actual material length, but only if there is production
    const actualLengthFt = q > 0 ? minimalLengthFt + 1 : 0;

    const materialCost = actualLengthFt * p;
    const setupCost = q > 0 ? 100 : 0; // fixed setup cost
    const totalCost = materialCost + setupCost;
    const pricePerMagnet = q > 0 ? totalCost / q : 0;

    return {
      h, w, q, p, m,
      horizontalFit,
      minimalLengthFt,
      actualLengthFt,
      materialCost,
      setupCost,
      totalCost,
      pricePerMagnet
    };
  };

  const r = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Magnet Calculator</h1>
          <p className="text-muted-foreground">Calculate price per magnet based on material usage and setup.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Magnet Inputs"
            description="Enter magnet dimensions, quantity, and material pricing"
            icon={Magnet}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.01"
                    value={form.heightIn}
                    onChange={(e) => setForm(prev => ({ ...prev, heightIn: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.01"
                    value={form.widthIn}
                    onChange={(e) => setForm(prev => ({ ...prev, widthIn: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price-foot">Price per Foot ($)</Label>
                  <Input
                    id="price-foot"
                    type="number"
                    step="0.01"
                    value={form.pricePerFoot}
                    onChange={(e) => setForm(prev => ({ ...prev, pricePerFoot: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="material-width">Material Max Width (inches)</Label>
                <Input
                  id="material-width"
                  type="number"
                  step="0.01"
                  value={form.materialWidthIn}
                  onChange={(e) => setForm(prev => ({ ...prev, materialWidthIn: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Default is 22 inches.</p>
              </div>
            </div>
          </CalculatorCard>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Results</CardTitle>
              <CardDescription>Calculated material usage and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horizontal Fit (m / w):</span>
                  <span className="font-medium">{r.horizontalFit.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimal Material Length (ft):</span>
                  <span className="font-medium">{r.minimalLengthFt.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual Material Length (ft):</span>
                  <span className="font-medium">{r.actualLengthFt.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material Cost ($):</span>
                  <span className="font-medium">${r.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Setup Cost ($):</span>
                  <span className="font-medium">${r.setupCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total Cost ($):</span>
                  <span className="font-semibold">${r.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Price per Magnet:</span>
                  <span className="text-accent">${r.pricePerMagnet.toFixed(2)}</span>
                </div>
                
                {/* Check Inventory Section */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Style number (e.g. 64000)"
                      value={inventoryId}
                      onChange={(e) => setInventoryId(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/inventory-checker?style=${inventoryId}`)}
                      className="whitespace-nowrap"
                    >
                      <Search className="h-4 w-4 mr-2" /> 
                      Check Inventory
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check raw inventory data for a specific style number
                  </p>
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
                  <li>Horizontal Fit = m / w</li>
                  <li>Minimal Length (ft) = q × (w / m) × (h / 12)</li>
                  <li>Actual Length (ft) = Minimal Length + 1</li>
                  <li>Material Cost = Actual Length × p</li>
                  <li>Total Cost = Material Cost + $100 setup</li>
                  <li>Price per Magnet = Total Cost / q</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example (should match)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>h=3.5, w=3, q=500, p=$20, m=22</li>
                  <li>Horizontal fit: 22/3 = 7.333333</li>
                  <li>Minimal length: 500×(3/22)×(3.5/12) = 19.886364 ft</li>
                  <li>Actual length: 19.886364 + 1 = 20.886364 ft</li>
                  <li>Material cost: 20.886364 × 20 = $417.7273</li>
                  <li>Total cost: $417.7273 + 100 = $517.7273</li>
                  <li>Price per magnet: $517.7273 / 500 = $1.035455</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
