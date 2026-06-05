// ══════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════
const MEMBERS          = ['Philip','Nymph','Teeratat','Nook','Pete','Pun+','Noey','Nott','Teechai','Jam'];
const DEFAULT_PASSWORD = '12345';
const AUTH_KEY         = 'bromo_session';

function getMemberPassword(name) {
  return localStorage.getItem('bromo_pw_' + name) || DEFAULT_PASSWORD;
}

let currentUser = null; // { role: 'member'|'viewer', name: string|null }

function initAuth() {
  const saved = localStorage.getItem(AUTH_KEY);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      applyAuthUI();
      return;
    } catch { localStorage.removeItem(AUTH_KEY); }
  }
  document.getElementById('loginOverlay').classList.remove('hidden');
}

// Called from HTML
function selectRole(role) {
  if (role === 'viewer') {
    currentUser = { role: 'viewer', name: null };
    localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    closeLogin();
  } else {
    document.getElementById('stepRole').style.display   = 'none';
    document.getElementById('stepMember').style.display = 'block';
    setTimeout(() => document.getElementById('nameSelect').focus(), 50);
  }
}

function backToRoles() {
  document.getElementById('stepMember').style.display = 'none';
  document.getElementById('stepRole').style.display   = 'block';
  document.getElementById('loginError').textContent   = '';
  document.getElementById('passInput').value          = '';
}

function submitLogin() {
  const name = document.getElementById('nameSelect').value;
  const pass = document.getElementById('passInput').value;
  const err  = document.getElementById('loginError');
  err.textContent = '';

  if (!name)          { err.textContent = 'กรุณาเลือกชื่อของคุณ'; return; }
  if (pass !== getMemberPassword(name)) { err.textContent = 'Password ไม่ถูกต้อง ลองอีกครั้ง'; return; }

  currentUser = { role: 'member', name };
  localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
  closeLogin();
}

function closeLogin() {
  document.getElementById('loginOverlay').classList.add('hidden');
  applyAuthUI();
  // Always land on Overview after login
  history.replaceState(null, '', '#overview');
  switchTab('overview');
}

function applyAuthUI() {
  const badge = document.getElementById('userBadge');
  if (!badge || !currentUser) return;

  badge.style.display = 'flex';

  if (currentUser.role === 'member') {
    badge.className = 'user-badge member';
    badge.innerHTML = `<span class="user-badge-dot"></span>${currentUser.name}`;
    badge.title = 'คลิกเพื่อออกจากระบบ';
  } else {
    badge.className = 'user-badge viewer';
    badge.innerHTML = `<span class="user-badge-dot"></span>Viewer`;
    badge.title = 'คลิกเพื่อเปลี่ยน Role';
  }

  badge.onclick = logout;
}

function logout() {
  if (!confirm('ออกจากระบบ?')) return;
  localStorage.removeItem(AUTH_KEY);
  currentUser = null;
  location.reload();
}

// ══════════════════════════════════════════════
// TAB LAZY-LOADING
// ══════════════════════════════════════════════
const cache = {};

async function loadTab(name) {
  if (cache[name]) return cache[name];
  const res = await fetch('tabs/' + name + '.html', { cache: 'no-store' });
  if (!res.ok) throw new Error('load failed');
  cache[name] = await res.text();
  return cache[name];
}

const tabBtns  = document.querySelectorAll('.tab-btn');
const tabPages = document.querySelectorAll('.tab-page');

async function switchTab(name) {
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));

  const page = document.getElementById('tab-' + name);
  if (!page) return;

  if (!page.dataset.loaded) {
    page.innerHTML = '<div class="tab-loading">กำลังโหลด…</div>';
    try {
      page.innerHTML = await loadTab(name);
      page.dataset.loaded = 'true';
      if (name === 'packup')  initPackUp();
      if (name === 'wear')    initWear();
      if (name === 'members') initMembers();
    } catch {
      page.innerHTML = `
        <div class="tab-loading">
          ไม่สามารถโหลดได้ — ต้องเปิดผ่าน local server<br>
          <small style="opacity:.6">VS Code → Live Server · หรือ python -m http.server</small>
        </div>`;
    }
  }

  tabPages.forEach(p => p.classList.remove('active'));
  page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.tab;
    history.replaceState(null, '', '#' + name);
    switchTab(name);
  });
});

