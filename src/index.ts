export type SynchraBridgeEvent =
  | "api.request"
  | "theme.state"
  | "theme.apperance"
  | "app.geo.position"
  | "app.camera.photo"
  | "app.gallery.photo"
  | "app.file.pick"
  | "app.users.select"
  | "app.calendar.date.select"
  | "app.calendar.range.select"
  | "app.time.select"
  | "app.qr.scan"
  | "app.s3.image.get"
  | "app.s3.file.get"
  | "app.navigation.open"
  | "app.snackbar.show"
  | "app.modal.open"
  | "app.provider.context"
  | "app.integration.status";

export type SynchraApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type SynchraThemeVariant = "light" | "dark";
export type SynchraSnackbarType = "warn" | "error" | "success" | "empty";
export type SynchraModalAction = "primary" | "secondary" | "dismiss";
export type SynchraS3ResponseType = "local_uri" | "base64";
export type SynchraNavigationAction =
  | "navigate"
  | "push"
  | "replace"
  | "go_back"
  | "pop_to_top";

export interface SynchraAppOptions {
  responseTimeout?: number;
}

export interface SynchraNativeResponse<T = unknown> {
  code?: number;
  result?: T;
  message?: string;
  status?: string;
}

export interface SynchraNativeMessage<TPayload = unknown, TResponse = unknown> {
  event: SynchraBridgeEvent;
  event_id?: string | number;
  request_id?: string | number;
  payload?: TPayload;
  response?: SynchraNativeResponse<TResponse>;
}

export interface SynchraSelectUsersPayload {
  users?: number[];
  all_users?: boolean;
}

export interface SynchraApiRequestPayload {
  method: SynchraApiMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  form?: Record<string, unknown> | SynchraApiFormEntry[];
  apiVersion?: number;
}

export interface SynchraApiFormEntry {
  name: string;
  value: unknown;
}

export interface SynchraGeoPositionPayload {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitude_accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface SynchraPickedPhotoPayload {
  file: string | null;
  bucket: string | null;
  base64: string;
  name: string;
  type: string;
}

export interface SynchraPickedFilePayload {
  file: string | null;
  bucket: string | null;
  local_uri: string;
  name: string;
  type: string;
  size: number;
}

export interface SynchraCalendarDatePayload {
  date?: string | null;
}

export interface SynchraCalendarRangePayload {
  start_date?: string | null;
  end_date?: string | null;
}

export interface SynchraTimePayload {
  time?: string;
  hours?: number;
  minutes?: number;
}

export interface SynchraQrScanPayload {
  value: string;
  type?: string;
}

export interface SynchraS3AssetRequestPayload {
  file: string;
  response_type?: SynchraS3ResponseType;
}

export interface SynchraS3AssetPayload {
  file: string;
  local_uri: string | null;
  base64: string | null;
  response_type: SynchraS3ResponseType;
  source_url: string;
}

export interface SynchraNavigationPayload {
  screen?: string;
  params?: Record<string, unknown>;
  action?: SynchraNavigationAction;
}

export interface SynchraNavigationResponse {
  success: boolean;
  action: SynchraNavigationAction;
  screen: string | null;
}

export interface SynchraSnackbarPayload {
  message: string;
  type?: SynchraSnackbarType;
  timeout?: number;
}

export interface SynchraModalPayload {
  title?: string;
  text: string;
  primary_button_text?: string;
  secondary_button_text?: string;
}

export interface SynchraProviderRole {
  description: string;
  id: number;
  name: string;
  parent_id: number;
  permissions: string[];
}

export interface SynchraProviderPanel {
  create_at: number;
  description: string;
  id: number;
  name: string;
}

export interface SynchraProviderUserProfile {
  blocked: boolean;
  cuid: string;
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  middle_name: string;
  phone: string;
  position: {
    division_id: number;
    division_name: string;
    position_id: number;
    position_name: string;
  };
  preview: string;
  role: SynchraProviderRole;
  salary_amount: number;
  started_work: number;
  work_end: string;
  work_mode: number[];
  work_start: string;
  work_time: number;
}

export interface SynchraProviderContext {
  open: boolean;
  provider_id: number;
  profile_id: number;
  role: SynchraProviderRole;
  panels: SynchraProviderPanel[];
  bucketName: string;
  color: string;
  user: SynchraProviderUserProfile | null;
  license_apps: string[];
  memory_limit: number;
  panels_limit: number;
  provider_license: number;
  user_id: string;
  user_limit: number;
}

export interface SynchraThemeColors {
  [key: string]: string;
}

export interface SynchraThemePayload {
  active: SynchraThemeVariant;
  current: SynchraThemeColors;
  themes: Record<SynchraThemeVariant, SynchraThemeColors>;
}

interface SynchraNativeWindow extends Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
  onNativeMessage?: (message: string) => void;
  __SYNCHRA_THEME__?: SynchraThemePayload;
}

