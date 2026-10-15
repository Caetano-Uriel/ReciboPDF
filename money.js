/* Monetary values are integers in cents. No silent partial parsing. */
(function (root) {
  "use strict";
  const MAX_CENTS = 99999999999;
  function parseMoney(raw) {
    const value = String(raw ?? "").trim();
    if (!value || value.length > 20) return null;
    let normalized;
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) {
      normalized = value.replace(/\./g, "").replace(",", ".");
    } else if (/^\d+(,\d{1,2})?$/.test(value)) {
      normalized = value.replace(",", ".");
    } else if (/^\d+\.\d{1,2}$/.test(value)) {
      normalized = value;
    } else return null;
    const [whole, fraction = ""] = normalized.split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
  }
  function parseQuantity(raw) {
    const value = String(raw ?? "").trim();
    if (!/^\d+$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 && number <= 99999
      ? number
      : null;
  }
  function calculate(items) {
    let total = 0;
    const lines = items.map((item) => {
      const quantity = parseQuantity(item.quantity);
      const unit = parseMoney(item.unit);
      const amount =
        quantity === null || unit === null ? null : quantity * unit;
      const valid =
        amount !== null && Number.isSafeInteger(amount) && amount <= MAX_CENTS;
      if (valid) total += amount;
      return { quantity, unit, amount: valid ? amount : null };
    });
    return {
      lines,
      total,
      valid:
        lines.length > 0 &&
        lines.every((line) => line.amount !== null) &&
        Number.isSafeInteger(total) &&
        total <= MAX_CENTS,
    };
  }
  function validatePayment(total, type, receivedRaw, method, payments) {
    const received = type === "partial" ? parseMoney(receivedRaw) : total;
    const receivedValid =
      Number.isSafeInteger(received) &&
      received > 0 &&
      received <= total &&
      (type !== "partial" || received < total);
    const allowed = [
      "Pix",
      "Dinheiro",
      "Cartão",
      "Boleto bancário",
      "Link de pagamento",
    ];
    const methodValid = allowed.includes(method) || method === "mixed";
    let mixedValid = true;
    if (method === "mixed") {
      const amounts = payments.map((payment) => parseMoney(payment.amount));
      mixedValid =
        payments.length >= 2 &&
        payments.length <= 5 &&
        payments.every(
          (payment, index) =>
            allowed.includes(payment.method) &&
            amounts[index] !== null &&
            amounts[index] > 0,
        ) &&
        amounts.reduce((sum, amount) => sum + (amount ?? 0), 0) === received;
    }
    return {
      received,
      receivedValid,
      methodValid,
      mixedValid,
      valid: receivedValid && methodValid && mixedValid,
    };
  }
  function formatMoney(cents) {
    return ((cents ?? 0) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  function formatInput(cents) {
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const api = {
    MAX_CENTS,
    parseMoney,
    parseQuantity,
    calculate,
    validatePayment,
    formatMoney,
    formatInput,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ReceiptMath = api;
})(typeof window !== "undefined" ? window : globalThis);
