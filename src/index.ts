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
  | "app.integration.status"
  | "app.runtime"
  | "app.widget.context"
  | "app.service.variable.get"
  | "app.service.variable.set"
  | "app.automation.artifact.get"
  | "app.automation.artifact.set"
  | "app.automation.event.emit";

export type SynchraApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type SynchraThemeVariant = "light" | "dark";
export type SynchraSnackbarType = "warn" | "error" | "success" | "empty";
export type SynchraModalAction = "primary" | "secondary" | "dismiss";
export type SynchraS3ResponseType = "local_uri" | "base64";
export type SynchraNavigationAction =
  "navigate" | "push" | "replace" | "go_back" | "pop_to_top";

export interface SynchraAppOptions {
  responseTimeout?: number;
  /** Exact trusted Synchra origin for an external service embedded in the web app. */
  hostOrigin?: string;
}

export type SynchraRuntime = "web" | "mobile";
export interface SynchraUnsupportedWebCall {
  runtime: "web";
  supported: false;
  ignored: true;
}
export type SynchraNativeResult<T> = T | SynchraUnsupportedWebCall;
export type SynchraVariableType = "string" | "number" | "boolean" | "json";
export interface SynchraServiceVariable<T = unknown> {
  name: string;
  description: string;
  type: SynchraVariableType;
  value: T;
  is_set: boolean;
  revision: number;
  updated_at: string;
}
export interface SynchraArtifact<T = unknown> {
  name: string;
  value: T;
  version: number;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}
export type SynchraWidgetPlacement =
  | "dashboard"
  | "task"
  | "incident"
  | "document"
  | "field_visit"
  | "visit"
  | "journal"
  | "report"
  | "control_employee"
  | "control";
export interface SynchraWidgetContext<T = Record<string, unknown>> {
  version: 1;
  placement: SynchraWidgetPlacement;
  provider_id: string;
  entity: { type: string; id: string };
  data: T;
}
export type SynchraEventReceipt =
  | { event_id: string; duplicate: boolean }
  | { preview: true; accepted: false; message: string };

/** Preserves HTTP-style bridge errors, including revision conflicts (409). */
export class SynchraBridgeError extends Error {
  readonly code: number;
  readonly status?: string;
  constructor(response: SynchraNativeResponse) {
    super(response.message || response.status || "native bridge error");
    this.name = "SynchraBridgeError";
    this.code = Number(response.code);
    this.status = response.status;
  }
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
  open?: boolean;
  provider_id: number | string;
  profile_id: number;
  role: Pick<SynchraProviderRole, "permissions"> &
    Partial<Omit<SynchraProviderRole, "permissions">>;
  panels?: SynchraProviderPanel[];
  bucketName?: string;
  color?: string;
  user?: SynchraProviderUserProfile | null;
  license_apps?: string[];
  memory_limit?: number;
  panels_limit?: number;
  provider_license?: number;
  user_id?: string;
  user_limit?: number;
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
  __SYNCHRA_RUNTIME__?: SynchraRuntime;
  getSynchraRuntime?: () => SynchraRuntime;
}

interface SynchraWaiter<T> {
  event: SynchraBridgeEvent;
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

const nativeMessageHubs = new WeakMap<
  SynchraNativeWindow,
  {
    subscribers: Set<SynchraNativeMessageSubscriber>;
    previous: SynchraNativeWindow["onNativeMessage"];
    handler: (message: string) => void;
  }
>();

function getNativeWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  return window as SynchraNativeWindow;
}

