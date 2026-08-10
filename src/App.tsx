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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CatalogProvider>
          <DealerProvider>
          <CartProvider>
            <AppRoutes />
            <CartDrawer />
            <QuickViewHost />
          </CartProvider>
          </DealerProvider>
        </CatalogProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
