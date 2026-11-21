import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Module, createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative, mocks = {}) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const item = new Module(filename); item.filename = filename; item.paths = Module._nodeModulePaths(path.dirname(filename));
  item.require = (name) => name in mocks ? mocks[name] : require(name); item._compile(compiled, filename); return item.exports;
}
const permissions = load("lib/bbs-control/permissions.ts");
const policy = load("app/bbs-control/usuarios/manage-policy.ts", { "../../../lib/bbs-control/permissions": permissions });
const authInput = load("lib/bbs-control/auth-input.ts");
const ids = { actor: "11111111-1111-4111-8111-111111111111", admin: "22222222-2222-4222-8222-222222222222", staff: "33333333-3333-4333-8333-333333333333", sa: "44444444-4444-4444-8444-444444444444", created: "55555555-5555-4555-8555-555555555555" };
const stamp = "2026-10-27T00:00:00.000Z";
function profile(id, username, role) { return { id, username, role, full_name: username, is_active: true, must_change_password: false, created_at: stamp, updated_at: stamp }; }

function fixture(actorRole = "super_admin", actorId = ids.actor) {
  const state = { actor: { id: actorId, role: actorRole, full_name: "Actor", is_active: true }, profiles: new Map([
    [ids.actor, profile(ids.actor, "edwin00741", "super_admin")], [ids.admin, profile(ids.admin, "administrador", "admin")],
    [ids.staff, profile(ids.staff, "colaborador", "cotizador")], [ids.sa, profile(ids.sa, "bryanrodriguez", "super_admin")],
  ]), identities: new Map(), requests: [{ id: "request", user_id: ids.staff, status: "pending" }], calls: [], adminCalls: 0, profileFailure: false, authFailure: false, sequence: 0 };
  for (const item of state.profiles.values()) state.identities.set(item.id, { id: item.id, email: `${item.username}@example.invalid`, app_metadata: { bbs_role: item.role }, user_metadata: { full_name: item.full_name, username: item.username } });
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.operation = "read"; this.values = null; }
    select() { return this; } eq(key, value) { this.filters.push([key, value]); return this; }
    insert(value) { this.operation = "insert"; this.values = value; return this; } update(value) { this.operation = "update"; this.values = value; return this; }
    maybeSingle() { return this.run(true); } then(resolve, reject) { return this.run(false).then(resolve, reject); }
    async run(single) {
      const data = this.table === "profiles" ? Array.from(state.profiles.values()) : state.requests;
      const selected = data.filter((row) => this.filters.every(([key, value]) => row[key] === value));
      if (this.operation === "read") return { data: single ? selected[0] ? { ...selected[0] } : null : selected, error: null };
      state.calls.push({ operation: `${this.table}.${this.operation}`, values: this.values });
      if (this.table === "profiles" && state.profileFailure) return { data: null, error: { message: "simulated profile failure" } };
      if (this.operation === "insert") { const created = { ...this.values, created_at: stamp, updated_at: stamp }; state.profiles.set(created.id, created); return { data: null, error: null }; }
      for (const row of selected) { Object.assign(row, this.values); if (this.table === "profiles") row.updated_at = new Date(Date.parse(stamp) + ++state.sequence * 1000).toISOString(); }
      return { data: single ? selected[0] ? { ...selected[0] } : null : selected, error: null };
    }
  }
  const admin = { from: (table) => new Query(table), auth: { admin: {
    async createUser(value) { state.calls.push({ operation: "auth.create", values: value }); const user = { ...value, id: ids.created }; state.identities.set(user.id, user); return { data: { user }, error: null }; },
    async deleteUser(id) { state.calls.push({ operation: "auth.delete", id }); state.identities.delete(id); return { data: {}, error: null }; },
    async getUserById(id) { state.calls.push({ operation: "auth.read", id }); return { data: { user: state.identities.get(id) || null }, error: null }; },
    async updateUserById(id, value) { state.calls.push({ operation: "auth.update", id, values: value }); if (state.authFailure) return { data: {}, error: { message: "simulated Auth failure" } }; Object.assign(state.identities.get(id), value); return { data: { user: state.identities.get(id) }, error: null }; },
    async generateLink(value) { state.calls.push({ operation: "auth.link", values: value }); return { data: { properties: { hashed_token: "qa-hash-only" } }, error: null }; },
  } } };
  const actions = load("app/bbs-control/usuarios/actions.ts", {
    "next/cache": { revalidatePath() {} },
    "../../../lib/bbs-control/supabase-server": { requireBackOfficeUser: async () => state.actor, createSupabaseAdminClient() { state.adminCalls++; return admin; } },
    "../../../lib/bbs-control/env": { usernameToInternalEmail: (value) => `${value}@bbsbiomedical.local` },
    "../../../lib/bbs-control/auth-input": authInput, "./manage-policy": policy,
  });
  return { state, actions };
}
function form(values) { const result = new FormData(); for (const [key, value] of Object.entries(values)) result.set(key, String(value)); return result; }
const empty = { error: "" };
const createValues = { username: "Nueva.Persona", full_name: "Nueva Persona", role: "admin", password: "Temporal!Seguro2026", recovery_email: "" };

