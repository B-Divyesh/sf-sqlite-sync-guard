import "./styles.css";

if (location.pathname === "/" && new URLSearchParams(location.search).get("demo") === "1") {
  location.replace("/demo/");
}

document.querySelector<HTMLButtonElement>("[data-reset-demo]")?.addEventListener("click", () => {
  Object.keys(localStorage).filter((key) => key.startsWith("demo:sqlite-sync-guard:")).forEach((key) => localStorage.removeItem(key));
  const notice = document.querySelector<HTMLElement>("[data-demo-reset-status]");
  if (notice) notice.textContent = "Demo reset. The recorded sample is unchanged.";
});
document.querySelector("[data-start-real]")?.addEventListener("click", () => Object.keys(localStorage).filter((key) => key.startsWith("demo:sqlite-sync-guard:")).forEach((key) => localStorage.removeItem(key)));

const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");
document.querySelectorAll<HTMLButtonElement>("[data-copy-target]").forEach((button) => button.addEventListener("click", async () => {
  const target = document.getElementById(button.dataset.copyTarget ?? "");
  const value = target?.textContent ?? "";
  try { await navigator.clipboard.writeText(value); const old = button.textContent; button.textContent = "Copied"; if (copyStatus) copyStatus.textContent = `Copied: ${value}`; window.setTimeout(() => { button.textContent = old; }, 1400); }
  catch { if (target) { const range = document.createRange(); range.selectNodeContents(target); const selection = getSelection(); selection?.removeAllRanges(); selection?.addRange(range); target.setAttribute("tabindex", "-1"); target.focus(); } if (copyStatus) copyStatus.textContent = "Could not copy because this browser denied clipboard access. The command is selected; press Ctrl+C or Command+C."; }
}));

document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener("click", () => requestAnimationFrame(() => document.querySelector<HTMLElement>("main")?.focus()));
const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
if (!location.hash || navigation?.type === "back_forward") requestAnimationFrame(() => {
  const h1 = document.querySelector<HTMLElement>("h1");
  const live = document.querySelector<HTMLElement>("[data-route-status]");
  if (h1) h1.focus();
  if (live && h1) live.textContent = h1.textContent ?? "";
});

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
