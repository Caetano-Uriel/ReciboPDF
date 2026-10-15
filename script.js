(function () {
  "use strict";
  const M = window.ReceiptMath;
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "info-projekt.receipt.v2";
  const METHODS = [
    "Pix",
    "Dinheiro",
    "Cartão",
    "Boleto bancário",
    "Link de pagamento",
  ];
  let counter = 0;
  let attempted = false;
  let dirty = false;
  let saveTimer;
  let toastTimer;

  function today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() >= 1900 &&
      date.getFullYear() <= 9999 &&
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` ===
        value
    );
  }
  function displayDate(value) {
    return validDate(value) ? value.split("-").reverse().join("/") : "—";
  }
  function trashIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("toast").hidden = true;
    }, 4500);
  }
  function addItem(data = {}, focus = false) {
    if ($("items").children.length >= 100) {
      toast("Limite de 100 itens por recibo.");
      return;
    }
    const id = ++counter;
    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.id = id;
    row.innerHTML = `<div class="item-fields">
      <div class="item-description"><label class="sr-only" for="description-${id}">Descrição do item ${id}</label><input id="description-${id}" class="item-desc" maxlength="500" placeholder="Ex.: Mensalidade de internet" list="serviceSuggestions" autocomplete="off" required aria-describedby="item-error-${id}"></div>
      <div class="item-quantity"><label class="item-mobile-label" for="quantity-${id}"><span class="sr-only">Item ${id}: </span>Quantidade</label><input id="quantity-${id}" class="item-qty" type="number" inputmode="numeric" min="1" max="99999" step="1" required aria-describedby="item-error-${id}"></div>
      <div class="item-price"><label class="item-mobile-label" for="unit-${id}"><span class="sr-only">Item ${id}: </span>Valor unitário</label><input id="unit-${id}" class="item-unit" inputmode="decimal" maxlength="20" placeholder="0,00" required aria-describedby="item-error-${id}"></div>
      <button type="button" class="remove-button remove-item" aria-label="Excluir item ${id}">${trashIcon()}</button>
      </div><div class="item-subtotal"><span class="field-error" id="item-error-${id}"></span><strong class="line-total">—</strong></div>`;
    row.querySelector(".item-desc").value = data.description || "";
    row.querySelector(".item-qty").value = data.quantity ?? "1";
    row.querySelector(".item-unit").value = data.unit || "";
    $("items").appendChild(row);
    if (focus) row.querySelector(".item-desc").focus();
  }
  function addPayment(data = {}, focus = false) {
    if ($("paymentRows").children.length >= 5) {
      toast("Você pode combinar até cinco formas de pagamento.");
      return;
    }
    const id = ++counter;
    const row = document.createElement("div");
    row.className = "mixed-row";
    row.innerHTML = `<label class="sr-only" for="method-${id}">Forma da parcela ${id}</label><select id="method-${id}" class="mixed-method" aria-describedby="mixedError"></select><label class="sr-only" for="amount-${id}">Valor da parcela ${id}</label><input id="amount-${id}" class="mixed-amount" inputmode="decimal" maxlength="20" placeholder="0,00" aria-describedby="mixedError"><button type="button" class="remove-button remove-payment" aria-label="Excluir forma de pagamento">${trashIcon()}</button>`;
    const select = row.querySelector("select");
    for (const method of METHODS) {
      const option = document.createElement("option");
      option.value = method;
      option.textContent = method;
      select.appendChild(option);
    }
    select.value = METHODS.includes(data.method)
      ? data.method
      : METHODS[$("paymentRows").children.length % METHODS.length];
    row.querySelector("input").value = data.amount || "";
    $("paymentRows").appendChild(row);
    if (focus) select.focus();
  }
  function snapshot() {
    return {
      date: $("date").value,
      reference: $("reference").value.trim(),
      client: $("cliente").value.trim(),
      address: $("address").value.trim(),
      items: Array.from($("items").children, (row) => ({
        description: row.querySelector(".item-desc").value.trim(),
        quantity: row.querySelector(".item-qty").value,
        unit: row.querySelector(".item-unit").value,
      })),
      paymentType: document.querySelector('input[name="paymentType"]:checked')
        .value,
      received: $("received").value,
      paymentMethod: $("paymentMethod").value,
      payments: Array.from($("paymentRows").children, (row) => ({
        method: row.querySelector("select").value,
        amount: row.querySelector("input").value,
      })),
      notes: $("notes").value.trim(),
      receiver: $("receiver").value.trim(),
    };
  }
  function error(input, output, message, show) {
    output.textContent = show ? message : "";
    if (show && message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", output.id);
    } else input.removeAttribute("aria-invalid");
  }
  function isTouched(input) {
    return attempted || input.dataset.touched === "true";
  }
  function validate(state, calc, payment) {
    error(
      $("date"),
      $("dateError"),
      validDate(state.date) ? "" : "Informe uma data válida.",
      isTouched($("date")),
    );
    error(
      $("cliente"),
      $("clientError"),
      state.client ? "" : "Informe o nome do cliente.",
      isTouched($("cliente")),
    );
    error(
      $("paymentMethod"),
      $("methodError"),
      payment.methodValid ? "" : "Selecione a forma de pagamento.",
      isTouched($("paymentMethod")),
    );
    error(
      $("received"),
      $("receivedError"),
      payment.receivedValid
        ? ""
        : "Informe um valor maior que zero e menor que o total dos itens.",
      isTouched($("received")),
    );
    Array.from($("items").children).forEach((row, index) => {
      const item = state.items[index],
        line = calc.lines[index];
      const inputs = [
        row.querySelector(".item-desc"),
        row.querySelector(".item-qty"),
        row.querySelector(".item-unit"),
      ];
      const messages = [
        item.description ? "" : "Descreva o serviço ou produto.",
        line.quantity !== null
          ? ""
          : "Use uma quantidade inteira de 1 a 99.999.",
        line.unit !== null ? "" : "Informe um preço válido. Ex.: 1.299,90.",
      ];
      if (!messages.some(Boolean) && line.amount === null)
        messages[2] = "O subtotal ultrapassa o limite permitido.";
      const show =
        attempted || inputs.some((input) => input.dataset.touched === "true");
      row.querySelector(".field-error").textContent = show
        ? messages.find(Boolean) || ""
        : "";
      inputs.forEach((input, i) => {
        if (show && messages[i]) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      });
    });
    $("itemsError").textContent =
      attempted && calc.valid && calc.total === 0
        ? "O total do recibo deve ser maior que zero."
        : attempted && calc.total > M.MAX_CENTS
          ? "O total dos itens ultrapassa o limite permitido."
          : "";
    const showMixed =
      attempted ||
      Array.from($("paymentRows").querySelectorAll("input,select")).some(
        (input) => input.dataset.touched === "true",
      );
    $("mixedError").textContent =
      state.paymentMethod === "mixed" && !payment.mixedValid && showMixed
        ? "Preencha pelo menos duas formas com valores positivos. A soma deve ser igual ao valor recebido."
        : "";
    for (const input of $("paymentRows").querySelectorAll("input,select")) {
      if (state.paymentMethod === "mixed" && !payment.mixedValid && showMixed)
        input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    const descriptionsValid = state.items.every((item) => item.description);
    return (
      validDate(state.date) &&
      Boolean(state.client) &&
      descriptionsValid &&
      calc.valid &&
      calc.total > 0 &&
      payment.valid
    );
  }
  function render() {
    const state = snapshot();
    const calc = M.calculate(state.items);
    const payment = M.validatePayment(
      calc.total,
      state.paymentType,
      state.received,
      state.paymentMethod,
      state.payments,
    );
    const valid = validate(state, calc, payment);
    const totalSafe = calc.valid ? M.formatMoney(calc.total) : "—";
    const receivedSafe =
      calc.valid && payment.receivedValid
        ? M.formatMoney(payment.received)
        : "—";
    $("itemCount").textContent =
      `${state.items.length} ${state.items.length === 1 ? "item" : "itens"}`;
    Array.from($("items").children).forEach((row, i) => {
      row.querySelector(".line-total").textContent =
        calc.lines[i].amount === null
          ? "—"
          : M.formatMoney(calc.lines[i].amount);
    });
    $("editorTotal").textContent = totalSafe;
    $("previewTotal").textContent = totalSafe;
    $("previewReceived").textContent = receivedSafe;
    $("previewDate").textContent = displayDate(state.date);
    $("previewClient").textContent = state.client || "Nome do cliente";
    $("previewClient").classList.toggle("placeholder", !state.client);
    $("previewAddress").textContent = state.address;
    $("previewAddress").hidden = !state.address;
    $("referenceLine").hidden = !state.reference;
    $("previewReference").textContent = state.reference;
    $("previewItems").replaceChildren();
    state.items.forEach((item, index) => {
      const line = calc.lines[index];
      const tr = document.createElement("tr");
      const cells = [
        item.description || "Descrição do serviço ou produto",
        line.quantity ?? "—",
        line.unit === null ? "—" : M.formatMoney(line.unit),
        line.amount === null ? "—" : M.formatMoney(line.amount),
      ];
      cells.forEach((text, i) => {
        const td = document.createElement("td");
        td.textContent = String(text);
        if (i === 0 && !item.description) td.className = "placeholder";
        tr.appendChild(td);
      });
      $("previewItems").appendChild(tr);
    });
    const partial = state.paymentType === "partial";
    $("receivedField").hidden = !partial;
    $("received").disabled = !partial;
    $("balanceSummary").hidden = !partial;
    $("previewBalanceLine").hidden = !partial;
    const balance =
      calc.valid && payment.receivedValid
        ? M.formatMoney(calc.total - payment.received)
        : "—";
    $("remainingBalance").textContent = balance;
    $("previewBalance").textContent = balance;
    $("mixedPayments").hidden = state.paymentMethod !== "mixed";
    $("previewMethod").textContent =
      state.paymentMethod === "mixed"
        ? "Pagamento misto"
        : state.paymentMethod || "A informar";
    $("previewMethod").classList.toggle("placeholder", !state.paymentMethod);
    $("previewMixed").replaceChildren();
    if (state.paymentMethod === "mixed")
      for (const part of state.payments) {
        const p = document.createElement("p");
        const amount = M.parseMoney(part.amount);
        p.textContent = `${part.method}: ${amount === null ? "—" : M.formatMoney(amount)}`;
        $("previewMixed").appendChild(p);
      }
    $("previewNotesSection").hidden = !state.notes;
    $("previewNotes").textContent = state.notes;
    $("previewReceiver").textContent = state.receiver || "Info Projekt";
    $("receiptStatement").textContent = valid
      ? `Recebemos de ${state.client} a quantia de ${M.formatMoney(payment.received)}, referente aos itens discriminados acima.${partial ? " Este recibo registra um pagamento parcial; o saldo pendente está indicado acima." : ""}`
      : "Confira os dados antes de emitir este recibo.";
    $("receipt").classList.toggle("valid", valid);
    $("readyState").classList.toggle("complete", valid);
    $("readyState").replaceChildren();
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = valid ? "✓" : "○";
    const text = document.createElement("p");
    text.textContent = valid
      ? "Tudo pronto para emitir."
      : "Confira o preenchimento.";
    const small = document.createElement("small");
    small.textContent = valid
      ? "Revise os dados na prévia antes de imprimir."
      : "Cliente, itens e pagamento são obrigatórios.";
    text.appendChild(small);
    $("readyState").append(icon, text);
    $("addItem").disabled = state.items.length >= 100;
    $("addPayment").disabled = state.payments.length >= 5;
    return { state, valid };
  }
  function saveDraft() {
    clearTimeout(saveTimer);
    if (!$("saveDraft").checked) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          savedAt: new Date().toISOString(),
          data: snapshot(),
        }),
      );
      $("draftStatus").textContent =
        `Rascunho salvo neste navegador às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`;
      $("forgetDraft").hidden = false;
    } catch {
      $("draftStatus").textContent =
        "Não foi possível salvar. Mantenha esta página aberta até imprimir.";
    }
  }
  function changed() {
    dirty = true;
    render();
    clearTimeout(saveTimer);
    if ($("saveDraft").checked) saveTimer = setTimeout(saveDraft, 350);
  }
  function forgetDraft() {
    clearTimeout(saveTimer);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Saving can be unavailable in private browsing. */
    }
    $("saveDraft").checked = false;
    $("forgetDraft").hidden = true;
    $("draftStatus").textContent =
      "O preenchimento atual não está sendo salvo.";
  }
  function setView(preview) {
    document.body.classList.toggle("preview-mode", preview);
    $("editTab").classList.toggle("selected", !preview);
    $("previewTab").classList.toggle("selected", preview);
    $("editTab").setAttribute("aria-pressed", String(!preview));
    $("previewTab").setAttribute("aria-pressed", String(preview));
  }
  function reset() {
    clearTimeout(saveTimer);
    $("receiptForm").reset();
    $("items").replaceChildren();
    $("paymentRows").replaceChildren();
    for (const input of document.querySelectorAll("[data-touched]"))
      delete input.dataset.touched;
    $("date").value = today();
    attempted = false;
    dirty = false;
    addItem();
    addPayment();
    addPayment();
    render();
  }
  function restoreDraft() {
    let entry;
    try {
      entry = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return;
    }
    if (!entry) return;
    const data = entry.data;
    const string = (value, max) =>
      typeof value === "string" && value.length <= max;
    const valid =
      entry.version === 2 &&
      data &&
      typeof data === "object" &&
      string(data.date, 10) &&
      string(data.client, 180) &&
      string(data.address, 300) &&
      string(data.reference, 60) &&
      string(data.notes, 3000) &&
      string(data.receiver, 120) &&
      string(data.received, 20) &&
      ["full", "partial"].includes(data.paymentType) &&
      [...METHODS, "", "mixed"].includes(data.paymentMethod) &&
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items.length <= 100 &&
      data.items.every(
        (item) =>
          item &&
          string(item.description, 500) &&
          string(item.quantity, 10) &&
          string(item.unit, 20),
      ) &&
      Array.isArray(data.payments) &&
      data.payments.length >= 2 &&
      data.payments.length <= 5 &&
      data.payments.every(
        (part) =>
          part && METHODS.includes(part.method) && string(part.amount, 20),
      );
    if (!valid) {
      $("draftStatus").textContent =
        "O rascunho salvo não pôde ser recuperado. Inicie um novo recibo.";
      return;
    }
    for (const [id, key] of [
      ["date", "date"],
      ["cliente", "client"],
      ["address", "address"],
      ["reference", "reference"],
      ["notes", "notes"],
      ["receiver", "receiver"],
      ["received", "received"],
      ["paymentMethod", "paymentMethod"],
    ])
      $(id).value = data[key];
    document.querySelector(
      `input[name="paymentType"][value="${data.paymentType}"]`,
    ).checked = true;
    $("items").replaceChildren();
    data.items.forEach((item) => addItem(item));
    $("paymentRows").replaceChildren();
    data.payments.forEach((part) => addPayment(part));
    $("saveDraft").checked = true;
    $("forgetDraft").hidden = false;
    $("draftStatus").textContent = "Rascunho recuperado deste navegador.";
    dirty = true;
    render();
  }

  reset();
  restoreDraft();
  $("receiptForm").addEventListener("submit", (event) => {
    event.preventDefault();
    $("printReceipt").click();
  });
  $("receiptForm").addEventListener("input", (event) => {
    if (event.target.id !== "saveDraft") changed();
  });
  $("receiptForm").addEventListener("change", (event) => {
    if (event.target.id === "saveDraft") {
      if (event.target.checked) saveDraft();
      else forgetDraft();
      return;
    }
    changed();
  });
  $("receiptForm").addEventListener("focusout", (event) => {
    const input = event.target;
    if (
      !input.matches("input,textarea,select") ||
      input.type === "checkbox" ||
      input.type === "radio"
    )
      return;
    input.dataset.touched = "true";
    if (input.matches(".item-unit,.mixed-amount,#received")) {
      const amount = M.parseMoney(input.value);
      if (amount !== null) input.value = M.formatInput(amount);
    }
    render();
    if ($("saveDraft").checked) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 350);
    }
  });
  $("addItem").addEventListener("click", () => {
    addItem({}, true);
    changed();
  });
  $("items").addEventListener("click", (event) => {
    const button = event.target.closest(".remove-item");
    if (!button) return;
    const row = button.closest(".item-row");
    const next = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    if (!$("items").children.length) addItem();
    (next || $("items").firstElementChild).querySelector("input").focus();
    changed();
  });
  $("addPayment").addEventListener("click", () => {
    addPayment({}, true);
    changed();
  });
  $("paymentRows").addEventListener("click", (event) => {
    const button = event.target.closest(".remove-payment");
    if (!button) return;
    if ($("paymentRows").children.length <= 2) {
      toast("O pagamento misto precisa de pelo menos duas formas.");
      return;
    }
    button.closest(".mixed-row").remove();
    changed();
    $("addPayment").focus();
  });
  $("forgetDraft").addEventListener("click", () => {
    forgetDraft();
    toast("Rascunho apagado. Os campos continuam disponíveis nesta aba.");
  });
  $("newReceipt").addEventListener("click", () => {
    if (
      dirty &&
      !window.confirm(
        "Começar um novo recibo? O preenchimento atual será apagado, inclusive o rascunho salvo.",
      )
    )
      return;
    forgetDraft();
    reset();
    setView(false);
    $("cliente").focus();
    toast("Novo recibo iniciado.");
  });
  $("duplicateReceipt").addEventListener("click", () => {
    if (
      !window.confirm(
        "Criar uma cópia com os dados atuais? A data será atualizada e a referência ficará em branco. Confira o pagamento antes de emitir.",
      )
    )
      return;
    $("date").value = today();
    $("reference").value = "";
    attempted = false;
    changed();
    setView(false);
    $("reference").focus();
    toast("Cópia iniciada. Informe uma nova referência, se necessário.");
  });
  $("editTab").addEventListener("click", () => setView(false));
  $("previewTab").addEventListener("click", () => setView(true));
  $("printReceipt").addEventListener("click", () => {
    attempted = true;
    const { valid } = render();
    if (!valid) {
      setView(false);
      const invalid = document.querySelector('[aria-invalid="true"]');
      if (invalid) invalid.focus();
      toast("Revise os campos destacados antes de emitir o recibo.");
      return;
    }
    if ($("saveDraft").checked) saveDraft();
    const previousTitle = document.title;
    const state = snapshot();
    const safe = (state.reference || state.client)
      .replace(/[\\/:*?"<>|\x00-\x1F]/g, "-")
      .slice(0, 80);
    document.title = `Recibo - ${safe} - ${state.date}`;
    const restoreTitle = () => {
      document.title = previousTitle;
    };
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
  });
  window.addEventListener("beforeprint", render);
  window.addEventListener("pagehide", saveDraft);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveDraft();
  });
})();
