import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_URL, adminFetch, setAdminToken, getAdminToken } from "@/lib/api";
import { clearSiteCache } from "@/lib/cache";
import { FitMode } from "@/data/catalog";
import ProductEditor, {
  AdminProduct,
  emptyProduct,
} from "@/components/admin/ProductEditor";
import BrandsEditor, { AdminBrand } from "@/components/admin/BrandsEditor";
import OrdersPanel from "@/components/admin/OrdersPanel";
import DealersPanel from "@/components/admin/DealersPanel";
import GuideEditor, {
  AdminGuide,
  emptyGuide,
} from "@/components/admin/GuideEditor";
import SettingsPanel from "@/components/admin/SettingsPanel";
import SupplierPanel from "@/components/admin/SupplierPanel";
import DiagnosticsPanel from "@/components/admin/DiagnosticsPanel";
import { auditProducts } from "@/lib/data-audit";
import StoragePanel from "@/components/admin/StoragePanel";
import SitePanel from "@/components/admin/SitePanel";
import CategoriesEditor from "@/components/admin/CategoriesEditor";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs, { AdminTab } from "@/components/admin/AdminTabs";
import AdminGuidesTab from "@/components/admin/AdminGuidesTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import MissingFitPanel from "@/components/admin/MissingFitPanel";

