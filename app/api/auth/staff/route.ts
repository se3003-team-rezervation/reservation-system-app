import type { NextRequest } from "next/server";

const DEFAULT_STAFF_PIN = "1234";

function getExpectedPin(): string {
  return process.env.STAFF_PIN?.trim() || DEFAULT_STAFF_PIN;
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("dormdine_staff_session")?.value;
  const isAuthenticated = session === "authenticated";

  return Response.json({
    authenticated: isAuthenticated,
  });
}

export async function POST(request: NextRequest) {
  let body: { pin?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { pin } = body;
  const expectedPin = getExpectedPin();

  if (!pin || String(pin).trim() !== expectedPin) {
    return Response.json(
      { success: false, error: "Invalid staff PIN. Access denied." },
      { status: 401 }
    );
  }

  const response = Response.json({
    success: true,
    message: "Staff authentication successful",
  });

  response.headers.set(
    "Set-Cookie",
    "dormdine_staff_session=authenticated; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400"
  );

  return response;
}

export async function DELETE() {
  const response = Response.json({
    success: true,
    message: "Logged out from staff session",
  });

  response.headers.set(
    "Set-Cookie",
    "dormdine_staff_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );

  return response;
}
