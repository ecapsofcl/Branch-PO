const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const contentEl = document.getElementById("content");
const statusSubEl = document.getElementById("statusSub");

function fnUrl(name) {
  return `${window.PO_CONFIG.SUPABASE_URL}/functions/v1/${name}`;
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${window.PO_CONFIG.SUPABASE_ANON_KEY}`,
    "apikey": window.PO_CONFIG.SUPABASE_ANON_KEY,
  };
}

function statusPillClass(status) {
  if (status === "Director Approved" || status === "Auto Approved") return "approved";
  if (status === "Director Rejected") return "not-approved";
  return "pending";
}

function renderPO(po) {
  statusSubEl.textContent = po.po_number;

  const buckets = [
    [po.bucket_1_label, po.bucket_1_value, po.approved_1],
    [po.bucket_2_label, po.bucket_2_value, po.approved_2],
    [po.bucket_3_label, po.bucket_3_value, po.approved_3],
    [po.bucket_4_label, po.bucket_4_value, po.approved_4],
  ];

  const isPending = po.final_status === "Pending Director Review";

  contentEl.innerHTML = `
    <div class="card">
      <p class="section-title">PO ${po.po_number}</p>
      <div class="po-meta-grid">
        <div class="k">Branch</div><div class="v">${po.branch}</div>
        <div class="k">Product</div><div class="v">${po.product}</div>
        <div class="k">Vendor</div><div class="v">${po.vendor}</div>
        <div class="k">PO purpose</div><div class="v">${po.po_purpose}</div>
        <div class="k">Partner</div><div class="v">${po.partner_name || "—"}</div>
        <div class="k">PO attached</div><div class="v">${po.po_attached ? "Yes" : "No"}</div>
        <div class="k">Requested by</div><div class="v">${po.creator_name}</div>
        <div class="k">Prepared for</div><div class="v">${po.prepared_for_name || "—"}</div>
        <div class="k">Current order value</div><div class="v">₹${po.current_order_value}L</div>
      </div>

      <p class="section-title" style="margin-top:20px;">Stock aging (Lakhs)</p>
      <table class="calc-table">
        <thead><tr><th>Bucket</th>${buckets.map((b) => `<th>${b[0]}</th>`).join("")}</tr></thead>
        <tbody>
          <tr><td>Stock value</td>${buckets.map((b) => `<td>${b[1]}</td>`).join("")}</tr>
          <tr><td>Approved cap</td>${buckets.map((b) => `<td>${b[2].toFixed(2)}</td>`).join("")}</tr>
        </tbody>
      </table>

      <div class="result-panel">
        <span>Automatic system status:</span>
        <span class="status-pill ${po.auto_status === "Approved" ? "approved" : "not-approved"}">${po.auto_status}</span>
        &nbsp;&nbsp;
        <span>Current status:</span>
        <span class="status-pill ${statusPillClass(po.final_status)}">${po.final_status}</span>
      </div>
    </div>

    ${isPending ? `
    <div class="card" id="decisionCard">
      <p class="section-title">Your decision</p>
      <div id="decisionButtons" style="display:flex; gap:12px;">
        <button class="primary" id="approveBtn">Approve</button>
        <button class="reject" id="rejectBtn">Reject</button>
      </div>
      <div id="otpArea" style="display:none;">
        <p class="note" id="otpSentNote"></p>
        <div class="otp-row">
          <input id="otpInput" type="text" inputmode="numeric" maxlength="6" placeholder="000000" />
          <button class="primary" id="verifyBtn">Confirm</button>
        </div>
        <p class="note">Entering this OTP acts as your digital signature on this decision.</p>
      </div>
      <div id="decisionMsg"></div>
    </div>` : `
    <div class="card"><p>This PO has already been finalized. No further action needed.</p></div>
    `}
  `;

  if (isPending) wireDecisionButtons(po);
}

function wireDecisionButtons(po) {
  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn = document.getElementById("rejectBtn");
  const otpArea = document.getElementById("otpArea");
  const decisionButtons = document.getElementById("decisionButtons");
  const decisionMsg = document.getElementById("decisionMsg");
  const otpSentNote = document.getElementById("otpSentNote");

  async function requestOtp(decision) {
    decisionMsg.innerHTML = "";
    try {
      const res = await fetch(fnUrl("request-otp"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ reviewToken: token, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      decisionButtons.style.display = "none";
      otpArea.style.display = "block";
      otpSentNote.textContent = `OTP sent via WhatsApp and email to confirm: ${decision}.`;
    } catch (err) {
      decisionMsg.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  }

  approveBtn.addEventListener("click", () => requestOtp("Approved"));
  rejectBtn.addEventListener("click", () => requestOtp("Rejected"));

  document.getElementById("verifyBtn").addEventListener("click", async () => {
    const otp = document.getElementById("otpInput").value.trim();
    decisionMsg.innerHTML = "";
    try {
      const res = await fetch(fnUrl("verify-otp"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ reviewToken: token, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      decisionMsg.innerHTML = `<div class="success-box">Confirmed: ${data.finalStatus}. The requester has been notified.</div>`;
      document.getElementById("decisionCard").querySelectorAll("button, input").forEach((el) => el.disabled = true);
    } catch (err) {
      decisionMsg.innerHTML = `<div class="error-box">${err.message}</div>`;
    }
  });
}

async function load() {
  if (!token) {
    contentEl.innerHTML = `<div class="card"><div class="error-box">Missing review link token.</div></div>`;
    return;
  }
  try {
    const res = await fetch(`${fnUrl("get-po")}?token=${encodeURIComponent(token)}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "PO not found");
    renderPO(data.po);
  } catch (err) {
    contentEl.innerHTML = `<div class="card"><div class="error-box">${err.message}</div></div>`;
  }
}
load();
