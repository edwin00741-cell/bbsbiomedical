import assert from "node:assert/strict";
import test from "node:test";
import { newPasswordSchema, passwordChangeSchema, safeAuthNext, bbsAuthBaseUrl } from "../lib/bbs-control/auth-input.ts";
test("new passwords require 12–128 characters and each character group", () => {
  assert.equal(newPasswordSchema.safeParse("QaPassword!234").success, true);
  for (const password of ["Short!1", "nouppercase!123", "NOLOWERCASE!123", "NoNumbers!long", "NoSymbols123long", "A!1a".repeat(33)]) assert.equal(newPasswordSchema.safeParse(password).success, false);
});
test("password confirmation must match exactly without trimming secrets", () => {
  assert.equal(passwordChangeSchema.safeParse({ password: "QaPassword!234", confirmation: "QaPassword!234" }).success, true);
  assert.equal(passwordChangeSchema.safeParse({ password: "QaPassword!234", confirmation: "QaPassword!234 " }).success, false);
});
test("login destinations stay inside BBS and omit authentication loops", () => {
  for (const path of ["https://evil.example", "//evil.example", "/bbs-control-evil", "/bbs-control/../outside", "/bbs-control/login", "/bbs-control/recuperar/confirmar?token_hash=secret", "/bbs-control/cambiar-contrasena", "/bbs-control\\evil"]) assert.equal(safeAuthNext(path, "/bbs-control/cotizaciones"), "/bbs-control/cotizaciones");
  assert.equal(safeAuthNext("/bbs-control/cotizaciones?status=approved"), "/bbs-control/cotizaciones?status=approved");
});
test("recovery base is server configuration and rejects malformed or insecure production URLs", () => {
  const previous = { BBS_APP_URL: process.env.BBS_APP_URL, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, NODE_ENV: process.env.NODE_ENV };
  try {
    process.env.NODE_ENV = "production"; process.env.BBS_APP_URL = "http://evil.example";
    assert.equal(bbsAuthBaseUrl(), "https://bbsbiomedical.com");
    process.env.BBS_APP_URL = "https://user:password@evil.example"; assert.equal(bbsAuthBaseUrl(), "https://bbsbiomedical.com");
    process.env.BBS_APP_URL = "https://bbsbiomedical.com/path"; assert.equal(bbsAuthBaseUrl(), "https://bbsbiomedical.com");
    process.env.NODE_ENV = "development"; process.env.BBS_APP_URL = "http://127.0.0.1:3000"; assert.equal(bbsAuthBaseUrl(), "http://127.0.0.1:3000");
  } finally { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
