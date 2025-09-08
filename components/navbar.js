import { state, t, applyLang, applyTheme } from '../state.js';
import { me } from '../data/mock.js';

export function Navbar(){
  // Get current user from localStorage (logged in user)
  const storedUser = localStorage.getItem('currentUser');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = currentUser?.roles?.[0] || 'user';
  
  return `
  <header>
    <div class="brand"><span class="dot"></span> Medipol Lead CRM</div>
    <div class="header-logo">
      <img src="https://mio.medipol.edu.tr/sites/mio.medipol.edu.tr/themes/custom/mio/logo-en.svg" alt="Medipol University" class="header-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="header-logo-fallback" style="display: none;">🏛️</div>
    </div>
    <div class="toolbar" style="display:flex; gap:8px; align-items:center;">
      <span class="tag">${currentUser?.name || 'User'} · ${userRole}</span>
      <button class="btn-icon" onclick="window.appNavigate('#/profile')" title="My Profile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
      <button class="btn-icon" onclick="handleLogout()" title="Logout">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16,17 21,12 16,7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
      <div class="notifications-container">
        <button class="btn-icon" id="notifications-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="notification-badge" id="notification-count" style="display:none;">0</span>
        </button>
        <div class="notifications-dropdown" id="notifications-dropdown" style="display:none;">
          <div class="notifications-header">
            <h4>Notifications</h4>
            <button class="btn-icon" onclick="markAllNotificationsRead()">Mark all read</button>
          </div>
          <div class="notifications-list" id="notifications-list">
            <!-- Notifications will be populated here -->
          </div>
        </div>
      </div>
      <label>${t('language')}: 
        <select id="lang" class="select">
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="tr">Türkçe</option>
          <option value="ru">Русский</option>
        </select>
      </label>
      <label>${t('theme')}: 
        <select id="theme" class="select">
          <option value="light">${t('light')}</option>
          <option value="dark">${t('dark')}</option>
          <option value="auto">${t('auto')}</option>
        </select>
      </label>
    </div>
  </header>`;
}

export function wireNavbar(render){
  document.getElementById('lang').value = state.lang;
  document.getElementById('theme').value = state.theme;

  document.getElementById('lang').onchange = (e)=>{
    state.lang = e.target.value; localStorage.setItem('lang', state.lang); applyLang(); render();
  };
  document.getElementById('theme').onchange = (e)=>{
    state.theme = e.target.value; localStorage.setItem('theme', state.theme); applyTheme();
  };

  // Notifications: render and events
  const btn = document.getElementById('notifications-btn');
  const dropdown = document.getElementById('notifications-dropdown');
  const countEl = document.getElementById('notification-count');

  window.refreshNotifications = function(){
    const uid = me()?.id || null;
    const list = document.getElementById('notifications-list');
    if (!list) return;
    const items = (window.getNotifications ? window.getNotifications(uid) : []).slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

    const unread = items.filter(n=>!n.read).length;
    if (unread > 0){ countEl.style.display = 'inline-flex'; countEl.textContent = unread; }
    else { countEl.style.display = 'none'; }

    list.innerHTML = items.length ? items.map(n=>`
      <div class="notification-item ${n.read?'read':''}" onclick="(function(id){ if(window.markNotificationRead){ window.markNotificationRead(id); } window.refreshNotifications && window.refreshNotifications(); })(${n.id})">
        <div class="notification-title">${n.title || 'Notification'}</div>
        <div class="notification-message">${n.message || ''}</div>
        <div class="notification-time">${new Date(n.created_at).toLocaleString()}</div>
      </div>
    `).join('') : '<div class="notification-empty">No notifications</div>';
  };

  window.markAllNotificationsRead = function(){
    const uid = me()?.id || null;
    const items = window.getNotifications ? window.getNotifications(uid) : [];
    items.forEach(n=>{ if(!n.read && window.markNotificationRead){ window.markNotificationRead(n.id); } });
    window.refreshNotifications && window.refreshNotifications();
  };

  btn?.addEventListener('click', (e)=>{
    e.stopPropagation();
    const visible = dropdown.style.display !== 'none';
    dropdown.style.display = visible ? 'none' : 'block';
    if (!visible) window.refreshNotifications();
  });
  document.addEventListener('click', (e)=>{
    if (!dropdown.contains(e.target) && e.target !== btn){ dropdown.style.display = 'none'; }
  });

  // initial badge update
  window.refreshNotifications();
}
