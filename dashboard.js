const contentEl = document.getElementById("content");
let allPos = [];

async function fetchData() {
  const token = await getAccessToken();
  const res = await fetch(`${window.PO_CONFIG.SUPABASE_URL}/functions/v1/list-pos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": window.PO_CONFIG.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load data");
  return data;
}

function statusPillClass(status) {
  if (status === "Director Approved" || status === "Auto Approved") return "approved";
  if (status === "Director Rejected") return "not-approved";
  return "pending";
}

function renderSummary(summary) {
  const branchRows = Object.entries(summary.byBranch)
    .sort((a, b) => b[1] - a[1])
    .map(([branch, count]) => `<tr><td style="text-align:left;">${branch}</td><td>${count}</td></tr>`)
    .join("");

  return `
    <div class="card">
      <p class="section-title">Summary</p>
      <div class="stat-grid">
        <div class="stat-box"><div class="stat-num">${summary.total}</div><div class="stat-label">Total POs</div></div>
        <div class="stat-box"><div class="stat-num" style="color:var(--teal-dark);">${summary.autoApproved}</div><div class="stat-label">Auto Approved</div></div>
        <div class="stat-box"><div class="stat-num" style="color:var(--amber);">${summary.pendingReview}</div><div class="stat-label">Pending Review</div></div>
        <div class="stat-box"><div class="stat-num" style="color:var(--teal-dark);">${summary.directorApproved}</div><div class="stat-label">Director Approved</div></div>
        <div class="stat-box"><div class="stat-num" style="color:var(--red);">${summary.directorRejected}</div><div class="stat-label">Director Rejected</div></div>
      </div>
    </div>
    <div class="card">
      <p class="section-title">By branch</p>
      <table class="calc-table" style="width:100%; max-width:420px;">
        <thead><tr><th style="text-align:left;">Branch</th><th>POs</th></tr></thead>
        <tbody>${branchRows || '<tr><td colspan="2" style="text-align:center;color:var(--muted);">No data yet</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function renderFiltersAndTable(pos) {
  const branches = [...new Set(pos.map((p) => p.branch))].sort();
  const statuses = [...new Set(pos.map((p) => p.final_status))].sort();

  return `
    <div class="card">
      <p class="section-title">All purchase orders</p>
      <div class="grid" style="margin-bottom:16px;">
        <div class="field" style="margin-bottom:0;">
          <label for="searchBox">Search</label>
          <input id="searchBox" type="text" placeholder="PO number, requester name or email…" />
        </div>
        <div class="field" style="margin-bottom:0;">
          <label for="branchFilter">Branch</label>
          <select id="branchFilter"><option value="">All branches</option>${branches.map((b) => `<option value="${b}">${b}</option>`).join("")}</select>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label for="statusFilter">Status</label>
          <select id="statusFilter"><option value="">All statuses</option>${statuses.map((s) => `<option value="${s}">${s}</option>`).join("")}</select>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="calc-table" style="width:100%;">
          <thead>
            <tr>
              <th style="text-align:left;">PO Number</th><th style="text-align:left;">Branch</th>
              <th style="text-align:left;">Product</th><th style="text-align:left;">Vendor</th>
              <th>Order Value</th><th>Status</th><th style="text-align:left;">Requested By</th><th>Date</th>
            </tr>
          </thead>
          <tbody id="posTableBody"></tbody>
        </table>
      </div>
      <p class="note" id="rowCount"></p>
    </div>
  `;
}

function renderRows(pos) {
  const tbody = document.getElementById("posTableBody");
  const rowCount = document.getElementById("rowCount");
  if (pos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--muted); padding:20px;">No matching POs</td></tr>`;
  } else {
    tbody.innerHTML = pos.map((p) => `
      <tr>
        <td style="text-align:left; font-family:'IBM Plex Mono',monospace;">${p.po_number}</td>
        <td style="text-align:left;">${p.branch}</td>
        <td style="text-align:left;">${p.product}</td>
        <td style="text-align:left;">${p.vendor}</td>
        <td>₹${p.current_order_value}L</td>
        <td><span class="status-pill ${statusPillClass(p.final_status)}">${p.final_status}</span></td>
        <td style="text-align:left;">${p.creator_name}<br><span class="opt" style="font-size:11px;">${p.creator_email}</span></td>
        <td>${new Date(p.created_at).toLocaleDateString("en-IN")}</td>
      </tr>
    `).join("");
  }
  rowCount.textContent = `Showing ${pos.length} of ${allPos.length} POs`;
}

function applyFilters() {
  const search = document.getElementById("searchBox").value.trim().toLowerCase();
  const branch = document.getElementById("branchFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = allPos.filter((p) => {
    if (branch && p.branch !== branch) return false;
    if (status && p.final_status !== status) return false;
    if (search) {
      const haystack = `${p.po_number} ${p.creator_name} ${p.creator_email}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  renderRows(filtered);
}

async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderAuthNav();

  try {
    const data = await fetchData();
    allPos = data.pos;
    contentEl.innerHTML = renderSummary(data.summary) + renderFiltersAndTable(allPos);
    renderRows(allPos);

    document.getElementById("searchBox").addEventListener("input", applyFilters);
    document.getElementById("branchFilter").addEventListener("change", applyFilters);
    document.getElementById("statusFilter").addEventListener("change", applyFilters);
  } catch (err) {
    contentEl.innerHTML = `<div class="card"><div class="error-box">${err.message}</div></div>`;
  }
}

init();
