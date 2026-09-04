import { rm } from "node:fs/promises";
import { join } from "node:path";

const exampleRoot = join(import.meta.dir, "..", "example");
const databaseName = `.rokke-smoke-${crypto.randomUUID()}.sqlite`;
const databasePath = join(exampleRoot, databaseName);
const baseUrl = "http://127.0.0.1:3001";
const username = `tester-${crypto.randomUUID()}`;
const password = "alpha-password-123";

const server = Bun.spawn(["bun", "run", "index.ts"], {
  cwd: exampleRoot,
  env: {
    ...Bun.env,
    APP_ENV: "development",
    DATABASE_URL: `sqlite://${databaseName}`,
    JWT_SECRET: "smoke-test-secret-that-is-not-used-outside-this-process",
  },
  stdout: "inherit",
  stderr: "inherit",
});

async function waitUntilReady(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Example exited before becoming ready with code ${server.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/ready`);
      if (response.ok) return;
      lastError = new Error(`Unexpected readiness status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(100);
  }
  throw new Error(`Example did not become ready: ${String(lastError)}`);
}

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<{ response: Response; body: T | undefined }> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = response.status === 204 ? undefined : await response.json() as T;
  return { response, body };
}

function expectStatus(response: Response, expected: number, operation: string): void {
  if (response.status !== expected) throw new Error(`${operation} returned ${response.status}; expected ${expected}`);
}

try {
  await waitUntilReady();
  const root = await jsonRequest<{ hello?: string; framework?: string }>("/");
  expectStatus(root.response, 200, "root route");
  if (root.body?.hello !== "world" || root.body.framework !== "rokke") throw new Error("Unexpected root response");

  const unauthorized = await jsonRequest<unknown>("/tasks");
  expectStatus(unauthorized.response, 401, "unauthenticated task listing");

  const registration = await jsonRequest<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  expectStatus(registration.response, 201, "registration");

  const login = await jsonRequest<{ token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  expectStatus(login.response, 200, "login");
  if (typeof login.body?.token !== "string") throw new Error("Login did not return a JWT");
  const authorization = { Authorization: `Bearer ${login.body.token}` };

  const profile = await jsonRequest<{ data?: { username?: string } }>("/auth/me", { headers: authorization });
  expectStatus(profile.response, 200, "authenticated profile");
  if (profile.body?.data?.username !== username) throw new Error("Profile belongs to an unexpected user");

  const creation = await jsonRequest<{ data?: { id?: number } }>("/tasks", {
    method: "POST",
    headers: authorization,
    body: JSON.stringify({ title: "Probar Rokke", description: "CRUD autenticado", completed: false }),
  });
  expectStatus(creation.response, 201, "task creation");
  const taskId = creation.body?.data?.id;
  if (!Number.isSafeInteger(taskId)) throw new Error("Created task has no numeric id");

  const listing = await jsonRequest<{ data?: Array<{ id: number }> }>("/tasks", { headers: authorization });
  expectStatus(listing.response, 200, "task listing");
  if (listing.body?.data?.length !== 1 || listing.body.data[0]?.id !== taskId) throw new Error("Created task is absent from listing");

  const detail = await jsonRequest<unknown>(`/tasks/${taskId}`, { headers: authorization });
  expectStatus(detail.response, 200, "task detail");

  const secondUsername = `other-${crypto.randomUUID()}`;
  const secondRegistration = await jsonRequest<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: secondUsername, password }),
  });
  expectStatus(secondRegistration.response, 201, "second user registration");
  const secondLogin = await jsonRequest<{ token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: secondUsername, password }),
  });
  expectStatus(secondLogin.response, 200, "second user login");
  if (typeof secondLogin.body?.token !== "string") throw new Error("Second login did not return a JWT");
  const secondAuthorization = { Authorization: `Bearer ${secondLogin.body.token}` };
  const isolatedListing = await jsonRequest<{ data?: unknown[] }>("/tasks", { headers: secondAuthorization });
  expectStatus(isolatedListing.response, 200, "second user's task listing");
  if (isolatedListing.body?.data?.length !== 0) throw new Error("Task ownership leaked into another user's listing");
  const isolatedDetail = await jsonRequest<unknown>(`/tasks/${taskId}`, { headers: secondAuthorization });
  expectStatus(isolatedDetail.response, 404, "cross-user task lookup");

  const update = await jsonRequest<{ data?: { completed?: boolean } }>(`/tasks/${taskId}`, {
    method: "PUT",
    headers: authorization,
    body: JSON.stringify({ title: "Rokke probado", description: "Flujo completo", completed: true }),
  });
  expectStatus(update.response, 200, "task update");
  if (update.body?.data?.completed !== true) throw new Error("Task update did not persist completion");

  const deletion = await jsonRequest<unknown>(`/tasks/${taskId}`, { method: "DELETE", headers: authorization });
  expectStatus(deletion.response, 204, "task deletion");
  const missing = await jsonRequest<unknown>(`/tasks/${taskId}`, { headers: authorization });
  expectStatus(missing.response, 404, "deleted task lookup");

  const health = await fetch(`${baseUrl}/health`);
  expectStatus(health, 200, "health endpoint");
  console.log("Example smoke test passed: auth, ownership isolation and the complete task CRUD flow are working.");
} finally {
  server.kill("SIGINT");
  await server.exited;
  await Promise.all([
    rm(databasePath, { force: true }),
    rm(`${databasePath}-shm`, { force: true }),
    rm(`${databasePath}-wal`, { force: true }),
  ]);
}
