const API = "https://home311-api.1dylanroeder1.workers.dev";

// ─── State ──────────────────────────────────────────────
let allTickets = [];
let allOffenses = [];
let pendingPhotos = []; // array of base64 strings
let currentFilter = "all";

// ─── DOM refs ───────────────────────────────────────────
const modal          = document.getElementById("ticketModal");
const offenseModal   = document.getElementById("offenseModal");
const ticketOffense  = document.getElementById("ticketOffense");
const ticketNotes    = document.getElementById("ticketNotes");
const ticketDays     = document.getElementById("ticketDays");
const ticketLevel    = document.getElementById("ticketLevel");
const photoInput     = document.getElementById("photoInput");
const photoPreviews  = document.getElementById("photoPreviews");
const photoDropZone  = document.getElementById("photoDropZone");

// ─── Toast ───────────────────────────────────────────────
function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── Navigation ──────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.remove("active"));

  const page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");

  const link = document.querySelector(`[data-page="${pageId}"]`);
  if (link) link.classList.add("active");

  renderCurrentPage(pageId);
}

document.querySelectorAll("[data-page]").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    showPage(el.dataset.page);
  });
});

// ─── Badge helpers ───────────────────────────────────────
function levelBadge(level) {
  const map = { Warning: "badge-warning", Violation: "badge-violation", Removal: "badge-removal" };
  return `<span class="badge ${map[level] || "badge-active"}">${level}</span>`;
}

function statusBadge(status) {
  return `<span class="badge ${status === "Resolved" ? "badge-resolved" : "badge-active"}">${status}</span>`;
}

// ─── Render helpers ──────────────────────────────────────
function ticketCardHTML(ticket) {
  const photoThumb = ticket.photos && ticket.photos.length > 0
    ? `<div class="ticket-photos">${ticket.photos.slice(0,4).map(src => `<img src="${src}" alt="photo" onclick="openLightbox('${src}')">`).join("")}</div>`
    : "";

  const date = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return `
    <div class="ticket-card">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
        ${levelBadge(ticket.level || "Warning")}
        ${statusBadge(ticket.status)}
      </div>
      <h3>${ticket.offense}</h3>
      ${ticket.notes ? `<p style="margin-top:6px;">${ticket.notes}</p>` : ""}
      ${photoThumb}
      ${date ? `<p style="font-size:12px;color:#94a3b8;margin-top:10px;">${date}</p>` : ""}
      <div class="actions">
        <a class="ticket-link" href="ticket.html?id=${ticket.id}">View →</a>
        ${ticket.status !== "Resolved"
          ? `<button class="btn" style="font-size:13px;padding:7px 12px;" onclick="quickResolve('${ticket.id}')">✅ Resolve</button>`
          : ""}
        <button class="btn btn-danger" style="font-size:13px;padding:7px 12px;" onclick="deleteTicket('${ticket.id}')">🗑</button>
      </div>
    </div>
  `;
}

function emptyState(icon, msg) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

// ─── Lightbox ────────────────────────────────────────────
function openLightbox(src) {
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `<img src="${src}" alt="Photo">`;
  lb.addEventListener("click", () => lb.remove());
  document.body.appendChild(lb);
}

// ─── Load data ───────────────────────────────────────────
async function loadAll() {
  try {
    const [oRes, tRes] = await Promise.all([
      fetch(API + "/offenses"),
      fetch(API + "/tickets")
    ]);
    allOffenses = await oRes.json();
    allTickets  = await tRes.json();
  } catch (e) {
    toast("Failed to connect to API", "error");
    allOffenses = [];
    allTickets  = [];
  }

  renderOffenseDropdown();
  renderCurrentPage(currentActivePage());
  updateStats();
}

function currentActivePage() {
  const active = document.querySelector(".page.active");
  return active ? active.id.replace("page-", "") : "dashboard";
}

