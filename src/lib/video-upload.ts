import { adminFetch } from '@/lib/api';

/**
 * Загрузка видео товара по частям.
 *
 * Один запрос к серверу принимает не больше ~3,5 МБ тела — это предел
 * самой платформы, обойти его нельзя. Ролик с телефона легко весит
 * 50-150 МБ, поэтому режем файл на куски и шлём их по очереди: каждый
 * кусок сервер кладёт отдельным маленьким файлом в хранилище, а когда
 * пришёл последний — просит сервер собрать их в одно видео.
 *
 * Штатной многочастевой загрузки у этого хранилища нет (проверено —
 * отвечает ошибкой), поэтому сборка идёт на стороне нашей функции: она
 * скачивает все куски и складывает их в один файл одним вызовом.
 */

/*
 * Функция на сервере живёт по умолчанию 2 секунды, и каждая операция с
 * хранилищем занимает не меньше половины секунды. Кусок покрупнее рискует
 * не уложиться в укладку одного вызова и провалит всю загрузку. 1 МБ
 * проверен вживую — укладывается с запасом что при приёме куска, что при
 * его чтении обратно во время сборки.
 */
const CHUNK_SIZE = 1024 * 1024;

const readChunkAsBase64 = (chunk: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // data:*/*;base64,XXXX — нам нужна только часть после запятой
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(chunk);
  });

export interface VideoUploadResult {
  url: string;
}

/**
 * Грузит файл и возвращает адрес готового видео на CDN.
 * onProgress получает долю от 0 до 1 — для полоски загрузки в админке.
 */
export const uploadVideo = async (
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<VideoUploadResult> => {
  const init = await adminFetch('?action=video-init', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, size: file.size }),
  });
  const initData = await init.json();
  if (!init.ok || !initData.uploadId) {
    throw new Error(initData.error || 'Не удалось начать загрузку');
  }
  const { uploadId, key } = initData;

  const total = Math.ceil(file.size / CHUNK_SIZE) || 1;

  const abort = async () => {
    try {
      await adminFetch('?action=video-abort', {
        method: 'POST',
        body: JSON.stringify({ uploadId, totalParts: total }),
      });
    } catch {
      /* Чистка временных файлов — не критично, если не получилось */
    }
  };

  try {
    for (let i = 0; i < total; i++) {
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const b64 = await readChunkAsBase64(chunk);
      const res = await adminFetch('?action=video-part', {
        method: 'POST',
        body: JSON.stringify({ uploadId, index: i, chunk: b64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Не удалось загрузить часть ${i + 1}`);
      }
      onProgress?.((i + 1) / total);
    }
  } catch (e) {
    await abort();
    throw e;
  }

  const complete = await adminFetch('?action=video-complete', {
    method: 'POST',
    body: JSON.stringify({
      key,
      uploadId,
      totalParts: total,
      filename: file.name,
    }),
  });
  const completeData = await complete.json();
  if (!complete.ok || !completeData.url) {
    throw new Error(completeData.error || 'Не удалось завершить загрузку');
  }

  return { url: completeData.url };
};
