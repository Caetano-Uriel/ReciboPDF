"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../money.js");

test("reads Brazilian currency without losing thousands or cents", () => {
  for (const [value, cents] of [
    ["79,90", 7990],
    ["1.299,90", 129990],
    ["1299,90", 129990],
    ["1.299", 129900],
    ["1.000.000,01", 100000001],
    ["0,01", 1],
    ["79.90", 7990],
    ["50", 5000],
    [" 50,5 ", 5050],
  ])
    assert.equal(M.parseMoney(value), cents, value);
});
test("rejects partial numbers, negatives, malformed grouping and excess precision", () => {
  for (const value of [
    "",
    " ",
    "79abc",
    "-50",
    "1,299.90",
    "1.29,90",
    "1,2,3",
    "12,345",
    "1e3",
    "Infinity",
    "NaN",
    "0x10",
    "9".repeat(30),
  ])
    assert.equal(M.parseMoney(value), null, value);
});
test("quantity must be a positive bounded integer", () => {
  for (const value of ["0", "-1", "1.5", "1,5", "2abc", "", "100000"])
    assert.equal(M.parseQuantity(value), null, value);
  assert.equal(M.parseQuantity("2"), 2);
});
test("multiplies and sums using exact cents", () => {
  const result = M.calculate([
    { quantity: "2", unit: "79,90" },
    { quantity: "1", unit: "1.299,90" },
  ]);
  assert.equal(result.total, 145970);
  assert.equal(result.valid, true);
  assert.equal(M.calculate([{ quantity: "3", unit: "0,10" }]).total, 30);
});
test("invalid and oversized lines never become a valid receipt", () => {
  assert.equal(M.calculate([{ quantity: "-1", unit: "50,00" }]).valid, false);
  assert.equal(M.calculate([{ quantity: "1", unit: "79abc" }]).valid, false);
  assert.equal(
    M.calculate([{ quantity: "99999", unit: "999.999.999,99" }]).valid,
    false,
  );
  assert.equal(M.calculate([]).valid, false);
  assert.equal(
    M.calculate([
      { quantity: "1", unit: "999.999.999,99" },
      { quantity: "1", unit: "1,00" },
    ]).valid,
    false,
  );
});
test("validates full and partial receipts against the actual received amount", () => {
  assert.equal(M.validatePayment(25000, "full", "", "Pix", []).received, 25000);
  const partial = M.validatePayment(25000, "partial", "50,00", "Pix", []);
  assert.equal(partial.valid, true);
  assert.equal(partial.received, 5000);
  for (const amount of ["0,00", "-50", "250,00", "300,00", "50abc", ""])
    assert.equal(
      M.validatePayment(25000, "partial", amount, "Pix", []).valid,
      false,
      amount,
    );
  assert.equal(M.validatePayment(0, "full", "", "Pix", []).valid, false);
  assert.equal(M.validatePayment(25000, "full", "", "", []).valid, false);
});
test("mixed payments must equal the amount received, including partial payments", () => {
  const parts = [
    { method: "Pix", amount: "30,00" },
    { method: "Dinheiro", amount: "20,00" },
  ];
  assert.equal(
    M.validatePayment(25000, "partial", "50,00", "mixed", parts).valid,
    true,
  );
  assert.equal(
    M.validatePayment(25000, "full", "", "mixed", parts).valid,
    false,
  );
  assert.equal(M.validatePayment(5000, "full", "", "mixed", parts).valid, true);
  assert.equal(
    M.validatePayment(5000, "full", "", "mixed", [
      { method: "Pix", amount: "50,00" },
    ]).valid,
    false,
  );
  assert.equal(
    M.validatePayment(5000, "full", "", "mixed", [
      { method: "Pix", amount: "50,00" },
      { method: "Dinheiro", amount: "0" },
    ]).valid,
    false,
  );
});
