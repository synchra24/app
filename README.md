# @synchra24/app

TypeScript SDK для гибридных приложений, которые открываются внутри мобильного приложения Synchra.24 через WebView.

Пакет оборачивает native bridge Synchra и предоставляет Promise-based API для вызова возможностей приложения: запросы к разрешенным API, контекст провайдера, тема, геопозиция, выбор файлов и медиа, получение файлов из S3, QR-сканер, выбор пользователей, календарь, выбор времени, snackbar и модальное окно подтверждения.

## Установка

```bash
npm install @synchra24/app
```

```ts
import { SynchraApp } from "@synchra24/app";

const synchra = new SynchraApp("SERVICE_TOKEN");
```

`SERVICE_TOKEN` - токен внутреннего сервиса, созданный в Synchra.24. Native-приложение проверяет этот токен при каждом bridge-вызове.

## Быстрый старт

```ts
const synchra = new SynchraApp("SERVICE_TOKEN");

const integrated = await synchra.isSynchraIntegrated();

if (!integrated) {
  console.log("Приложение открыто не внутри Synchra.24 или токен невалиден.");
}

const provider = await synchra.getProviderContext();
const theme = synchra.getSynchraTheme();

await synchra.showSnackbar({
  message: `Provider ID: ${provider.provider_id}`,
  type: "success",
});

console.log(theme?.active);
console.log(theme?.current.controlPrimary);
```

## Создание клиента

```ts
const synchra = new SynchraApp(token, {
  responseTimeout: 60000,
});
```

Параметры:

- `responseTimeout` - таймаут ожидания ответа от native bridge в миллисекундах. По умолчанию `60000`.

Когда экземпляр больше не нужен, можно снять listeners и отклонить ожидающие запросы:

```ts
synchra.destroy();
```

## Ошибки

Большинство методов возвращают `Promise`. Если native-приложение вернуло ошибку, Promise будет отклонен через `Error(message)`.

```ts
try {
  const position = await synchra.getGeoPosition();
} catch (error) {
  console.error(error);
}
```

Метод `isSynchraIntegrated()` специально сделан безопасным: он возвращает `false`, если bridge недоступен или токен не прошел проверку.

## Проверка интеграции

Проверяет, что приложение открыто внутри Synchra.24 и service token валиден.

```ts
const integrated = await synchra.isSynchraIntegrated();
```

Возвращает:

```ts
boolean;
```

## Тема приложения

Synchra прокидывает цветовую тему напрямую в WebView, поэтому чтение темы не требует bridge-запроса.

```ts
const theme = synchra.getSynchraTheme();
```

Возвращает:

```ts
{
    active: 'light' | 'dark';
    current: Record<string, string>;
    themes: {
        light: Record<string, string>;
        dark: Record<string, string>;
    };
} | null
```

Подписка на изменение темы:

```ts
const unsubscribe = synchra.onSynchraThemeChange((theme) => {
  document.body.style.background = theme.current.primary;
});

unsubscribe();
```

Также доступен legacy bridge активной темы:

```ts
const activeTheme = await synchra.getThemeState();

const unsubscribeAppearance = synchra.onThemeAppearance((theme) => {
  console.log(theme);
});
```

## API-запросы

Выполняет разрешенные Open API запросы через native-приложение Synchra.

```ts
const response = await synchra.requestApi<{ parameters: { name: string } }>({
  method: "GET",
  path: "providers/parameters",
  query: {
    key: "value",
  },
});

console.log(response.result.parameters.name);
```

Payload:

```ts
{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    apiVersion?: number;
    form?: Record<string, unknown> | { name: string; value: unknown }[];
}
```

`apiVersion` позволяет вызывать не только `/api/v1`, но и другие версии API. Если передать `apiVersion: 2`, запрос уйдет на `/api/v2/...`.

`form` нужен для multipart/form-data запросов. Поскольку bridge сериализуется через `postMessage`, в `form` нужно передавать обычный JSON-совместимый объект или массив полей, а native-слой сам соберет `FormData`.

Пример multipart-запроса:

```ts
await synchra.requestApi({
  method: "POST",
  path: "reports/create",
  apiVersion: 1,
  form: {
    title: "Отчет",
    published: true,
    tags: ["daily", "shift"],
  },
});
```

## Контекст провайдера

Возвращает текущий контекст провайдера Synchra без provider token.

```ts
const provider = await synchra.getProviderContext();

console.log(provider.provider_id);
console.log(provider.profile_id);
console.log(provider.role.permissions);
console.log(provider.bucketName);
```

Provider token этим методом не возвращается.

## Выбор пользователей

Открывает native-виджет выбора пользователей.

```ts
const result = await synchra.selectUsers({
  users: [25],
  all_users: true,
});

console.log(result.users);
```

Payload:

```ts
{
    users?: number[];
    all_users?: boolean;
}
```

Возвращает:

```ts
{
    users: number[];
}
```

## Геопозиция

Запрашивает текущую геопозицию пользователя через native-приложение.

```ts
const position = await synchra.getGeoPosition();

console.log(position.latitude, position.longitude);
```

Возвращает:

```ts
{
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitude_accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}
```

## Фото с камеры

Открывает native-камеру и возвращает фото. По умолчанию файл загружается в хранилище Synchra, а в ответе приходят `file`, `bucket` и `base64`.

```ts
const photo = await synchra.takePhoto({
  use_front_camera: false,
  upload: true,
});

console.log(photo.file);
console.log(photo.bucket);
console.log(photo.base64);
```

