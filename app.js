// Require login before doing anything else on this page.
(async function guard() {
  const session = await requireAuth();
  if (!session) return;
  renderAuthNav();
  const { data: { user } } = await sb.auth.getUser();
  if (user && user.email) {
    const emailField = document.getElementById("creatorEmail");
    if (emailField && !emailField.value) emailField.value = user.email;
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

fillSelect(branchEl, BRANCHES, "Select branch");
fillSelect(productEl, PRODUCTS, "Select product");
fillSelect(vendorEl, VENDORS, "Select vendor");
SPLIT_UPS.forEach((s) => { const o = document.createElement("option"); o.value = s; o.textContent = s; splitUpEl.appendChild(o); });
fillSelect(poPurposeEl, PO_PURPOSES, "Select purpose");

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
}
productEl.addEventListener("change", renderBucketInputs);
renderBucketInputs();

function getBucketValues() {
  return Array.from(document.querySelectorAll(".bucket-value")).map((i) => Number(i.value || 0));
}
function getBucketLabels() {
  return AGING_BUCKETS[productEl.value] || ["Bucket 1", "Bucket 2", "Bucket 3", "Bucket 4"];
}

function runPreview() {
  const overallStock = Number(document.getElementById("overallStock").value || 0);
  const bucketValues = getBucketValues();
  const bucketLabels = getBucketLabels();
  const product = productEl.value;
  const poPurpose = poPurposeEl.value;

  const { approved, status } = computeAutoStatus({
    overallStock, bucket1: bucketValues[0], bucket2: bucketValues[1],
    bucket3: bucketValues[2], bucket4: bucketValues[3], product, poPurpose,
  });

  const table = document.getElementById("previewTable");
  table.innerHTML = `
    <thead><tr><th>Bucket</th>${bucketLabels.map((l) => `<th>${l}</th>`).join("")}</tr></thead>
    <tbody>
      <tr><td>Stock value</td>${bucketValues.map((v) => `<td>${v.toFixed(2)}</td>`).join("")}</tr>
      <tr><td>Approved cap</td>${approved.map((v) => `<td>${v.toFixed(2)}</td>`).join("")}</tr>
    </tbody>
  `;

  const statusEl = document.getElementById("previewStatus");
  statusEl.textContent = status;
  statusEl.className = "status-pill " + (status === "Approved" ? "approved" : "not-approved");

  document.getElementById("previewNote").textContent =
    status === "Approved"
      ? "This PO will be auto-approved on submission — no director review needed."
      : "This PO will be routed to director review automatically. The director will be notified by WhatsApp and email.";

  document.getElementById("previewCard").style.display = "block";
  return { overallStock, bucketValues, bucketLabels, product, poPurpose, approved, status };
}

document.getElementById("previewBtn").addEventListener("click", runPreview);

document.getElementById("poForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  const resultEl = document.getElementById("resultMsg");
  resultEl.innerHTML = "";

  const preview = runPreview();

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
    currentOrderValue: Number(document.getElementById("currentOrderValue").value || 0),
    creatorName: document.getElementById("creatorName").value,
    creatorEmail: document.getElementById("creatorEmail").value,
    creatorWhatsapp: document.getElementById("creatorWhatsapp").value,
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
    document.getElementById("previewCard").style.display = "none";
  } catch (err) {
    resultEl.innerHTML = `<div class="error-box">${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit PO";
  }
});
