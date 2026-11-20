import test from "node:test";
import assert from "node:assert/strict";

const { GET, POST, DELETE } = await import("../app/api/auth/staff/route.ts");

test("Role-based authentication - Staff PIN auth API", async (t) => {
  await t.test("rejects incorrect PIN with 401", async () => {
    const req = new Request("http://localhost/api/auth/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "wrong-pin-9999" }),
    });

    const res = await POST(req);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes("Invalid staff PIN"));
  });

  await t.test("authenticates successfully with default PIN 1234", async () => {
    const req = new Request("http://localhost/api/auth/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "1234" }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(res.headers.get("Set-Cookie")?.includes("dormdine_staff_session=authenticated"));
  });

  await t.test("authenticates with custom process.env.STAFF_PIN", async () => {
    process.env.STAFF_PIN = "8888";
    const req = new Request("http://localhost/api/auth/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "8888" }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    delete process.env.STAFF_PIN;
  });

  await t.test("checks session status via GET /api/auth/staff", async () => {
    // Unauthenticated request
    const unauthReq = {
      cookies: {
        get: () => undefined,
      },
    };
    const unauthRes = await GET(unauthReq);
    const unauthData = await unauthRes.json();
    assert.equal(unauthData.authenticated, false);

    // Authenticated request
    const authReq = {
      cookies: {
        get: (name) => (name === "dormdine_staff_session" ? { value: "authenticated" } : undefined),
      },
    };
    const authRes = await GET(authReq);
    const authData = await authRes.json();
    assert.equal(authData.authenticated, true);
  });

  await t.test("clears session on DELETE /api/auth/staff", async () => {
    const res = await DELETE();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(res.headers.get("Set-Cookie")?.includes("Max-Age=0"));
  });
});
