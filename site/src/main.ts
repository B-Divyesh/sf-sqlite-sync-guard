import "./styles.css";

if (location.pathname === "/" && new URLSearchParams(location.search).get("demo") === "1") {
  location.replace("/demo/");
}

const fixtures = {
  unsafe: { output: `$ sqlite-sync-guard demo\n\nUNSAFE  active-session.db\n        - WAL sidecar present\nSAFE  closed-project.db\n\nDO NOT SYNC — 1 of 2 database set(s) are unsafe to copy live.\nClose writers or run sqlite-sync-guard export.\n\nTRANSFER BACKUP CREATED\n  backup: transfer/closed-project.backup.sqlite3\n  manifest: transfer/closed-project.backup.manifest.json`, label: "Unsafe scan · do not copy", className: "status-danger" },
  safe: { output: `$ sqlite-sync-guard scan sample-after-close\n\nSAFE  active-session.db\nSAFE  closed-project.db\n\nSAFE — 2 database set(s) have no sidecars or active locks.`, label: "Safe scan · ready to copy", className: "status-safe" }
} as const;
type FixtureName = keyof typeof fixtures;

const demoMode = document.body.dataset.demo === "true";
const demoKey = "demo:sqlite-sync-guard:fixture";
function showFixture(name: FixtureName, persist = true): void {
  const fixture = fixtures[name];
  const terminal = document.querySelector<HTMLElement>("[data-terminal]");
  const status = document.querySelector<HTMLElement>("[data-terminal-status]");
  if (terminal) terminal.textContent = fixture.output;
  if (status) { status.className = `terminal-status ${fixture.className}`; status.innerHTML = `<span aria-hidden="true">${name === "safe" ? "✓" : "!"}</span><strong>${fixture.label}</strong>`; }
  document.querySelectorAll<HTMLButtonElement>("[data-fixture]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.fixture === name)));
  if (demoMode && persist) localStorage.setItem(demoKey, name);
}
document.querySelectorAll<HTMLButtonElement>("[data-fixture]").forEach((button) => button.addEventListener("click", () => showFixture(button.dataset.fixture as FixtureName)));
const saved = demoMode ? localStorage.getItem(demoKey) : null;
showFixture(saved === "safe" ? "safe" : "unsafe");
document.querySelector<HTMLButtonElement>("[data-reset-demo]")?.addEventListener("click", () => { localStorage.removeItem(demoKey); showFixture("unsafe", false); document.querySelector<HTMLElement>("[data-terminal]")?.focus(); });
document.querySelector("[data-start-real]")?.addEventListener("click", () => localStorage.removeItem(demoKey));

const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");
document.querySelectorAll<HTMLButtonElement>("[data-copy-target]").forEach((button) => button.addEventListener("click", async () => {
  const target = document.getElementById(button.dataset.copyTarget ?? "");
  const value = target?.textContent ?? "";
  try { await navigator.clipboard.writeText(value); const old = button.textContent; button.textContent = "Copied"; if (copyStatus) copyStatus.textContent = `Copied: ${value}`; window.setTimeout(() => { button.textContent = old; }, 1400); }
  catch { if (target) { const range = document.createRange(); range.selectNodeContents(target); const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range); target.setAttribute("tabindex", "-1"); target.focus(); } if (copyStatus) copyStatus.textContent = "Could not copy because this browser denied clipboard access. The command is selected; press Ctrl+C or Command+C."; }
}));

document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener("click", () => requestAnimationFrame(() => document.querySelector<HTMLElement>("main")?.focus()));
const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
if (navigation?.type === "back_forward") requestAnimationFrame(() => { const h1 = document.querySelector<HTMLElement>("h1"); h1?.focus(); const live = document.querySelector<HTMLElement>("[data-route-status]"); if (live && h1) live.textContent = h1.textContent; });

const offlineNote = document.querySelector<HTMLElement>("[data-offline]");
const updateNetworkState = () => { if (offlineNote) offlineNote.hidden = navigator.onLine; };
addEventListener("online", updateNetworkState); addEventListener("offline", updateNetworkState); updateNetworkState();

if ("serviceWorker" in navigator && import.meta.env.PROD) addEventListener("load", async () => {
  try {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const toast = document.querySelector<HTMLElement>("[data-update-toast]");
    const registration = await navigator.serviceWorker.register("/sw.js");
    let refreshing = false;
    const showUpdate = () => { if (hadController && registration.waiting && toast) toast.hidden = false; };
    registration.addEventListener("updatefound", () => registration.installing?.addEventListener("statechange", () => { if (registration.installing?.state === "installed") showUpdate(); }));
    document.querySelector<HTMLButtonElement>("[data-apply-update]")?.addEventListener("click", () => registration.waiting?.postMessage({ type: "SKIP_WAITING" }));
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !refreshing) { refreshing = true; location.reload(); } });
    showUpdate();
  } catch { /* The static guide remains usable. */ }
});
