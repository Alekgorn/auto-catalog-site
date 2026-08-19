import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Product from './pages/Product';
import NotFound from './pages/NotFound';
import Guides from './pages/Guides';
import CategoryPage from './pages/CategoryPage';
import BrandPage from './pages/BrandPage';
import GuidePage from './pages/GuidePage';
import ScenarioPage from './pages/Scenario';

/**
 * Админка и поиск грузятся отдельно, по требованию.
 *
 * Покупателю, который смотрит товар, незачем скачивать панель управления
 * каталогом — это заметный кусок кода, нужный одному человеку. Остальные
 * страницы остаются обычными: они собираются заранее для поисковиков,
 * и отложенная загрузка сломала бы им готовый HTML.
 */
const Admin = lazy(() => import('./pages/Admin'));
const SearchPage = lazy(() => import('./pages/Search'));
const ComparePage = lazy(() => import('./pages/Compare'));

/** Пока грузится страница — короткая заглушка вместо пустоты */
const Loading = () => (
  <div className="section-pad py-24 text-center text-muted-foreground">
    Загружаем…
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/product/:id" element={<Product />} />
    <Route
      path="/search"
      element={
        <Suspense fallback={<Loading />}>
          <SearchPage />
        </Suspense>
      }
    />
    <Route
      path="/compare"
      element={
        <Suspense fallback={<Loading />}>
          <ComparePage />
        </Suspense>
      }
    />
    <Route path="/scenario/:slug" element={<ScenarioPage />} />
    <Route path="/catalog/:slug" element={<CategoryPage />} />
    <Route path="/brand/:slug" element={<BrandPage />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/guides/:slug" element={<GuidePage />} />
    <Route
      path="/admin"
      element={
        <Suspense fallback={<Loading />}>
          <Admin />
        </Suspense>
      }
    />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
