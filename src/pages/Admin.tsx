import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_URL, adminFetch, setAdminToken, getAdminToken } from "@/lib/api";
import { clearSiteCache } from "@/lib/cache";
import { formatPrice } from "@/data/catalog";
import ProductEditor, {
  AdminProduct,
  emptyProduct,
} from "@/components/admin/ProductEditor";
import BrandsEditor, { AdminBrand } from "@/components/admin/BrandsEditor";
import OrdersPanel from "@/components/admin/OrdersPanel";
import DealersPanel from "@/components/admin/DealersPanel";
import QueriesPanel from "@/components/admin/QueriesPanel";
import GuideEditor, {
  AdminGuide,
  emptyGuide,
} from "@/components/admin/GuideEditor";
import SettingsPanel from "@/components/admin/SettingsPanel";
import SitePanel from "@/components/admin/SitePanel";
import CategoriesEditor from "@/components/admin/CategoriesEditor";
import BulkBar from "@/components/admin/BulkBar";

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
  const [tab, setTab] = useState<
    | "products"
    | "guides"
    | "orders"
    | "queries"
    | "dealers"
    | "brands"
    | "categories"
    | "site"
    | "settings"
  >("orders");
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
      <div className="flex min-h-screen items-center justify-center section-pad">
        <form
          onSubmit={login}
          className="w-full max-w-sm border border-foreground"
        >
          <div className="border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
              Штатно
            </div>
            <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
              Управление каталогом
            </div>
          </div>
          <div className="px-6 py-7">
            <label className="eyebrow" htmlFor="pwd">
              Пароль
            </label>
            <input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-border bg-transparent py-3 font-head text-lg font-medium outline-none transition-colors focus:border-primary"
              placeholder="••••••••"
            />
            {loginError && (
              <div className="mt-3 text-[0.8rem] text-primary">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="mt-7 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Войти
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-foreground bg-background section-pad">
        <div className="flex h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-3 font-head text-xl font-bold uppercase tracking-[-0.02em]">
            <span className="block h-4 w-4 flex-none bg-primary" />
            Админка
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={resetCache}
              title="Убрать сохранённую копию каталога и открыть сайт заново"
              className="flex items-center gap-2 border border-foreground px-4 py-2 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="RefreshCw" size={15} />
              Обновить сайт
            </button>
            <a
              href="/"
              className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
            >
              На сайт
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="section-pad pb-20">
        <div className="flex flex-wrap gap-8 border-b border-border py-5">
          {(
            [
              [
                "orders",
                newOrders > 0 ? `Заявки (${newOrders} новых)` : "Заявки",
              ],
              ["products", `Товары (${products.length})`],
              ["guides", `Инструкции (${guides.length})`],
              ["brands", `Марки (${brands.length})`],
              ["categories", `Категории (${categories.length})`],
              ["queries", "Запросы"],
              ["dealers", "Дилеры"],
              ["site", "Сайт"],
              ["settings", "Настройки"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`border-b-2 pb-2 text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" && <OrdersPanel />}

        {tab === "queries" && <QueriesPanel />}

        {tab === "dealers" && <DealersPanel />}

        {tab === "guides" && (
          <>
            <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[42em] text-muted-foreground">
                Технические описания установки с фото. Каждую инструкцию можно
                привязать к товарам — она покажется прямо в карточке товара.
              </p>
              <button
                onClick={() => setEditingGuide(emptyGuide())}
                className="flex flex-none items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="Plus" size={16} />
                Новая инструкция
              </button>
            </div>

            {guides.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                Инструкций пока нет
              </div>
            ) : (
              <div className="border-t border-foreground">
                {guides.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-wrap items-center gap-4 border-b border-border py-4"
                  >
                    {g.cover ? (
                      <img
                        src={g.cover}
                        alt=""
                        className="h-14 w-20 flex-none bg-card object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 flex-none items-center justify-center bg-card text-muted-foreground">
                        <Icon name="BookOpen" size={18} />
                      </div>
                    )}
                    <div className="min-w-[200px] flex-1">
                      <div className="font-head text-[1rem] font-medium leading-tight">
                        {g.title}
                      </div>
                      <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {g.blocks?.length ?? 0} блоков ·{" "}
                        {g.productIds?.length ?? 0} товаров
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] ${
                        g.isActive
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {g.isActive ? "На сайте" : "Скрыта"}
                    </span>
                    <button
                      onClick={() => setEditingGuide(g)}
                      className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => removeGuide(g)}
                      aria-label="Удалить"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="Trash2" size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "brands" && (
          <BrandsEditor brands={brands} onSave={saveBrands} onReload={load} />
        )}

        {tab === "categories" && <CategoriesEditor onSaved={load} />}

        {tab === "site" && <SitePanel onSaved={load} categories={categories} />}

        {tab === "settings" && <SettingsPanel onImported={load} />}

        {tab === "products" && (
          <>
            <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или категории"
                className="w-full max-w-sm border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
              />
              <button
                onClick={() => setEditing(emptyProduct())}
                className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="Plus" size={16} />
                Добавить товар
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-muted-foreground">
                Загружаем…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                Товаров не найдено
              </div>
            ) : (
              <div className="border-t border-foreground">
                <label className="flex cursor-pointer items-center gap-4 border-b border-border py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked && !allChecked;
                    }}
                    onChange={() =>
                      setSelected(
                        allChecked
                          ? []
                          : filtered
                              .map((p) => p.id)
                              .filter((id): id is number => !!id),
                      )
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
                    {allChecked
                      ? "Снять выделение"
                      : `Выбрать все — ${filtered.length}`}
                  </span>
                </label>

                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-4 border-b border-border py-4"
                  >
                    <input
                      type="checkbox"
                      checked={!!p.id && selected.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Выбрать ${p.name}`}
                      className="h-4 w-4 flex-none cursor-pointer accent-primary"
                    />
                    <img
                      src={p.images?.[0] ?? ""}
                      alt=""
                      className="h-14 w-14 flex-none bg-card object-contain p-1"
                    />
                    <div className="min-w-[200px] flex-1">
                      <div className="font-head text-[1rem] font-medium leading-tight">
                        {p.name}
                      </div>
                      <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {p.sku || "—"} · {p.category} ·{" "}
                        {Object.keys(p.fits ?? {}).length} марок
                      </div>
                    </div>
                    <div className="font-head text-lg font-bold">
                      {formatPrice(p.price)}
                    </div>
                    <button
                      onClick={() => toggleActive(p)}
                      className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
                        p.isActive
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {p.isActive ? "На сайте" : "Скрыт"}
                    </button>
                    <button
                      onClick={() => setEditing(p)}
                      className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => remove(p)}
                      aria-label="Удалить"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="Trash2" size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <BulkBar
              count={selected.length}
              categories={categories}
              busy={bulkBusy}
              onMove={(category) =>
                bulk({ op: "category", category }, "Товары перенесены")
              }
              onVisibility={(op) =>
                bulk(
                  { op },
                  op === "show" ? "Показаны на сайте" : "Скрыты с сайта",
                )
              }
              onDelete={bulkDelete}
              onClear={() => setSelected([])}
            />
          </>
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