window.addEventListener('hashchange', () => {
  const h = location.hash.replace('#', '');
  if (h) switchTab(h);
});

// ══════════════════════════════════════════════
// PACK UP — logic + save/load
// ══════════════════════════════════════════════
const PACK_SECTIONS = ['cnt-critical','cnt-clothing','cnt-gear','cnt-health','cnt-snacks'];

function packKey(name) {
  return 'bromo_pack_' + name;
}

function toggle(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  if (window.event && window.event.target !== cb) cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
  updatePackProgress();
  savePackUp();
}

function updatePackProgress() {
  const all = document.querySelectorAll('.item input[type="checkbox"]');
  const chk = document.querySelectorAll('.item input[type="checkbox"]:checked');
  const pct = all.length ? chk.length / all.length * 100 : 0;

  const fill  = document.getElementById('barFill');
  const count = document.getElementById('progressCount');
  if (fill)  fill.style.width = pct + '%';
  if (count) count.textContent = chk.length + ' / ' + all.length;

  const cards = document.querySelectorAll('.section-card');
  PACK_SECTIONS.forEach((id, i) => {
    const card = cards[i];
    const el   = document.getElementById(id);
    if (!card || !el) return;
    const total = card.querySelectorAll('input[type="checkbox"]').length;
    const done  = card.querySelectorAll('input[type="checkbox"]:checked').length;
    el.textContent = done + '/' + total;
  });
}

function savePackUp() {
  if (!currentUser || currentUser.role !== 'member') return;

  const items = document.querySelectorAll('.item input[type="checkbox"]');
  const state = Array.from(items).map(cb => cb.checked);
  localStorage.setItem(packKey(currentUser.name), JSON.stringify(state));

  // แสดง "Saved" badge
  const badge = document.getElementById('packSavedBadge');
  if (badge) {
    badge.classList.add('show');
    clearTimeout(badge._timer);
    badge._timer = setTimeout(() => badge.classList.remove('show'), 2000);
  }
}

function loadPackUp() {
  if (!currentUser) return;

  if (currentUser.role === 'viewer') {
    document.getElementById('tab-packup').classList.add('viewer-mode');
    updatePackProgress();
    return;
  }

  // Member: โหลด state ที่บันทึกไว้
  const saved = localStorage.getItem(packKey(currentUser.name));
  if (saved) {
    try {
      const state = JSON.parse(saved);
      const items = document.querySelectorAll('.item');
      items.forEach((item, i) => {
        if (state[i]) {
          item.querySelector('input').checked = true;
          item.classList.add('checked');
        }
      });
    } catch { /* ignore corrupt data */ }
  }
  updatePackProgress();
}

function resetAll() {
  if (!currentUser || currentUser.role !== 'member') return;
  if (!confirm('Reset Pack Up ของคุณทั้งหมด?')) return;

  document.querySelectorAll('.item').forEach(item => {
    item.querySelector('input').checked = false;
    item.classList.remove('checked');
  });
  updatePackProgress();
  savePackUp();
}

function injectMemberBar() {
  if (!currentUser) return;
  const wrap = document.querySelector('#tab-packup .pack-content');
  if (!wrap) return;

  const bar = document.createElement('div');
  bar.className = 'pack-member-bar';

  if (currentUser.role === 'member') {
    bar.innerHTML = `
      <span class="pack-member-name">🎒 Pack Up ของ ${currentUser.name}</span>
      <span class="pack-saved-badge" id="packSavedBadge">✓ Saved</span>`;
  } else {
    bar.innerHTML = `<span class="pack-member-name" style="color:var(--gold)">👁 View Only — ไม่สามารถแก้ไขได้</span>`;
  }

  wrap.insertBefore(bar, wrap.firstChild);
}

function initPackUp() {
  injectMemberBar();
  loadPackUp();
}