// ─── Stats ───────────────────────────────────────────────
function updateStats() {
  const total    = allTickets.length;
  const warnings = allTickets.filter(t => t.level === "Warning").length;
  const violations = allTickets.filter(t => t.level === "Violation").length;
  const resolved = allTickets.filter(t => t.status === "Resolved").length;

  setText("totalCount",     total);
  setText("warningCount",   warnings);
  setText("violationCount", violations);
  setText("resolvedCount",  resolved);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Render pages ────────────────────────────────────────
function renderCurrentPage(pageId) {
  switch (pageId) {
    case "dashboard":  renderDashboard();  break;
    case "tickets":    renderTickets();    break;
    case "warnings":   renderWarnings();   break;
    case "violations": renderViolations(); break;
    case "removal":    renderRemoval();    break;
    case "offenses":   renderOffenses();   break;
  }
}

function renderDashboard() {
  const el = document.getElementById("recentTicketList");
  if (!el) return;
  const recent = [...allTickets].sort((a,b) => (b.createdAt||0)-(a.createdAt||0)).slice(0, 6);
  el.innerHTML = recent.length
    ? recent.map(ticketCardHTML).join("")
    : emptyState("🎫", "No tickets yet. Create your first one!");
}

function renderTickets() {
  const el = document.getElementById("ticketList");
  if (!el) return;
  let list = allTickets;
  if (currentFilter !== "all") list = list.filter(t => t.status === currentFilter);
  list = [...list].sort((a,b) => (b.createdAt||0)-(a.createdAt||0));
  el.innerHTML = list.length
    ? list.map(ticketCardHTML).join("")
    : emptyState("🎫", "No tickets match this filter.");
}

function renderWarnings() {
  const el = document.getElementById("warningList");
  if (!el) return;
  const list = allTickets.filter(t => t.level === "Warning").sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  el.innerHTML = list.length
    ? list.map(ticketCardHTML).join("")
    : emptyState("⚠️", "No warnings on record.");
}

function renderViolations() {
  const el = document.getElementById("violationList");
  if (!el) return;
  const list = allTickets.filter(t => t.level === "Violation").sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  el.innerHTML = list.length
    ? list.map(ticketCardHTML).join("")
    : emptyState("🚨", "No violations on record.");
}

function renderRemoval() {
  const el = document.getElementById("removalList");
  if (!el) return;
  const list = allTickets.filter(t => t.level === "Removal").sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  el.innerHTML = list.length
    ? list.map(ticketCardHTML).join("")
    : emptyState("🗑️", "No removal tickets on record.");
}

function renderOffenses() {
  const el = document.getElementById("offenseList");
  if (!el) return;
  el.innerHTML = allOffenses.length
    ? allOffenses.map(o => `
        <div class="offense-card">
          <h3>${o.name}</h3>
          <p>Auto Remove: ${o.days} days</p>
          <div class="actions">
            <button class="btn btn-ghost" onclick="openEditOffense('${o.id}')">✏️ Edit</button>
            <button class="btn btn-danger" onclick="deleteOffense('${o.id}')">🗑 Delete</button>
          </div>
        </div>
      `).join("")
    : emptyState("📋", "No offense presets yet. Add one!");
}

function renderOffenseDropdown() {
  ticketOffense.innerHTML = allOffenses.length
    ? allOffenses.map(o => `<option value="${o.name}">${o.name}</option>`).join("")
    : `<option value="">No offenses — add presets first</option>`;
}

// ─── Photo upload ─────────────────────────────────────────
photoDropZone.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", e => {
  Array.from(e.target.files).forEach(readPhotoFile);
  photoInput.value = ""; // allow re-selecting same file
});

["dragenter","dragover"].forEach(evt => {
  photoDropZone.addEventListener(evt, e => {
    e.preventDefault();
    photoDropZone.classList.add("dragover");
  });
});

["dragleave","drop"].forEach(evt => {
  photoDropZone.addEventListener(evt, e => {
    e.preventDefault();
    photoDropZone.classList.remove("dragover");
    if (evt === "drop" && e.dataTransfer.files.length) {
      Array.from(e.dataTransfer.files).forEach(readPhotoFile);
    }
  });
});

function readPhotoFile(file) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = e => {
    pendingPhotos.push(e.target.result);
    renderPhotoPreviews();
  };
  reader.readAsDataURL(file);
}

function renderPhotoPreviews() {
  photoPreviews.innerHTML = pendingPhotos.map((src, i) => `
    <div class="photo-preview-item">
      <img src="${src}" alt="Preview">
      <button class="remove-photo" onclick="removePhoto(${i})">✕</button>
    </div>
  `).join("");
}

function removePhoto(i) {
  pendingPhotos.splice(i, 1);
  renderPhotoPreviews();
}

// ─── Modals ───────────────────────────────────────────────
function openTicketModal(defaultLevel) {
  if (defaultLevel) ticketLevel.value = defaultLevel;
  pendingPhotos = [];
  renderPhotoPreviews();
  ticketNotes.value = "";
  ticketDays.value = "";
  modal.classList.remove("hidden");
}

function closeTicketModal() {
  modal.classList.add("hidden");
  pendingPhotos = [];
  renderPhotoPreviews();
}

