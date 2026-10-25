const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Run the real hook with a minimal effect scheduler and controlled API responses.
function setup() {
  const slots = [];
  let cursor = 0;
  let pending = [];
  const requests = [];
  const same = (a, b) =>
    a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(value) {
      const i = cursor++;
      slots[i] ??= { current: value };
      return slots[i];
    },
    useState(value) {
      const i = cursor++;
      slots[i] ??= { value };
      return [
        slots[i].value,
        (next) => {
          slots[i].value =
            typeof next === "function" ? next(slots[i].value) : next;
        },
      ];
    },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) slots[i] = { value: fn, deps };
      return slots[i].value;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) {
        pending.push(() => {
          slots[i]?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const noop = () => {};
  const services = {
    ApiRequestError: class extends Error {},
    isGuid: (id) => id.startsWith("server"),
    fetchDocumentsWithApi: () =>
      new Promise((resolve) => requests.push(resolve)),
  };
  const source = readFileSync(
    "app/components/hooks/use-editor-account-sync.ts",
    "utf8",
  );
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (name === "react") return react;
        if (name === "sonner") return { toast: { error: noop } };
        if (name.endsWith("document.service")) return services;
        if (name.endsWith("perfis.enum")) return { Perfis: { ADMIN: "admin" } };
        if (name.endsWith("auth-session"))
          return {
            AUTH_TOKEN_STORAGE_KEY: "token",
            AUTH_USER_STORAGE_KEY: "user",
            isAdminUser: () => false,
          };
        if (name.endsWith("editor-document"))
          return { shouldSaveDocument: () => false };
        return {};
      },
      localStorage: {
        getItem: (key) =>
          key === "token"
            ? "test-token"
            : key === "user"
              ? JSON.stringify({
                  id: "user",
                  name: "Test",
                  email: "test@example.com",
                })
              : null,
      },
      window: {
        addEventListener: noop,
        removeEventListener: noop,
        clearTimeout: noop,
      },
      document: { addEventListener: noop, removeEventListener: noop },
    },
  );
  const options = {
    documents: [{ id: "initial", title: "", content: "" }],
    activeDocumentId: "initial",
    hadStoredDocuments: false,
    setDocuments: (next) => {
      options.documents =
        typeof next === "function" ? next(options.documents) : next;
    },
    setActiveDocumentId: (id) => {
      options.activeDocumentId = id;
    },
    persistCurrentDocumentHtml: noop,
    closeDocumentLocally: noop,
  };
  const render = () => {
    cursor = 0;
    exports.useEditorAccountSync(options);
    const effects = pending;
    pending = [];
    effects.forEach((fn) => {
      fn();
    });
  };
  const respond = async (index) => {
    requests[index]({
      total: 1,
      items: [
        {
          id: "server-old",
          title: "Anterior",
          content: "Salvo",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });
    await Promise.resolve();
    await Promise.resolve();
  };
  render();
  render();
  return { options, render, requests, respond };
}

test("switching documents does not reload the account and close the new tab", async () => {
  const h = setup();
  await h.respond(0);
  h.render();
  h.options.documents = [
    ...h.options.documents,
    { id: "new", title: "Novo", content: "" },
  ];
  h.options.activeDocumentId = "new";
  h.options.persistCurrentDocumentHtml = () => {};
  h.render();
  assert.equal(h.requests.length, 1);
  assert.equal(h.options.activeDocumentId, "new");
  assert.equal(h.options.documents.length, 2);
});

test("a delayed initial response preserves a document opened while loading", async () => {
  const h = setup();
  h.options.documents = [
    ...h.options.documents,
    { id: "new", title: "Novo", content: "" },
  ];
  h.options.activeDocumentId = "new";
  h.render();
  await h.respond(0);
  assert.equal(h.options.activeDocumentId, "new");
  assert.ok(h.options.documents.some((doc) => doc.id === "new"));
});
