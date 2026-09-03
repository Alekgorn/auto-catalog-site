import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import { MockFixed, MockAsk } from '@/components/kit/KitWiringMock';

/**
 * Макет блока «Подключение» для шага 3 сборки комплекта.
 *
 * Страница нужна только чтобы показать, как поведёт себя блок в двух
 * ситуациях — фиксированная проводка и уточняющий вопрос. Движка подбора
 * за макетом нет: данные вписаны руками, кнопки переключают состояния.
 * Как решим по виду — логика приедет отдельно, а страница уйдёт.
 */
const MockWiring = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="section-pad py-10">
      <div className="mx-auto max-w-3xl">
        <SectionHead
          index="00"
          eyebrow="Макет для обсуждения"
          title="Блок «Подключение»"
          note="Так выглядит третий шаг сборки после доработки. Слева — машина с известной проводкой, ниже — машина, где нужен один вопрос. Кнопки живые, можно потыкать."
        />

        <div className="mt-10 space-y-3">
          <div className="font-head text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Вариант 1 · Honda Civic 2006 — проводка известна точно
          </div>
          <MockFixed />
          <p className="text-sm text-muted-foreground">
            Вопросов нет: система сразу показывает нужный интерфейс. Бюджетный
            вариант спрятан за строкой — кто ищет дешевле, тот развернёт и
            увидит предупреждение про климат.
          </p>
        </div>

        <div className="mt-14 space-y-3">
          <div className="font-head text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Вариант 2 · Kia Rio 2016 — нужен один вопрос
          </div>
          <MockAsk />
          <p className="text-sm text-muted-foreground">
            Вопрос задаётся прямо в блоке, без всплывающих окон. Ответ «не
            знаю» ведёт к фото, а не к списку из восьми проводок.
          </p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default MockWiring;
