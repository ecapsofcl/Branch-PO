const contentEl = document.getElementById("content");
async function fnUrl(name) {
  return `${window.PO_CONFIG.SUPABASE_URL}/functions/v1/${name}`;
}
async function callAdmin(action, extra) {
  const token = await getAccessToken();
  const res = await fetch(await fnUrl("admin-users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": window.PO_CONFIG.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleString("en-IN") : "—";
}
async function loadUsers() {
  try {
    const data = await callAdmin("list");
    renderPanel(data.users);
  } catch (err) {
    contentEl.innerHTML = `<div class="card"><div class="error-box">${err.message}</div></div>`;
  }
}
function renderPanel(users) {
  contentEl.innerHTML = `
    <div class="card">
      <p class="section-title">Invite a team member</p>
      <form id="inviteForm" style="display:flex; gap:10px; align-items:flex-end;">
        <div class="field" style="flex:1; margin-bottom:0;">
          <label for="inviteEmail">Email address</label>
          <input id="inviteEmail" type="email" required placeholder="name@company.com" />
        </div>
        <div class="field" style="margin-bottom:0;">
          <label for="inviteRole">Role</label>
          <select id="inviteRole">
            <option value="user" selected>User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" class="primary" id="inviteBtn">Send invite</button>
      </form>
      <p class="note" style="margin-top:8px;">Admins can see every PO in the Dashboard. Users only see their own.</p>
      <div id="inviteMsg"></div>
    </div>
    <div class="card">
      <p class="section-title">Team members (${users.length})</p>
      <table class="calc-table" style="width:100%;">
        <thead><tr><th style="text-align:left;">Email</th><th>Role</th><th>Joined</th><th>Last sign in</th><th></th></tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td style="text-align:left; font-family:'IBM Plex Sans',sans-serif;">${u.email}</td>
              <td>
                <select class="role-select" data-id="${u.id}" data-email="${u.email}" data-current="${u.role}">
                  <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                  <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                </select>
              </td>
              <td>${fmtDate(u.created_at)}</td>
              <td>${fmtDate(u.last_sign_in_at)}</td>
              <td><button type="button" class="reject revoke-btn" data-id="${u.id}" data-email="${u.email}">Revoke</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById("inviteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("inviteBtn");
    const msg = document.getElementById("inviteMsg");
    msg.innerHTML = "";
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const email = document.getElementById("inviteEmail").value.trim();
      const role = document.getElementById("inviteRole").value;
      await callAdmin("invite", { email, role });
      msg.innerHTML = `<div class="success-box">Invite sent to ${email} as ${role === "admin" ? "Admin" : "User"}.</div>`;
      loadUsers();
    } catch (err) {
      msg.innerHTML = `<div class="error-box">${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Send invite";
    }
  });
  document.querySelectorAll(".revoke-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Revoke access for ${btn.dataset.email}? This cannot be undone.`)) return;
      btn.disabled = true;
      btn.textContent = "Revoking…";
      try {
        await callAdmin("revoke", { userId: btn.dataset.id });
        loadUsers();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = "Revoke";
      }
    });
  });
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const newRole = select.value;
      const previousRole = select.dataset.current;
      const email = select.dataset.email;
      if (!confirm(`Change ${email}'s role to ${newRole === "admin" ? "Admin" : "User"}?`)) {
        select.value = previousRole;
        return;
      }
      select.disabled = true;
      try {
        await callAdmin("setRole", { userId: select.dataset.id, role: newRole });
        select.dataset.current = newRole;
      } catch (err) {
        alert(err.message);
        select.value = previousRole;
      } finally {
        select.disabled = false;
      }
    });
  });
}
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderAuthNav();
  loadUsers();
})();
