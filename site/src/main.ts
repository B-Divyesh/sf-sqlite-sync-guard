import "./styles.css";

const fixtures = {
  unsafe: {
    output: `$ sqlite-sync-guard scan ~/Sync\n\nUNSAFE  profiles/session.db\n        - WAL sidecar present\n        - shared-memory sidecar present\n        - active SQLite lock detected\n\nDO NOT SYNC — 1 of 1 database set is unsafe to copy live.`,
    label: "Exit 2 · do not sync",
    className: "status-danger"
  },
  safe: {
    output: `$ sqlite-sync-guard scan ~/Sync\n\nSAFE  profiles/session.db\n\nSAFE — 1 database set has no sidecars or active locks.`,
    label: "Exit 0 · safe to copy",
    className: "status-safe"
  }
} as const;

type FixtureName = keyof typeof fixtures;
const terminal = document.querySelector<HTMLElement>("[data-terminal]");
const terminalStatus = document.querySelector<HTMLElement>("[data-terminal-status]");
const fixtureButtons = document.querySelectorAll<HTMLButtonElement>("[data-fixture]");

function showFixture(name: FixtureName): void {
  const fixture = fixtures[name];
  if (terminal) terminal.textContent = fixture.output;
  if (terminalStatus) {
    terminalStatus.className = `terminal-status ${fixture.className}`;
    terminalStatus.innerHTML = `<span aria-hidden="true">${name === "safe" ? "✓" : "!"}</span><strong>${fixture.label}</strong>`;
  }
  fixtureButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.fixture === name));
  });
}

fixtureButtons.forEach((button) => {
  button.addEventListener("click", () => showFixture(button.dataset.fixture as FixtureName));
});
showFixture("unsafe");

const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy ?? "";
    try {
      await navigator.clipboard.writeText(value);
      const previous = button.textContent;
      button.textContent = "Copied";
      if (copyStatus) copyStatus.textContent = `Copied: ${value}`;
      window.setTimeout(() => { button.textContent = previous; }, 1400);
    } catch {
      if (copyStatus) copyStatus.textContent = `Copy failed. Select the command: ${value}`;
    }
  });
});

const offlineNote = document.querySelector<HTMLElement>("[data-offline]");
function updateNetworkState(): void {
  if (offlineNote) offlineNote.hidden = navigator.onLine;
}
window.addEventListener("online", updateNetworkState);
window.addEventListener("offline", updateNetworkState);
updateNetworkState();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