document.getElementById("newTicketBtn").addEventListener("click", () => openTicketModal());
document.getElementById("newTicketBtn2").addEventListener("click", () => openTicketModal());
document.getElementById("newTicketBtn3").addEventListener("click", () => openTicketModal("Warning"));
document.getElementById("newTicketBtn4").addEventListener("click", () => openTicketModal("Violation"));
document.getElementById("newTicketBtn5").addEventListener("click", () => openTicketModal("Removal"));
document.getElementById("closeModal").addEventListener("click", closeTicketModal);
modal.addEventListener("click", e => { if (e.target === modal) closeTicketModal(); });

document.getElementById("closeOffenseModal").addEventListener("click", () => offenseModal.classList.add("hidden"));
offenseModal.addEventListener("click", e => { if (e.target === offenseModal) offenseModal.classList.add("hidden"); });

// ─── Create ticket ────────────────────────────────────────
document.getElementById("createTicketBtn").addEventListener("click", createTicket);

async function createTicket() {
  if (!ticketOffense.value) {
    toast("Please add an offense preset first", "error");
    return;
  }

  const newTicket = {
    id: crypto.randomUUID(),
    level: ticketLevel.value,
    offense: ticketOffense.value,
    notes: ticketNotes.value.trim(),
    status: "Active",
    createdAt: Date.now(),
    expiresInDays: ticketDays.value || null,
    photos: pendingPhotos.slice() // base64 array
  };

  allTickets.push(newTicket);

  try {
    await saveTickets();
    closeTicketModal();
    updateStats();
    renderCurrentPage(currentActivePage());
    toast("Ticket created!", "success");
  } catch (e) {
    allTickets.pop();
    toast("Failed to save ticket", "error");
  }
}

// ─── Quick resolve ────────────────────────────────────────
async function quickResolve(id) {
  allTickets = allTickets.map(t => t.id === id ? { ...t, status: "Resolved", resolvedAt: Date.now() } : t);
  try {
    await saveTickets();
    updateStats();
    renderCurrentPage(currentActivePage());
    toast("Ticket resolved!", "success");
  } catch (e) {
    toast("Failed to resolve", "error");
  }
}

// ─── Delete ticket ────────────────────────────────────────
async function deleteTicket(id) {
  if (!confirm("Delete this ticket?")) return;
  allTickets = allTickets.filter(t => t.id !== id);
  try {
    await saveTickets();
    updateStats();
    renderCurrentPage(currentActivePage());
    toast("Ticket deleted");
  } catch (e) {
    toast("Failed to delete", "error");
  }
}

async function saveTickets() {
  const res = await fetch(API + "/saveTickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allTickets)
  });
  if (!res.ok) throw new Error("Save failed");
}

// ─── Offense CRUD ─────────────────────────────────────────
document.getElementById("addOffenseBtn").addEventListener("click", () => {
  document.getElementById("offenseModalTitle").textContent = "Add Offense";
  document.getElementById("offenseName").value = "";
  document.getElementById("offenseDays").value = "";
  document.getElementById("offenseEditId").value = "";
  offenseModal.classList.remove("hidden");
});

function openEditOffense(id) {
  const o = allOffenses.find(x => x.id === id);
  if (!o) return;
  document.getElementById("offenseModalTitle").textContent = "Edit Offense";
  document.getElementById("offenseName").value = o.name;
  document.getElementById("offenseDays").value = o.days;
  document.getElementById("offenseEditId").value = id;
  offenseModal.classList.remove("hidden");
}

document.getElementById("saveOffenseBtn").addEventListener("click", saveOffense);

async function saveOffense() {
  const name = document.getElementById("offenseName").value.trim();
  const days = document.getElementById("offenseDays").value.trim();
  const editId = document.getElementById("offenseEditId").value;

  if (!name || !days) { toast("Fill in all fields", "error"); return; }

  if (editId) {
    allOffenses = allOffenses.map(o => o.id === editId ? { ...o, name, days } : o);
  } else {
    allOffenses.push({ id: crypto.randomUUID(), name, days });
  }

  try {
    await saveOffenses();
    offenseModal.classList.add("hidden");
    renderOffenseDropdown();
    renderOffenses();
    toast("Offense saved!", "success");
  } catch (e) {
    toast("Failed to save offense", "error");
  }
}

async function deleteOffense(id) {
  if (!confirm("Delete this offense preset?")) return;
  allOffenses = allOffenses.filter(o => o.id !== id);
  try {
    await saveOffenses();
    renderOffenseDropdown();
    renderOffenses();
    toast("Offense deleted");
  } catch (e) {
    toast("Failed to delete", "error");
  }
}

async function saveOffenses() {
  const res = await fetch(API + "/saveOffenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allOffenses)
  });
  if (!res.ok) throw new Error("Save failed");
}

// ─── Filter buttons ───────────────────────────────────────
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTickets();
  });
});

// ─── Init ─────────────────────────────────────────────────
loadAll();
