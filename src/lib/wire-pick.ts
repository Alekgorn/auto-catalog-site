import { Product, Vehicle, BodyType, isCompatible } from '@/data/catalog';

/** Что покупатель ответил про своё авто. undefined — ещё не спрашивали */
export interface WireAnswers {
  amp?: boolean | null;
  camera?: boolean | null;
  can?: boolean | null;
  body?: BodyType | null;
}

/** Вопрос, который стоит задать: без него варианты не различить */
export interface WireQuestion {
  id: 'amp' | 'camera' | 'can' | 'body';
  title: string;
  hint: string;
  /** Для кузова — из чего выбирать (у машины их обычно два) */
  bodies?: BodyType[];
}

/** Настройка подбора для машины — из вкладки «Марки» */
export interface VehicleWiring {
  brand: string;
  model: string;
  years: [number, number];
  mode: 'fixed' | 'select';
  wireSlug: string;
  ask: Record<string, boolean>;
  /** Сторона руля машины. Пусто — бывают оба варианта */
  wheel?: '' | 'left' | 'right';
  /** Кузова этого поколения. Пусто — любой */
  bodies?: BodyType[];
  /** Почему выбрана эта проводка — показываем покупателю */
  reason?: string;
}

/** Настройка для конкретной машины: марка, модель и попадание в годы */
export const findWiring = (
  list: VehicleWiring[],
  vehicle: Vehicle | null,
): VehicleWiring | null => {
  if (!vehicle) return null;
  return (
    list.find(
      (v) =>
        v.brand.toLowerCase() === vehicle.brand.toLowerCase() &&
        v.model.toLowerCase() === vehicle.model.toLowerCase() &&
        vehicle.year >= v.years[0] &&
        vehicle.year <= v.years[1],
    ) ?? null
  );
};

export interface WirePick {
  /** Полностью размеченные варианты: их показываем по-новому */
  full: Product[];
  /** Что теряется у бюджетных вариантов */
  budget: Product[];
  /** Ещё не различённые — нужен ответ */
  question: WireQuestion | null;
  /** Размеченных данных не хватает — показываем старый список */
  fallback: boolean;
}

/** Товар размечен, если у него проставлен уровень совместимости */
export const isMarked = (p: Product): boolean => !!p.wireLevel;

const QUESTIONS: Record<string, { title: string; hint: string }> = {
  camera: {
    title: 'На машине есть штатная камера заднего вида?',
    hint: 'Камера в ручке багажника или под эмблемой — картинка выводится на штатный экран при задней передаче.',
  },
  amp: {
    title: 'В машине премиум-аудиосистема?',
    hint: 'На динамиках или магнитоле есть логотип JBL, Bose, Harman/Kardon — значит стоит штатный усилитель.',
  },
  can: {
    title: 'Работают ли кнопки на руле и бортовой компьютер?',
    hint: 'Если руль управляет магнитолой, а на панели есть бортовой компьютер — в машине есть CAN-шина.',
  },
};

/**
 * Кузов, который выдала выбранная рамка.
 *
 * Рамку человек выбирает раньше проводки, и она привязана к панели —
 * а панель у хэтчбека и седана разная. Значит по рамке кузов уже известен,
 * и спрашивать о нём второй раз незачем.
 */
export const bodyFromFrame = (frame?: Product | null): BodyType | null => {
  const list = frame?.wireBodies || [];
  return list.length === 1 ? list[0] : null;
};

/** Подходит ли проводка машине по кузову */
const bodyOk = (p: Product, body?: BodyType | null): boolean => {
  const list = p.wireBodies || [];
  if (!list.length) return true;
  if (!body) return true;
  return list.includes(body);
};

/** Руль: товар без пометки подходит любому */
const wheelOk = (p: Product, wheel?: '' | 'left' | 'right' | null): boolean =>
  !p.wireWheel || !wheel || p.wireWheel === wheel;

/** Сверяем ответ покупателя с требованием проводки */
const techOk = (p: Product, key: string, answer?: boolean | null): boolean => {
  const need = (p.wireTech || {})[key];
  if (!need || need === 'any') return true;
  // Не спросили — не отсеиваем: решать будем после ответа
  if (answer === undefined || answer === null) return true;
  return need === (answer ? 'yes' : 'no');
};

/**
 * Различает ли параметр оставшиеся варианты. Спрашивать про то, что
 * ничего не меняет, — верный способ потерять покупателя.
 */
const splits = (items: Product[], key: string): boolean => {
  const vals = new Set(
    items.map((p) => (p.wireTech || {})[key] || 'any').filter((v) => v !== 'any'),
  );
  return vals.size > 1;
};

