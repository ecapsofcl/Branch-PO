// ============================================================
// Shared auth helper. Requires the Supabase JS SDK to be loaded
// first (see the <script> tag in each HTML page) and config.js.
// ============================================================
const sb = window.supabase.createClient(window.PO_CONFIG.SUPABASE_URL, window.PO_CONFIG.SUPABASE_ANON_KEY);

// Redirects to login.html if not signed in. Call this at the top of any
// protected page. Returns the session if signed in.
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

async function getAccessToken() {
  const { data: { session } } = await sb.auth.getSession();
  return session ? session.access_token : null;
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}

async function checkIsAdmin() {
  try {
    const token = await getAccessToken();
    const res = await fetch(`${window.PO_CONFIG.SUPABASE_URL}/functions/v1/admin-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": window.PO_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action: "list" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Injects a simple top nav row into any element with id="authNav".
async function renderAuthNav() {
  const el = document.getElementById("authNav");
  if (!el) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const admin = await checkIsAdmin();
  el.innerHTML = `
    <a href="index.html">PO Builder</a>
    <a href="dashboard.html">Dashboard</a>
    ${admin ? '<a href="admin.html">Admin</a>' : ""}
    <span class="nav-user">${user.email}</span>
    <button type="button" id="logoutBtn" class="nav-logout">Log out</button>
  `;
  document.getElementById("logoutBtn").addEventListener("click", logout);
}
