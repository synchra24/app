import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SynchraApp, SynchraBridgeError } from "../dist/index.js";

const clients = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.destroy());
  delete globalThis.window;
});
function client(token = "service-a", options) {
  const value = new SynchraApp(token, { responseTimeout: 100, ...options });
  clients.push(value);
  return value;
}
function native(handler, runtime = "mobile") {
  const target = new EventTarget();
  target.__SYNCHRA_RUNTIME__ = runtime;
  target.ReactNativeWebView = {
    postMessage(raw) {
      const message = JSON.parse(raw);
      handler(message, (payload, response) =>
        target.onNativeMessage(
          JSON.stringify({
            event: message.event,
            event_id: message.payload.event_id,
            ...(response ? { response } : { payload }),
          }),
        ),
      );
    },
  };
  globalThis.window = target;
  return target;
}
const variable = (
  name = "settings",
  value = { enabled: true },
  revision = 1,
  is_set = true,
) => ({
  name,
  value,
  revision,
  is_set,
  type: "json",
  description: "settings",
  updated_at: "2026-10-25T10:00:00Z",
});
function external(handler) {
  const target = new EventTarget();
  const parent = {
    postMessage(message, origin) {
      handler(message, origin);
    },
  };
  target.parent = parent;
  globalThis.window = target;
  const dispatch = (
    data,
    { origin = "https://app.synchra24.com", source = parent } = {},
  ) => {
    const event = new Event("message");
    Object.assign(event, { data, origin, source });
    target.dispatchEvent(event);
  };
  return { target, parent, dispatch };
}

test("synchronous native replies are registered before sending; preserves native API envelopes", async () => {
  native((message, reply) => {
    assert.equal(message.payload.token, "service-a");
    reply(undefined, { code: 200, result: { ok: true } });
  });
  const api = client();
  assert.deepEqual(await api.requestApi({ method: "GET", path: "example" }), {
    code: 200,
    result: { ok: true },
  });
});

test("missing transport rejects asynchronously, and integration check safely returns false", async () => {
  const api = client();
  assert.equal(api.getRuntime(), "web");
  await assert.rejects(api.getProviderContext(), /bridge is not available/);
  assert.equal(await api.isSynchraIntegrated(), false);
});

test("runtime uses host signal rather than treating the web compatibility shim as mobile", () => {
  native(() => {}, "web");
  assert.equal(client().getRuntime(), "web");
  delete window.__SYNCHRA_RUNTIME__;
  assert.equal(client().getRuntime(), "mobile");
});

test("web transport pins exact destination and ignores replies from another origin or window", async () => {
  let sent;
  const host = external((message, origin) => {
    sent = { message, origin };
  });
  const api = client("service-a", { hostOrigin: "https://app.synchra24.com" });
  const pending = api.getWidgetContext();
  const request = JSON.parse(sent.message.message);
  assert.equal(sent.origin, "https://app.synchra24.com");
  assert.equal(sent.message.synchraHosted, true);
  assert.equal(request.payload.token, "service-a");
  let completed = false;
  pending.then(() => {
    completed = true;
  });
  const reply = {
    synchraHostedReply: true,
    message: {
      event: request.event,
      event_id: request.payload.event_id,
      payload: null,
    },
  };
  host.dispatch(reply, { origin: "https://attacker.example" });
  host.dispatch(reply, { source: {} });
  await Promise.resolve();
  assert.equal(completed, false);
  host.dispatch(reply);
  assert.equal(await pending, null);
});

test("hostOrigin cannot be wildcard, path, opaque origin or a top-level web transport", async () => {
  for (const hostOrigin of [
    "*",
    "null",
    "https://app.synchra24.com/path",
    "https://app.synchra24.com/",
    "file://local",
  ])
    assert.throws(() => client("service-a", { hostOrigin }));
  const target = new EventTarget();
  target.parent = target;
  globalThis.window = target;
  await assert.rejects(
    client("service-a", {
      hostOrigin: "https://app.synchra24.com",
    }).getWidgetContext(),
    /host is not available/,
  );
});

test("wrong event with a matching request id does not settle the pending call", async () => {
  native((message, reply) => {
    window.onNativeMessage(
      JSON.stringify({
        event: "theme.state",
        event_id: message.payload.event_id,
        payload: "wrong",
      }),
    );
    window.onNativeMessage("null");
    window.onNativeMessage("invalid json");
    reply({ provider_id: 108 });
  });
  assert.deepEqual(await client().getProviderContext(), { provider_id: 108 });
});

test("preload is deduplicated, synchronous getters distinguish unset and null, and copies cannot mutate cache", async () => {
  let count = 0;
  native((message, reply) => {
    count++;
    queueMicrotask(() =>
      reply({
        items: [
          variable(),
          variable("unset", null, 1, false),
          variable("empty", null),
        ],
      }),
    );
  });
  const api = client();
  assert.throws(() => api.getVariable("settings"), /not loaded/);
  await Promise.all([api.loadVariables(), api.loadVariables()]);
  await api.loadVariables();
  assert.equal(count, 1);
  const data = api.getVariable("settings");
  data.enabled = false;
  assert.deepEqual(api.getVariable("settings"), { enabled: true });
  assert.equal(api.getVariable("unset"), undefined);
  assert.equal(api.getVariable("empty"), null);
  const info = api.getVariableInfo("settings");
  info.value.enabled = false;
  assert.deepEqual(api.getVariable("settings"), { enabled: true });
  assert.throws(() => api.getVariable("missing"), /not found/);
});

