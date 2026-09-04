import {
  Product,
  Vehicle,
  BodyType,
  WireFeature,
  isCompatible,
} from '@/data/catalog';

/**
 * Что покупатель ответил про своё авто. Ключи — id признаков из
 * справочника плюс кузов. undefined значит «ещё не спрашивали».
 */
export interface WireAnswers {
  body?: BodyType | null;
  [feature: string]: boolean | BodyType | null | undefined;
}

/** Вопрос, который стоит задать: без него варианты не различить */
export interface WireQuestion {
  id: string;
  title: string;
  hint: string;
  /**
   * Короткое имя для свёрнутой строки: «камера», «кнопки на руле».
   * Полный вопрос туда не влезает, а понимать, что ты ответил, надо.
   */
  short: string;
  /** Для кузова — из чего выбирать (у машины их обычно два) */
  bodies?: BodyType[];
}

/** Настройка подбора для машины — из вкладки «Марки» */
export interface VehicleWiring {
  /** Номер строки в базе. Нет — строка ещё не сохранена */
  id?: number;
  brand: string;
  model: string;
  years: [number, number];
  /**
   * Устарело. Режим «Жёстко» назначал проводку в обход каталога и
   * конфликтовал с привязкой к рамке — подбор его больше не читает.
   * Поле оставлено, чтобы старые записи открывались без ошибок.
   */
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
/** Все настройки, подходящие машине по марке, модели и году */
export const matchingWirings = (
  list: VehicleWiring[],
  vehicle: Vehicle | null,
): VehicleWiring[] => {
  if (!vehicle) return [];
  return list.filter(
    (v) =>
      v.brand.toLowerCase() === vehicle.brand.toLowerCase() &&
      v.model.toLowerCase() === vehicle.model.toLowerCase() &&
      vehicle.year >= v.years[0] &&
      vehicle.year <= v.years[1],
  );
};

/**
 * Настройка для машины с учётом того, что известно про кузов.
 *
 * На один период у модели бывает несколько строк: Civic 2006–2011 хэтчбек
 * идёт на дорогой интерфейс, а тот же период без уточнения кузова — на
 * обычный переходник. Пока кузов неизвестен, выбирать между ними нельзя:
 * возьмём первую попавшуюся — и покажем дорогую проводку владельцу седана.
 *
 * Поэтому: знаем кузов — берём строку под него, иначе самую общую (без
 * ограничений). А спросить кузов должен вызывающий код.
 */
export const findWiring = (
  list: VehicleWiring[],
  vehicle: Vehicle | null,
  body?: BodyType | null,
): VehicleWiring | null => {
  const all = matchingWirings(list, vehicle);
  if (!all.length) return null;
  if (all.length === 1) return all[0];

  if (body) {
    const exact = all.find((v) => (v.bodies || []).includes(body));
    if (exact) return exact;
  }

  /*
   * Переходный год: 2011-й попадает и в период 2006–2011, и в 2011–2017,
   * потому что рамки продаются с такими годами и подгонять их нельзя.
   * Берём строку старшего периода — рестайлинг обычно выходит в начале
   * года, и машина этого года чаще уже новая. Но выбор неоднозначен, и
   * покупателю об этом говорим отдельно: см. transitionalYear.
   */
  const newest = [...all].sort((a, b) => b.years[0] - a.years[0]);
  const general = newest.filter((v) => !(v.bodies || []).length);
  return general[0] ?? newest[0];
};

/**
 * Год попал на стык двух периодов разметки.
 *
 * Такое бывает по-честному: рамка «2006–2011» и рамка «2011–2017» обе
 * реально продаются под машину 2011 года. Значит подходить может и
 * проводка старого образца, и нового — угадать по году нельзя, и
 * покупателя надо предупредить.
 */
export const transitionalYear = (
  list: VehicleWiring[],
  vehicle: Vehicle | null,
): boolean => {
  const all = matchingWirings(list, vehicle);
  if (all.length < 2) return false;
  // Разные периоды, а не два уточнения одного и того же (кузов, руль)
  return new Set(all.map((v) => `${v.years[0]}-${v.years[1]}`)).size > 1;
};

/** Кузова, которые различают настройки — по ним и спрашиваем покупателя */
export const wiringBodyChoice = (
  list: VehicleWiring[],
  vehicle: Vehicle | null,
): BodyType[] => {
  const all = matchingWirings(list, vehicle);
  if (all.length < 2) return [];
  const set = new Set<BodyType>();
  all.forEach((v) => (v.bodies || []).forEach((b) => set.add(b)));
  return set.size > 0 ? [...set] : [];
};

export interface WirePick {
  /**
   * Как показывать результат:
   * fixed — проводка известна точно, остальное прячем в «другие варианты»;
   * select — точного ответа нет, честно показываем все подходящие.
   */
  pickMode: 'fixed' | 'select';
  /** Полностью размеченные варианты: их показываем по-новому */
  full: Product[];
  /** Что теряется у бюджетных вариантов */
  budget: Product[];
  /** Ещё не различённые — нужен ответ */
  question: WireQuestion | null;
  /**
   * Все вопросы, которые вообще имеет смысл задать по этой машине —
   * сразу, а не по одному. Цепочка «ответил — появился следующий»
   * скрывала, сколько осталось: человек не понимал, где конец.
   */
  questions: WireQuestion[];
  /** Размеченных данных не хватает — показываем старый список */
  fallback: boolean;
}

/** Товар размечен, если у него проставлен уровень совместимости */
export const isMarked = (p: Product): boolean =>
  !!(p.wireFeatures || []).length;

/*
 * Подсказки к вопросам. Для привычных признаков текст выверен и живёт
 * здесь; для новых, добавленных в справочнике, вопрос собирается из
 * названия — «В машине есть штатный усилитель?».
 */
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

/** Текст вопроса: выверенный для знакомых признаков, иначе из названия */
const questionFor = (
  f: WireFeature,
): { title: string; hint: string; short: string } => ({
  short: f.label.toLowerCase(),
  ...(QUESTIONS[f.id] ?? {
    title: `В машине есть «${f.label.toLowerCase()}»?`,
    hint: 'От этого зависит, какая проводка подойдёт.',
  }),
});

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

/**
 * Порядок рекомендации: сначала то, что есть на складе, внутри — от
 * дешёвого к дорогому. Советовать позицию под заказ, когда рядом лежит
 * такая же в наличии, значит задержать отправку заказа на недели.
 * Нет в наличии ничего — просто самая дешёвая идёт первой.
 */
export const byStockThenPrice = (a: Product, b: Product): number => {
  const av = (a.stock ?? 0) > 0 ? 0 : 1;
  const bv = (b.stock ?? 0) > 0 ? 0 : 1;
  return av !== bv ? av - bv : a.price - b.price;
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

/**
 * Сверяем ответ покупателя с тем, что проводка подключает.
 *
 * «Да, камера есть» — нужна проводка с этой галочкой, иначе картинки не
 * будет. «Нет» — подходит простая: проводка под камеру физически встанет
 * и на машину без неё, но покупатель переплатит за то, чем не
 * пользуется. Поэтому точное совпадение идёт в рекомендации, а остальное
 * не выбрасываем — прячем под пометку «может не подойти».
 *
 * «Не знаю» (null) не отсеивает ничего: гадать за человека нельзя.
 *
 * Товар без единого признака не отсеиваем никогда. Пустой список
 * означает «ещё не заполнили», а не «не умеет ничего» — иначе, пока
 * каталог размечается, покупатель видит вместо своей проводки пустоту.
 */
const featureOk = (
  p: Product,
  key: string,
  answer?: boolean | BodyType | null,
): boolean => {
  if (answer === undefined || answer === null) return true;
  if (!(p.wireFeatures || []).length) return true;
  const has = (p.wireFeatures || []).includes(key);
  return answer === true ? has : !has;
};

/**
 * Различает ли признак оставшиеся варианты. Спрашивать про то, что
 * ничего не меняет, — верный способ потерять покупателя.
 */
const splits = (items: Product[], key: string): boolean => {
  const has = items.some((p) => (p.wireFeatures || []).includes(key));
  const hasNot = items.some((p) => !(p.wireFeatures || []).includes(key));
  return has && hasNot;
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
  /** Справочник признаков из настроек — какие вопросы вообще возможны */
  features: WireFeature[] = [],
): WirePick => {
  // Спрашиваем только о том, что отмечено «спрашивать» в настройках
  const asked = features.filter((f) => f.ask);
  const empty: WirePick = {
    pickMode: 'select',
    full: [],
    budget: [],
    question: null,
    questions: [],
    fallback: true,
  };
  if (!vehicle) return empty;

  // Руль машины отсекает часть проводок независимо от прочего
  const fits = products.filter(
    (p) => isCompatible(p, vehicle) && wheelOk(p, wiring?.wheel),
  );

  /*
   * Проводки, отмеченные прямо на выбранной рамке.
   *
   * Это самый точный источник: рамка привязана к конкретной панели, а
   * человек её уже выбрал — значит и модель, и годы, и тип панели нам
   * известны без единого вопроса. Поэтому такой список бьёт и разметку
   * по годам, и общий подбор по каталогу.
   *
   * Одна проводка — показываем её и молчим. Несколько — отсеиваем по
   * ответам про усилитель, камеру и CAN-шину, как и раньше.
   */
  const fromFrame = frame?.frameWires?.length
    ? products.filter((p) => frame.frameWires?.includes(p.id))
    : [];

  if (fromFrame.length === 1) {
    return {
      pickMode: 'fixed',
      full: fromFrame,
      budget: [],
      question: null,
      questions: [],
      fallback: false,
    };
  }

  if (fromFrame.length > 1) {
    const byPrice = byStockThenPrice;

    /*
     * Требования покупателя: «да» на вопрос — проводка обязана это
     * подключать. Отвечать на все вопросы необязательно, считаем по тем,
     * что уже заданы.
     */
    const fits2 = fromFrame.filter((p) =>
      asked.every((f) => featureOk(p, f.id, answers[f.id])),
    );

    /* Все вопросы, которые различают эти проводки. Показываем их разом:
       по одному человек не видит, сколько осталось до конца */
    const list = asked
      .filter((f) => splits(fromFrame, f.id))
      .map((f) => ({ id: f.id, ...questionFor(f) }));
    const next = list.find((f) => answers[f.id] === undefined);

    /*
     * Вопрос ещё есть — показываем всё, что подходит машине, и ничего не
     * советуем: советовать до ответа значит гадать.
     *
     * Скрывать список до ответа нельзя. Вопросы задаются не всегда и не
     * всем, а человек, пришедший за конкретной проводкой, должен видеть
     * её сразу — иначе решит, что на его машину у нас ничего нет.
     */
    if (next) {
      return {
        pickMode: 'select',
        full: [...fromFrame].sort(byPrice),
        budget: [],
        question: next,
        questions: list,
        fallback: false,
      };
    }

    /*
     * Вопросы кончились — надо посоветовать, а не вываливать список.
     *
     * Подходящие идут наверх, самая дешёвая из них — рекомендация.
     * Остальные прячем в «другие варианты»: сказавшему «камера есть»
     * проводка без камеры технически подойдёт, но камера работать не
     * будет, и молча ставить её рядом как равную — обман.
     *
     * Ответ «нет» ничего не отсекает: проводка, которая умеет больше,
     * работает и на простой машине. Она просто окажется ниже по цене.
     */
    const good = fits2.length ? fits2 : fromFrame;
    const rest = fromFrame.filter((p) => !good.includes(p));


    /* Всегда «рекомендуем», даже когда подходят обе: человек ответил на
       вопросы и ждёт ответа, а не списка равных вариантов. Первой идёт
       самая дешёвая подходящая */
    return {
      pickMode: 'fixed',
      full: [...good].sort(byPrice),
      budget: [...rest].sort(byPrice),
      question: null,
      questions: list,
      fallback: false,
    };
  }

  /*
   * Раньше здесь оставались только размеченные проводки, а остальные
   * выбрасывались. Пока каталог размечен на несколько позиций из
   * четырёхсот, это означало пустой экран на большинстве машин: товар
   * есть, подходит, но «признаки не заполнены» — и покупатель его не
   * видит.
   *
   * Теперь берём всё, что подходит машине. Разметка только уточняет
   * порядок и позволяет задать вопросы, но никогда не сокращает список.
   */
  const marked = fits;
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
      asked.every((f) => featureOk(p, f.id, answers[f.id])),
  );
  if (!left.length) left = marked;

  // Кузов спрашиваем первым: его покупатель знает точно, в отличие от
  // усилителя и CAN-шины
  const allowed = wiring?.bodies?.length ? wiring.bodies : modelBodies;
  const bodies = bodySplits(left).filter(
    (b) => !allowed.length || allowed.includes(b),
  );
  /* Полный список вопросов по этой машине. Кузов идёт первым: его
     покупатель знает точно, в отличие от усилителя и CAN-шины */
  const questions: WireQuestion[] = [];
  if (bodies.length > 1 && !knownBody) {
    questions.push({
      id: 'body',
      title: 'Какой у вас кузов?',
      hint: 'От кузова зависит форма штатного разъёма — проводки разные.',
      short: 'кузов',
      bodies,
    });
  }
  asked.forEach((f) => {
    if (
      splits(left, f.id) &&
      // Режим «Подбор»: спрашиваем только про то, что отмечено в админке
      (wiring?.mode !== 'select' || !!wiring.ask?.[f.id])
    )
      questions.push({ id: f.id, ...questionFor(f) });
  });

  const question =
    questions.find((q) => answers[q.id] === undefined) ?? null;

  /*
   * Вопросы ещё остались — задаём их, но список показываем сразу.
   *
   * Прятать товары до ответов мы пробовали: логика была в том, что
   * человек не должен выбирать наугад из десятка похожих коробок. На
   * деле выходило хуже — пустой экран читается как «на вашу машину
   * ничего нет», и человек уходит, не дойдя до вопросов. Пусть видит
   * всё, что подходит, а ответы сузят выбор.
   */
  if (question) {
    return {
      pickMode: 'select',
      full: [...marked.filter((p) => bodyOk(p, knownBody))].sort(
        byStockThenPrice,
      ),
      budget: [],
      question,
      questions,
      fallback: false,
    };
  }

  /*
   * Ответы получены — делим на «подходит» и «может не подойти».
   *
   * Второе не выбрасываем: у человека могла быть нестандартная
   * комплектация или он ошибся в ответе. Но и рядом как равные ставить
   * нельзя — прячем под кнопку с честной пометкой.
   */
  const base = marked.filter((p) => bodyOk(p, knownBody));
  const rest = base.filter((p) => !left.includes(p));

  return {
    pickMode: 'fixed',
    full: [...left].sort(byStockThenPrice),
    budget: [...rest].sort(byStockThenPrice),
    question: null,
    questions,
    fallback: false,
  };
};

/** Что сохраняет проводка — человеческими словами, для карточки */