const bodySplits = (items: Product[]): BodyType[] => {
  const all = new Set<BodyType>();
  let limited = false;
  items.forEach((p) => {
    const list = p.wireBodies || [];
    if (list.length) {
      limited = true;
      list.forEach((b) => all.add(b));
    }
  });
  // Ограничение есть не у всех — значит кузов реально делит выбор
  return limited && items.some((p) => !(p.wireBodies || []).length)
    ? [...all]
    : all.size > 1
      ? [...all]
      : [];
};

/**
 * Подбор проводки по разметке.
 *
 * Работает только на размеченных товарах. Пока их нет — возвращаем
 * fallback, и покупатель видит привычный список: лучше старый вид, чем
 * пустой шаг. Так разметку можно вести постепенно, а результат виден
 * сразу на тех машинах, до которых руки уже дошли.
 */
export const pickWires = (
  products: Product[],
  vehicle: Vehicle | null,
  answers: WireAnswers,
  modelBodies: BodyType[] = [],
  wiring: VehicleWiring | null = null,
  frame?: Product | null,
): WirePick => {
  const empty: WirePick = {
    full: [],
    budget: [],
    question: null,
    fallback: true,
  };
  if (!vehicle) return empty;

  // Руль машины отсекает часть проводок независимо от прочего
  const fits = products.filter(
    (p) => isCompatible(p, vehicle) && wheelOk(p, wiring?.wheel),
  );

  /*
   * Машина помечена как «фиксированная» — проводка известна точно.
   * Спрашивать про усилитель и CAN-шину незачем: решение уже принято
   * человеком, который разбирается. Каждый лишний вопрос теряет покупателя.
   */
  if (wiring?.mode === 'fixed' && wiring.wireSlug) {
    const one = fits.find((p) => p.id === wiring.wireSlug);
    if (one) {
      return {
        full: [one],
        budget: fits.filter((p) => p.id !== one.id && isMarked(p)),
        question: null,
        fallback: false,
      };
    }
  }

  const marked = fits.filter(isMarked);
  // Ни одного размеченного варианта — показывать нечего, отдаём старый список
  if (!marked.length) return empty;

  /*
   * Кузов берём из трёх мест по убыванию точности: ответ покупателя,
   * настройка поколения (Civic после 2011 — только седан) и выбранная
   * рамка. Знаем хоть откуда — вопрос не задаём.
   */
  const generationBody =
    wiring?.bodies?.length === 1 ? wiring.bodies[0] : null;
  const knownBody = answers.body ?? generationBody ?? bodyFromFrame(frame);

  let left = marked.filter(
    (p) =>
      bodyOk(p, knownBody) &&
      techOk(p, 'amp', answers.amp) &&
      techOk(p, 'camera', answers.camera) &&
      techOk(p, 'can', answers.can),
  );
  if (!left.length) left = marked;

  // Кузов спрашиваем первым: его покупатель знает точно, в отличие от
  // усилителя и CAN-шины
  const allowed = wiring?.bodies?.length ? wiring.bodies : modelBodies;
  const bodies = bodySplits(left).filter(
    (b) => !allowed.length || allowed.includes(b),
  );
  let question: WireQuestion | null = null;
  if (bodies.length > 1 && !knownBody) {
    question = {
      id: 'body',
      title: 'Какой у вас кузов?',
      hint: 'От кузова зависит форма штатного разъёма — проводки разные.',
      bodies,
    };
  } else {
    const next = (['camera', 'amp', 'can'] as const).find(
      (k) =>
        answers[k] === undefined &&
        splits(left, k) &&
        // Режим «Подбор»: спрашиваем только про то, что отмечено в админке
        (wiring?.mode !== 'select' || !!wiring.ask?.[k]),
    );
    if (next) question = { id: next, ...QUESTIONS[next] };
  }

  const full = left.filter((p) => p.wireLevel === 'full');
  const budget = left.filter((p) => p.wireLevel && p.wireLevel !== 'full');

  return {
    full: full.sort((a, b) => a.price - b.price),
    budget: budget.sort((a, b) => a.price - b.price),
    question,
    fallback: false,
  };
};

/** Что сохраняет проводка — человеческими словами, для карточки */
export const KEEP_LABELS: Record<string, string> = {
  climate: 'Климат-контроль на экране',
  wheel: 'Кнопки на руле',
  camera: 'Штатная камера',
  amp: 'Штатный усилитель',
  parktronic: 'Парктроники',
};
