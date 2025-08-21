import { useState } from "react";
import { Square } from "lucide-react";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Helper formatters
const toNum = (v: string) => (Number(v) || 0);
const round4x = (cost: number) => Math.ceil(cost * 4);

// Banner presets
const bannerPresets = {
  "13oz_54": { label: "13oz Vinyl (54\") — $20/ft, up to 50\" wide", pricePerFoot: 20, maxWidthIn: 50 },
  "13oz_96": { label: "13oz Vinyl (96\") — $30/ft, up to 92\" wide", pricePerFoot: 30, maxWidthIn: 92 },
  "8oz_mesh_63": { label: "8oz Mesh (63\") — $30/ft, up to 60\" wide", pricePerFoot: 30, maxWidthIn: 60 },
} as const;

type BannerKey = keyof typeof bannerPresets;

// Yard sign price suggestion based on limited examples. Editable by user.
function suggestYardPrice(sided: "single" | "double", qty: number) {
  if (qty >= 51) return sided === "single" ? 10 : 15;
  if (qty > 10) return sided === "single" ? 20 : 25; // 11–50 default from example
  return sided === "single" ? 20 : 25; // editable default for <=10
}

export default function SignCalculator() {
  const [vinylRows, setVinylRows] = useState(
    [{ type: "40c", costPerFoot: "3", feet: "0" }]
  );
  const [laminateRows, setLaminateRows] = useState(
    [{ type: "8508", costPerFoot: "2.07", feet: "0" }]
  );
  const [maskingFeet, setMaskingFeet] = useState("0"); // $2.5 per foot, cost baseline $0.63 (informational)
  const [laborRows, setLaborRows] = useState(
    [{ type: "Production", rate: "75", hours: "0" }]
  );
  const [banner, setBanner] = useState({
    type: "13oz_54" as BannerKey,
    lengthFeet: "0",
    widthIn: "0",
  });
  const [yard, setYard] = useState({
    sided: "single" as "single" | "double",
    quantity: "0",
    pricePerSign: "", // if empty, we will suggest based on qty+sided
  });
  const [rigidRows, setRigidRows] = useState(
    [{ type: "3mm ACM", costPerSqFt: "1.75", sqFt: "0" }]
  );

  // Computations
  const vinylSubtotal = vinylRows.reduce((sum, r) => {
    const cost = toNum(r.costPerFoot);
    const sell = round4x(cost);
    const lf = toNum(r.feet);
    return sum + sell * lf;
  }, 0);

  const laminateSubtotal = laminateRows.reduce((sum, r) => {
    const cost = toNum(r.costPerFoot);
    const sell = round4x(cost);
    const lf = toNum(r.feet);
    return sum + sell * lf;
  }, 0);

  const maskingPricePerFoot = 2.5; // given
  const maskingSubtotal = maskingPricePerFoot * toNum(maskingFeet);

  const laborSubtotal = laborRows.reduce((sum, r) => sum + toNum(r.rate) * toNum(r.hours), 0);

  const preset = bannerPresets[banner.type];
  const bannerWidthOk = toNum(banner.widthIn) <= preset.maxWidthIn;
  const bannerSubtotal = bannerWidthOk ? (preset.pricePerFoot * toNum(banner.lengthFeet)) : 0;

  const yardQty = Math.max(0, Math.floor(toNum(yard.quantity)));
  const yardSuggested = suggestYardPrice(yard.sided, yardQty);
  const yardPrice = toNum(yard.pricePerSign) || yardSuggested;
  const yardSubtotal = yardPrice * yardQty;

  const rigidSubtotal = rigidRows.reduce((sum, r) => {
    const cost = toNum(r.costPerSqFt);
    const sell = round4x(cost);
    const sqft = toNum(r.sqFt);
    return sum + sell * sqft;
  }, 0);

  const projectTotal = vinylSubtotal + laminateSubtotal + maskingSubtotal + laborSubtotal + bannerSubtotal + yardSubtotal + rigidSubtotal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sign Project Calculator</h1>
          <p className="text-muted-foreground">Calculate complete pricing for sign projects: materials, labor, and fixed-price items.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CalculatorCard
            title="Sign Project Inputs"
            description="Enter components based on your job spec"
            icon={Square}
          >
            <div className="space-y-8">
              {/* Vinyl */}
              <section>
                <h3 className="font-semibold mb-3">Vinyl Materials</h3>
                <div className="space-y-3">
                  {vinylRows.map((row, idx) => {
                    const cost = toNum(row.costPerFoot);
                    const sell = round4x(cost);
                    const feet = toNum(row.feet);
                    const sub = sell * feet;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].type = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Label>Cost/ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerFoot} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].costPerFoot = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="col-span-2">
                          <Label>Selling/ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="col-span-2">
                          <Label>Feet</Label>
                          <Input type="number" step="0.01" value={row.feet} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].feet = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setVinylRows(v => ([...v, { type: "", costPerFoot: "0", feet: "0" }]))}>Add Vinyl</Button>
                    {vinylRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setVinylRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Laminate */}
              <section>
                <h3 className="font-semibold mb-3">Laminate Materials</h3>
                <div className="space-y-3">
                  {laminateRows.map((row, idx) => {
                    const cost = toNum(row.costPerFoot);
                    const sell = round4x(cost);
                    const feet = toNum(row.feet);
                    const sub = sell * feet;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].type = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Label>Cost/ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerFoot} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].costPerFoot = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="col-span-2">
                          <Label>Selling/ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="col-span-2">
                          <Label>Feet</Label>
                          <Input type="number" step="0.01" value={row.feet} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].feet = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setLaminateRows(v => ([...v, { type: "", costPerFoot: "0", feet: "0" }]))}>Add Laminate</Button>
                    {laminateRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setLaminateRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Masking */}
              <section>
                <h3 className="font-semibold mb-3">Masking</h3>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label>Cost/ft ($)</Label>
                    <Input value={"0.63"} readOnly />
                  </div>
                  <div className="col-span-3">
                    <Label>Selling/ft ($)</Label>
                    <Input value={maskingPricePerFoot.toString()} readOnly />
                  </div>
                  <div className="col-span-3">
                    <Label>Feet</Label>
                    <Input type="number" step="0.01" value={maskingFeet} onChange={(e) => setMaskingFeet(e.target.value)} />
                  </div>
                  <div className="col-span-3 text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${maskingSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </section>

              {/* Labor */}
              <section>
                <h3 className="font-semibold mb-3">Labor</h3>
                <div className="space-y-3">
                  {laborRows.map((row, idx) => {
                    const sub = toNum(row.rate) * toNum(row.hours);
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].type = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Label>Rate ($/hr)</Label>
                          <Input type="number" step="0.01" value={row.rate} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].rate = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Label>Hours</Label>
                          <Input type="number" step="0.01" value={row.hours} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].hours = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setLaborRows(v => ([...v, { type: "", rate: "0", hours: "0" }]))}>Add Labor</Button>
                    {laborRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setLaborRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Banners */}
              <section>
                <h3 className="font-semibold mb-3">Banners</h3>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Label>Type</Label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={banner.type}
                      onChange={(e) => setBanner(b => ({ ...b, type: e.target.value as BannerKey }))}
                    >
                      {(Object.keys(bannerPresets) as BannerKey[]).map(k => (
                        <option key={k} value={k}>{bannerPresets[k].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Label>Width (in)</Label>
                    <Input type="number" step="0.01" value={banner.widthIn} onChange={(e) => setBanner(b => ({ ...b, widthIn: e.target.value }))} />
                    {!bannerWidthOk && (
                      <div className="text-xs text-destructive mt-1">Exceeds max width of {preset.maxWidthIn}\"</div>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Label>Length (ft)</Label>
                    <Input type="number" step="0.01" value={banner.lengthFeet} onChange={(e) => setBanner(b => ({ ...b, lengthFeet: e.target.value }))} />
                  </div>
                  <div className="col-span-12 text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${bannerSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </section>

              {/* Yard Signs */}
              <section>
                <h3 className="font-semibold mb-3">Yard Signs</h3>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Label>Sided</Label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={yard.sided}
                      onChange={(e) => setYard(y => ({ ...y, sided: e.target.value as "single" | "double" }))}
                    >
                      <option value="single">Single Sided</option>
                      <option value="double">Double Sided</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Label>Quantity</Label>
                    <Input type="number" step="1" value={yard.quantity} onChange={(e) => setYard(y => ({ ...y, quantity: e.target.value }))} />
                  </div>
                  <div className="col-span-3">
                    <Label>Price/Sign ($)</Label>
                    <Input type="number" step="0.01" value={yard.pricePerSign || (yardSuggested?.toString() ?? "")} onChange={(e) => setYard(y => ({ ...y, pricePerSign: e.target.value }))} />
                    <div className="text-xs text-muted-foreground mt-1">Suggested: ${yardSuggested.toFixed(2)}</div>
                  </div>
                  <div className="col-span-3 text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${yardSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </section>

              {/* Rigid Materials */}
              <section>
                <h3 className="font-semibold mb-3">Rigid Sign Materials (per sq ft)</h3>
                <div className="space-y-3">
                  {rigidRows.map((row, idx) => {
                    const cost = toNum(row.costPerSqFt);
                    const sell = round4x(cost);
                    const sqft = toNum(row.sqFt);
                    const sub = sell * sqft;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].type = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Label>Cost/sq ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerSqFt} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].costPerSqFt = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="col-span-2">
                          <Label>Selling/sq ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="col-span-2">
                          <Label>Sq Ft</Label>
                          <Input type="number" step="0.01" value={row.sqFt} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].sqFt = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="col-span-1 text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setRigidRows(v => ([...v, { type: "", costPerSqFt: "0", sqFt: "0" }]))}>Add Material</Button>
                    {rigidRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setRigidRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </CalculatorCard>

          {/* Results */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-accent">Project Results</CardTitle>
              <CardDescription>Calculated pricing breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Vinyl Subtotal:</span><span className="font-medium">${vinylSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Laminate Subtotal:</span><span className="font-medium">${laminateSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Masking Subtotal:</span><span className="font-medium">${maskingSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Labor Subtotal:</span><span className="font-medium">${laborSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Banners Subtotal:</span><span className="font-medium">${bannerSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Yard Signs Subtotal:</span><span className="font-medium">${yardSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rigid Materials Subtotal:</span><span className="font-medium">${rigidSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Project Price:</span>
                  <span className="text-accent">${projectTotal.toFixed(2)}</span>
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
                <h4 className="font-medium mb-2">Formulas</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Vinyl/Laminate Selling Price per foot = ceil(cost × 4)</li>
                  <li>Masking Selling Price per foot = $2.50 (cost $0.63/ft)</li>
                  <li>Labor Subtotal = rate × hours</li>
                  <li>Banners = price per foot × feet (width must be within preset)</li>
                  <li>Yard Signs = per sign price × quantity (suggested per examples)</li>
                  <li>Rigid Selling Price per sq ft = ceil(cost × 4)</li>
                  <li>Total Project = sum of all component subtotals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Examples</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Vinyl: 40c cost $3 → sell $12/ft; 10 ft → $120</li>
                  <li>Laminate: 8508 cost $2.07 → sell $9/ft; 5 ft → $45</li>
                  <li>Masking: 8 ft × $2.5 → $20</li>
                  <li>Labor: Production 3 hr × $75 → $225</li>
                  <li>Yard: 60 double-sided × $15 → $900</li>
                  <li>Rigid: 3mm ACM cost $1.75 → sell $7/sq ft; 20 sq ft → $140</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