function subscribeNativeMessages(
  target: SynchraNativeWindow,
  subscriber: SynchraNativeMessageSubscriber,
) {
  let hub = nativeMessageHubs.get(target);
  if (!hub) {
    const previous = target.onNativeMessage;
    const subscribers = new Set<SynchraNativeMessageSubscriber>();
    const handler = (message: string) => {
      try {
        previous?.(message);
      } finally {
        subscribers.forEach((listener) => listener(message));
      }
    };
    hub = { previous, subscribers, handler };
    nativeMessageHubs.set(target, hub);
    target.onNativeMessage = handler;
  }
  hub.subscribers.add(subscriber);
  const subscribedHub = hub;
  return () => {
    subscribedHub.subscribers.delete(subscriber);
    if (!subscribedHub.subscribers.size) {
      if (target.onNativeMessage === subscribedHub.handler)
        target.onNativeMessage = subscribedHub.previous;
      nativeMessageHubs.delete(target);
    }
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function jsonValue(value: unknown, limit: number): unknown {
  const raw = JSON.stringify(value);
  if (raw === undefined || new TextEncoder().encode(raw).length > limit)
    throw new Error(`Value must be JSON of at most ${limit} bytes`);
  return JSON.parse(raw) as unknown;
}
function variableName(name: string) {
  if (typeof name !== "string" || !/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(name))
    throw new Error("variable name is not valid");
}
function artifactName(name: string) {
  if (
    typeof name !== "string" ||
    !/^[A-Za-z][A-Za-z0-9_.-]{0,127}$/.test(name.trim())
  )
    throw new Error("artifact name is not valid");
  return name.trim();
}

function createUniqId() {
  const randomPart = Math.random().toString(36).slice(2);
  return `${randomPart}.${Date.now()}`;
}

export class SynchraApp {
  private readonly token: string;
  private readonly responseTimeout: number;
  private readonly nativeWindow = getNativeWindow();
  private readonly hostOrigin?: string;
  private readonly cleanups = new Set<() => void>();
  private readonly variables = new Map<string, SynchraServiceVariable>();
  private variablesReady = false;
  private variablesLoading?: Promise<void>;
  private webTheme: SynchraThemePayload | null = null;
  private readonly themeListeners = new Set<
    (theme: SynchraThemePayload) => void
  >();
  private readonly pending = new Map<string, SynchraWaiter<unknown>>();
  private readonly listeners = new Map<
    SynchraBridgeEvent,
    Set<(payload: unknown) => void>
  >();
  private destroyed = false;

  constructor(token: string, options: SynchraAppOptions = {}) {
    this.token = token;
    this.responseTimeout = options.responseTimeout ?? 60000;
    if (options.hostOrigin !== undefined) {
      const url = new URL(options.hostOrigin);
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.origin !== options.hostOrigin
      )
        throw new Error("hostOrigin must be an exact HTTP(S) origin");
      this.hostOrigin = url.origin;
    }
    if (this.nativeWindow) {
      if (this.hostOrigin) {
        this.nativeWindow.addEventListener("message", this.handleHostMessage);
        this.cleanups.add(() =>
          this.nativeWindow?.removeEventListener(
            "message",
            this.handleHostMessage,
          ),
        );
      } else {
        this.cleanups.add(
          subscribeNativeMessages(this.nativeWindow, this.handleNativeMessage),
        );
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.clear();
    this.themeListeners.clear();
    this.variables.clear();
    this.pending.forEach((waiter) => {
      clearTimeout(waiter.timer);
      waiter.reject(new Error("SynchraApp instance destroyed"));
    });
    this.pending.clear();
    this.listeners.clear();
  }

  private postMessage(
    event: SynchraBridgeEvent,
    payload: SynchraBridgePayload = {},
  ) {
    const nativeWindow = this.nativeWindow;

    if (this.hostOrigin) {
      if (!nativeWindow || nativeWindow.parent === nativeWindow)
        throw new Error("Synchra web host is not available");
      nativeWindow.parent.postMessage(
        {
          synchraHosted: true,
          message: JSON.stringify({
            event,
            payload: { ...payload, token: this.token },
          }),
        },
        this.hostOrigin,
      );
      return;
    }

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
      }),
    );
  }

  private requestPayload<T>(
    event: SynchraBridgeEvent,
    payload: SynchraBridgePayload = {},
    timeout = this.responseTimeout,
  ): Promise<T> {
    if (this.destroyed)
      return Promise.reject(new Error("SynchraApp instance destroyed"));
    const eventId = createUniqId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(eventId);
        reject(new Error("response timeout"));
      }, timeout);

      this.pending.set(eventId, {
        event,
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });
      try {
        // Register first: in-process web hosts may reply synchronously.
        this.postMessage(event, { ...payload, event_id: eventId });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(eventId);
        reject(error);
      }
    });
  }

  private requestNativePayload<T>(
    event: SynchraBridgeEvent,
    payload: SynchraBridgePayload = {},
  ) {
    return this.requestPayload<SynchraNativeResult<T>>(event, payload);
  }

  private handleHostMessage = (event: MessageEvent) => {
    if (
      event.source !== this.nativeWindow?.parent ||
      event.origin !== this.hostOrigin
    )
      return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.synchraHostedTheme) {
      this.webTheme = clone(data.synchraHostedTheme as SynchraThemePayload);
      this.themeListeners.forEach((listener) =>
        listener(clone(this.webTheme!)),
      );
    }
    if (
      data.synchraHostedReply &&
      data.message &&
      typeof data.message === "object"
    )
      this.handleNativeMessage(JSON.stringify(data.message));
  };

  private handleNativeMessage = (message: string) => {
    let parsed: SynchraNativeMessage;

    try {
      parsed = JSON.parse(message) as SynchraNativeMessage;
    } catch {
      return;
    }
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.event !== "string"
    )
      return;

    const eventId = String(parsed.event_id ?? parsed.request_id ?? "");

    if (eventId && this.pending.has(eventId)) {
      const waiter = this.pending.get(eventId);
      if (!waiter || waiter.event !== parsed.event) {
        return;
      }

      clearTimeout(waiter.timer);
      this.pending.delete(eventId);

      if (parsed.response && Number(parsed.response.code ?? 200) >= 400) {
        waiter.reject(new SynchraBridgeError(parsed.response));
        return;
      }

      waiter.resolve(
        Object.prototype.hasOwnProperty.call(parsed, "payload")
          ? parsed.payload
          : parsed.response,
      );
      return;
    }

    // Replies for another client (or an expired request) are not subscriptions.
    if (eventId) return;
    const listeners = this.listeners.get(parsed.event);
    listeners?.forEach((listener) => {
      listener(parsed.payload);
    });
  };

  onThemeAppearance(callback: (theme: SynchraThemeVariant) => void) {
    if (this.destroyed) return () => undefined;
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
    payload: SynchraApiRequestPayload,
  ) {
    return this.requestPayload<SynchraNativeResponse<T> & { result: T }>(
      "api.request",
      payload as unknown as SynchraBridgePayload,
    );
  }

  /** Environment detection is not an authorization or integration check. */
  getRuntime(): SynchraRuntime {
    const runtime =
      this.nativeWindow?.__SYNCHRA_RUNTIME__ ??
      this.nativeWindow?.getSynchraRuntime?.();
    if (runtime === "mobile" || runtime === "web") return runtime;
    return this.hostOrigin || !this.nativeWindow?.ReactNativeWebView
      ? "web"
      : "mobile";
  }

  getWidgetContext<T = Record<string, unknown>>() {
    return this.requestPayload<SynchraWidgetContext<T> | null>(
      "app.widget.context",
    );
  }

  onWidgetContextChange<T = Record<string, unknown>>(
    callback: (context: SynchraWidgetContext<T> | null) => void,
  ) {
    if (this.destroyed) return () => undefined;
    const event = "app.widget.context";
    const listeners =
      this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    const listener = (payload: unknown) =>
      callback(
        payload == null ? null : (clone(payload) as SynchraWidgetContext<T>),
      );
    if (!this.destroyed) listeners.add(listener);
    this.listeners.set(event, listeners);
    return () => {
      listeners.delete(listener);
    };
  }

  /** Explicit preload for external clients; hosted services preload their provided client automatically. */
  loadVariables(): Promise<void> {
    if (this.destroyed)
      return Promise.reject(new Error("SynchraApp instance destroyed"));
    if (this.variablesReady) return Promise.resolve();
    if (this.variablesLoading) return this.variablesLoading;
    this.variablesLoading = this.requestPayload<{
      items: SynchraServiceVariable[];
    }>("app.service.variable.get")
      .then((result) => {
        if (this.destroyed) throw new Error("SynchraApp instance destroyed");
        if (!Array.isArray(result?.items))
          throw new Error("service variables response is not valid");
        // Validate the complete snapshot before changing the cache.
        const items = result.items.map((item) => this.checkedVariable(item));
        for (const item of items) this.cacheVariable(item);
        this.variablesReady = true;
      })
      .finally(() => {
        this.variablesLoading = undefined;
      });
    return this.variablesLoading;
  }

  private checkedVariable(
    item: SynchraServiceVariable,
  ): SynchraServiceVariable {
    if (!item || typeof item !== "object")
      throw new Error("service variable response is not valid");
    variableName(item.name);
    if (
      !["string", "number", "boolean", "json"].includes(item.type) ||
      typeof item.is_set !== "boolean" ||
      !Number.isSafeInteger(item.revision) ||
      item.revision < 1
    )
      throw new Error("service variable response is not valid");
    return clone(item);
  }

  private cacheVariable(item: SynchraServiceVariable) {
    if (this.destroyed) return;
    const previous = this.variables.get(item.name);
    if (!previous || item.revision >= previous.revision)
      this.variables.set(item.name, clone(item));
  }

  getVariableInfo<T = unknown>(name: string): SynchraServiceVariable<T> {
    variableName(name);
    if (this.destroyed) throw new Error("SynchraApp instance destroyed");
    if (!this.variablesReady)
      throw new Error(
        "service variables are not loaded; await loadVariables() first",
      );
    const item = this.variables.get(name);
    if (!item) throw new Error(`variable not found: ${name}`);
    return clone(item) as SynchraServiceVariable<T>;
  }

  getVariable<T = unknown>(name: string): T | undefined {
    const item = this.getVariableInfo<T>(name);
    return item.is_set ? item.value : undefined;
  }

  async setVariable<T = unknown>(
    name: string,
    value: T,
    options: { revision?: number } = {},
  ): Promise<SynchraServiceVariable<T>> {
    variableName(name);
    const json = jsonValue(value, 65536);
    if (
      options.revision !== undefined &&
      (!Number.isSafeInteger(options.revision) || options.revision < 1)
    )
      throw new Error("variable revision is not valid");
    const item = this.checkedVariable(
      await this.requestPayload<SynchraServiceVariable>(
        "app.service.variable.set",
        { name, value: json, revision: options.revision },
      ),
    );
    if (item.name !== name)
      throw new Error("service variable response name does not match");
    this.cacheVariable(item);
    return clone(item) as SynchraServiceVariable<T>;
  }

  async getArtifact<T = unknown>(name: string): Promise<SynchraArtifact<T>> {
    return this.requestPayload("app.automation.artifact.get", {
      name: artifactName(name),
    });
  }

  /** Replaces an existing artifact; does not create a missing name. */
  async setArtifact<T = unknown>(
    name: string,
    value: T,
  ): Promise<SynchraArtifact<T>> {
    return this.requestPayload("app.automation.artifact.set", {
      name: artifactName(name),
      value: jsonValue(value, 1048576),
    });
  }

  async emitEvent(
    name: string,
    payload: Record<string, unknown> = {},
    options: { requestKey?: string } = {},
  ): Promise<SynchraEventReceipt> {
    if (this.getRuntime() === "mobile")
      throw new Error(
        "Custom service events are currently supported only in web",
      );
    if (typeof name !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(name))
      throw new Error("event name is not valid");
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new Error("event payload must be an object");
    const data = jsonValue(payload, 32768);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("event payload must be a JSON object");
    const requestKey =
      options.requestKey ??
      globalThis.crypto?.randomUUID?.() ??
      `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2).padEnd(16, "0")}`;
    if (
      typeof requestKey !== "string" ||
      !/^[A-Za-z0-9_-]{16,128}$/.test(requestKey)
    )
      throw new Error(
        "event requestKey must be 16–128 letters, digits, underscores or hyphens",
      );
    return this.requestPayload("app.automation.event.emit", {
      name,
      data,
      request_key: requestKey,
    });
  }

  getThemeState() {
    return this.requestPayload<SynchraThemeVariant>("theme.state", {}, 8000);
  }

  getGeoPosition() {
    return this.requestNativePayload<SynchraGeoPositionPayload>(
      "app.geo.position",
    );
  }

  takePhoto(params?: { use_front_camera?: boolean; upload?: boolean }) {
    return this.requestNativePayload<SynchraPickedPhotoPayload>(
      "app.camera.photo",
      {
        use_front_camera: Boolean(params?.use_front_camera),
        upload: params?.upload ?? true,
      },
    );
  }

  pickPhoto(params?: { upload?: boolean }) {
    return this.requestNativePayload<SynchraPickedPhotoPayload>(
      "app.gallery.photo",
      {
        upload: params?.upload ?? true,
      },
    );
  }

  pickFile(params?: { upload?: boolean }) {
    return this.requestNativePayload<SynchraPickedFilePayload>(
      "app.file.pick",
      {
        upload: params?.upload ?? true,
      },
    );
  }

  selectUsers({
    users = [],
    all_users = true,
  }: SynchraSelectUsersPayload = {}) {
    return this.requestNativePayload<{ users: number[] }>("app.users.select", {
      users,
      all_users,
    });
  }

  selectDate(params?: SynchraCalendarDatePayload) {
    return this.requestNativePayload<{ date: string | null }>(
      "app.calendar.date.select",
      {
        date: params?.date,
      },
    );
  }

  selectDateRange(params?: SynchraCalendarRangePayload) {
    return this.requestNativePayload<{
      start_date: string | null;
      end_date: string | null;
    }>("app.calendar.range.select", {
      start_date: params?.start_date,
      end_date: params?.end_date,
    });
  }

  selectTime(params?: SynchraTimePayload) {
    return this.requestNativePayload<{
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
    return this.requestNativePayload<SynchraQrScanPayload>("app.qr.scan");
  }

  getS3Image(payload: SynchraS3AssetRequestPayload) {
    return this.requestNativePayload<SynchraS3AssetPayload>(
      "app.s3.image.get",
      payload as unknown as SynchraBridgePayload,
    );
  }

  getS3File(payload: SynchraS3AssetRequestPayload) {
    return this.requestNativePayload<SynchraS3AssetPayload>(
      "app.s3.file.get",
      payload as unknown as SynchraBridgePayload,
    );
  }

  navigate(payload: SynchraNavigationPayload) {
    return this.requestNativePayload<SynchraNavigationResponse>(
      "app.navigation.open",
      payload as unknown as SynchraBridgePayload,
    );
  }

  showSnackbar(payload: SynchraSnackbarPayload) {
    return this.requestNativePayload<{ shown: boolean }>(
      "app.snackbar.show",
      payload as unknown as SynchraBridgePayload,
    );
  }

  openModal(payload: SynchraModalPayload) {
    return this.requestNativePayload<{ action: SynchraModalAction }>(
      "app.modal.open",
      payload as unknown as SynchraBridgePayload,
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
        8000,
      );
      return response.integrated === true;
    } catch {
      return false;
    }
  }

  getSynchraTheme() {
    const theme = this.hostOrigin
      ? this.webTheme
      : this.nativeWindow?.__SYNCHRA_THEME__;
    return theme ? clone(theme) : null;
  }

  onSynchraThemeChange(callback: (theme: SynchraThemePayload) => void) {
    const nativeWindow = this.nativeWindow;

    if (!nativeWindow || this.destroyed) {
      return () => undefined;
    }

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<SynchraThemePayload>;
      callback(clone(customEvent.detail));
    };

    if (this.hostOrigin) this.themeListeners.add(callback);
    else nativeWindow.addEventListener("synchra.theme", listener);
    const unsubscribe = () => {
      nativeWindow.removeEventListener("synchra.theme", listener);
      this.themeListeners.delete(callback);
      this.cleanups.delete(unsubscribe);
    };
    this.cleanups.add(unsubscribe);
    return unsubscribe;
  }
}