test("cotizador/aprobador are rejected before parsing or service-role client creation", async () => {
  for (const role of ["cotizador", "aprobador"]) {
    const { state, actions } = fixture(role);
    for (const action of Object.values(actions)) { const result = await action(empty, new FormData()); assert.match(result.error, /permiso/); }
    assert.equal(state.adminCalls, 0); assert.equal(state.calls.length, 0);
  }
});
test("admin cannot tamper a target ID to update, reset, recover or resolve SA", async () => {
  const { state, actions } = fixture("admin", ids.admin);
  const values = { user_id: ids.sa, version: stamp, full_name: "Intento", role: "admin", is_active: "false", password: "Temporal!Seguro2026" };
  for (const key of ["updateManagedUser", "resetManagedPassword", "createManagedRecoveryLink", "resolveManagedRecovery"]) assert.match((await actions[key](empty, form(values))).error, /permiso/);
  assert.equal(state.calls.filter((call) => call.operation.startsWith("auth.")).length, 0);
  assert.equal(state.calls.filter((call) => call.operation.endsWith("update")).length, 0);
  assert.equal(state.profiles.get(ids.sa).role, "super_admin");
});
test("new super administrators and reserved usernames never reach Auth", async () => {
  const { state, actions } = fixture();
  assert.ok((await actions.createManagedUser(empty, form({ ...createValues, role: "super_admin" }))).error);
  assert.match((await actions.createManagedUser(empty, form({ ...createValues, username: "EDWIN00741" }))).error, /reservado/);
  assert.equal(state.adminCalls, 0);
});
test("admin may create lower/admin accounts with normalized username and forced first change", async () => {
  const { state, actions } = fixture("admin", ids.admin);
  assert.ok((await actions.createManagedUser(empty, form(createValues))).success);
  const created = state.profiles.get(ids.created); assert.equal(created.username, "nueva.persona"); assert.equal(created.role, "admin"); assert.equal(created.must_change_password, true);
  const identity = state.identities.get(ids.created); assert.equal(identity.email, "nueva.persona@bbsbiomedical.local"); assert.equal(identity.app_metadata.bbs_role, "admin"); assert.equal(identity.app_metadata.must_change_password, true);
});
test("optional real recovery email is normalized and profile-write failure removes Auth account", async () => {
  const { state, actions } = fixture(); state.profileFailure = true;
  const result = await actions.createManagedUser(empty, form({ ...createValues, recovery_email: "PERSONA@EXAMPLE.INVALID" }));
  assert.ok(result.error); assert.equal(state.calls.find((call) => call.operation === "auth.create").values.email, "persona@example.invalid");
  assert.equal(state.calls.filter((call) => call.operation === "auth.delete").length, 1); assert.equal(state.identities.has(ids.created), false);
});
test("weak temporary passwords are rejected before privileged reads", async () => {
  const { state, actions } = fixture();
  for (const password of ["corta", "abcdefghijklmnop", "ABCDEFGHIJKLMNOP1!", "Abcdefghijklmnop!"]) assert.ok((await actions.createManagedUser(empty, form({ ...createValues, password }))).error);
  assert.equal(state.adminCalls, 0);
});
test("self-demotion, SA deactivation and promotion of arbitrary existing users are blocked", async () => {
  const admin = fixture("admin", ids.admin);
  assert.match((await admin.actions.updateManagedUser(empty, form({ user_id: ids.admin, version: stamp, full_name: "Admin", role: "cotizador", is_active: "true" }))).error, /propio acceso/);
  const sa = fixture();
  assert.match((await sa.actions.updateManagedUser(empty, form({ user_id: ids.sa, version: stamp, full_name: "SA", role: "super_admin", is_active: "false" }))).error, /se conservan/);
  assert.match((await sa.actions.updateManagedUser(empty, form({ user_id: ids.staff, version: stamp, full_name: "Staff", role: "super_admin", is_active: "true" }))).error, /reservada/);
});
test("profile/Auth role and name update together; stale edits never write", async () => {
  const { state, actions } = fixture("admin", ids.admin);
  const values = { user_id: ids.staff, version: stamp, full_name: "Nuevo Nombre", role: "admin", is_active: "true" };
  assert.ok((await actions.updateManagedUser(empty, form(values))).success);
  assert.equal(state.profiles.get(ids.staff).role, "admin"); assert.equal(state.identities.get(ids.staff).app_metadata.bbs_role, "admin"); assert.equal(state.identities.get(ids.staff).user_metadata.full_name, "Nuevo Nombre");
  const calls = state.calls.length; assert.match((await actions.updateManagedUser(empty, form(values))).error, /Otro administrador/); assert.equal(state.calls.length, calls);
});
test("failed identity synchronization compensates the profile update", async () => {
  const { state, actions } = fixture(); state.authFailure = true;
  assert.ok((await actions.updateManagedUser(empty, form({ user_id: ids.staff, version: stamp, full_name: "No Persistir", role: "admin", is_active: "false" }))).error);
  assert.equal(state.profiles.get(ids.staff).role, "cotizador"); assert.equal(state.profiles.get(ids.staff).is_active, true); assert.equal(state.profiles.get(ids.staff).full_name, "colaborador");
});
test("password reset forces change and resolves requests without exposing the password", async () => {
  const { state, actions } = fixture("admin", ids.admin);
  const result = await actions.resetManagedPassword(empty, form({ user_id: ids.staff, version: stamp, password: "Temporal!Seguro2026" }));
  assert.ok(result.success); assert.equal(state.profiles.get(ids.staff).must_change_password, true); assert.equal(state.identities.get(ids.staff).app_metadata.must_change_password, true); assert.equal(state.requests[0].status, "resolved"); assert.equal(JSON.stringify(result).includes("Temporal!Seguro2026"), false);
});
test("recovery links are generated without sending mail or resolving unused requests", async () => {
  const previousBase = process.env.BBS_APP_URL, previousEnvironment = process.env.NODE_ENV;
  process.env.BBS_APP_URL = "https://bbsbiomedical.com"; process.env.NODE_ENV = "production";
  try {
    const { state, actions } = fixture("admin", ids.admin);
    const result = await actions.createManagedRecoveryLink(empty, form({ user_id: ids.staff }));
    assert.ok(result.recoveryUrl?.startsWith("https://bbsbiomedical.com/bbs-control/recuperar/confirmar?")); assert.ok(result.recoveryUrl?.includes("type=recovery"));
    assert.equal(state.calls.find((call) => call.operation === "auth.link").values.type, "recovery"); assert.equal(state.requests[0].status, "pending"); assert.equal(state.profiles.get(ids.staff).must_change_password, false);
    process.env.BBS_APP_URL = "https://other.example.invalid";
    const invalid = fixture(); assert.ok((await invalid.actions.createManagedRecoveryLink(empty, form({ user_id: ids.staff }))).error); assert.equal(invalid.state.adminCalls, 0);
    process.env.BBS_APP_URL = "http://127.0.0.1:3000";
    const prodLocal = fixture(); assert.ok((await prodLocal.actions.createManagedRecoveryLink(empty, form({ user_id: ids.staff }))).error);
    process.env.NODE_ENV = "development";
    const local = fixture(); assert.ok((await local.actions.createManagedRecoveryLink(empty, form({ user_id: ids.staff }))).recoveryUrl?.startsWith("http://127.0.0.1:3000/"));
  } finally { if (previousBase === undefined) delete process.env.BBS_APP_URL; else process.env.BBS_APP_URL = previousBase; if (previousEnvironment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnvironment; }
});
