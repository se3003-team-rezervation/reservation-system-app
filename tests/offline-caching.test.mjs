import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("Offline QR caching support via Service Workers & PWA Manifest", async (t) => {
  await t.test("public/sw.js exists and defines caching lifecycle and offline fallbacks", async () => {
    const swPath = path.join(process.cwd(), "public", "sw.js");
    const content = await fs.readFile(swPath, "utf-8");

    assert.ok(content.includes("addEventListener(\"install\"") || content.includes("addEventListener('install'"));
    assert.ok(content.includes("addEventListener(\"activate\"") || content.includes("addEventListener('activate'"));
    assert.ok(content.includes("addEventListener(\"fetch\"") || content.includes("addEventListener('fetch'"));
    assert.ok(content.includes("caches.open"));
    assert.ok(content.includes("/my-reservations"));
  });

  await t.test("public/manifest.json provides valid PWA metadata for offline dining access", async () => {
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    const content = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(content);

    assert.equal(manifest.name, "DormDine - Student Dining Reservation System");
    assert.equal(manifest.short_name, "DormDine");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "/my-reservations");
    assert.ok(manifest.icons.length > 0);
  });

  await t.test("components/ServiceWorkerRegister.tsx safely registers worker", async () => {
    const compPath = path.join(process.cwd(), "components", "ServiceWorkerRegister.tsx");
    const content = await fs.readFile(compPath, "utf-8");

    assert.ok(content.includes("navigator.serviceWorker") && content.includes(".register"));
    assert.ok(content.includes("/sw.js"));
  });
});
