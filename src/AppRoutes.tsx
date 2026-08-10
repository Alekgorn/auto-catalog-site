import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Product from './pages/Product';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import Guides from './pages/Guides';
import CategoryPage from './pages/CategoryPage';
import BrandPage from './pages/BrandPage';
import GuidePage from './pages/GuidePage';
import SearchPage from './pages/Search';
import ScenarioPage from './pages/Scenario';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/product/:id" element={<Product />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/scenario/:slug" element={<ScenarioPage />} />
    <Route path="/catalog/:slug" element={<CategoryPage />} />
    <Route path="/brand/:slug" element={<BrandPage />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/guides/:slug" element={<GuidePage />} />
    <Route path="/admin" element={<Admin />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;