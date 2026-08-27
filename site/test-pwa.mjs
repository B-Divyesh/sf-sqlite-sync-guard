import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { writeServiceWorker } from "./pwa-build.mjs";

class MemoryCache {
  constructor(network) {
    this.network = network;
    this.entries = new Map();
  }

  key(request) {
    return new URL(typeof request === "string" ? request : request.url, "https://guard.test").pathname;
  }

  async addAll(requests) {
    for (const request of requests) {
      const response = await this.network.fetch(request);
      if (!response.ok) throw new Error(`precache failed: ${request}`);
      await this.put(request, response);
    }
  }

  async match(request) {
    return this.entries.get(this.key(request))?.clone();
  }

  async put(request, response) {
    this.entries.set(this.key(request), response.clone());
  }
}

class MemoryCaches {
  constructor(network) {
    this.network = network;
    this.entries = new Map();
  }

  async open(name) {
    if (!this.entries.has(name)) this.entries.set(name, new MemoryCache(this.network));
    return this.entries.get(name);
  }

  async keys() { return [...this.entries.keys()]; }
  async delete(name) { return this.entries.delete(name); }
}

function networkFor(files) {
  return {
    online: true,
    async fetch(request) {
      if (!this.online) throw new TypeError("offline");
      const path = new URL(typeof request === "string" ? request : request.url, "https://guard.test").pathname;
      const body = files.get(path);
      return body === undefined ? new Response("missing", { status: 404 }) : new Response(body);
    }
  };
}

async function activateWorker(source, caches, network) {
  const events = new Map();
  const self = {
    location: { origin: "https://guard.test" },
    clients: { claim: async () => {} },
    addEventListener(type, listener) { events.set(type, listener); },
    skipWaiting() {}
  };
  vm.runInNewContext(source, { self, caches, fetch: network.fetch.bind(network), URL, Response });
  for (const type of ["install", "activate"]) {
    let waiting;
    events.get(type)({ waitUntil(promise) { waiting = promise; } });
    await waiting;
  }
  return async (path) => {
    let response;
    events.get("fetch")({
      request: { method: "GET", mode: "navigate", url: `https://guard.test${path}` },
      respondWith(promise) { response = promise; }
    });
    return response;
  };
}

const work = await mkdtemp(join(tmpdir(), "sqlite-sync-guard-pwa-"));
const buildA = join(work, "build-a");
const buildB = join(work, "build-b");
for (const [directory, title, asset] of [[buildA, "Build A shell", "a"], [buildB, "Build B shell", "b"]]) {
  await mkdir(join(directory, "assets"), { recursive: true });
  await writeFile(join(directory, "index.html"), `<title>${title}</title>`);
  await writeFile(join(directory, "assets", `main-${asset}.js`), `console.log("${asset}")`);
}

const a = await writeServiceWorker(buildA);
const b = await writeServiceWorker(buildB);
assert.notEqual(a.version, b.version, "cache revision must change with release content");

const network = networkFor(new Map([
  ["/", "<title>Build A shell</title>"],
  ["/assets/main-a.js", "console.log('a')"]
]));
const caches = new MemoryCaches(network);
const fetchA = await activateWorker(await readFile(join(buildA, "sw.js"), "utf8"), caches, network);
network.online = false;
assert.match(await (await fetchA("/")).text(), /Build A shell/, "build A shell should work offline");

network.online = true;
network.fetch = networkFor(new Map([
  ["/", "<title>Build B shell</title>"],
  ["/assets/main-b.js", "console.log('b')"]
])).fetch;
const fetchB = await activateWorker(await readFile(join(buildB, "sw.js"), "utf8"), caches, network);
network.online = false;
assert.match(await (await fetchB("/")).text(), /Build B shell/, "activated build B worker must serve its new shell offline");
assert.deepEqual(await caches.keys(), [`sqlite-sync-guard-${b.version}`], "activation must remove stale release caches");
console.log(`PWA update regression passed: build ${a.version} → ${b.version} serves Build B shell offline`);
