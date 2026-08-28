// Require login before doing anything else on this page.
(async function guard() {
  const session = await requireAuth();
  if (!session) return;
  renderAuthNav();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  const nameField = document.getElementById("creatorName");
  const emailField = document.getElementById("creatorEmail");
  const whatsappField = document.getElementById("creatorWhatsapp");
  const meta = user.user_metadata || {};

  emailField.value = user.email || "";
  emailField.disabled = true;

  function lockRequestedBy(name, whatsapp) {
    nameField.value = name;
    nameField.disabled = true;
    whatsappField.value = whatsapp;
    whatsappField.disabled = true;
    window.__lockedRequestedBy = { name, email: user.email || "", whatsapp };
  }

  if (meta.full_name && meta.whatsapp) {
    lockRequestedBy(meta.full_name, meta.whatsapp);
  } else {
    // First time here — collect name + WhatsApp once, save to the account, then lock the form.
    document.getElementById("poForm").style.display = "none";
    const setupCard = document.getElementById("profileSetupCard");
    setupCard.style.display = "block";

    document.getElementById("profileSaveBtn").addEventListener("click", async () => {
      const name = document.getElementById("profileName").value.trim();
      const whatsapp = document.getElementById("profileWhatsapp").value.trim();
      const msg = document.getElementById("profileMsg");
      msg.innerHTML = "";
      if (!name || !whatsapp) {
        msg.innerHTML = `<div class="error-box">Both fields are required.</div>`;
        return;
      }
      const { error } = await sb.auth.updateUser({ data: { full_name: name, whatsapp } });
      if (error) {
        msg.innerHTML = `<div class="error-box">${error.message}</div>`;
        return;
      }
      setupCard.style.display = "none";
      document.getElementById("poForm").style.display = "block";
      lockRequestedBy(name, whatsapp);
    });
  }
})();

function fillSelect(el, options, placeholder) {
  el.innerHTML = "";
  if (placeholder) {
    const o = document.createElement("option");
    o.value = ""; o.textContent = placeholder; o.disabled = true; o.selected = true;
    el.appendChild(o);
  }
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt; o.textContent = opt;
    el.appendChild(o);
  });
}

const branchEl = document.getElementById("branch");
const productEl = document.getElementById("product");
const vendorEl = document.getElementById("vendor");
const splitUpEl = document.getElementById("splitUp");
const poPurposeEl = document.getElementById("poPurpose");
const bucketInputsEl = document.getElementById("bucketInputs");
const preparedForNameEl = document.getElementById("preparedForName");
const preparedForEmailEl = document.getElementById("preparedForEmail");
const preparedForWhatsappEl = document.getElementById("preparedForWhatsapp");
const overallStockEl = document.getElementById("overallStock");
const currentOrderValueEl = document.getElementById("currentOrderValue");

fillSelect(branchEl, BRANCHES, "Select branch");
fillSelect(productEl, PRODUCTS, "Select product");
fillSelect(vendorEl, VENDORS, "Select vendor");
SPLIT_UPS.forEach((s) => { const o = document.createElement("option"); o.value = s; o.textContent = s; splitUpEl.appendChild(o); });
fillSelect(poPurposeEl, PO_PURPOSES, "Select purpose");

function renderPreparedForOptions() {
  const branch = branchEl.value;
  const people = BRANCH_PEOPLE[branch] || [];
  preparedForEmailEl.value = "";
  preparedForWhatsappEl.value = "";
  if (!people.length) {
    fillSelect(preparedForNameEl, [], "Select branch first");
    return;
  }
  fillSelect(preparedForNameEl, people.map((p) => p.name), "Select person");
}
branchEl.addEventListener("change", renderPreparedForOptions);

preparedForNameEl.addEventListener("change", () => {
  const branch = branchEl.value;
  const people = BRANCH_PEOPLE[branch] || [];
  const person = people.find((p) => p.name === preparedForNameEl.value);
  preparedForEmailEl.value = person ? person.email : "";
  preparedForWhatsappEl.value = person ? person.whatsapp : "";
});

// ---------- Lakhs-format helpers ----------
// Values here should always be entered in ₹ Lakhs (e.g. ₹12,67,873 -> 12.68).
// Anything at or above this threshold almost certainly means someone typed
// a raw rupee figure instead, so we surface a conversion suggestion inline
// rather than silently accepting it.
const RAW_RUPEE_THRESHOLD = 1000;

function lakhsWarning(value) {
  if (!value || value < RAW_RUPEE_THRESHOLD) return "";
  const suggestion = (value / 100000).toFixed(2);
  return `This looks like a raw rupee amount, not Lakhs. In Lakhs, ₹${value.toLocaleString("en-IN")} would be ${suggestion}. Please re-enter using Lakhs.`;
}

function updateFieldWarning(inputEl, warnEl) {
  const value = Number(inputEl.value || 0);
  warnEl.textContent = lakhsWarning(value);
}

const overallStockWarnEl = document.getElementById("overallStockWarn");
const currentOrderValueWarnEl = document.getElementById("currentOrderValueWarn");
const bucketWarnEl = document.getElementById("bucketWarn");

