import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_URL, adminFetch, setAdminToken, getAdminToken } from "@/lib/api";
import { clearSiteCache } from "@/lib/cache";
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
import SitePanel from "@/components/admin/SitePanel";
import CategoriesEditor from "@/components/admin/CategoriesEditor";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs, { AdminTab } from "@/components/admin/AdminTabs";
import AdminGuidesTab from "@/components/admin/AdminGuidesTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";

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
  const [newOrders, setNewOrders] = useState(0);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [categorySpecs, setCategorySpecs] = useState<Record<string, string[]>>(
    {},
  );
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
      await loadGuides();
      await adminFetch("?action=categories")
        .then((r) => r.json())
        .then((d) => {
          const list = (d.categories ?? []) as {
            name: string;
            specFields?: string[];
          }[];
          setCatalogCategories(list.map((c) => c.name));
          setCategorySpecs(
            Object.fromEntries(
              list
                .filter((c) => c.specFields?.length)
                .map((c) => [c.name, c.specFields!]),
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
      products.filter((p) =>
        `${p.name} ${p.category} ${p.sku ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [products, search],
  );

  // Сменили вкладку или поиск — выделение больше не относится к тому, что на экране
  useEffect(() => {
    setSelected([]);
  }, [tab, search]);

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
          <BrandsEditor brands={brands} onSave={saveBrands} onReload={load} />
        )}

        {tab === "categories" && <CategoriesEditor onSaved={load} />}

        {tab === "site" && <SitePanel onSaved={load} />}

        {tab === "settings" && <SettingsPanel onImported={load} />}

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
          brands={brands}
          onClose={() => setEditing(null)}
          onSave={save}
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