test("variable caches are isolated by instance and service; failed preload can be retried", async () => {
  let fail = true;
  native((message, reply) => {
    if (message.payload.token === "bad" && fail) {
      fail = false;
      reply(undefined, { code: 503, message: "offline" });
    } else reply({ items: [variable("settings", message.payload.token)] });
  });
  const a = client("service-a"),
    b = client("service-b"),
    bad = client("bad");
  await Promise.all([a.loadVariables(), b.loadVariables()]);
  assert.equal(a.getVariable("settings"), "service-a");
  assert.equal(b.getVariable("settings"), "service-b");
  await assert.rejects(bad.loadVariables(), /offline/);
  await bad.loadVariables();
  assert.equal(bad.getVariable("settings"), "bad");
});

test("invalid preload never exposes a partially loaded snapshot", async () => {
  native((message, reply) =>
    reply({ items: [variable(), { ...variable("bad"), revision: 0 }] }),
  );
  const api = client();
  await assert.rejects(api.loadVariables(), /response is not valid/);
  assert.throws(() => api.getVariable("settings"), /not loaded/);
});

test("writes update copies; conflicts preserve cached value and expose code 409", async () => {
  native((message, reply) => {
    if (message.event.endsWith(".get")) reply({ items: [variable()] });
    else if (message.payload.revision === 1)
      reply(variable("settings", message.payload.value, 2));
    else
      reply(undefined, {
        code: 409,
        message: "revision conflict",
        status: "conflict",
      });
  });
  const api = client();
  await api.loadVariables();
  const result = await api.setVariable(
    "settings",
    { enabled: false },
    { revision: 1 },
  );
  result.value.enabled = true;
  assert.deepEqual(api.getVariable("settings"), { enabled: false });
  await assert.rejects(
    api.setVariable("settings", 5, { revision: 3 }),
    (error) => error instanceof SynchraBridgeError && error.code === 409,
  );
  assert.deepEqual(api.getVariable("settings"), { enabled: false });
});

test("out-of-order writes and a delayed preload do not overwrite newer revisions", async () => {
  const replies = [];
  native((message, reply) => {
    replies.push({ message, reply });
  });
  const api = client();
  const load = api.loadVariables();
  const old = api.setVariable("settings", "old"),
    latest = api.setVariable("settings", "latest");
  replies[2].reply(variable("settings", "latest", 3));
  await latest;
  replies[1].reply(variable("settings", "old", 2));
  await old;
  replies[0].reply({ items: [variable("settings", "initial", 1)] });
  await load;
  assert.equal(api.getVariable("settings"), "latest");
});

test("artifact methods preserve metadata, validate names and enforce UTF-8 size limits", async () => {
  const seen = [];
  native((message, reply) => {
    seen.push(message);
    reply({
      name: message.payload.name,
      value: message.payload.value ?? null,
      version: 2,
    });
  });
  const api = client();
  assert.equal(
    (await api.getArtifact(" data.settings ")).name,
    "data.settings",
  );
  assert.equal(
    (await api.setArtifact("data.settings", { enabled: true })).version,
    2,
  );
  await assert.rejects(
    api.setArtifact("data.settings", "Я".repeat(524288)),
    /1048576/,
  );
  await assert.rejects(api.getArtifact("../secret"), /name is not valid/);
  await assert.rejects(api.setArtifact("data", undefined), /JSON/);
  assert.equal(seen.length, 2);
});

test("invalid variable inputs do not send requests", async () => {
  let calls = 0;
  native(() => calls++);
  const api = client();
  for (const revision of [0, -1, 1.2, Infinity])
    await assert.rejects(
      api.setVariable("settings", {}, { revision }),
      /revision/,
    );
  const circular = {};
  circular.self = circular;
  for (const value of [undefined, 1n, circular, "Я".repeat(32768)])
    await assert.rejects(api.setVariable("settings", value));
  await assert.rejects(api.setVariable("not valid", {}), /name/);
  assert.equal(calls, 0);
});

test("events use local registered names and preserve idempotency keys and preview receipts", async () => {
  const seen = [];
  native((message, reply) => {
    seen.push(message.payload);
    reply({ event_id: "receipt-1", duplicate: seen.length > 1 });
  }, "web");
  const api = client();
  const options = { requestKey: "operation_20261025_0001" };
  assert.equal(
    (await api.emitEvent("report_ready", { qa: true }, options)).duplicate,
    false,
  );
  assert.equal(
    (await api.emitEvent("report_ready", { qa: true }, options)).duplicate,
    true,
  );
  assert.equal(seen[0].request_key, seen[1].request_key);
  assert.deepEqual(seen[0].data, { qa: true });
  await api.emitEvent("report_ready");
  assert.match(seen[2].request_key, /^[A-Za-z0-9_-]{16,128}$/);
  for (const args of [
    ["custom.service_42.report_ready", {}],
    ["report_ready", []],
    ["report_ready", { big: "Я".repeat(17000) }],
    ["report_ready", {}, { requestKey: "short" }],
  ])
    await assert.rejects(api.emitEvent(...args));
  native(
    (message, reply) =>
      reply({ preview: true, accepted: false, message: "preview" }),
    "web",
  );
  assert.equal((await client().emitEvent("report_ready")).preview, true);
});

