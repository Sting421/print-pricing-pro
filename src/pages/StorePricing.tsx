import { useState } from "react";
import { DollarSign } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StorePricing() {
  const [form, setForm] = useState({
    basePrice: "16.82", // RegFrecklesPrice
    roy1: "0.08",
    roy2: "0",
    roy3: "0",
    roy4: "0",
    roy5: "0",
    markup: "0.074074", // additional markup rate
  });

  const calculate = () => {
    const base = Number(form.basePrice) || 0;
    const rates = [form.roy1, form.roy2, form.roy3, form.roy4, form.roy5].map((r) => Number(r) || 0);
    const royTotal = rates.reduce((a, b) => a + b, 0);
    const markup = Number(form.markup) || 0;

    const storePrice = base * (1 + royTotal + markup);
    const revenueAfterRoyalties = storePrice * (1 - royTotal);
    const extraAmount = revenueAfterRoyalties - base;

    return {
      base,
      royTotal,
      markup,
      storePrice,
      revenueAfterRoyalties,
      extraAmount,
    };
  };

  const r = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Store Pricing</h1>
          <p className="text-muted-foreground">Calculate store price, royalties, and extra revenue using base price, royalty rates, and markup.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Inputs"
            description="Enter base price, royalties (Roy 1–5), and additional markup rate"
            icon={DollarSign}
          >
            <div className="space-y-6">
              <div>
                <Label htmlFor="base">Base Price (RegFrecklesPrice)</Label>
                <Input
                  id="base"
                  type="number"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>

              <div>
                <Label>Royalties (as decimal rates)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="roy1" className="text-xs text-muted-foreground">Roy 1</Label>
                    <Input
                      id="roy1"
                      type="number"
                      step="0.0001"
                      value={form.roy1}
                      onChange={(e) => setForm((prev) => ({ ...prev, roy1: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roy2" className="text-xs text-muted-foreground">Roy 2</Label>
                    <Input
                      id="roy2"
                      type="number"
                      step="0.0001"
                      value={form.roy2}
                      onChange={(e) => setForm((prev) => ({ ...prev, roy2: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roy3" className="text-xs text-muted-foreground">Roy 3</Label>
                    <Input
                      id="roy3"
                      type="number"
                      step="0.0001"
                      value={form.roy3}
                      onChange={(e) => setForm((prev) => ({ ...prev, roy3: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roy4" className="text-xs text-muted-foreground">Roy 4</Label>
                    <Input
                      id="roy4"
                      type="number"
                      step="0.0001"
                      value={form.roy4}
                      onChange={(e) => setForm((prev) => ({ ...prev, roy4: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roy5" className="text-xs text-muted-foreground">Roy 5</Label>
                    <Input
                      id="roy5"
                      type="number"
                      step="0.0001"
                      value={form.roy5}
                      onChange={(e) => setForm((prev) => ({ ...prev, roy5: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">RoyTotal = Roy1 + Roy2 + Roy3 + Roy4 + Roy5</p>
              </div>

              <div>
                <Label htmlFor="markup">Additional Markup Rate</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.000001"
                  value={form.markup}
                  onChange={(e) => setForm((prev) => ({ ...prev, markup: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Example default is 0.074074</p>
              </div>
            </div>
          </CalculatorCard>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Results</CardTitle>
              <CardDescription>Calculated store price and royalty breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RoyTotal:</span>
                  <span className="font-medium">{r.royTotal.toFixed(6)} ({(r.royTotal * 100).toFixed(2)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Markup Rate:</span>
                  <span className="font-medium">{r.markup.toFixed(6)} ({(r.markup * 100).toFixed(2)}%)</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Store Price ($):</span>
                  <span className="font-semibold">${r.storePrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue After Royalties ($):</span>
                  <span className="font-medium">${r.revenueAfterRoyalties.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Extra Amount ($):</span>
                  <span className="text-accent">${r.extraAmount.toFixed(4)}</span>
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
                  <li>Base Price = RegFrecklesPrice</li>
                  <li>RoyTotal = Roy1 + Roy2 + Roy3 + Roy4 + Roy5</li>
                  <li>Additional Markup Rate = given</li>
                  <li>Store Price = Base Price × (1 + RoyTotal + Additional Markup Rate)</li>
                  <li>Revenue After Royalties = Store Price × (1 - RoyTotal)</li>
                  <li>Extra Amount = Revenue After Royalties - Base Price</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example (should match)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Base Price = 16.82</li>
                  <li>RoyTotal = 0.08 (e.g., Roy1=0.08; others=0)</li>
                  <li>Additional Markup Rate = 0.074074</li>
                  <li>Store Price = 16.82 × (1 + 0.08 + 0.074074) = 16.82 × 1.154074 = 19.4115</li>
                  <li>Revenue After Royalties = 19.4115 × (1 - 0.08) = 19.4115 × 0.92 = 17.8586</li>
                  <li>Extra Amount = 17.8586 - 16.82 = 1.0386</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
