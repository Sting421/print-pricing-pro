import { useState } from "react";
import jsPDF from "jspdf";
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

// Vinyl presets (cost/sell are shown; we only use cost and compute sell using existing rule)
const vinylPresets = {
  "40c": { label: "40c", costPerFoot: 3.00, sellPerFoot: 12.00 },
  ij180: { label: "IJ180 (Vehicle Wrap)", costPerFoot: 6.10, sellPerFoot: 24.00 },
  briteline_im3223: { label: "Briteline 6.0 IM3223", costPerFoot: 1.70, sellPerFoot: 7.00 },
  window_perf: { label: "Window Perf", costPerFoot: 3.80, sellPerFoot: 15.00 },
  oracal_651: { label: "Oracal 651", costPerFoot: 1.50, sellPerFoot: 6.00 },
  textured_floor_vinyl: { label: "Textured Floor Vinyl", costPerFoot: 6.00, sellPerFoot: 24.00 },
} as const;

type VinylKey = keyof typeof vinylPresets;

type VinylRow = {
  type: string;
  costPerFoot: string;
  feet: string;
  presetKey?: VinylKey | "";
};

// Laminate presets
const laminatePresets = {
  "8508": { label: "8508", costPerFoot: 2.07, sellPerFoot: 9.00 },
  "8518": { label: "8518", costPerFoot: 4.60, sellPerFoot: 19.00 },
  dry_erase: { label: "Dry Erase Lam", costPerFoot: 1.75, sellPerFoot: 7.00 },
} as const;

type LaminateKey = keyof typeof laminatePresets;

type LaminateRow = {
  type: string;
  costPerFoot: string;
  feet: string;
  presetKey?: LaminateKey | "";
};

// Labor presets
const laborPresets = {
  production: { label: "Production", rate: 75 },
  hp_esko: { label: "HP/ESKO", rate: 125 },
  installations: { label: "Installations", rate: 95 },
  art: { label: "Art", rate: 75 },
} as const;

type LaborKey = keyof typeof laborPresets;

type LaborRow = {
  type: string;
  rate: string;
  hours: string;
  presetKey?: LaborKey | "";
};

// Rigid material presets
const rigidPresets = {
  acm_3mm: { label: "3mm ACM", costPerSqFt: 1.75, sellPerSqFt: 7.00 },
  acm_6mm: { label: "6mm ACM", costPerSqFt: 3.25, sellPerSqFt: 13.00 },
  pvc_3mm: { label: "3mm PVC", costPerSqFt: 1.25, sellPerSqFt: 5.00 },
  pvc_6mm: { label: "6mm PVC", costPerSqFt: 2.00, sellPerSqFt: 8.00 },
  corro_4mm: { label: "4mm Corro", costPerSqFt: 0.35, sellPerSqFt: 1.50 },
} as const;

type RigidKey = keyof typeof rigidPresets;

type RigidRow = {
  type: string;
  costPerSqFt: string;
  sqFt: string;
  presetKey?: RigidKey | "";
};

// Yard sign price suggestion based on limited examples. Editable by user.
function suggestYardPrice(sided: "single" | "double", qty: number) {
  if (qty >= 51) return sided === "single" ? 10 : 15;
  if (qty > 10) return sided === "single" ? 20 : 25; // 11–50 default from example
  return sided === "single" ? 20 : 25; // editable default for <=10
}