Если нужен только `base64`, загрузку можно отключить:

```ts
const photo = await synchra.takePhoto({
  upload: false,
});

console.log(photo.file); // null
console.log(photo.bucket); // null
console.log(photo.base64);
```

Возвращает:

```ts
{
  file: string | null;
  bucket: string | null;
  base64: string;
  name: string;
  type: string;
}
```

## Фото из галереи

Открывает native-выбор фото из галереи. Формат ответа такой же, как у `takePhoto()`.

```ts
const photo = await synchra.pickPhoto({
  upload: false,
});
```

## Выбор файла

Открывает native file picker. По умолчанию файл загружается в хранилище Synchra и также возвращается в `base64`.

```ts
const file = await synchra.pickFile({
  upload: true,
});

console.log(file.file);
console.log(file.bucket);
console.log(file.base64);
console.log(file.name);
console.log(file.size);
```

Если нужен только локальный `base64`, загрузку можно отключить:

```ts
const file = await synchra.pickFile({
  upload: false,
});
```

Возвращает:

```ts
{
  file: string | null;
  bucket: string | null;
  base64: string;
  name: string;
  type: string;
  size: number;
}
```

## QR-сканер

Открывает native QR-сканер.

```ts
const qr = await synchra.scanQr();

console.log(qr.value);
console.log(qr.type);
```

Возвращает:

```ts
{
    value: string;
    type?: string;
}
```

## Получение изображения из S3

Получает файл из S3 через native-приложение. По умолчанию возвращает локальный путь `local_uri`, потому что это заметно легче для bridge и лучше подходит для больших изображений.

```ts
const image = await synchra.getS3Image({
  file: "avatar.jpg",
});

console.log(image.local_uri);
```

Если нужен именно `base64`, можно явно запросить его:

```ts
const image = await synchra.getS3Image({
  file: "avatar.jpg",
  response_type: "base64",
});
```

Возвращает:

```ts
{
  file: string;
  local_uri: string | null;
  base64: string | null;
  response_type: "local_uri" | "base64";
  source_url: string;
}
```

## Получение файла из S3

Работает так же, как получение изображения, но предназначен для любых файлов.

```ts
const file = await synchra.getS3File({
  file: "docs/report.pdf",
});

console.log(file.local_uri);
```

Для обоих S3-методов bucket снаружи не передается. Native-слой всегда берет его из `providerCardContext.bucketName` текущего провайдера.

## Выбор даты

Открывает native date picker для выбора одной даты.

```ts
const result = await synchra.selectDate({
  date: "2026-04-21",
});

console.log(result.date);
```

Возвращает:

```ts
{
  date: string | null; // YYYY-MM-DD
}
```

## Выбор диапазона дат

Открывает native date range picker.

```ts
const range = await synchra.selectDateRange({
  start_date: "2026-04-01",
  end_date: "2026-04-21",
});

console.log(range.start_date, range.end_date);
```

Возвращает:

```ts
{
  start_date: string | null;
  end_date: string | null;
}
```

## Выбор времени

Открывает native time picker.

```ts
const time = await synchra.selectTime({
  time: "09:30",
});

console.log(time.time);
console.log(time.hours);
console.log(time.minutes);
```

В payload можно передать либо `time`, либо `hours`/`minutes`.

Возвращает:

```ts
{
  time: string; // HH:mm
  hours: number;
  minutes: number;
}
```

## Snackbar

Показывает native snackbar Synchra.

```ts
await synchra.showSnackbar({
  message: "Сохранено",
  type: "success",
  timeout: 4000,
});
```

Доступные типы:

- `success`
- `error`
- `warn`
- `empty`

Возвращает:

```ts
{
  shown: boolean;
}
```

## Модальное окно

Открывает native-модальное окно Synchra с двумя кнопками.

```ts
const result = await synchra.openModal({
  title: "Подтверждение",
  text: "Продолжить действие?",
  primary_button_text: "Продолжить",
  secondary_button_text: "Отмена",
});

if (result.action === "primary") {
  // Нажата первая кнопка
}

if (result.action === "secondary") {
  // Нажата вторая кнопка
}

if (result.action === "dismiss") {
  // Окно закрыто нажатием по фону
}
```

Возвращает:

```ts
{
  action: "primary" | "secondary" | "dismiss";
}
```

## TypeScript

Пакет поставляется с декларациями TypeScript. Можно импортировать типы payload и response:

```ts
import type {
  SynchraProviderContext,
  SynchraPickedFilePayload,
  SynchraThemePayload,
} from "@synchra24/app";
```

## Запуск вне Synchra

Большинство bridge-методов требуют `window.ReactNativeWebView`. При вызове вне мобильного приложения Synchra они выбросят ошибку. Для безопасной runtime-проверки используйте `isSynchraIntegrated()`.

```ts
const integrated = await synchra.isSynchraIntegrated();

if (!integrated) {
  // Показать fallback UI для обычного браузера.
}
```

## Разработка

Установить зависимости:

```bash
npm install
```

Проверить типы:

```bash
npm run typecheck
```

Собрать пакет:

```bash
npm run build
```

Проверить состав публикации:

```bash
npm pack --dry-run
```

В npm-пакет попадают только `dist`, `README.md` и `package.json`.

## Публикация

Перед публикацией нужно убедиться, что native-приложение Synchra поддерживает те же bridge-события, что и SDK.

```bash
npm publish
```

Для публичной публикации scoped-пакета:

```bash
npm publish --access public
```