interface SynchraWaiter<T> {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface SynchraBridgePayload {
  token?: string;
  event_id?: string;
  request_id?: string;
  [key: string]: unknown;
}

type SynchraNativeMessageSubscriber = (message: string) => void;

const nativeMessageSubscribers = new Set<SynchraNativeMessageSubscriber>();
let nativeMessageHandlerInstalled = false;

function getNativeWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window as SynchraNativeWindow;
}

function ensureNativeMessageHandler() {
  const nativeWindow = getNativeWindow();
  if (!nativeWindow || nativeMessageHandlerInstalled) {
    return;
  }

  const previousHandler = nativeWindow.onNativeMessage;

  nativeWindow.onNativeMessage = function onNativeMessage(message) {
    previousHandler?.(message);
    nativeMessageSubscribers.forEach((subscriber) => {
      subscriber(message);
    });
  };

  nativeMessageHandlerInstalled = true;
}

function getNativeError(response: SynchraNativeResponse) {
  return response.message || response.status || "native bridge error";
}

function createUniqId() {
  const randomPart = Math.random().toString(36).slice(2);
  return `${randomPart}.${Date.now()}`;
}

export class SynchraApp {
  private readonly token: string;
  private readonly responseTimeout: number;
  private readonly pending = new Map<string, SynchraWaiter<unknown>>();
  private readonly listeners = new Map<
    SynchraBridgeEvent,
    Set<(payload: unknown) => void>
  >();
  private destroyed = false;

  constructor(token: string, options: SynchraAppOptions = {}) {
    this.token = token;
    this.responseTimeout = options.responseTimeout ?? 60000;
    ensureNativeMessageHandler();
    nativeMessageSubscribers.add(this.handleNativeMessage);
  }

  destroy() {
    this.destroyed = true;
    nativeMessageSubscribers.delete(this.handleNativeMessage);
    this.pending.forEach((waiter) => {
      clearTimeout(waiter.timer);
      waiter.reject(new Error("SynchraApp instance destroyed"));
    });
    this.pending.clear();
    this.listeners.clear();
  }

  private postMessage(
    event: SynchraBridgeEvent,
    payload: SynchraBridgePayload = {}
  ) {
    const nativeWindow = getNativeWindow();

    if (!nativeWindow?.ReactNativeWebView) {
      throw new Error("ReactNativeWebView bridge is not available");
    }

    nativeWindow.ReactNativeWebView.postMessage(
      JSON.stringify({
        event,
        payload: {
          ...payload,
          token: this.token,
        },
      })
    );
  }

