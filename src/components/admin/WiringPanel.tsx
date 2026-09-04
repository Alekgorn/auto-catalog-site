import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Scope = 'hot' | 'kit' | 'all';

const SCOPES: { id: Scope; label: string; hint: string }[] = [
  {
    id: 'hot',
    label: 'Только важные',
    hint: 'Машины, где дешёвая и дорогая проводка сильно расходятся в цене — там и теряются заказы',
  },
  {
    id: 'kit',
    label: 'Где собирается комплект',
    hint: 'Есть и рамка, и проводка — магнитоле есть куда встать',
  },
  {
    id: 'all',
    label: 'Все машины',
    hint: 'Весь справочник, включая те, под которые нет товаров',
  },
];

interface Result {
  wires: number;
  cars: number;
  problems: string[];
}

/**
 * Разметка подбора проводки через Excel.
 *
 * Заполнять полторы тысячи моделей руками никто не станет, поэтому файл
 * выгружается уже отсортированным: сверху машины с самым большим разрывом
 * цен между дешёвым переходником и полноценным интерфейсом. Можно пройти
 * первые полсотни строк и закрыть основную часть потерянных сделок,
 * а остальное доразметить когда-нибудь потом.
 */
interface Props {
  /** Внутри общего раздела диагностики — свой заголовок не нужен */
  bare?: boolean;
}

const WiringPanel = ({ bare }: Props = {}) => {
  const { toast } = useToast();
  const [scope, setScope] = useState<Scope>('hot');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFile = async () => {
    setBusy(true);
    setResult(null);
    const res = await adminFetch(`?action=wiring-xlsx&scope=${scope}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.file) {
      toast({ title: 'Ошибка', description: 'Не удалось собрать файл' });
      return;
    }
    const bytes = Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0));
    download(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `podbor-provodki-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast({
      title: 'Файл готов',
      description: 'Откройте в Excel — начинайте с верхних строк',
    });
  };

  const importFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.readAsDataURL(file);
      });
      const res = await adminFetch('?action=wiring-import', {
        method: 'POST',
        body: JSON.stringify({ file: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось загрузить' });
        return;
      }
      setResult(data as Result);
      toast({
        title: 'Загружено',
        description: `Проводок: ${data.wires}, машин: ${data.cars}`,
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {!bare && (
          <div className="font-head text-lg font-bold uppercase tracking-tight">
            Подбор проводки
          </div>
        )}
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Файл на два листа: у проводок отмечаете, с чем они работают и какие
          штатные функции сохраняют; у машин — известна проводка точно или
          нужно уточнять. Заполняйте сколько успеете, пустые строки
          пропускаются.
        </p>
      </div>

      <div className="border border-border p-5">
        <div className="eyebrow mb-3">Какие машины включить в файл</div>
        <div className="space-y-2">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${
                scope === s.id
                  ? 'border-foreground bg-secondary/50'
                  : 'border-border hover:border-foreground'
              }`}
            >
              <Icon
                name={scope === s.id ? 'CircleCheck' : 'Circle'}
                size={17}
                className={`mt-0.5 shrink-0 ${
                  scope === s.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span>
                <span className="font-head text-[0.8rem] font-semibold uppercase tracking-[0.06em]">
                  {s.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {s.hint}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={exportFile}
            disabled={busy}
            className="flex items-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-background transition-opacity disabled:opacity-50"
          >
            <Icon name="Download" size={16} />
            {busy ? 'Готовим…' : 'Скачать файл'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 border border-foreground px-5 py-2.5 font-head text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            <Icon name="Upload" size={16} />
            Загрузить заполненный
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
            }}
          />
        </div>
      </div>

      {result && (
        <div className="border border-border p-5">
          <div className="font-head text-sm font-bold uppercase tracking-tight">
            Что загрузилось
          </div>
          <div className="mt-3 flex flex-wrap gap-6">
            <div>
              <div className="font-head text-2xl font-bold">{result.wires}</div>
              <div className="text-sm text-muted-foreground">проводок</div>
            </div>
            <div>
              <div className="font-head text-2xl font-bold">{result.cars}</div>
              <div className="text-sm text-muted-foreground">машин</div>
            </div>
          </div>

          {result.problems?.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-primary">
                <Icon name="TriangleAlert" size={16} />
                <span className="font-head text-[0.8rem] font-semibold uppercase tracking-[0.06em]">
                  Строки с ошибками — их не взяли
                </span>
              </div>
              <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm text-muted-foreground">
                {result.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WiringPanel;
