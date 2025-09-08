export const $ = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

export function fmtDate(iso){ const d=new Date(iso); return d.toLocaleDateString(); }
export function toLocalDateTimeValue(date){
  const pad = (x)=> String(x).padStart(2,'0');
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function groupCount(arr, keyFn){
  return arr.reduce((m, x)=>{ const k=keyFn(x)||'—'; m[k]=(m[k]||0)+1; return m; }, {});
}
export function nextId(col){ return (col.reduce((m,x)=> Math.max(m, x.id), 0) + 1) }

// Global data storage
window.leadsData = [];
window.usersData = [];
window.tasksData = [];

export async function apiFetch(url, options = {}) {
  const config = { ...options };
  config.headers = { ...(options.headers || {}) };
  const hasBody = config.body && typeof config.body === 'object';
  if (hasBody) {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    config.body = JSON.stringify(config.body);
  }
  
  // Add current user header for profile endpoints
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    config.headers['x-current-user'] = currentUser;
  }
  
  const response = await fetch(`http://localhost:4000${url}`, config);
  
  // Try to parse JSON either way to extract useful error messages
  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { data = await response.json(); } catch (_) { data = null; }
  }
  
  if (!response.ok) {
    const msg = (data && (data.message || data.error)) || response.statusText || 'Request failed';
    throw new Error(`HTTP ${response.status}: ${msg}`);
  }
  
  return data;
}

// Logout function
window.handleLogout = async function() {
  try {
    // Call logout API
    await apiFetch('/auth/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.log('Logout API error (continuing anyway):', error);
  }
  
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  // Show logout message
  if (window.showToast) {
    window.showToast('Logged out successfully', 'success');
  }
  
  // Redirect to login
  setTimeout(() => {
    window.location.hash = '#/login';
  }, 500);
};

// Permission checking system
export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

export function getUserPermissions(user = null) {
  const currentUser = user || getCurrentUser();
  if (!currentUser || !currentUser.roles) return {};
  
  const effectivePermissions = {};
  
  // Get roles data from cache or mock data
  const rolesData = window.rolesCache || [];
  
  currentUser.roles.forEach(roleName => {
    const role = rolesData.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (role && role.permissions) {
      // Merge permissions (union of all roles)
      Object.keys(role.permissions).forEach(resource => {
        if (!effectivePermissions[resource]) {
          effectivePermissions[resource] = {};
        }
        Object.keys(role.permissions[resource]).forEach(action => {
          const currentValue = effectivePermissions[resource][action];
          const newValue = role.permissions[resource][action];
          
          // For boolean permissions, OR them together
          if (typeof newValue === 'boolean') {
            effectivePermissions[resource][action] = currentValue || newValue;
          }
          // For scope permissions, take the highest level
          else if (typeof newValue === 'string') {
            const scopeOrder = ['none', 'own', 'team', 'all'];
            const currentIndex = scopeOrder.indexOf(currentValue) || 0;
            const newIndex = scopeOrder.indexOf(newValue) || 0;
            effectivePermissions[resource][action] = scopeOrder[Math.max(currentIndex, newIndex)];
          }
        });
      });
    }
  });
  
  return effectivePermissions;
}

export function hasPermission(resource, action, scope = null) {
  const permissions = getUserPermissions();
  console.log('Checking permission:', resource, action, 'Permissions:', permissions);
  const resourcePerms = permissions[resource];
  if (!resourcePerms) {
    console.log('No permissions for resource:', resource);
    return false;
  }
  
  const permValue = resourcePerms[action];
  console.log('Permission value:', permValue);
  if (typeof permValue === 'boolean') return permValue;
  if (typeof permValue === 'string') {
    if (!scope) return permValue !== 'none';
    const scopeOrder = ['none', 'own', 'team', 'all'];
    const userLevel = scopeOrder.indexOf(permValue);
    const requiredLevel = scopeOrder.indexOf(scope);
    return userLevel >= requiredLevel;
  }
  
  return false;
}

// Load all data on app start
export async function loadAllData() {
  try {
    const [leadsRes, usersRes, tasksRes, rolesRes] = await Promise.all([
      apiFetch('/leads'),
      apiFetch('/users'),
      apiFetch('/tasks'),
      apiFetch('/roles')
    ]);
    
    window.leadsData = leadsRes.items || leadsRes.leads || [];
    window.usersData = usersRes.users || [];
    window.tasksData = tasksRes.items || tasksRes.tasks || [];
    window.rolesCache = rolesRes.items || [];
    
    console.log('Loaded data:', { 
      leads: window.leadsData.length, 
      users: window.usersData.length, 
      tasks: window.tasksData.length,
      roles: window.rolesCache.length 
    });
    
    // Don't trigger hashchange to avoid infinite loop
    // The initial render will happen from main.js
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}
