import { Link } from "react-router-dom";
import { Calculator, Palette, DollarSign, Sticker, Magnet, FileText, ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const calculatorServices = [
  {
    title: "Screenprint Calculator",
    description: "Calculate pricing for screenprinting with ink costs, screens, and garment pricing",
    icon: Palette,
    href: "/screenprint",
    features: ["Freckles & Customer Supplied", "Up to 6 colors", "Ink price tables", "Royalty calculations"]
  },
  {
    title: "Embroidery Calculator", 
    description: "Price embroidery services with stitch counts and location-based pricing",
    icon: Calculator,
    href: "/embroidery", 
    features: ["Up to 3 locations", "Puff embroidery", "Stitch-based pricing", "Customer/Freckles rates"]
  },
  {
    title: "Stickers & Decals",
    description: "Calculate material usage and pricing for vinyl stickers and decals",
    icon: Sticker,
    href: "/stickers",
    features: ["52\" max width", "Lamination options", "Cutting services", "Material optimization"]
  },
  {
    title: "Patches Calculator",
    description: "UV-printed patches with heat application, markup, and artwork fees",
    icon: BadgeCheck,
    href: "/patches",
    features: ["Leather/Faux/Sublimated", "+$3 heat option", "Artwork fees", "Per-item pricing"]
  },
  {
    title: "Store Pricing",
    description: "Calculate store pricing with royalties and markup calculations",
    icon: DollarSign,
    href: "/store-pricing",
    features: ["Multiple royalties", "Markup calculations", "Revenue tracking", "Profit analysis"]
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-strong">
                <Calculator className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Print Pricing <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pro</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Professional pricing calculators for screenprinting, embroidery, stickers, and more. 
              Get accurate quotes with detailed breakdowns and material optimization.
            </p>
            <Button variant="gradient" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/screenprint">
                Start Calculating <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Professional Pricing Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive calculators designed for print shops and businesses to ensure accurate pricing and profitability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calculatorServices.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.href} className="group hover:shadow-strong transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                    <Link to={service.href}>
                      Open Calculator <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Accurate Calculations</h3>
              <p className="text-muted-foreground">Precise pricing based on industry standards and material costs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Detailed Breakdowns</h3>
              <p className="text-muted-foreground">See exactly how your pricing is calculated with itemized costs</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Profit Optimization</h3>
              <p className="text-muted-foreground">Built-in royalty and markup calculations to ensure profitability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
