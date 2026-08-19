import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppRoutes from './AppRoutes';
import { CartProvider } from '@/context/CartContext';
import { DealerProvider } from '@/context/DealerContext';
import { CatalogProvider, PrerenderData } from '@/context/CatalogContext';
import { clearSeo, takeSeo } from '@/lib/seo';
import { SCENARIOS } from '@/data/scenarios';
import './index.css';

export { clearSeo, takeSeo };

/** Адреса страниц «подбор по задаче» — сборщик готовит их заранее */
export const scenarioSlugs = SCENARIOS.map((s) => s.slug);

/**
 * Собирает HTML страницы во время сборки: без браузера, без запросов к сети.
 * Данные каталога передаются готовым объектом.
 */
export const render = (url: string, data: PrerenderData): string => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderToString(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StaticRouter location={url}>
          <DealerProvider>
            <CatalogProvider initialData={data}>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </CatalogProvider>
          </DealerProvider>
        </StaticRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
};