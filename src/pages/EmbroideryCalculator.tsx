import { useState } from "react";
import { Calculator } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmbroideryCalculator() {
  // Numeric state
  const [garmentCost, setGarmentCost] = useState<number>(21.99);
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [artHours, setArtHours] = useState<number>(0.1964);
  const [stitches, setStitches] = useState<number[]>([8000, 10000, 1165]); // defaults that demonstrate examples

  // UI string state for nice clearing/editing
  const [ui, setUi] = useState({
    garmentCost: String(21.99),
    hourlyRate: String(75),
    artHours: String(0.1964),
    loc1: String(8000),
    loc2: String(10000),
    loc3: String(1165),
  });

  const embroideryCostFor = (s: number) => {
    const n = Math.max(0, Math.floor(s));
    if (n <= 0) return 0; // treat absent location as $0
    const variable = (n / 1000) * 0.875;
    return Math.max(7, Math.ceil(variable));
  };

  const artFee = hourlyRate * artHours;
  const locationCosts = stitches.map(embroideryCostFor);
  const locationCumulativeTotals = locationCosts.map((_, i) => garmentCost + artFee + locationCosts.slice(0, i + 1).reduce((a, b) => a + b, 0));
  const totalEmbroidery = locationCosts.reduce((a, b) => a + b, 0);
  const totalPrice = garmentCost + artFee + totalEmbroidery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Embroidery Calculator</h1>
          <p className="text-muted-foreground">Total price = Garment Cost + Art Fee + Sum(Embroidery Costs per location)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Inputs"
            description="Enter garment cost, art hours, and stitches per location (up to 3)"
            icon={Calculator}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="garment">Garment Cost ($)</Label>
                  <Input
                    id="garment"
                    type="number"
                    step="0.01"
                    value={ui.garmentCost}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, garmentCost: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                      setGarmentCost(next);
                      setUi((p) => ({ ...p, garmentCost: String(next) }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Art Hourly Rate ($/hr)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={ui.hourlyRate}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, hourlyRate: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                      setHourlyRate(next);
                      setUi((p) => ({ ...p, hourlyRate: String(next) }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Estimated Art Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.0001"
                    value={ui.artHours}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, artHours: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, n) : 0;
                      setArtHours(next);
                      setUi((p) => ({ ...p, artHours: String(next) }));
                    }}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-sm text-muted-foreground">Art Fee (rate × hours)</div>
                  <div className="text-lg font-semibold">${artFee.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="loc1">Location 1 Stitches</Label>
                  <Input
                    id="loc1"
                    type="number"
                    value={ui.loc1}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, loc1: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                      setStitches((prev) => [next, prev[1] ?? 0, prev[2] ?? 0]);
                      setUi((p) => ({ ...p, loc1: String(next) }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="loc2">Location 2 Stitches</Label>
                  <Input
                    id="loc2"
                    type="number"
                    value={ui.loc2}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, loc2: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                      setStitches((prev) => [prev[0] ?? 0, next, prev[2] ?? 0]);
                      setUi((p) => ({ ...p, loc2: String(next) }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="loc3">Location 3 Stitches</Label>
                  <Input
                    id="loc3"
                    type="number"
                    value={ui.loc3}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setUi((p) => ({ ...p, loc3: e.target.value }))}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? NaN : Number(v);
                      const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                      setStitches((prev) => [prev[0] ?? 0, prev[1] ?? 0, next]);
                      setUi((p) => ({ ...p, loc3: String(next) }));
                    }}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Embroidery per location = max(7, ceil(stitches / 1000 × 0.875)). Locations with 0 stitches are ignored ($0).
              </div>
            </div>
          </CalculatorCard>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Results</CardTitle>
              <CardDescription>Calculated breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Garment Cost:</span>
                  <span className="font-medium">${garmentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Art Fee (Rate × Hours):</span>
                  <span className="font-medium">${artFee.toFixed(2)} <span className="text-xs text-muted-foreground">(${hourlyRate.toFixed(2)} × {artHours.toFixed(4)}h)</span></span>
                </div>
                <div className="space-y-2">
                  {stitches.map((s, i) => (
                    <div key={`loc-${i}`}>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location {i + 1} ({s.toLocaleString()} stitches):</span>
                        <span className="font-medium">${embroideryCostFor(s).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total after {i + 1} location{i + 1 > 1 ? 's' : ''}:</span>
                        <span className="font-medium">${locationCumulativeTotals[i].toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Embroidery Total:</span>
                  <span className="font-medium">${totalEmbroidery.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Price:</span>
                    <span className="text-accent">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Example Verification</CardTitle>
            <CardDescription>Using: Garment $21.99, Rate $75/h, Hours 0.1964 (Art Fee $14.73); Locations: 8000, 10000, 1165 stitches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">One location (8000)</h4>
                <div className="flex justify-between"><span>Embroidery:</span><span>$7.00</span></div>
                <div className="flex justify-between"><span>Total:</span><span>$43.72</span></div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Two locations (+10000)</h4>
                <div className="flex justify-between"><span>2nd Embroidery:</span><span>$9.00</span></div>
                <div className="flex justify-between"><span>Total:</span><span>$52.72</span></div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Three locations (+1165)</h4>
                <div className="flex justify-between"><span>3rd Embroidery:</span><span>$7.00</span></div>
                <div className="flex justify-between"><span>Total:</span><span>$59.72</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
