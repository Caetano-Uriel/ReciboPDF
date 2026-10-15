"use strict";
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path =
  require("node:path").join(__dirname, "..") + require("node:path").sep;
const html = fs.readFileSync(path + "index.html", "utf8");
const errors = [];
function create(saved) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: "https://caetano-uriel.github.io/ReciboPDF/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const w = dom.window;
  let prints = 0;
  w.print = () => {
    prints++;
    w.dispatchEvent(new w.Event("beforeprint"));
    w.dispatchEvent(new w.Event("afterprint"));
  };
  w.confirm = () => true;
  if (saved) w.localStorage.setItem("info-projekt.receipt.v2", saved);
  w.eval(fs.readFileSync(path + "money.js", "utf8"));
  w.eval(fs.readFileSync(path + "script.js", "utf8"));
  return { dom, w, d: w.document, prints: () => prints };
}
const env = create();
const { w, d } = env;
const $ = (id) => d.getElementById(id);
const fill = (input, value) => {
  input.value = value;
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
};
const set = (id, value) => fill($(id), value);
const currency = (el) => el.textContent.replace(/\s/g, "");
const click = (id) => $(id).click();
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log("PASS " + name);
}
check(
  "starts with local date, one quantity, empty private fields and no storage",
  () => {
    assert.match($("date").value, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(d.querySelectorAll(".item-row").length, 1);
    assert.equal(d.querySelector(".item-qty").value, "1");
    assert.equal(w.localStorage.length, 0);
  },
);
check("blocks printing incomplete receipts and focuses invalid field", () => {
  click("printReceipt");
  assert.equal(env.prints(), 0);
  assert.equal($("cliente").getAttribute("aria-invalid"), "true");
  assert.equal(d.activeElement, $("cliente"));
});
set("cliente", "Cliente de teste");
fill(d.querySelector(".item-desc"), "Serviço de teste");
fill(d.querySelector(".item-unit"), "1.299,90");
set("paymentMethod", "Pix");
check("renders thousands correctly and emits a complete receipt", () => {
  assert.equal(currency($("previewTotal")), "R$1.299,90");
  assert.equal($("receipt").classList.contains("valid"), true);
  click("printReceipt");
  assert.equal(env.prints(), 1);
  assert.equal(d.title, "Recibos · Info Projekt");
});
check("invalid numeric input is never printed as a partial value", () => {
  fill(d.querySelector(".item-unit"), "79abc");
  click("printReceipt");
  assert.equal(env.prints(), 1);
  assert.equal($("previewTotal").textContent, "—");
  assert.equal(
    d.querySelector(".item-unit").getAttribute("aria-invalid"),
    "true",
  );
});
check("removing a line updates totals and keeps an editable row", () => {
  fill(d.querySelector(".item-unit"), "79,90");
  fill(d.querySelector(".item-qty"), "2");
  click("addItem");
  const rows = d.querySelectorAll(".item-row");
  fill(rows[1].querySelector(".item-desc"), "Outro serviço");
  fill(rows[1].querySelector(".item-unit"), "40,20");
  assert.equal(currency($("previewTotal")), "R$200,00");
  rows[1].querySelector(".remove-item").click();
  assert.equal(currency($("previewTotal")), "R$159,80");
});
check("rejects negative quantity and recalculates after correction", () => {
  fill(d.querySelector(".item-qty"), "-1");
  click("printReceipt");
  assert.equal(env.prints(), 1);
  assert.equal($("receipt").classList.contains("valid"), false);
  fill(d.querySelector(".item-qty"), "1");
  fill(d.querySelector(".item-unit"), "250,00");
});
check(
  "partial receipt separates total, received amount and remaining balance",
  () => {
    d.querySelector('input[value="partial"]').checked = true;
    d.querySelector('input[value="partial"]').dispatchEvent(
      new w.Event("change", { bubbles: true }),
    );
    set("received", "50,00");
    assert.equal($("receivedField").hidden, false);
    assert.equal(currency($("previewTotal")), "R$250,00");
    assert.equal(currency($("previewReceived")), "R$50,00");
    assert.equal(currency($("previewBalance")), "R$200,00");
    assert.equal($("receipt").classList.contains("valid"), true);
  },
);
check("mixed payments must add up to received amount", () => {
  set("paymentMethod", "mixed");
  const parts = d.querySelectorAll(".mixed-row");
  fill(parts[0].querySelector("input"), "30,00");
  fill(parts[1].querySelector("input"), "20,00");
  assert.equal($("receipt").classList.contains("valid"), true);
  fill(parts[1].querySelector("input"), "25,00");
  click("printReceipt");
  assert.equal(env.prints(), 1);
  assert.ok($("mixedError").textContent.length > 0);
  fill(parts[1].querySelector("input"), "20,00");
});
check("text is rendered literally without HTML injection", () => {
  set("notes", "<img src=x onerror=alert(1)>");
  assert.equal($("previewNotes").querySelector("img"), null);
  assert.equal($("previewNotes").textContent, "<img src=x onerror=alert(1)>");
});
check("draft storage requires opt-in and recovers all data", () => {
  assert.equal(w.localStorage.length, 0);
  $("saveDraft").checked = true;
  $("saveDraft").dispatchEvent(new w.Event("change", { bubbles: true }));
  const saved = w.localStorage.getItem("info-projekt.receipt.v2");
  assert.ok(saved);
  const restored = create(saved);
  assert.equal(restored.d.getElementById("cliente").value, "Cliente de teste");
  assert.equal(restored.d.getElementById("paymentMethod").value, "mixed");
  assert.equal(
    currency(restored.d.getElementById("previewBalance")),
    "R$200,00",
  );
  assert.equal(
    restored.d.getElementById("receipt").classList.contains("valid"),
    true,
  );
  restored.dom.window.close();
});
check("forget removes saved data without clearing the current receipt", () => {
  click("forgetDraft");
  assert.equal(w.localStorage.length, 0);
  assert.equal($("cliente").value, "Cliente de teste");
  assert.equal($("saveDraft").checked, false);
});
check("mobile view toggles without losing form state", () => {
  click("previewTab");
  assert.equal(d.body.classList.contains("preview-mode"), true);
  assert.equal($("previewTab").getAttribute("aria-pressed"), "true");
  click("editTab");
  assert.equal(d.body.classList.contains("preview-mode"), false);
  assert.equal($("cliente").value, "Cliente de teste");
});
check("duplicate resets reference and keeps content for editing", () => {
  set("reference", "OS-123");
  click("duplicateReceipt");
  assert.equal($("reference").value, "");
  assert.equal($("cliente").value, "Cliente de teste");
});
check("new receipt clears all fields, payment state and saved data", () => {
  click("newReceipt");
  assert.equal($("cliente").value, "");
  assert.equal(d.querySelectorAll(".item-row").length, 1);
  assert.equal($("paymentMethod").value, "");
  assert.equal($("receivedField").hidden, true);
  assert.equal($("notes").value, "");
  assert.equal(w.localStorage.length, 0);
});
check("zero total cannot be issued and has an explanatory error", () => {
  set("cliente", "Teste");
  fill(d.querySelector(".item-desc"), "Teste");
  fill(d.querySelector(".item-unit"), "0,00");
  set("paymentMethod", "Pix");
  click("printReceipt");
  assert.equal($("receipt").classList.contains("valid"), false);
  assert.ok($("itemsError").textContent.includes("maior que zero"));
});
check("rejects a malformed stored draft safely", () => {
  const malformed = create("{bad json");
  assert.equal(malformed.d.querySelectorAll(".item-row").length, 1);
  malformed.dom.window.close();
  const unknown = create(
    JSON.stringify({ version: 2, data: { client: "untrusted" } }),
  );
  assert.equal(unknown.d.getElementById("cliente").value, "");
  unknown.dom.window.close();
});
check("all editable controls have associated labels", () => {
  for (const input of d.querySelectorAll("input,textarea,select"))
    assert.ok(input.labels.length > 0, input.id);
});
assert.deepEqual(errors, []);
console.log(`${checks} integration checks passed; no runtime errors.`);
env.dom.window.close();
