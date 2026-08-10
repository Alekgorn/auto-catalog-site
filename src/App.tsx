import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { CartProvider } from '@/context/CartContext';
import { DealerProvider } from '@/context/DealerContext';
import { CatalogProvider } from '@/context/CatalogContext';
import CartDrawer from '@/components/CartDrawer';
import QuickViewHost from '@/components/QuickViewHost';
import DealerToggle from '@/components/DealerToggle';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DealerProvider>
          <CatalogProvider>
            <CartProvider>
              <AppRoutes />
              <CartDrawer />
              <QuickViewHost />
              <DealerToggle />
            </CartProvider>
          </CatalogProvider>
        </DealerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