const Admin = () => {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [tab, setTab] = useState<AdminTab>("orders");
  const [search, setSearch] = useState("");
  /** Выбранная категория в списке товаров; пустая строка — показываем все */
  const [category, setCategory] = useState("");
  const [newOrders, setNewOrders] = useState(0);
  /** Машины, под которые не собрался комплект — счётчик на вкладке */
  const [missingFits, setMissingFits] = useState(0);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [categorySpecs, setCategorySpecs] = useState<Record<string, string[]>>(
    {},
  );
  /** Умолчание «как подбирается» у каждой категории */
  const [categoryFitModes, setCategoryFitModes] = useState<
    Record<string, FitMode>
  >({});
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [editingGuide, setEditingGuide] = useState<AdminGuide | null>(null);

  const loadGuides = useCallback(async () => {
    const res = await adminFetch("?action=guides");
    if (!res.ok) return;
    const data = await res.json();
    setGuides(data.guides ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("");
      if (res.status === 401) {
        setAuthed(false);
        setAdminToken(null);
        return;
      }
      const data = await res.json();
      setProducts(data.products ?? []);
      setBrands(data.brands ?? []);
      setNewOrders(data.newOrders ?? 0);
      setMissingFits(data.missingFits ?? 0);
      await loadGuides();
      await adminFetch("?action=categories")
        .then((r) => r.json())
        .then((d) => {
          const list = (d.categories ?? []) as {
            name: string;
            specFields?: string[];
            fitMode?: FitMode;
          }[];
          setCatalogCategories(list.map((c) => c.name));
          setCategorySpecs(
            Object.fromEntries(
              list
                .filter((c) => c.specFields?.length)
                .map((c) => [c.name, c.specFields!]),
            ),
          );
          setCategoryFitModes(
            Object.fromEntries(
              list.map((c) => [c.name, c.fitMode ?? 'universal']),
            ),
          );
        })
        .catch(() => undefined);
    } finally {
      setLoading(false);
    }
  }, [loadGuides]);

  const saveGuide = async (guide: AdminGuide) => {
    const res = await adminFetch("?action=guides", {
      method: guide.id ? "PUT" : "POST",
      body: JSON.stringify(guide),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Ошибка",
        description: data.error ?? "Не удалось сохранить",
      });
      return;
    }
    toast({ title: "Инструкция сохранена", description: guide.title });
    setEditingGuide(null);
    loadGuides();
  };

  const removeGuide = async (guide: AdminGuide) => {
    if (!window.confirm(`Удалить «${guide.title}»?`)) return;
    await adminFetch(`?action=guides&id=${guide.id}`, { method: "DELETE" });
    toast({ title: "Удалено" });
    loadGuides();
  };

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setChecking(false);
      return;
    }
    adminFetch("?action=check")
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          return load();
        }
        setAdminToken(null);
        return undefined;
      })
      .catch(() => setAdminToken(null))
      .finally(() => setChecking(false));
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch(`${ADMIN_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error ?? "Не удалось войти");
      return;
    }
    setAdminToken(data.token);
    setAuthed(true);
    setPassword("");
    load();
  };

  const logout = async () => {
    await adminFetch("?action=logout", { method: "GET" }).catch(
      () => undefined,
    );
    setAdminToken(null);
    setAuthed(false);
  };

  /**
   * Сброс сохранённой копии сайта. Каталог держится в браузере 10 минут,
   * поэтому после правок посетитель какое-то время видит старую версию.
   */
  const resetCache = () => {
    clearSiteCache();
    toast({
      title: "Кеш сайта очищен",
      description: "Открываю сайт заново — изменения уже видны",
    });
    setTimeout(() => {
      window.open("/?fresh=" + Date.now(), "_blank", "noopener");
    }, 600);
  };

  const save = async (product: AdminProduct) => {
    const res = await adminFetch("", {
      method: product.id ? "PUT" : "POST",
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Ошибка",
        description: data.error ?? "Не удалось сохранить",
      });
      return;
    }
    toast({ title: "Сохранено", description: product.name });
    setEditing(null);
    load();
  };

  const remove = async (product: AdminProduct) => {
    if (!window.confirm(`Удалить «${product.name}»?`)) return;
    const res = await adminFetch(`?id=${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Ошибка", description: "Не удалось удалить" });
      return;
    }
    toast({ title: "Удалено", description: product.name });
    load();
  };

  const toggleActive = async (product: AdminProduct) => {
    await save({ ...product, isActive: !product.isActive });
  };

  /**
   * Копия товара — заготовка для похожей позиции.
   *
   * Ничего не сохраняем сразу: открываем редактор с заполненными полями,
   * чтобы человек поправил название и цену и сам решил, сохранять ли.
   * Артикул и адрес не переносим — они должны быть свои, сервер выдаст
   * новые. Копия создаётся скрытой: пока её не доделали, ей нечего
   * делать на сайте.
   */
  const duplicate = (product: AdminProduct) => {
    const { id: _id, slug: _slug, sku: _sku, ...rest } = product;
    setEditing({
      ...rest,
      name: `${product.name} — копия`,
      isActive: false,
    });
    toast({
      title: "Копия готова",
      description: "Поменяйте название и цену, затем сохраните",
    });
  };

  const saveBrands = async (next: AdminBrand[]) => {
    const res = await adminFetch("?action=brands", {
      method: "PUT",
      body: JSON.stringify({ brands: next }),
    });
    if (!res.ok) {
      toast({ title: "Ошибка", description: "Не удалось сохранить марки" });
      return;
    }
    toast({ title: "Марки сохранены" });
    load();
  };

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        return `${p.name} ${p.category} ${p.sku ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [products, search, category],
  );

  /** Сколько товаров в каждой категории — цифры на кнопках отбора */
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [products]);

  // Сменили вкладку, поиск или категорию — выделение больше не относится к тому, что на экране
  useEffect(() => {
    setSelected([]);
  }, [tab, search, category]);

  const visibleIds = filtered
    .map((p) => p.id)
    .filter((id): id is number => !!id);
  const allChecked =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someChecked = visibleIds.some((id) => selected.includes(id));

  const toggleOne = (id?: number) => {
    if (!id) return;
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  };

  const bulk = async (payload: Record<string, unknown>, done: string) => {
    setBulkBusy(true);
    const res = await adminFetch("?action=bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selected, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    setBulkBusy(false);
    if (!res.ok) {
      toast({ title: "Ошибка", description: data.error ?? "Не получилось" });
      return;
    }
    toast({
      title: done,
      description: `Товаров: ${data.affected ?? selected.length}`,
    });
    setSelected([]);
    load();
  };

  const bulkDelete = () => {
    if (
      !window.confirm(
        `Удалить ${selected.length} товаров? Отменить будет нельзя.`,
      )
    )
      return;
    bulk({ op: "delete" }, "Товары удалены");
  };

  // Справочник категорий; категория старого товара тоже остаётся в списке
  const categories = useMemo(() => {
    const set = [...catalogCategories];
    products.forEach((p) => {
      if (p.category && !set.includes(p.category)) set.push(p.category);
    });
    return set;
  }, [products, catalogCategories]);

  /**
   * Сколько товаров с ошибками совместимости — цифра на вкладке.
   * Считаем по тем же правилам, что и сама панель: марка или модель,
   * которых нет в справочнике.
   */
  const fitsIssues = useMemo(() => {
    if (!brands.length) return 0;
    return products.filter((p) => {
      if (!p.isActive) return false;
      return Object.entries(p.fits ?? {}).some(([brand, models]) => {
        if (!Array.isArray(models)) return false;
        const ref = brands.find((b) => b.name === brand);
        if (!ref) return true;
        return models.some((m) => !ref.models.includes(m));
      });
    }).length;
  }, [products, brands]);

  /**
   * Карточки с расхождениями в данных — цифра на вкладке.
   * Считает та же проверка, что и сама панель.
   */
  const dataIssues = useMemo(
    () => auditProducts(products, true).length,
    [products],
  );

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Проверяем доступ…
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        password={password}
        onPasswordChange={setPassword}
        loginError={loginError}
        onSubmit={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onResetCache={resetCache} onLogout={logout} />

      <main className="section-pad pb-20">
        <AdminTabs
          tab={tab}
          onChange={setTab}
          newOrders={newOrders}
          productsCount={products.length}
          guidesCount={guides.length}
          brandsCount={brands.length}
          categoriesCount={categories.length}
          fitsIssues={fitsIssues}
          missingFits={missingFits}
          dataIssues={dataIssues}
        />

        {tab === "orders" && <OrdersPanel />}


        {tab === "dealers" && <DealersPanel />}

        {tab === "guides" && (
          <AdminGuidesTab
            guides={guides}
            onCreate={() => setEditingGuide(emptyGuide())}
            onEdit={setEditingGuide}
            onRemove={removeGuide}
          />
        )}

        {tab === "brands" && (
          <BrandsEditor
            brands={brands}
            onSave={saveBrands}
            onReload={load}
          />
        )}

        {tab === "categories" && <CategoriesEditor onSaved={load} />}

        {tab === "audit" && (
          <DiagnosticsPanel
            products={products}
            brands={brands}
            onEdit={setEditing}
            dataIssues={dataIssues}
            fitsIssues={fitsIssues}
            onReload={load}
          />
        )}

        {tab === "missing-fit" && (
          <MissingFitPanel onCount={setMissingFits} />
        )}

        {tab === "site" && <SitePanel onSaved={load} />}

        {tab === "storage" && <StoragePanel />}

        {tab === "settings" && (
          <>
            <SettingsPanel onImported={load} />
            <div className="border-t border-foreground">
              <SupplierPanel categories={categories} />
            </div>
          </>
        )}

        {tab === "products" && (
          <AdminProductsTab
            search={search}
            onSearchChange={setSearch}
            onCreate={() => setEditing(emptyProduct())}
            loading={loading}
            filtered={filtered}
            allChecked={allChecked}
            someChecked={someChecked}
            selected={selected}
            onToggleAll={() =>
              setSelected(allChecked ? [] : visibleIds)
            }
            onToggleOne={toggleOne}
            onToggleActive={toggleActive}
            onEdit={setEditing}
            onRemove={remove}
            onDuplicate={duplicate}
            category={category}
            onCategoryChange={setCategory}
            categoryCounts={categoryCounts}
            totalCount={products.length}
            categories={categories}
            bulkBusy={bulkBusy}
            onBulkMove={(category) =>
              bulk({ op: "category", category }, "Товары перенесены")
            }
            onBulkVisibility={(op) =>
              bulk(
                { op },
                op === "show" ? "Показаны на сайте" : "Скрыты с сайта",
              )
            }
            onBulkDelete={bulkDelete}
            onBulkClear={() => setSelected([])}
          />
        )}
      </main>

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          categorySpecs={categorySpecs}
          categoryFitModes={categoryFitModes}
          brands={brands}
          products={products}
          onClose={() => setEditing(null)}
          onSave={save}
          onOpen={setEditing}
        />
      )}

      {editingGuide && (
        <GuideEditor
          guide={editingGuide}
          products={products}
          onClose={() => setEditingGuide(null)}
          onSave={saveGuide}
        />
      )}
    </div>
  );
};

export default Admin;