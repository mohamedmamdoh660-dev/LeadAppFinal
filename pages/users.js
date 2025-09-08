import { t } from '../state.js';
import { apiFetch, hasPermission } from '../shared.js';

// Global variables for users and roles data
let usersData = [];
let rolesData = [];

let filteredUsers = [];
let searchTerm = '';
let roleFilter = 'all';

export function UsersPage(){
  const canCreateUsers = hasPermission('users', 'create');
  
  return `<div class="users-page-modern">
    <!-- Header Section -->
    <div class="page-header-modern">
      <div class="header-content">
        <div class="header-title">
          <h1>Team Members</h1>
          <p class="header-subtitle">Manage your team and their permissions</p>
        </div>
        ${canCreateUsers ? `
          <button class="btn-modern primary" onclick="window.appNavigate('#/users/add')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Add Member
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls-section">
      <div class="search-modern">
        <svg class="search-icon-modern" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          placeholder="Search members..." 
          value="${searchTerm}"
          oninput="handleSearch(this.value)"
          class="search-input-modern"
        >
      </div>
      
      <div class="filter-modern">
        <select onchange="handleRoleFilter(this.value)" class="select-modern">
          <option value="all">All Roles</option>
          <!-- Role options will be populated dynamically -->
        </select>
      </div>
    </div>

    <!-- Users Grid -->
    <div class="users-grid">
      ${renderUserCards()}
    </div>
  </div>
  
  <!-- Confirmation Modal -->
  <div id="confirm-modal" class="modal" style="display: none;" aria-hidden="true">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Confirm Action</h3>
      </div>
      <div class="modal-body">
        <p id="confirm-message"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn ghost" onclick="window.closeConfirmModal()">Cancel</button>
        <button type="button" class="btn danger" id="confirm-action">Confirm</button>
      </div>
    </div>
  </div>
</div>`;
}

function renderUserCards() {
  if (filteredUsers.length === 0) {
    return `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <h3>No team members found</h3>
      <p>Try adjusting your search or filters</p>
    </div>`;
  }
  
  return filteredUsers.map(user => `
    <div class="user-card" data-user-id="${user.id}">
      <div class="user-card-header">
        <div class="user-avatar">
          <span class="avatar-text">${getInitials(user.name)}</span>
        </div>
        <div class="user-status">
          ${user.active 
            ? '<div class="status-dot active"></div>' 
            : '<div class="status-dot inactive"></div>'
          }
        </div>
      </div>
      
      <div class="user-card-body">
        <h3 class="user-name">
          <a href="#/users/report/${user.id}" onclick="window.appNavigate('#/users/report/${user.id}'); return false;">
            ${escapeHtml(user.name)}
          </a>
        </h3>
        <p class="user-email">${escapeHtml(user.email)}</p>
        
        <div class="user-roles">
          ${renderUserRoleBadgesModern(user)}
        </div>
        
        <div class="user-meta">
          <div class="meta-item">
            <span class="meta-label">Last Login</span>
            <span class="meta-value">${formatLastLogin(user.last_login_at)}</span>
          </div>
        </div>
      </div>
      
      <div class="user-card-actions">
        ${hasPermission('users', 'edit') ? `
          <button class="action-btn edit" onclick="window.appNavigate('#/users/${user.id}/edit')" title="Edit User">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onclick="toggleUserStatus(${user.id})" class="action-btn toggle" title="${user.active ? 'Disable' : 'Enable'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${user.active 
                ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>'
                : '<circle cx="12" cy="12" r="10"/><polyline points="8,12 12,16 16,12"/>'
              }
            </svg>
          </button>
        ` : ''}
        ${hasPermission('users', 'delete') ? `
          <button onclick="deleteUser(${user.id})" class="action-btn delete" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function renderUserRoleBadgesModern(user) {
  const userRoles = user.roles || [];
  if (userRoles.length === 0) {
    return '<span class="no-roles-modern">No role assigned</span>';
  }
  
  return userRoles.map(roleName => {
    return `<span class="role-badge-modern role-${roleName.toLowerCase()}">${roleName}</span>`;
  }).filter(Boolean).join('');
}

function renderUserRoleBadges(user) {
  const userRoles = user.roles || [];
  if (userRoles.length === 0) {
    return '<span class="no-roles">No roles assigned</span>';
  }
  
  return userRoles.map(roleName => {
    return `<span class="role-badge role-${roleName.toLowerCase()}" onclick="editRole('${roleName}')" title="Click to edit role">${roleName}</span>`;
  }).filter(Boolean).join(' ');
}

function getUserEffectivePermissions(user) {
  const userRoles = user.roles || [];
  const effectivePermissions = {};
  
  userRoles.forEach(roleId => {
    const role = roles[roleId];
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

function canUserReceiveAssignments(user) {
  const userRoles = user.roles || [];
  return userRoles.some(roleId => {
    const role = roles[roleId];
    return role && role.can_receive_assignments;
  });
}

function formatLastLogin(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function wireUsers() {
  // Load users from backend on initialization
  loadUsers();
  
  // Set up global functions for event handlers
  window.handleSearch = (value) => {
    searchTerm = value.toLowerCase();
    filterUsers();
  };

  window.handleRoleFilter = (value) => {
    roleFilter = value;
    filterUsers();
  };

  window.toggleUserStatus = async (userId) => {
    const user = usersData.find(u => u.id === userId);
    if (user) {
      try {
        console.log('Toggling user status for:', user.name);
        // Update in database first
        const response = await apiFetch(`/users/${userId}`, {
          method: 'PUT',
          body: {
            active: !user.active
          }
        });
        
        console.log('User status update response:', response);
        
        // Reload users from database to ensure consistency
        await loadUsers();
        
      } catch (error) {
        console.error('Failed to update user status:', error);
        alert('Failed to update user status. Please try again.');
      }
    }
  };

  window.deleteUser = (userId) => {
    const user = usersData.find(u => u.id === userId);
    if (user) {
      showConfirmModal(
        `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
        async () => {
          try {
            console.log('Deleting user:', user.name);
            // Delete from database first
            await apiFetch(`/users/${userId}`, {
              method: 'DELETE'
            });
            
            console.log('User deleted successfully');
            
            // Reload users from database to ensure consistency
            await loadUsers();
            
          } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please try again.');
          }
        }
      );
    }
  };

  // Role editing functionality
  window.editRole = (roleName) => {
    showRoleEditModal(roleName);
  };

  // Modal keyboard handling
  document.addEventListener('keydown', (e) => {
    const modal = document.querySelector('.modal[aria-hidden="false"]');
    if (modal && e.key === 'Escape') {
      if (modal.id === 'confirm-modal') {
        window.closeConfirmModal();
      }
    }
  });

  // Initialize
  filterUsers();
}

