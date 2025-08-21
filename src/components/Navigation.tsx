import { Calculator, Palette, DollarSign, Sticker, Magnet, FileText, Square } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Overview", icon: FileText },
  { href: "/screenprint", label: "Screenprint", icon: Palette },
  { href: "/embroidery", label: "Embroidery", icon: Calculator },
  { href: "/stickers", label: "Stickers & Decals", icon: Sticker },
  { href: "/magnets", label: "Magnets", icon: Magnet },
  { href: "/signs", label: "Signs", icon: Square },
  { href: "/store-pricing", label: "Store Pricing", icon: DollarSign },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-card border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BC Apparel</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};