  private waitMessage<T>(
    eventId: string,
    timeout = this.responseTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(eventId);
        reject(new Error("response timeout"));
      }, timeout);

      this.pending.set(eventId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
    });
  }

  private requestPayload<T>(
    event: SynchraBridgeEvent,
    payload: SynchraBridgePayload = {},
    timeout?: number
  ) {
    if (this.destroyed) {
      return Promise.reject(new Error("SynchraApp instance destroyed"));
    }

    const eventId = createUniqId();
    this.postMessage(event, {
      ...payload,
      event_id: eventId,
    });

    return this.waitMessage<T>(eventId, timeout);
  }

  private handleNativeMessage = (message: string) => {
    let parsed: SynchraNativeMessage;

    try {
      parsed = JSON.parse(message) as SynchraNativeMessage;
    } catch {
      return;
    }

    const eventId = String(parsed.event_id ?? parsed.request_id ?? "");

    if (eventId && this.pending.has(eventId)) {
      const waiter = this.pending.get(eventId);
      if (!waiter) {
        return;
      }

      clearTimeout(waiter.timer);
      this.pending.delete(eventId);

      if (parsed.response && Number(parsed.response.code ?? 200) >= 400) {
        waiter.reject(new Error(getNativeError(parsed.response)));
        return;
      }

      waiter.resolve(parsed.payload ?? parsed.response);
      return;
    }

    const listeners = this.listeners.get(parsed.event);
    listeners?.forEach((listener) => {
      listener(parsed.payload);
    });
  };

  onThemeAppearance(callback: (theme: SynchraThemeVariant) => void) {
    const event: SynchraBridgeEvent = "theme.apperance";
    const listeners =
      this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    const listener = (payload: unknown) => {
      callback(payload === "dark" ? "dark" : "light");
    };

    listeners.add(listener);
    this.listeners.set(event, listeners);

    return () => {
      listeners.delete(listener);
    };
  }

  requestApi<T = Record<string, Record<string, string>>>(
    payload: SynchraApiRequestPayload
  ) {
    return this.requestPayload<SynchraNativeResponse<T> & { result: T }>(
      "api.request",
      payload as unknown as SynchraBridgePayload
    );
  }

  getThemeState() {
    return this.requestPayload<SynchraThemeVariant>("theme.state", {}, 8000);
  }

  getGeoPosition() {
    return this.requestPayload<SynchraGeoPositionPayload>("app.geo.position");
  }

  takePhoto(params?: { use_front_camera?: boolean; upload?: boolean }) {
    return this.requestPayload<SynchraPickedPhotoPayload>("app.camera.photo", {
      use_front_camera: Boolean(params?.use_front_camera),
      upload: params?.upload ?? true,
    });
  }

  pickPhoto(params?: { upload?: boolean }) {
    return this.requestPayload<SynchraPickedPhotoPayload>("app.gallery.photo", {
      upload: params?.upload ?? true,
    });
  }

  pickFile(params?: { upload?: boolean }) {
    return this.requestPayload<SynchraPickedFilePayload>("app.file.pick", {
      upload: params?.upload ?? true,
    });
  }

  selectUsers({
    users = [],
    all_users = true,
  }: SynchraSelectUsersPayload = {}) {
    return this.requestPayload<{ users: number[] }>("app.users.select", {
      users,
      all_users,
    });
  }

  selectDate(params?: SynchraCalendarDatePayload) {
    return this.requestPayload<{ date: string | null }>(
      "app.calendar.date.select",
      {
        date: params?.date,
      }
    );
  }

  selectDateRange(params?: SynchraCalendarRangePayload) {
    return this.requestPayload<{
      start_date: string | null;
      end_date: string | null;
    }>("app.calendar.range.select", {
      start_date: params?.start_date,
      end_date: params?.end_date,
    });
  }

  selectTime(params?: SynchraTimePayload) {
    return this.requestPayload<{
      time: string;
      hours: number;
      minutes: number;
    }>("app.time.select", {
      time: params?.time,
      hours: params?.hours,
      minutes: params?.minutes,
    });
  }

  scanQr() {
    return this.requestPayload<SynchraQrScanPayload>("app.qr.scan");
  }

  getS3Image(payload: SynchraS3AssetRequestPayload) {
    return this.requestPayload<SynchraS3AssetPayload>(
      "app.s3.image.get",
      payload as unknown as SynchraBridgePayload
    );
  }

  getS3File(payload: SynchraS3AssetRequestPayload) {
    return this.requestPayload<SynchraS3AssetPayload>(
      "app.s3.file.get",
      payload as unknown as SynchraBridgePayload
    );
  }

  navigate(payload: SynchraNavigationPayload) {
    return this.requestPayload<SynchraNavigationResponse>(
      "app.navigation.open",
      payload as unknown as SynchraBridgePayload
    );
  }

  showSnackbar(payload: SynchraSnackbarPayload) {
    return this.requestPayload<{ shown: boolean }>(
      "app.snackbar.show",
      payload as unknown as SynchraBridgePayload
    );
  }

  openModal(payload: SynchraModalPayload) {
    return this.requestPayload<{ action: SynchraModalAction }>(
      "app.modal.open",
      payload as unknown as SynchraBridgePayload
    );
  }

  getProviderContext() {
    return this.requestPayload<SynchraProviderContext>("app.provider.context");
  }

  async isSynchraIntegrated() {
    try {
      const response = await this.requestPayload<{ integrated: boolean }>(
        "app.integration.status",
        {},
        8000
      );
      return response.integrated === true;
    } catch {
      return false;
    }
  }

  getSynchraTheme() {
    return getNativeWindow()?.__SYNCHRA_THEME__ ?? null;
  }

  onSynchraThemeChange(callback: (theme: SynchraThemePayload) => void) {
    const nativeWindow = getNativeWindow();

    if (!nativeWindow) {
      return () => undefined;
    }

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<SynchraThemePayload>;
      callback(customEvent.detail);
    };

    nativeWindow.addEventListener("synchra.theme", listener);

    return () => {
      nativeWindow.removeEventListener("synchra.theme", listener);
    };
  }
}
