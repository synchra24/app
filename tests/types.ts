import {
  SynchraApp,
  SynchraBridgeError,
  type SynchraProviderContext,
  type SynchraWidgetContext,
} from "../dist/index.js";
const client = new SynchraApp("fixture", {
  hostOrigin: "https://app.synchra24.com",
});
const webContext: SynchraProviderContext = {
  provider_id: "108",
  profile_id: 1,
  role: { permissions: [] },
};
void webContext;
async function useSdk() {
  await client.loadVariables();
  const value: { enabled: boolean } | undefined = client.getVariable<{
    enabled: boolean;
  }>("settings");
  const saved = await client.setVariable(
    "settings",
    { enabled: true },
    { revision: 1 },
  );
  saved.value.enabled;
  const artifact = await client.getArtifact<{ items: string[] }>(
    "report.latest",
  );
  artifact.value.items;
  const widget: SynchraWidgetContext<{ title: string }> | null =
    await client.getWidgetContext<{ title: string }>();
  widget?.data.title;
  client.onWidgetContextChange<{ title: string }>(
    (context) => context?.data.title,
  );
  const qr = await client.scanQr();
  // @ts-expect-error A web fallback is not a successful QR scan.
  qr.value;
  if (!("ignored" in qr)) qr.value;
  const receipt = await client.emitEvent("report_ready");
  if (!("preview" in receipt)) receipt.event_id;
  try {
    await client.setArtifact("report.latest", { items: [] });
  } catch (error) {
    if (error instanceof SynchraBridgeError) error.code;
  }
  return value;
}
void useSdk;

async function selectCompanyEmployees() {
  const result = await client.selectEmployeeProfiles({profile_ids:[501], all_users:true});
  const legacy = await client.selectUsers({users:[42]});
  if (!("ignored" in result)) { const ids: number[] = result.profile_ids; void ids; }
  if (!("ignored" in legacy)) { const ids: number[] = legacy.users; void ids; }
  return {result, legacy};
}
void selectCompanyEmployees;