test("mobile custom event limitation rejects without opening a bridge request", async () => {
  let calls = 0;
  native(() => calls++);
  await assert.rejects(client().emitEvent("report_ready"), /only in web/);
  assert.equal(calls, 0);
});

test("native methods retain the web ignored marker rather than fabricating successful native results", async () => {
  native(
    (message, reply) =>
      reply({ runtime: "web", supported: false, ignored: true }),
    "web",
  );
  assert.deepEqual(await client().scanQr(), {
    runtime: "web",
    supported: false,
    ignored: true,
  });
});

test("widget null and context updates, unsubscribe and destroy", async () => {
  const target = native((message, reply) => reply(null));
  const api = client();
  assert.equal(await api.getWidgetContext(), null);
  const updates = [];
  const stop = api.onWidgetContextChange((value) => updates.push(value));
  const send = (payload) =>
    target.onNativeMessage?.(
      JSON.stringify({ event: "app.widget.context", payload }),
    );
  send({ version: 1, data: { title: "one" } });
  stop();
  send(null);
  assert.equal(updates.length, 1);
  api.onWidgetContextChange((value) => updates.push(value));
  api.destroy();
  send(null);
  assert.equal(updates.length, 1);
});

test("theme reads return copies; web theme messages require the trusted host; destroy removes listeners", () => {
  const theme = {
    active: "dark",
    current: { primary: "#111" },
    themes: { dark: {}, light: {} },
  };
  const host = external(() => {});
  const api = client("service-a", { hostOrigin: "https://app.synchra24.com" });
  let changes = 0;
  api.onSynchraThemeChange(() => changes++);
  host.dispatch(
    { synchraHostedTheme: theme },
    { origin: "https://attacker.example" },
  );
  assert.equal(api.getSynchraTheme(), null);
  host.dispatch({ synchraHostedTheme: theme });
  assert.equal(changes, 1);
  api.getSynchraTheme().current.primary = "#fff";
  assert.equal(api.getSynchraTheme().current.primary, "#111");
  api.destroy();
  host.dispatch({ synchraHostedTheme: theme });
  assert.equal(changes, 1);
});

test("destroy rejects pending requests; shared native handler survives until the last client", async () => {
  const target = native(() => {});
  let previousCalls = 0;
  const previous = () => previousCalls++;
  target.onNativeMessage = previous;
  const a = client(),
    b = client("service-b");
  const pending = a.getWidgetContext();
  a.destroy();
  await assert.rejects(pending, /destroyed/);
  assert.notEqual(target.onNativeMessage, previous);
  target.onNativeMessage("{}");
  assert.equal(previousCalls, 1);
  b.destroy();
  assert.equal(target.onNativeMessage, previous);
  await assert.rejects(b.getProviderContext(), /destroyed/);
});

test("request timeout rejects and leaves a usable client", async () => {
  native(() => {});
  const api = client("service-a", { responseTimeout: 5 });
  await assert.rejects(api.getProviderContext(), /response timeout/);
  window.ReactNativeWebView.postMessage = (raw) => {
    const m = JSON.parse(raw);
    window.onNativeMessage(
      JSON.stringify({
        event: m.event,
        request_id: m.payload.event_id,
        payload: { integrated: true },
      }),
    );
  };
  assert.equal(await api.isSynchraIntegrated(), true);
});

test("a reply addressed to one instance does not become another instance context notification", async () => {
  native((message, reply) =>
    reply({ version: 1, entity: { id: "private-to-request" }, data: {} }),
  );
  const a = client("service-a"),
    b = client("service-b");
  const updates = [];
  b.onWidgetContextChange((value) => updates.push(value));
  await a.getWidgetContext();
  assert.deepEqual(updates, []);
});

test("destroy during a settled preload still prevents publishing its snapshot", async () => {
  native((message, reply) => reply({ items: [variable()] }));
  const api = client();
  const load = api.loadVariables();
  api.destroy();
  await assert.rejects(load, /destroyed/);
});

test("synchronous variables preserve false, zero and empty string rather than treating them as unset", async () => {
  native((message, reply) =>
    reply({
      items: [
        { ...variable("enabled", false), type: "boolean" },
        { ...variable("count", 0), type: "number" },
        { ...variable("label", ""), type: "string" },
      ],
    }),
  );
  const api = client();
  await api.loadVariables();
  assert.equal(api.getVariable("enabled"), false);
  assert.equal(api.getVariable("count"), 0);
  assert.equal(api.getVariable("label"), "");
});