export default function SignCalculator() {
  const [vinylRows, setVinylRows] = useState<VinylRow[]>(
    [{ type: "40c", costPerFoot: "3", feet: "0", presetKey: "40c" }]
  );
  const [laminateRows, setLaminateRows] = useState<LaminateRow[]>(
    [{ type: "8508", costPerFoot: "2.07", feet: "0", presetKey: "8508" }]
  );
  const [maskingFeet, setMaskingFeet] = useState("0"); // $2.5 per foot, cost baseline $0.63 (informational)
  const [laborRows, setLaborRows] = useState<LaborRow[]>(
    [{ type: "Production", rate: "75", hours: "0", presetKey: "production" }]
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
  const [customerName, setCustomerName] = useState("");
  const [rigidRows, setRigidRows] = useState<RigidRow[]>(
    [{ type: "3mm ACM", costPerSqFt: "1.75", sqFt: "0", presetKey: "acm_3mm" }]
  );

  // Computations
  const vinylSubtotal = vinylRows.reduce((sum, r: VinylRow) => {
    const cost = toNum(r.costPerFoot);
    const lf = toNum(r.feet);
    const sell = r.presetKey ? vinylPresets[r.presetKey].sellPerFoot : round4x(cost);
    return sum + sell * lf;
  }, 0);

  const laminateSubtotal = laminateRows.reduce((sum, r: LaminateRow) => {
    const cost = toNum(r.costPerFoot);
    const sell = r.presetKey ? laminatePresets[r.presetKey].sellPerFoot : round4x(cost);
    const lf = toNum(r.feet);
    return sum + sell * lf;
  }, 0);

  const maskingPricePerFoot = 2.5; // given
  const maskingSubtotal = maskingPricePerFoot * toNum(maskingFeet);

  const laborSubtotal = laborRows.reduce((sum, r: LaborRow) => sum + toNum(r.rate) * toNum(r.hours), 0);

  const preset = bannerPresets[banner.type];
  const bannerWidthOk = toNum(banner.widthIn) <= preset.maxWidthIn;
  const bannerSubtotal = bannerWidthOk ? (preset.pricePerFoot * toNum(banner.lengthFeet)) : 0;

  const yardQty = Math.max(0, Math.floor(toNum(yard.quantity)));
  const yardSuggested = suggestYardPrice(yard.sided, yardQty);
  const yardPrice = toNum(yard.pricePerSign) || yardSuggested;
  const yardSubtotal = yardPrice * yardQty;

  const rigidSubtotal = rigidRows.reduce((sum, r: RigidRow) => {
    const cost = toNum(r.costPerSqFt);
    const sell = r.presetKey ? rigidPresets[r.presetKey].sellPerSqFt : round4x(cost);
    const sqft = toNum(r.sqFt);
    return sum + sell * sqft;
  }, 0);

  const projectTotal = vinylSubtotal + laminateSubtotal + maskingSubtotal + laborSubtotal + bannerSubtotal + yardSubtotal + rigidSubtotal;

  // Download a simple PDF price breakdown using jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    let y = 20;
    const left = 14;
    const right = 196; // page width ~210mm, keep some margin
    // Dynamic page metrics for robust pagination (A4 in mm)
    const pageHeight = 297; // Avoid untyped access to doc.internal to satisfy lint
    const topMargin = 20;
    const bottomMargin = 14;

    // Page-break guard available before any usage
    const ensureSpace = (lineHeight = 8) => {
      const limit = pageHeight - bottomMargin;
      if (y + lineHeight > limit) {
        doc.addPage();
        y = topMargin;
      }
    };

    const money = (n: number) => `$${n.toFixed(2)}`;

    doc.setFontSize(16);
    doc.text("Project Price Breakdown", left, y);
    y += 8;
    // Customer
    doc.setFontSize(12);
    doc.text(`Customer: ${customerName || "-"}`, left, y);
    y += 6;

    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Generated: ${now.toLocaleString()}` , left, y);
    y += 6;

    doc.setLineWidth(0.5);
    ensureSpace(2);
    doc.line(left, y, right, y);
    y += 8;
    // Summary moved to bottom after itemized sections
    y += 2;

    // Items Included by Category (formatted like web preview)

    const sectionHeader = (title: string) => {
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(title, left, y);
      doc.setFont(undefined, "normal");
      y += 5;
      doc.setLineWidth(0.3);
      ensureSpace(2);
      doc.line(left, y, right, y);
      y += 6;
      // Column headers
      doc.setFontSize(10);
      doc.text("Description", left, y);
      doc.text("Qty @ Rate", 130, y);
      doc.text("Amount", right, y, { align: "right" as const });
      y += 6;
    };

    const addItemLine = (desc: string, qty: number, unit: string, rate: number, subtotal: number) => {
      if (!qty || qty <= 0) return;
      ensureSpace();
      doc.setFontSize(11);
      doc.text(desc, left, y);
      doc.setFontSize(10);
      const detail = `${qty.toFixed(2)} ${unit} @ ${money(rate)}`;
      doc.text(detail, 130, y);
      doc.text(money(subtotal), right, y, { align: "right" as const });
      y += 6;
    };

    const sectionSubtotal = (value: number) => {
      ensureSpace(8);
      doc.setLineWidth(0.2);
      doc.line(left, y, right, y);
      y += 6;
      doc.setFont(undefined, "bold");
      doc.text("Subtotal", left, y);
      doc.text(money(value), right, y, { align: "right" as const });
      doc.setFont(undefined, "normal");
      y += 10;
    };

    // Vinyl Section
    const vinylIncluded = vinylRows.some(r => toNum(r.feet) > 0);
    if (vinylIncluded) {
      ensureSpace(24);
      sectionHeader("Vinyl Materials");
      vinylRows.forEach((r) => {
        const cost = toNum(r.costPerFoot);
        const sell = r.presetKey ? vinylPresets[r.presetKey].sellPerFoot : round4x(cost);
        const feet = toNum(r.feet);
        addItemLine(r.type || "(type)", feet, "ft", sell, sell * feet);
      });
      sectionSubtotal(vinylSubtotal);
    }

    // Laminate Section
    const lamIncluded = laminateRows.some(r => toNum(r.feet) > 0);
    if (lamIncluded) {
      ensureSpace(24);
      sectionHeader("Laminate Materials");
      laminateRows.forEach((r) => {
        const cost = toNum(r.costPerFoot);
        const sell = r.presetKey ? laminatePresets[r.presetKey].sellPerFoot : round4x(cost);
        const feet = toNum(r.feet);
        addItemLine(r.type || "(type)", feet, "ft", sell, sell * feet);
      });
      sectionSubtotal(laminateSubtotal);
    }

    // Masking Section
    const maskFeet = toNum(maskingFeet);
    if (maskFeet > 0) {
      ensureSpace(24);
      sectionHeader("Masking");
      addItemLine("Masking", maskFeet, "ft", maskingPricePerFoot, maskingPricePerFoot * maskFeet);
      sectionSubtotal(maskingSubtotal);
    }

    // Labor Section
    const laborIncluded = laborRows.some(r => toNum(r.hours) > 0);
    if (laborIncluded) {
      ensureSpace(24);
      sectionHeader("Labor");
      laborRows.forEach((r) => {
        const rate = toNum(r.rate);
        const hrs = toNum(r.hours);
        addItemLine(r.type || "(type)", hrs, "hr", rate, rate * hrs);
      });
      sectionSubtotal(laborSubtotal);
    }

    // Banners Section
    const lenFt = toNum(banner.lengthFeet);
    if (bannerWidthOk && lenFt > 0) {
      ensureSpace(24);
      sectionHeader("Banners");
      addItemLine(preset.label, lenFt, "ft", preset.pricePerFoot, preset.pricePerFoot * lenFt);
      sectionSubtotal(bannerSubtotal);
    }

    // Yard Signs Section
    if (yardQty > 0) {
      ensureSpace(24);
      sectionHeader("Yard Signs");
      addItemLine(yard.sided === "double" ? "Double Sided" : "Single Sided", yardQty, "qty", yardPrice, yardSubtotal);
      sectionSubtotal(yardSubtotal);
    }

    // Rigid Section
    const rigidIncluded = rigidRows.some(r => toNum(r.sqFt) > 0);
    if (rigidIncluded) {
      ensureSpace(24);
      sectionHeader("Rigid Materials");
      rigidRows.forEach((r) => {
        const cost = toNum(r.costPerSqFt);
        const sell = r.presetKey ? rigidPresets[r.presetKey].sellPerSqFt : round4x(cost);
        const sqft = toNum(r.sqFt);
        addItemLine(r.type || "(type)", sqft, "sq ft", sell, sell * sqft);
      });
      sectionSubtotal(rigidSubtotal);
    }

    // Overall Summary at bottom
    ensureSpace(12);
    ensureSpace(8);
    doc.setLineWidth(0.5);
    doc.line(left, y, right, y);
    y += 8;
    doc.setFontSize(12);
    const addSummaryLine = (label: string, value: number) => {
      ensureSpace(8);
      doc.text(label, left, y);
      doc.text(money(value), right, y, { align: "right" as const });
      y += 8;
    };
    addSummaryLine("Vinyl Subtotal", vinylSubtotal);
    addSummaryLine("Laminate Subtotal", laminateSubtotal);
    addSummaryLine("Masking Subtotal", maskingSubtotal);
    addSummaryLine("Labor Subtotal", laborSubtotal);
    addSummaryLine("Banners Subtotal", bannerSubtotal);
    addSummaryLine("Yard Signs Subtotal", yardSubtotal);
    addSummaryLine("Rigid Materials Subtotal", rigidSubtotal);
    ensureSpace(8);
    doc.setLineWidth(0.5);
    doc.line(left, y, right, y);
    y += 8;
    ensureSpace(8);
    doc.setFont(undefined, "bold");
    doc.text("Total Project Price", left, y);
    doc.text(money(projectTotal), right, y, { align: "right" as const });
    doc.setFont(undefined, "normal");

    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    doc.save(`sign-pricing-${ts}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-6">
      <div className="w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sign Project Calculator</h1>
          <p className="text-muted-foreground">Calculate complete pricing for sign projects: materials, labor, and fixed-price items.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 gap-6">
            {/* Vinyl */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Vinyl Materials</CardTitle>
                <CardDescription>Per-foot pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vinylRows.map((row: VinylRow, idx) => {
                    const cost = toNum(row.costPerFoot);
                    const presetKeys = Object.keys(vinylPresets) as VinylKey[];
                    const selectedPresetKey = row.presetKey ?? "";
                    const sell = selectedPresetKey ? vinylPresets[selectedPresetKey].sellPerFoot : round4x(cost);
                    const feet = toNum(row.feet);
                    const sub = sell * feet;
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3 lg:col-span-3">
                          <Label>Preset</Label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedPresetKey}
                            onChange={(e) => {
                              const key = e.target.value as VinylKey | "";
                              const v = [...vinylRows];
                              if (key) {
                                v[idx].type = vinylPresets[key].label;
                                v[idx].costPerFoot = vinylPresets[key].costPerFoot.toString();
                                v[idx].presetKey = key;
                              } else {
                                v[idx].presetKey = "";
                              }
                              setVinylRows(v);
                            }}
                          >
                            <option value="">Custom</option>
                            {presetKeys.map(k => (
                              <option key={k} value={k}>{vinylPresets[k].label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].type = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Cost/ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerFoot} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].costPerFoot = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Selling/ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Feet</Label>
                          <Input type="number" step="0.01" value={row.feet} onChange={(e) => {
                            const v = [...vinylRows];
                            v[idx].feet = e.target.value;
                            setVinylRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-6 lg:col-span-1 sm:text-left lg:text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setVinylRows(v => ([...v, { type: "", costPerFoot: "0", feet: "0", presetKey: "" }]))}>Add Vinyl</Button>
                    {vinylRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setVinylRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                  <div className="flex justify-end border-t pt-2">
                    <div className="text-sm text-muted-foreground mr-2">Total</div>
                    <div className="font-semibold">${vinylSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Laminate */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Laminate Materials</CardTitle>
                <CardDescription>Per-foot pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {laminateRows.map((row: LaminateRow, idx) => {
                    const cost = toNum(row.costPerFoot);
                    const presetKeys = Object.keys(laminatePresets) as LaminateKey[];
                    const selectedPresetKey = row.presetKey ?? "";
                    const sell = selectedPresetKey ? laminatePresets[selectedPresetKey].sellPerFoot : round4x(cost);
                    const feet = toNum(row.feet);
                    const sub = sell * feet;
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3 lg:col-span-3">
                          <Label>Preset</Label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedPresetKey}
                            onChange={(e) => {
                              const key = e.target.value as LaminateKey | "";
                              const v = [...laminateRows];
                              if (key) {
                                v[idx].type = laminatePresets[key].label;
                                v[idx].costPerFoot = laminatePresets[key].costPerFoot.toString();
                                v[idx].presetKey = key;
                              } else {
                                v[idx].presetKey = "";
                              }
                              setLaminateRows(v);
                            }}
                          >
                            <option value="">Custom</option>
                            {presetKeys.map(k => (
                              <option key={k} value={k}>{laminatePresets[k].label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].type = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Cost/ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerFoot} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].costPerFoot = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Selling/ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Feet</Label>
                          <Input type="number" step="0.01" value={row.feet} onChange={(e) => {
                            const v = [...laminateRows];
                            v[idx].feet = e.target.value;
                            setLaminateRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-6 lg:col-span-1 sm:text-left lg:text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setLaminateRows(v => ([...v, { type: "", costPerFoot: "0", feet: "0", presetKey: "" }]))}>Add Laminate</Button>
                    {laminateRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setLaminateRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                  <div className="flex justify-end border-t pt-2">
                    <div className="text-sm text-muted-foreground mr-2">Total</div>
                    <div className="font-semibold">${laminateSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Masking */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Masking</CardTitle>
                <CardDescription>Fixed sell price per foot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 lg:col-span-3">
                    <Label>Cost/ft ($)</Label>
                    <Input value={"0.63"} readOnly />
                  </div>
                  <div className="sm:col-span-3 lg:col-span-3">
                    <Label>Selling/ft ($)</Label>
                    <Input value={maskingPricePerFoot.toString()} readOnly />
                  </div>
                  <div className="sm:col-span-3 lg:col-span-3">
                    <Label>Feet</Label>
                    <Input type="number" step="0.01" value={maskingFeet} onChange={(e) => setMaskingFeet(e.target.value)} />
                  </div>
                  <div className="sm:col-span-3 lg:col-span-3 sm:text-left lg:text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${maskingSubtotal.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-end border-t pt-2 mt-2">
                  <div className="text-sm text-muted-foreground mr-2">Total</div>
                  <div className="font-semibold">${maskingSubtotal.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Labor */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Labor</CardTitle>
                <CardDescription>Hourly rate × hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {laborRows.map((row: LaborRow, idx) => {
                    const presetKeys = Object.keys(laborPresets) as LaborKey[];
                    const selectedPresetKey = row.presetKey ?? "";
                    const sub = toNum(row.rate) * toNum(row.hours);
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3 lg:col-span-3">
                          <Label>Preset</Label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedPresetKey}
                            onChange={(e) => {
                              const key = e.target.value as LaborKey | "";
                              const v = [...laborRows];
                              if (key) {
                                v[idx].type = laborPresets[key].label;
                                v[idx].rate = laborPresets[key].rate.toString();
                                v[idx].presetKey = key;
                              } else {
                                v[idx].presetKey = "";
                              }
                              setLaborRows(v);
                            }}
                          >
                            <option value="">Custom</option>
                            {presetKeys.map(k => (
                              <option key={k} value={k}>{laborPresets[k].label} — ${laborPresets[k].rate}/hr</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3 lg:col-span-3">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].type = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Rate ($/hr)</Label>
                          <Input type="number" step="0.01" value={row.rate} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].rate = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Hours</Label>
                          <Input type="number" step="0.01" value={row.hours} onChange={(e) => {
                            const v = [...laborRows];
                            v[idx].hours = e.target.value;
                            setLaborRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-6 lg:col-span-2 sm:text-left lg:text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setLaborRows(v => ([...v, { type: "", rate: "0", hours: "0", presetKey: "" }]))}>Add Labor</Button>
                    {laborRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setLaborRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                  <div className="flex justify-end border-t pt-2">
                    <div className="text-sm text-muted-foreground mr-2">Total</div>
                    <div className="font-semibold">${laborSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banners */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Banners</CardTitle>
                <CardDescription>Preset-based pricing per foot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6 lg:col-span-6">
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
                  <div className="sm:col-span-3 lg:col-span-2">
                    <Label>Width (in)</Label>
                    <Input type="number" step="0.01" value={banner.widthIn} onChange={(e) => setBanner(b => ({ ...b, widthIn: e.target.value }))} />
                    {!bannerWidthOk && (
                      <div className="text-xs text-destructive mt-1">Exceeds max width of {preset.maxWidthIn}\"</div>
                    )}
                  </div>
                  <div className="sm:col-span-3 lg:col-span-2">
                    <Label>Length (ft)</Label>
                    <Input type="number" step="0.01" value={banner.lengthFeet} onChange={(e) => setBanner(b => ({ ...b, lengthFeet: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-6 lg:col-span-12 sm:text-left lg:text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${bannerSubtotal.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-end border-t pt-2 mt-2">
                  <div className="text-sm text-muted-foreground mr-2">Total</div>
                  <div className="font-semibold">${bannerSubtotal.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Yard Signs */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Yard Signs</CardTitle>
                <CardDescription>Per-sign pricing × quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 lg:col-span-3">
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
                  <div className="sm:col-span-3 lg:col-span-3">
                    <Label>Quantity</Label>
                    <Input type="number" step="1" value={yard.quantity} onChange={(e) => setYard(y => ({ ...y, quantity: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-3 lg:col-span-3">
                    <Label>Price/Sign ($)</Label>
                    <Input type="number" step="0.01" value={yard.pricePerSign || (yardSuggested?.toString() ?? "")} onChange={(e) => setYard(y => ({ ...y, pricePerSign: e.target.value }))} />
                    <div className="text-xs text-muted-foreground mt-1">Suggested: ${yardSuggested.toFixed(2)}</div>
                  </div>
                  <div className="sm:col-span-3 lg:col-span-3 sm:text-left lg:text-right">
                    <div className="text-xs text-muted-foreground">Subtotal</div>
                    <div className="font-medium">${yardSubtotal.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-end border-t pt-2 mt-2">
                  <div className="text-sm text-muted-foreground mr-2">Total</div>
                  <div className="font-semibold">${yardSubtotal.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Rigid Materials */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Rigid Sign Materials (per sq ft)</CardTitle>
                <CardDescription>Per-square-foot pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rigidRows.map((row: RigidRow, idx) => {
                    const cost = toNum(row.costPerSqFt);
                    const presetKeys = Object.keys(rigidPresets) as RigidKey[];
                    const selectedPresetKey = row.presetKey ?? "";
                    const sell = selectedPresetKey ? rigidPresets[selectedPresetKey].sellPerSqFt : round4x(cost);
                    const sqft = toNum(row.sqFt);
                    const sub = sell * sqft;
                    return (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3 lg:col-span-3">
                          <Label>Preset</Label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedPresetKey}
                            onChange={(e) => {
                              const key = e.target.value as RigidKey | "";
                              const v = [...rigidRows];
                              if (key) {
                                v[idx].type = rigidPresets[key].label;
                                v[idx].costPerSqFt = rigidPresets[key].costPerSqFt.toString();
                                v[idx].presetKey = key;
                              } else {
                                v[idx].presetKey = "";
                              }
                              setRigidRows(v);
                            }}
                          >
                            <option value="">Custom</option>
                            {presetKeys.map(k => (
                              <option key={k} value={k}>{rigidPresets[k].label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Type</Label>
                          <Input value={row.type} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].type = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Cost/sq ft ($)</Label>
                          <Input type="number" step="0.01" value={row.costPerSqFt} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].costPerSqFt = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Selling/sq ft ($)</Label>
                          <Input value={sell.toString()} readOnly />
                        </div>
                        <div className="sm:col-span-3 lg:col-span-2">
                          <Label>Sq Ft</Label>
                          <Input type="number" step="0.01" value={row.sqFt} onChange={(e) => {
                            const v = [...rigidRows];
                            v[idx].sqFt = e.target.value;
                            setRigidRows(v);
                          }} />
                        </div>
                        <div className="sm:col-span-6 lg:col-span-1 sm:text-left lg:text-right">
                          <div className="text-xs text-muted-foreground">Subtotal</div>
                          <div className="font-medium">${sub.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setRigidRows(v => ([...v, { type: "", costPerSqFt: "0", sqFt: "0", presetKey: "" }]))}>Add Material</Button>
                    {rigidRows.length > 1 && (
                      <Button variant="ghost" onClick={() => setRigidRows(v => v.slice(0, -1))}>Remove Last</Button>
                    )}
                  </div>
                  <div className="flex justify-end border-t pt-2">
                    <div className="text-sm text-muted-foreground mr-2">Total</div>
                    <div className="font-semibold">${rigidSubtotal.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <Card className="shadow-medium lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-accent">Project Results</CardTitle>
              <CardDescription>Calculated pricing breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12">
                    <Label>Customer Name</Label>
                    <Input placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleDownloadPdf} variant="default">Download PDF</Button>
                </div>
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
                  <li>Vinyl/Laminate Selling Price per foot = preset selling price when a preset is selected; otherwise ceil(cost × 4)</li>
                  <li>Masking Selling Price per foot = $2.50 (cost $0.63/ft)</li>
                  <li>Labor Subtotal = rate × hours</li>
                  <li>Banners = price per foot × feet (width must be within preset)</li>
                  <li>Yard Signs = per sign price × quantity (suggested per examples)</li>
                  <li>Rigid Selling Price per sq ft = preset selling price when a preset is selected; otherwise ceil(cost × 4)</li>
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