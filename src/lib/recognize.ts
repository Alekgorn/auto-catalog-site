import funcUrls from '../../backend/func2url.json';

const RECOGNIZE_URL = (funcUrls as Record<string, string>).recognize;

export interface RecognizeResult {
  brand: string;
  model: string;
  year: number | null;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

/** Уменьшает фото перед отправкой — так распознавание идёт быстрее. */
const shrink = (dataUrl: string, max = 1024): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      if (scale === 1) return resolve(dataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

export interface AiSearchResult {
  slugs: string[];
  explain: string;
  cached?: boolean;
}

/**
 * Подбор товаров по смыслу запроса. Обращается к ИИ, поэтому вызываем
 * только когда обычный поиск не справился или покупатель попросил сам.
 */
export const aiSearch = async (query: string): Promise<AiSearchResult> => {
  const res = await fetch(`${RECOGNIZE_URL}?action=search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Не удалось разобрать запрос');
  }
  return { slugs: data.slugs ?? [], explain: data.explain ?? '', cached: data.cached };
};

/** Отправляет фото салона и получает предполагаемую марку с моделью. */
export const recognizeVehicle = async (dataUrl: string): Promise<RecognizeResult> => {
  const image = await shrink(dataUrl);

  const res = await fetch(RECOGNIZE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Не удалось разобрать фото');
  }
  return data as RecognizeResult;
};