// ══════════════════════════════════════════════
// WHAT TO WEAR — lightbox
// ══════════════════════════════════════════════
function initWear() {
  const lightbox = document.getElementById('wearLightbox');
  const lbImg    = document.getElementById('lightboxImg');
  const lbTitle  = document.getElementById('lightboxTitle');
  const lbBg     = document.getElementById('lightboxBg');
  const lbClose  = document.getElementById('lightboxClose');
  if (!lightbox) return;

  document.querySelectorAll('.wear-card').forEach(card => {
    card.addEventListener('click', () => {
      lbImg.src           = card.dataset.img;
      lbTitle.textContent = card.dataset.title;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }
  lbBg.addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

// ══════════════════════════════════════════════
// MEMO
// ══════════════════════════════════════════════
const EXP_CATS = {
  food:      { ico: '🍽️', label: 'อาหาร' },
  transport: { ico: '🚕', label: 'เดินทาง' },
  shopping:  { ico: '🛍️', label: 'ช้อปปิ้ง' },
  activity:  { ico: '🎯', label: 'กิจกรรม' },
  health:    { ico: '💊', label: 'สุขภาพ' },
  other:     { ico: '📝', label: 'อื่นๆ' },
};
const DAYS = ['Jun 11','Jun 12','Jun 13','Jun 14','Jun 15','Jun 16'];

let memoSelectedMember = null;
let memoNotesTimer     = null;
let memoShowAddForm    = false;

function memoKey(name) { return 'bromo_memo_' + name; }

function loadMemoData(name) {
  try {
    const d = JSON.parse(localStorage.getItem(memoKey(name)));
    return { expenses: [], notes: '', motto: '', ...(d || {}) };
  }
  catch { return { expenses: [], notes: '', motto: '' }; }
}
function saveMemoData(name, data) {
  localStorage.setItem(memoKey(name), JSON.stringify(data));
}

// ── init ──────────────────────────────────────
function initMemo() {
  memoShowAddForm = false;
  memoSelectedMember = (currentUser?.role === 'member') ? currentUser.name : MEMBERS[0];
  renderMemoMemberSelector();
  renderMemoContent();
}

// ── Member selector ───────────────────────────
function renderMemoMemberSelector() {
  const el = document.getElementById('memoMemberScroll');
  if (!el) return;
  el.innerHTML = MEMBERS.map(name => {
    const isOwn    = currentUser?.role === 'member' && currentUser.name === name;
    const isActive = name === memoSelectedMember;
    const cls = ['memo-mem-btn', isOwn && 'is-own', isActive && 'active'].filter(Boolean).join(' ');
    const prefix = isOwn ? '✏️ ' : '';
    return `<button class="${cls}" onclick="selectMemoMember('${name}')">${prefix}${name}</button>`;
  }).join('');
}

function selectMemoMember(name) {
  memoSelectedMember = name;
  memoShowAddForm = false;
  renderMemoMemberSelector();
  renderMemoContent();
}

// ── Main content renderer ─────────────────────
function renderMemoContent() {
  const el = document.getElementById('memoMain');
  if (!el) return;

  const isOwnEdit = currentUser?.role === 'member' && currentUser.name === memoSelectedMember;
  const isViewer  = !currentUser || currentUser.role === 'viewer';
  const data      = loadMemoData(memoSelectedMember);

  // Banner
  let banner = '';
  if (isOwnEdit) {
    banner = `<div class="memo-banner memo-banner-own">✏️ Memo ของคุณ — แก้ไขได้</div>`;
  } else if (isViewer) {
    banner = `<div class="memo-banner memo-banner-viewer">👁 Viewer — ดูอย่างเดียว · ${memoSelectedMember}'s Memo</div>`;
  } else {
    banner = `<div class="memo-banner memo-banner-view">👁 กำลังดู Memo ของ ${memoSelectedMember} — View Only</div>`;
  }

  // Expenses
  const expList = data.expenses.length
    ? data.expenses.map(e => renderExpenseRow(e, isOwnEdit)).join('')
    : `<div class="expense-empty">ยังไม่มีรายการ</div>`;

  // Total
  const totalIDR = data.expenses.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);
  const totalTHB = data.expenses.filter(e => e.currency === 'THB').reduce((s, e) => s + e.amount, 0);
  const totalParts = [];
  if (totalIDR) totalParts.push(`${totalIDR.toLocaleString()} IDR`);
  if (totalTHB) totalParts.push(`${totalTHB.toLocaleString()} ฿`);
  const totalRow = data.expenses.length ? `
    <div class="expense-total">
      <span class="expense-total-label">รวมทั้งหมด</span>
      <span class="expense-total-idr">${totalParts.join(' + ') || '0'}</span>
    </div>` : '';

  // Add form
  const addForm = (isOwnEdit && memoShowAddForm) ? renderAddForm() : '';
  const addBtn  = isOwnEdit
    ? `<button class="memo-add-btn" onclick="toggleExpenseForm()">
         ${memoShowAddForm ? '✕ ยกเลิก' : '+ เพิ่มรายการ'}
       </button>` : '';

  // Notes
  const notesContent = isOwnEdit
    ? `<textarea class="memo-notes-area" id="memoNotesArea"
          oninput="onNotesInput()"
          placeholder="เขียน Note ได้เลย — ลิสต์ของที่ต้องซื้อ, เบอร์โทร, reminder ต่างๆ..."
        >${escapeHtml(data.notes)}</textarea>
       <div class="memo-save-status hidden" id="memoSaveStatus">✓ Saved</div>`
    : `<div class="memo-notes-view">${
        data.notes
          ? escapeHtml(data.notes)
          : '<span class="memo-notes-placeholder">ยังไม่มี Notes</span>'
      }</div>`;

  el.innerHTML = `
    ${banner}
    <div class="memo-card">
      <div class="memo-card-head">
        <span class="memo-card-title">💸 ค่าใช้จ่าย</span>
        ${addBtn}
      </div>
      ${expList}
      ${addForm}
      ${totalRow}
    </div>
    <div class="memo-card">
      <div class="memo-card-head">
        <span class="memo-card-title">📝 Notes</span>
      </div>
      ${notesContent}
    </div>`;
}

function renderExpenseRow(e, canDelete) {
  const cat = EXP_CATS[e.cat] || EXP_CATS.other;
  const amt = e.amount.toLocaleString() + (e.currency === 'IDR' ? ' IDR' : ' ฿');
  const del = canDelete
    ? `<button class="expense-del-btn" onclick="deleteExpense('${e.id}')" title="ลบ">×</button>`
    : '';
  return `
    <div class="expense-item">
      <span class="expense-cat-ico">${cat.ico}</span>
      <div class="expense-info">
        <div class="expense-desc">${escapeHtml(e.desc)}</div>
        <div class="expense-meta">${e.day} · ${cat.label}</div>
      </div>
      <div class="expense-amount">${amt}</div>
      ${del}
    </div>`;
}

function renderAddForm() {
  const dayOptions = DAYS.map(d => `<option value="${d}">${d}</option>`).join('');
  const catOptions = Object.entries(EXP_CATS)
    .map(([k,v]) => `<option value="${k}">${v.ico} ${v.label}</option>`).join('');
  return `
    <div class="expense-add-form" id="expenseAddForm">
      <div class="expense-form-row">
        <input class="expense-input" id="expDesc" type="text" placeholder="รายการ เช่น ค่าอาหารเย็น">
      </div>
      <div class="expense-form-row">
        <input class="expense-input expense-input-sm" id="expAmount" type="number" min="0" placeholder="จำนวนเงิน">
        <select class="expense-select" id="expCurrency" style="flex:0 0 80px">
          <option value="IDR">IDR</option>
          <option value="THB">THB ฿</option>
        </select>
        <select class="expense-select" id="expCat">${catOptions}</select>
      </div>
      <div class="expense-form-row">
        <select class="expense-select" id="expDay">${dayOptions}</select>
      </div>
      <div class="expense-form-actions">
        <button class="expense-save-btn" onclick="submitExpense()">บันทึก</button>
        <button class="expense-cancel-btn" onclick="toggleExpenseForm()">ยกเลิก</button>
      </div>
    </div>`;
}

// ── Actions (global) ──────────────────────────
function toggleExpenseForm() {
  memoShowAddForm = !memoShowAddForm;
  renderMemoContent();
  if (memoShowAddForm) {
    setTimeout(() => document.getElementById('expDesc')?.focus(), 50);
  }
}

function submitExpense() {
  if (!currentUser || currentUser.role !== 'member') return;
  const desc   = document.getElementById('expDesc')?.value.trim();
  const amount = parseFloat(document.getElementById('expAmount')?.value);
  const currency = document.getElementById('expCurrency')?.value || 'IDR';
  const cat    = document.getElementById('expCat')?.value    || 'other';
  const day    = document.getElementById('expDay')?.value    || 'Jun 11';

  if (!desc)           { alert('กรุณาใส่รายการ'); return; }
  if (!amount || amount <= 0) { alert('กรุณาใส่จำนวนเงิน'); return; }

  const data = loadMemoData(currentUser.name);
  data.expenses.push({ id: Date.now().toString(), desc, amount, currency, cat, day });
  saveMemoData(currentUser.name, data);
  memoShowAddForm = false;
  renderMemoContent();
}

function deleteExpense(id) {
  if (!currentUser || currentUser.role !== 'member') return;
  if (!confirm('ลบรายการนี้?')) return;
  const data = loadMemoData(currentUser.name);
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveMemoData(currentUser.name, data);
  renderMemoContent();
}

function onNotesInput() {
  clearTimeout(memoNotesTimer);
  memoNotesTimer = setTimeout(saveNoteNow, 800);
}

function saveNoteNow() {
  if (!currentUser || currentUser.role !== 'member') return;
  const ta = document.getElementById('memoNotesArea');
  if (!ta) return;
  const data = loadMemoData(currentUser.name);
  data.notes = ta.value;
  saveMemoData(currentUser.name, data);
  const status = document.getElementById('memoSaveStatus');
  if (status) {
    status.classList.remove('hidden');
    clearTimeout(status._t);
    status._t = setTimeout(() => status.classList.add('hidden'), 2000);
  }
}

// ══════════════════════════════════════════════
// MEMBERS TAB
// ══════════════════════════════════════════════
const MEMBER_PHOTOS = {
  'Philip':   'Asset/Trip_Member/Men4.png',
  'Nymph':    'Asset/Trip_Member/women2.png',
  'Teeratat': 'Asset/Trip_Member/Men7.png',
  'Nook':     'Asset/Trip_Member/Men1.png',
  'Pete':     'Asset/Trip_Member/Men3.png',
  'Pun+':     'Asset/Trip_Member/Men6.png',
  'Noey':     'Asset/Trip_Member/women3.png',
  'Nott':     'Asset/Trip_Member/Men5.png',
  'Teechai':  'Asset/Trip_Member/Men2.png',
  'Jam':      'Asset/Trip_Member/women1.png',
};

function getMemberPhoto(name) {
  const custom = localStorage.getItem('bromo_photo_' + name);
  return custom || MEMBER_PHOTOS[name] || '';
}

let membersSelected     = null;
let membersShowForm     = false;
let membersShowChangePw = false;
let membersNotesTimer   = null;

function initMembers() {
  membersShowForm = false;
  membersSelected = (currentUser?.role === 'member') ? currentUser.name : MEMBERS[0];
  renderMembersGrid();
  renderMemberDetail();
}

function renderMembersGrid() {
  const el = document.getElementById('memPhotoGrid');
  if (!el) return;
  el.innerHTML = MEMBERS.map(name => {
    const isOwn    = currentUser?.role === 'member' && currentUser.name === name;
    const isActive = name === membersSelected;
    const data  = loadMemoData(name);
    const photo = getMemberPhoto(name);
    const cls   = ['mem-card', isActive && 'active', isOwn && 'is-own'].filter(Boolean).join(' ');
    return `
      <div class="${cls}" onclick="selectMember('${name}')">
        <div class="mem-avatar-wrap">
          <img class="mem-avatar" src="${photo}" alt="${name}">
          ${isOwn ? '<div class="mem-you-badge">You</div>' : ''}
        </div>
        <div class="mem-name">${name}</div>
        <div class="mem-exp-chip">${data.expenses.length ? data.expenses.length + ' รายการ' : '–'}</div>
      </div>`;
  }).join('');
}

function selectMember(name) {
  membersSelected     = name;
  membersShowForm     = false;
  membersShowChangePw = false;
  renderMembersGrid();
  renderMemberDetail();
  setTimeout(() => document.getElementById('memDetail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

function renderMemberDetail() {
  const el = document.getElementById('memDetail');
  if (!el) return;
  const name      = membersSelected;
  const isOwnEdit = currentUser?.role === 'member' && currentUser.name === name;
  const isViewer  = !currentUser || currentUser.role === 'viewer';
  const data      = loadMemoData(name);

  // Banner
  let banner = '';
  if (isOwnEdit) {
    banner = `<div class="memo-banner memo-banner-own">✏️ Memo ของคุณ — แก้ไขได้</div>`;
  } else if (isViewer) {
    banner = `<div class="memo-banner memo-banner-viewer">👁 Viewer — ดูอย่างเดียว · ${name}'s Memo</div>`;
  } else {
    banner = `<div class="memo-banner memo-banner-view">👁 กำลังดู Memo ของ ${name} — View Only</div>`;
  }

  // Totals
  const idrTotal = data.expenses.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);
  const thbTotal = data.expenses.filter(e => e.currency === 'THB').reduce((s, e) => s + e.amount, 0);
  const totalParts = [idrTotal && idrTotal.toLocaleString() + ' IDR', thbTotal && thbTotal.toLocaleString() + ' ฿'].filter(Boolean);
  const totalStr = totalParts.join(' + ') || '–';

  // Profile header
  const mottoHtml = isOwnEdit
    ? `<input class="mem-motto-input" id="memMottoInput"
         value="${escapeHtml(data.motto || '')}"
         placeholder="✍️ ใส่ motto ของคุณ..."
         oninput="onMottoInput(this.value)">`
    : data.motto
      ? `<div class="mem-motto-text">"${escapeHtml(data.motto)}"</div>`
      : `<div class="mem-motto-text mem-motto-empty">ยังไม่มี motto</div>`;

  const profileHd = `
    <div class="mem-profile-hd">
      <div class="mem-profile-avatar-wrap">
        <img class="mem-profile-avatar" src="${getMemberPhoto(name)}" alt="${name}">
        ${isOwnEdit ? `
          <label class="mem-upload-label" title="เปลี่ยนรูปโปรไฟล์">
            📷
            <input type="file" accept="image/*" onchange="uploadMemberPhoto(event)" style="display:none">
          </label>` : ''}
      </div>
      <div class="mem-profile-info">
        <div class="mem-profile-name">${name}</div>
        ${mottoHtml}
        <div class="mem-profile-stats">
          <span>${data.expenses.length} รายการ</span>
          <span class="mem-profile-dot">·</span>
          <span class="mem-profile-total">${totalStr}</span>
        </div>
        <div class="mem-profile-actions">
          ${isOwnEdit ? '<div class="mem-profile-tag">✏️ บัญชีของคุณ</div>' : ''}
          ${isOwnEdit ? '<button class="mem-logout-btn" onclick="logout()">ออกจากระบบ</button>' : ''}
        </div>
      </div>
    </div>`;

  // Expense list
  const expList = data.expenses.length
    ? data.expenses.map(e => renderMembersExpRow(e, isOwnEdit)).join('')
    : `<div class="expense-empty">ยังไม่มีรายการ</div>`;

  const totalRow = data.expenses.length ? `
    <div class="expense-total">
      <span class="expense-total-label">รวมทั้งหมด</span>
      <span class="expense-total-idr">${totalParts.join(' + ') || '0'}</span>
    </div>` : '';

  const addForm = (isOwnEdit && membersShowForm) ? renderMembersAddForm() : '';
  const addBtn  = isOwnEdit
    ? `<button class="memo-add-btn" onclick="toggleMembersForm()">
         ${membersShowForm ? '✕ ยกเลิก' : '+ เพิ่มรายการ'}
       </button>` : '';

  // Notes
  const notesContent = isOwnEdit
    ? `<textarea class="memo-notes-area" id="membersNotesArea"
          oninput="onMembersNotesInput()"
          placeholder="เขียน Note ได้เลย — ลิสต์ของที่ต้องซื้อ, เบอร์โทร, reminder ต่างๆ..."
        >${escapeHtml(data.notes)}</textarea>
       <div class="memo-save-status hidden" id="membersSaveStatus">✓ Saved</div>`
    : `<div class="memo-notes-view">${
        data.notes
          ? escapeHtml(data.notes).replace(/\n/g, '<br>')
          : '<span class="memo-notes-placeholder">ยังไม่มี Notes</span>'
      }</div>`;

  const changePwCard = isOwnEdit ? `
    <div class="memo-card">
      <div class="memo-card-head">
        <span class="memo-card-title">🔑 เปลี่ยน Password</span>
        <button class="memo-add-btn" onclick="toggleChangePw()">
          ${membersShowChangePw ? '✕ ยกเลิก' : 'เปลี่ยน'}
        </button>
      </div>
      ${membersShowChangePw ? `
        <div class="expense-add-form">
          <div class="expense-form-row">
            <input class="expense-input" id="pwCurrent" type="password" placeholder="Password ปัจจุบัน">
          </div>
          <div class="expense-form-row">
            <input class="expense-input" id="pwNew" type="password" placeholder="Password ใหม่ (อย่างน้อย 4 ตัว)">
          </div>
          <div class="expense-form-row">
            <input class="expense-input" id="pwConfirm" type="password" placeholder="ยืนยัน Password ใหม่"
              onkeydown="if(event.key==='Enter')submitChangePw()">
          </div>
          <div class="expense-form-actions">
            <button class="expense-save-btn" onclick="submitChangePw()">บันทึก</button>
            <button class="expense-cancel-btn" onclick="toggleChangePw()">ยกเลิก</button>
          </div>
          <div class="pw-error" id="pwError"></div>
        </div>` : `<div class="pw-hint">Password ปัจจุบันของคุณ — เปลี่ยนได้เมื่อต้องการ</div>`}
    </div>` : '';

  el.innerHTML = `
    ${banner}
    ${profileHd}
    <div class="memo-card">
      <div class="memo-card-head">
        <span class="memo-card-title">💸 ค่าใช้จ่าย</span>
        ${addBtn}
      </div>
      ${expList}
      ${addForm}
      ${totalRow}
    </div>
    <div class="memo-card">
      <div class="memo-card-head">
        <span class="memo-card-title">📝 Notes</span>
      </div>
      ${notesContent}
    </div>
    ${changePwCard}`;
}

function renderMembersExpRow(e, canDelete) {
  const cat = EXP_CATS[e.cat] || EXP_CATS.other;
  const amt = e.amount.toLocaleString() + (e.currency === 'IDR' ? ' IDR' : ' ฿');
  const del = canDelete
    ? `<button class="expense-del-btn" onclick="deleteMembersExpense('${e.id}')" title="ลบ">×</button>`
    : '';
  return `
    <div class="expense-item">
      <span class="expense-cat-ico">${cat.ico}</span>
      <div class="expense-info">
        <div class="expense-desc">${escapeHtml(e.desc)}</div>
        <div class="expense-meta">${e.day} · ${cat.label}</div>
      </div>
      <div class="expense-amount">${amt}</div>
      ${del}
    </div>`;
}

function renderMembersAddForm() {
  const dayOptions = DAYS.map(d => `<option value="${d}">${d}</option>`).join('');
  const catOptions = Object.entries(EXP_CATS)
    .map(([k, v]) => `<option value="${k}">${v.ico} ${v.label}</option>`).join('');
  return `
    <div class="expense-add-form">
      <div class="expense-form-row">
        <input class="expense-input" id="memExpDesc" type="text" placeholder="รายการ เช่น ค่าอาหารเย็น">
      </div>
      <div class="expense-form-row">
        <input class="expense-input expense-input-sm" id="memExpAmount" type="number" min="0" placeholder="จำนวนเงิน">
        <select class="expense-select" id="memExpCurrency" style="flex:0 0 80px">
          <option value="IDR">IDR</option>
          <option value="THB">THB ฿</option>
        </select>
        <select class="expense-select" id="memExpCat">${catOptions}</select>
      </div>
      <div class="expense-form-row">
        <select class="expense-select" id="memExpDay">${dayOptions}</select>
      </div>
      <div class="expense-form-actions">
        <button class="expense-save-btn" onclick="submitMembersExpense()">บันทึก</button>
        <button class="expense-cancel-btn" onclick="toggleMembersForm()">ยกเลิก</button>
      </div>
    </div>`;
}

function toggleMembersForm() {
  membersShowForm = !membersShowForm;
  renderMemberDetail();
  if (membersShowForm) setTimeout(() => document.getElementById('memExpDesc')?.focus(), 50);
}

function submitMembersExpense() {
  if (!currentUser || currentUser.role !== 'member') return;
  const desc     = document.getElementById('memExpDesc')?.value.trim();
  const amount   = parseFloat(document.getElementById('memExpAmount')?.value);
  const currency = document.getElementById('memExpCurrency')?.value || 'IDR';
  const cat      = document.getElementById('memExpCat')?.value      || 'other';
  const day      = document.getElementById('memExpDay')?.value      || 'Jun 11';

  if (!desc)                { alert('กรุณาใส่รายการ'); return; }
  if (!amount || amount <= 0) { alert('กรุณาใส่จำนวนเงิน'); return; }

  const data = loadMemoData(currentUser.name);
  data.expenses.push({ id: Date.now().toString(), desc, amount, currency, cat, day });
  saveMemoData(currentUser.name, data);
  membersShowForm = false;
  renderMembersGrid();
  renderMemberDetail();
}

function deleteMembersExpense(id) {
  if (!currentUser || currentUser.role !== 'member') return;
  if (!confirm('ลบรายการนี้?')) return;
  const data = loadMemoData(currentUser.name);
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveMemoData(currentUser.name, data);
  renderMembersGrid();
  renderMemberDetail();
}

function onMembersNotesInput() {
  clearTimeout(membersNotesTimer);
  membersNotesTimer = setTimeout(saveMembersNoteNow, 800);
}

function toggleChangePw() {
  membersShowChangePw = !membersShowChangePw;
  renderMemberDetail();
  if (membersShowChangePw) setTimeout(() => document.getElementById('pwCurrent')?.focus(), 50);
}

function submitChangePw() {
  if (!currentUser || currentUser.role !== 'member') return;
  const current = document.getElementById('pwCurrent')?.value || '';
  const newPw   = document.getElementById('pwNew')?.value     || '';
  const confirm = document.getElementById('pwConfirm')?.value || '';
  const errEl   = document.getElementById('pwError');
  errEl.textContent = '';

  if (current !== getMemberPassword(currentUser.name)) {
    errEl.textContent = '❌ Password ปัจจุบันไม่ถูกต้อง'; return;
  }
  if (newPw.length < 4) {
    errEl.textContent = '❌ Password ใหม่ต้องมีอย่างน้อย 4 ตัวอักษร'; return;
  }
  if (newPw !== confirm) {
    errEl.textContent = '❌ Password ใหม่ไม่ตรงกัน'; return;
  }

  localStorage.setItem('bromo_pw_' + currentUser.name, newPw);
  membersShowChangePw = false;
  renderMemberDetail();
  setTimeout(() => {
    const card = document.querySelector('.pw-success');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
  alert('✅ เปลี่ยน Password สำเร็จ!');
}

function uploadMemberPhoto(event) {
  if (!currentUser || currentUser.role !== 'member') return;
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 240, maxH = 320;
      let w = img.width, h = img.height;
      const r = Math.min(maxW / w, maxH / h);
      if (r < 1) { w = Math.round(w * r); h = Math.round(h * r); }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      localStorage.setItem('bromo_photo_' + currentUser.name, canvas.toDataURL('image/jpeg', 0.85));
      renderMembersGrid();
      renderMemberDetail();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

let mottoTimer = null;
function onMottoInput(val) {
  clearTimeout(mottoTimer);
  mottoTimer = setTimeout(() => {
    if (!currentUser || currentUser.role !== 'member') return;
    const data = loadMemoData(currentUser.name);
    data.motto = val;
    saveMemoData(currentUser.name, data);
    renderMembersGrid();
  }, 600);
}

function saveMembersNoteNow() {
  if (!currentUser || currentUser.role !== 'member') return;
  const ta = document.getElementById('membersNotesArea');
  if (!ta) return;
  const data = loadMemoData(currentUser.name);
  data.notes = ta.value;
  saveMemoData(currentUser.name, data);
  const status = document.getElementById('membersSaveStatus');
  if (status) {
    status.classList.remove('hidden');
    clearTimeout(status._t);
    status._t = setTimeout(() => status.classList.add('hidden'), 2000);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════
initAuth();
switchTab(location.hash.replace('#', '') || 'overview');