// Bucket sum vs. overall stock value: these should match, with a small
// tolerance for rounding — allowed to be up to 1 (Lakh) lower, or up to 2
// (Lakh) higher, than the overall stock value.
const SUM_TOLERANCE_LOWER = 1;
const SUM_TOLERANCE_UPPER = 2;

function sumMismatchWarning(overallStock, bucketValues) {
  if (!overallStock) return "";
  const sum = bucketValues.reduce((a, b) => a + b, 0);
  const lowerBound = overallStock - SUM_TOLERANCE_LOWER;
  const upperBound = overallStock + SUM_TOLERANCE_UPPER;
  if (sum < lowerBound || sum > upperBound) {
    return `<div class="warn-box">Bucket values add up to ${sum.toFixed(2)}, but Overall stock value is ${overallStock.toFixed(2)}. These should match (a little rounding — up to 1 lower or 2 higher — is fine).</div>`;
  }
  return "";
}

function renderBucketInputs() {
  const product = productEl.value;
  const labels = AGING_BUCKETS[product] || ["Bucket 1", "Bucket 2", "Bucket 3", "Bucket 4"];
  bucketInputsEl.innerHTML = "";
  labels.forEach((label, i) => {
    const div = document.createElement("div");
    div.className = "bucket-box";
    div.innerHTML = `
      <span class="label-tag">${label} <span class="req">*</span></span>
      <input type="number" step="0.01" min="0" class="bucket-value" data-index="${i}" required />
    `;
    bucketInputsEl.appendChild(div);
  });
  // Bucket inputs are inside #poForm, so the form-level delegated listener
  // (added further down) picks up their input events automatically —
  // no per-input listener needs to be attached here.
}
productEl.addEventListener("change", renderBucketInputs);
renderBucketInputs();

function getBucketValues() {
  return Array.from(document.querySelectorAll(".bucket-value")).map((i) => Number(i.value || 0));
}
function getBucketLabels() {
  return AGING_BUCKETS[productEl.value] || ["Bucket 1", "Bucket 2", "Bucket 3", "Bucket 4"];
}

function buildPreviewTable(overallStock, bucketValues, approved, bucketLabels) {
  const totalApproved = approved.reduce((a, b) => a + b, 0);

  const headerCells = bucketLabels.map((l) => `<th>${l}</th>`).join("");

  const stockCells = bucketValues.map((v, i) => {
    const cls = v <= approved[i] ? "cell-ok" : "cell-warn";
    return `<td class="${cls}">${v.toFixed(2)}</td>`;
  }).join("");

  const capCells = approved.map((v) => `<td>${v.toFixed(2)}</td>`).join("");

  return `
    <thead>
      <tr><th></th><th>Total</th>${headerCells}</tr>
    </thead>
    <tbody>
      <tr><td>Stock value</td><td class="cell-total">${overallStock.toFixed(2)}</td>${stockCells}</tr>
      <tr><td>Approved cap</td><td class="cell-total">${totalApproved.toFixed(2)}</td>${capCells}</tr>
    </tbody>
  `;
}

// ---------- Partner name / PO document — B2B orders only ----------
const partnerNameEl = document.getElementById("partnerName");
const poAttachedEl = document.getElementById("poAttached");

function isB2BPurpose(value) {
  return (value || "").toLowerCase().includes("b2b");
}

function updatePartnerFieldsForPurpose() {
  const enabled = isB2BPurpose(poPurposeEl.value);
  partnerNameEl.disabled = !enabled;
  poAttachedEl.disabled = !enabled;
  if (!enabled) {
    partnerNameEl.value = "";
    poAttachedEl.checked = false;
  }
}

// ---------- Stock Aging validation + Approval Preview (live) ----------
const stockAgingCard = document.getElementById("stockAgingCard");
const stockAgingTopBanner = document.getElementById("stockAgingTopBanner");
const submitBtn = document.getElementById("submitBtn");

function isFormComplete() {
  const bucketInputs = Array.from(document.querySelectorAll(".bucket-value"));
  const bucketsFilled = bucketInputs.length > 0 && bucketInputs.every((i) => i.value !== "");
  return Boolean(
    branchEl.value &&
    productEl.value &&
    vendorEl.value &&
    poPurposeEl.value &&
    preparedForNameEl.value &&
    overallStockEl.value !== "" &&
    currentOrderValueEl.value !== "" &&
    bucketsFilled &&
    document.getElementById("creatorName").value &&
    document.getElementById("creatorEmail").value &&
    document.getElementById("creatorWhatsapp").value
  );
}

