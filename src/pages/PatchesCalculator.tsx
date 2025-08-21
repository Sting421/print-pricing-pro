import { useState } from "react";
import { Calculator } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Patch material pricing (UV Printing)
const PATCH_TYPES = {
  leather: { label: "Leather", base: 10 },
  faux: { label: "Faux", base: 9 },
  sublimated: { label: "Sublimated", base: 10 },
} as const;

type PatchKey = keyof typeof PATCH_TYPES;

type ArtOption = "none" | "new" | "vector_changes" | "vector_no_change";

export default function PatchesCalculator() {
  const [form, setForm] = useState({
    quantity: "24",
    patchType: "leather" as PatchKey,
    includeHeat: true,
    garmentCost: "0",
    markupPercent: "20", // percent input (e.g., 20 = 20%)
    artOption: "none" as ArtOption,
    artHours: "0.0", // used when artOption === "new"
  });

  const calculate = () => {
    const q = Math.max(0, Math.floor(Number(form.quantity) || 0));
    const patch = PATCH_TYPES[form.patchType];
    const basePerPatch = patch.base;
    const heatPerPatch = form.includeHeat ? 3 : 0; // $3 per patch for heat application
    const unitPatchPrice = basePerPatch + heatPerPatch;

    const patchesSubtotal = unitPatchPrice * q;

    const g = Number(form.garmentCost) || 0; // per garment
    const garmentSubtotal = g * q;

    const preMarkup = patchesSubtotal + garmentSubtotal;
    const markupRate = (Number(form.markupPercent) || 0) / 100;
    const markupAmount = preMarkup * markupRate;

    // Artwork fee logic
    let artFee = 0;
    if (form.artOption === "new") {
      const hours = Number(form.artHours) || 0;
      artFee = 75 * hours; // $75/hour
    } else if (form.artOption === "vector_changes") {
      artFee = 50;
    } else if (form.artOption === "vector_no_change") {
      artFee = 25;
    }

    const grandTotal = preMarkup + markupAmount + artFee;
    const pricePerItem = q > 0 ? grandTotal / q : 0;

    return {
      q,
      basePerPatch,
      heatPerPatch,
      unitPatchPrice,
      patchesSubtotal,
      garmentSubtotal,
      preMarkup,
      markupRate,
      markupAmount,
      artFee,
      grandTotal,
      pricePerItem,
    };
  };

  const r = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Patches Calculator</h1>
          <p className="text-muted-foreground">UV Printed patch pricing with artwork, heat application, markup, and garment cost.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Inputs"
            description="Choose patch type, quantity, and pricing options"
            icon={Calculator}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="patch-type">Patch Type (UV Printing)</Label>
                  <select
                    id="patch-type"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.patchType}
                    onChange={(e) => setForm((p) => ({ ...p, patchType: e.target.value as PatchKey }))}
                  >
                    {(Object.keys(PATCH_TYPES) as PatchKey[]).map((k) => (
                      <option key={k} value={k}>
                        {PATCH_TYPES[k].label} — ${PATCH_TYPES[k].base}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="garment">Garment Cost per Item ($)</Label>
                  <Input
                    id="garment"
                    type="number"
                    step="0.01"
                    value={form.garmentCost}
                    onChange={(e) => setForm((p) => ({ ...p, garmentCost: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="markup">Markup (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="0.01"
                    value={form.markupPercent}
                    onChange={(e) => setForm((p) => ({ ...p, markupPercent: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <input
                    id="heat"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form.includeHeat}
                    onChange={(e) => setForm((p) => ({ ...p, includeHeat: e.target.checked }))}
                  />
                  <Label htmlFor="heat">Include Heat Application (+$3/patch)</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Artwork</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.artOption}
                    onChange={(e) => setForm((p) => ({ ...p, artOption: e.target.value as ArtOption }))}
                  >
                    <option value="none">None</option>
                    <option value="new">New/Re-create — $75/hour</option>
                    <option value="vector_changes">Vector w/ changes — $50</option>
                    <option value="vector_no_change">Vector no change — $25</option>
                  </select>

                  {form.artOption === "new" && (
                    <div>
                      <Label htmlFor="hours">Art Hours</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.01"
                        value={form.artHours}
                        onChange={(e) => setForm((p) => ({ ...p, artHours: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
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
                  <span className="text-muted-foreground">Base per Patch ({PATCH_TYPES[form.patchType].label}):</span>
                  <span className="font-medium">${r.basePerPatch.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heat Application per Patch:</span>
                  <span className="font-medium">${r.heatPerPatch.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Patch Price (base + heat):</span>
                  <span className="font-medium">${r.unitPatchPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patches Subtotal ({r.q}×):</span>
                  <span className="font-medium">${r.patchesSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Garments Subtotal ({r.q}×):</span>
                  <span className="font-medium">${r.garmentSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pre-Markup Subtotal:</span>
                  <span className="font-medium">${r.preMarkup.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markup ({(r.markupRate * 100).toFixed(2)}%):</span>
                  <span className="font-medium">${r.markupAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Artwork Fee:</span>
                  <span className="font-medium">${r.artFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Grand Total:</span>
                  <span className="text-accent">${r.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Price per Item:</span>
                  <span className="text-accent">${r.pricePerItem.toFixed(2)}</span>
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
                <h4 className="font-medium mb-2">UV Printing Patch Pricing</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Leather: $10</li>
                  <li>Faux: $9</li>
                  <li>Sublimated: $10</li>
                  <li>Heat Application: +$3 per patch</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Formula</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Unit Patch Price = Base + (IncludeHeat ? $3 : $0)</li>
                  <li>Patches Subtotal = Unit Patch Price × Quantity</li>
                  <li>Garments Subtotal = Garment Cost × Quantity</li>
                  <li>Pre-Markup = Patches Subtotal + Garments Subtotal</li>
                  <li>Markup = Pre-Markup × Markup%</li>
                  <li>Artwork Fee = $75 × Hours | $50 | $25 | $0</li>
                  <li>Grand Total = Pre-Markup + Markup + Artwork Fee</li>
                  <li>Price per Item = Grand Total ÷ Quantity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