function filterUsers() {
  const users = usersData || [];
  filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm);
    
    const userRoles = user.roles || [];
    const matchesRole = roleFilter === 'all' || 
      userRoles.some(role => role.toLowerCase() === roleFilter.toLowerCase());
    
    return matchesSearch && matchesRole;
  });
  
  console.log('Filtered users:', filteredUsers);
  refreshUsersTable();
}

function refreshUsersTable() {
  const tbody = document.querySelector('.users-table tbody');
  if (tbody) {
    tbody.innerHTML = renderUserRows();
  }
}

function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const messageEl = document.getElementById('confirm-message');
  const confirmBtn = document.getElementById('confirm-action');
  
  messageEl.textContent = message;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus on confirm button
  confirmBtn.focus();
  
  // Set up confirm action
  confirmBtn.onclick = () => {
    onConfirm();
    window.closeConfirmModal();
  };
  
  trapFocus(modal);
}

window.closeConfirmModal = () => {
  const modal = document.getElementById('confirm-modal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
};

function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}

// Role editing modal functionality
function showRoleEditModal(roleName) {
  const modal = document.createElement('div');
  modal.className = 'modal role-edit-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Role</h3>
        <button class="btn-close" onclick="closeRoleEditModal()" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <form id="role-edit-form" class="modal-form">
        <div class="form-field">
          <label for="role-name-input">Role Name</label>
          <input type="text" id="role-name-input" value="${roleName}" required 
                 pattern="[a-z0-9-]+" title="Role name must contain only lowercase letters, numbers, and hyphens">
        </div>
        <div class="form-actions">
          <button type="button" class="btn ghost" onclick="closeRoleEditModal()">Cancel</button>
          <button type="submit" class="btn primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Focus on input
  const input = modal.querySelector('#role-name-input');
  input.focus();
  input.select();
  
  // Handle form submission
  const form = modal.querySelector('#role-edit-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const newName = input.value.trim().toLowerCase();
    if (newName && newName !== roleName.toLowerCase()) {
      await updateRoleName(roleName, newName);
    }
    closeRoleEditModal();
  };
}

window.closeRoleEditModal = () => {
  const modal = document.querySelector('.role-edit-modal');
  if (modal) {
    modal.remove();
  }
};

async function updateRoleName(oldName, newName) {
  try {
    // First, get all roles to find the role ID
    const rolesResponse = await apiFetch('/roles');
    const role = rolesResponse.items.find(r => r.name.toLowerCase() === oldName.toLowerCase());
    
    if (!role) {
      alert('Role not found');
      return;
    }
    
    // Update the role name
    await apiFetch(`/roles/${role.id}`, {
      method: 'PUT',
      body: {
        name: newName
      }
    });
    
    // Refresh the users table to show updated role names
    await loadUsers();
    refreshUsersTable();
    
    alert(`Role updated from "${oldName}" to "${newName}"`);
  } catch (error) {
    console.error('Failed to update role:', error);
    alert('Failed to update role. Please try again.');
  }
}

// Load users from backend API
async function loadUsers() {
  try {
    console.log('Loading users from backend...');
    const [usersResponse, rolesResponse] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/roles')
    ]);
    
    usersData = usersResponse.users || [];
    rolesData = rolesResponse.items || [];
    window.usersData = usersData;
    
    console.log('Loaded users:', usersData);
    console.log('Loaded roles:', rolesData);
    
    // Update role filter options based on actual roles
    updateRoleFilterOptions();
    filterUsers();
    
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('Failed to load users from database. Please refresh the page.');
    usersData = [];
    window.usersData = [];
    filterUsers();
  }
}

function updateRoleFilterOptions() {
  const roleFilter = document.getElementById('role-filter');
  if (roleFilter && rolesData.length > 0) {
    // Clear existing options except "All Roles"
    roleFilter.innerHTML = '<option value="all">All Roles</option>';
    
    // Add options for each role from database
    rolesData.forEach(role => {
      const option = document.createElement('option');
      option.value = role.name.toLowerCase();
      option.textContent = role.name.charAt(0).toUpperCase() + role.name.slice(1);
      if (roleFilter === role.name.toLowerCase()) {
        option.selected = true;
      }
      roleFilter.appendChild(option);
    });
  }
}
