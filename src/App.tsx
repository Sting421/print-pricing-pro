import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import ScreenprintCalculator from "./pages/ScreenprintCalculator";
import EmbroideryCalculator from "./pages/EmbroideryCalculator";
import StickersCalculator from "./pages/StickersCalculator";
import MagnetsCalculator from "./pages/MagnetsCalculator";
import SignCalculator from "./pages/SignCalculator";
import StorePricing from "./pages/StorePricing";
import NotFound from "./pages/NotFound";
import PatchesCalculator from "./pages/PatchesCalculator";
import StockTracking from "./pages/StockTracking";
import TestInventory from "./pages/TestInventory";
import InventoryChecker from "./pages/InventoryChecker";
import RawInventoryDetailPage from "./pages/RawInventoryDetailPage";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main>{children}</main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/screenprint" element={<ScreenprintCalculator />} />
            <Route path="/embroidery" element={<EmbroideryCalculator />} />
            <Route path="/stickers" element={<StickersCalculator />} />
            <Route path="/magnets" element={<MagnetsCalculator />} />
            <Route path="/signs" element={<SignCalculator />} />
            <Route path="/store-pricing" element={<StorePricing />} />
            <Route path="/patches" element={<PatchesCalculator />} />
            <Route path="/stock" element={<StockTracking />} />
            <Route path="/test-inventory" element={<TestInventory />} />
            <Route path="/inventory-checker" element={<InventoryChecker />} />
            <Route path="/raw-inventory-detail" element={<RawInventoryDetailPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