function updatePreview() {
  const overallStock = Number(overallStockEl.value || 0);
  const bucketValues = getBucketValues();
  const bucketLabels = getBucketLabels();
  const product = productEl.value;
  const poPurpose = poPurposeEl.value;
  const currentOrderValue = Number(currentOrderValueEl.value || 0);

  // Inline Lakhs-format warnings for the two standalone fields.
  const overallW = lakhsWarning(overallStock);
  const currentW = lakhsWarning(currentOrderValue);
  overallStockWarnEl.textContent = overallW;
  currentOrderValueWarnEl.textContent = currentW;

  // Combined warning box below the buckets: sum-vs-overall mismatch, plus
  // any individual bucket that looks like a raw rupee figure.
  const sumW = sumMismatchWarning(overallStock, bucketValues);
  const bucketRawRupeeMsgs = bucketValues
    .map((v, i) => {
      const w = lakhsWarning(v);
      return w ? `${bucketLabels[i]}: ${w}` : null;
    })
    .filter(Boolean);
  const bottomMessages = [sumW, ...bucketRawRupeeMsgs].filter(Boolean);
  bucketWarnEl.innerHTML = bottomMessages.length
    ? `<div class="warn-box">${bottomMessages.join("<br/>")}</div>`
    : "";

  const hasStockAgingError = Boolean(overallW || currentW || bottomMessages.length);
  stockAgingCard.classList.toggle("card-error", hasStockAgingError);
  stockAgingTopBanner.textContent = hasStockAgingError
    ? "Please review the values highlighted below before continuing."
    : "";

  const { approved, status } = computeAutoStatus({
    overallStock, bucket1: bucketValues[0], bucket2: bucketValues[1],
    bucket3: bucketValues[2], bucket4: bucketValues[3], product, poPurpose,
  });

  document.getElementById("previewTable").innerHTML =
    buildPreviewTable(overallStock, bucketValues, approved, bucketLabels);

  const statusEl = document.getElementById("previewStatus");
  statusEl.textContent = status;
  statusEl.className = "status-pill " + (status === "Approved" ? "approved" : "not-approved");

  document.getElementById("previewNote").textContent =
    status === "Approved"
      ? "This PO will be auto-approved on submission — no director review needed."
      : "This PO will be routed to director review automatically. The director will be notified by WhatsApp and email.";

  submitBtn.disabled = !(isFormComplete() && !hasStockAgingError);

  return { overallStock, bucketValues, bucketLabels, product, poPurpose, approved, status };
}

// A single delegated listener covers every field in the form — including
// bucket inputs, which are re-created on every product change — so the
// preview, warnings, and submit-button state all stay in sync without
// needing to re-attach listeners each time the DOM changes.
document.getElementById("poForm").addEventListener("input", handleFormChange);
document.getElementById("poForm").addEventListener("change", handleFormChange);

function handleFormChange(e) {
  if (e.target && e.target.id === "poPurpose") {
    updatePartnerFieldsForPurpose();
  }
  updatePreview();
}

updatePartnerFieldsForPurpose();
// Render an initial (zeroed) preview on page load so the section is never empty.
updatePreview();

document.getElementById("poForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById("resultMsg");
  resultEl.innerHTML = "";

  if (!preparedForNameEl.value) {
    resultEl.innerHTML = `<div class="error-box">Please select who this PO is prepared for.</div>`;
    return;
  }

  const preview = updatePreview();

  const payload = {
    branch: branchEl.value,
    product: productEl.value,
    vendor: vendorEl.value,
    splitUp: splitUpEl.value || null,
    poPurpose: poPurposeEl.value,
    partnerName: document.getElementById("partnerName").value || null,
    poAttached: document.getElementById("poAttached").checked,
    overallStock: preview.overallStock,
    bucketLabels: preview.bucketLabels,
    bucketValues: preview.bucketValues,
    currentOrderValue: Number(currentOrderValueEl.value || 0),
    creatorName: document.getElementById("creatorName").value,
    creatorEmail: document.getElementById("creatorEmail").value,
    creatorWhatsapp: document.getElementById("creatorWhatsapp").value,
    preparedForName: preparedForNameEl.value,
    preparedForEmail: preparedForEmailEl.value,
    preparedForWhatsapp: preparedForWhatsappEl.value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    const token = await getAccessToken();
    if (!token) { window.location.href = "login.html"; return; }

    const res = await fetch(`${window.PO_CONFIG.SUPABASE_URL}/functions/v1/create-po`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": window.PO_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit PO");

    const po = data.po;
    resultEl.innerHTML = `
      <div class="success-box">
        PO <strong>${po.po_number}</strong> submitted. Status: <strong>${po.final_status}</strong>.
        ${po.final_status === "Pending Director Review" ? "The director has been notified by WhatsApp and email." : ""}
      </div>
    `;
    document.getElementById("poForm").reset();
    renderBucketInputs();
    renderPreparedForOptions();
    // form.reset() clears disabled fields too — restore the locked "Requested by" values.
    if (window.__lockedRequestedBy) {
      document.getElementById("creatorName").value = window.__lockedRequestedBy.name;
      document.getElementById("creatorEmail").value = window.__lockedRequestedBy.email;
      document.getElementById("creatorWhatsapp").value = window.__lockedRequestedBy.whatsapp;
    }
    updatePartnerFieldsForPurpose();
    updatePreview();
  } catch (err) {
    resultEl.innerHTML = `<div class="error-box">${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit PO";
  }
});
