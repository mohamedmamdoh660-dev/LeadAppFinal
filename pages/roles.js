import { t } from '../state.js';
import { apiFetch, hasPermission } from '../shared.js';

let showInactive = false;
let rolesCache = [];
let rolesLoaded = false;

export function RolesPage() {
  const allRoles = rolesCache;
  const visibleRoles = showInactive ? allRoles : allRoles.filter(role => role.active);
  const canManageRoles = hasPermission('roles', 'manage');

  return `
    <div class="panel">
      <div class="page-header">
        <h3>${t('roleManagement')}</h3>
        <div class="header-actions">
          <label class="toggle-label">
            <input type="checkbox" id="show-inactive" 
                   ${showInactive ? 'checked' : ''} 
                   onchange="toggleInactiveRoles(this.checked)">
            <span>${t('showInactiveRoles')}</span>
          </label>
          ${canManageRoles ? `
            <button class="btn primary" onclick="window.appNavigate('#/roles/add')">
              + ${t('addNewRole')}
            </button>
          ` : ''}
        </div>
      </div>

      ${rolesLoaded ? `
        <div class="roles-grid">
          ${visibleRoles.length > 0 
            ? visibleRoles.map(role => renderRoleCard(role, canManageRoles)).join('')
            : `<div class=\"no-results\">${t('noRolesFound')}</div>`
          }
        </div>
      ` : `
        <div class="loading">${t('loading')}...</div>
      `}
    </div>
  `;
}

function renderRoleCard(role, canManageRoles) {
  const permissions = role.permissions || {};
  const permissionCount = Object.values(permissions).reduce((count, resource) => {
    return count + Object.values(resource).filter(Boolean).length;
  }, 0);

  return `
    <div class="role-card ${!role.active ? 'inactive' : ''}">
      <div class="role-header">
        <div class="role-info">
          <div class="role-name-container">
            <h4 class="role-name-display" id="role-name-${role.id}" onclick="editRoleName(${role.id})" title="Click to edit name">${role.name}</h4>
            <input type="text" class="role-name-input" id="role-name-input-${role.id}" value="${role.name}" style="display: none;" 
                   onblur="saveRoleName(${role.id})" onkeydown="handleRoleNameKeydown(event, ${role.id})">
          </div>
          <span class="status-badge ${role.active ? 'active' : 'inactive'}">
            ${role.active ? t('active') : t('inactive')}
          </span>
        </div>
        ${canManageRoles ? `
          <div class="role-actions">
            <button class="btn-icon" onclick="event.preventDefault(); event.stopPropagation(); showRoleUsers(${role.id}); return false;" title="View Users in Role">
              👥
            </button>
            <button class="btn-icon" onclick="event.preventDefault(); event.stopPropagation(); window.appNavigate('#/roles/${role.id}/edit'); return false;" title="${t('editRole')}">
              ⚙️
            </button>
            <button class="btn-icon" onclick="event.preventDefault(); event.stopPropagation(); toggleRoleStatus(${role.id}); return false;" 
                    title="${role.active ? t('deactivateRole') : t('activateRole')}">
              ${role.active ? '🚫' : '✅'}
            </button>
            <button class="btn-icon danger" onclick="event.preventDefault(); event.stopPropagation(); confirmDeleteRole(${role.id}); return false;" 
                    title="${t('deleteRole')}" ${role.userCount > 0 ? 'disabled' : ''}>
              🗑️
            </button>
          </div>
        ` : ''}
      </div>

      <div class="role-body">
        <p class="role-description">${role.description || t('noDescription')}</p>
        
        <div class="role-stats">
          <div class="stat">
            <span class="stat-label">${t('users')}:</span>
            <span class="stat-value">${role.userCount}</span>
          </div>
          <div class="stat">
            <span class="stat-label">${t('permissions')}:</span>
            <span class="stat-value">${permissionCount}</span>
          </div>
          <div class="stat">
            <span class="stat-label">${t('canReceiveTasks')}:</span>
            <span class="stat-value">${role.can_receive_assignments ? t('yes') : t('no')}</span>
          </div>
        </div>

        <div class="permissions-summary">
          <h5>${t('keyPermissions')}:</h5>
          <div class="permission-tags">
            ${renderPermissionTags(permissions)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPermissionTags(permissions) {
  const tags = [];
  
  Object.entries(permissions).forEach(([resource, resourcePerms]) => {
    Object.entries(resourcePerms).forEach(([action, value]) => {
      if (value && value !== 'none') {
        const label = getPermissionLabel(resource, action, value);
        tags.push(`<span class="permission-tag">${label}</span>`);
      }
    });
  });

  return tags.length > 0 ? tags.join('') : `<span class="no-permissions">${t('noPermissionsAssigned')}</span>`;
}

function getPermissionLabel(resource, action, value) {
  const resourceLabels = {
    leads: t('leads'),
    tasks: t('tasks'),
    users: t('users'),
    roles: t('roles'),
    assignments: t('assign')
  };

  const actionLabels = {
    view: t('view'),
    create: t('create'),
    edit: t('edit'),
    delete: t('delete'),
    import: t('import'),
    export: t('export'),
    manage: t('manage'),
    assign: t('assign')
  };

  const scopeLabels = {
    own: t('own'),
    team: t('team'),
    all: t('all')
  };

  const resourceName = resourceLabels[resource] || resource;
  const actionName = actionLabels[action] || action;
  
  if (typeof value === 'boolean') {
    return `${actionName} ${resourceName}`;
  } else {
    const scopeName = scopeLabels[value] || value;
    return `${actionName} ${resourceName} (${scopeName})`;
  }
}

// Global functions
window.toggleInactiveRoles = function(show) {
  showInactive = show;
  rerenderPage();
};

async function loadRoles() {
  try {
    console.log('Loading roles from API...');
    const res = await apiFetch('/roles');
    console.log('Roles API response:', res);
    rolesCache = res.items || [];
    window.rolesCache = rolesCache; // Make globally accessible for permission checking
    rolesLoaded = true;
    console.log('Roles loaded successfully:', rolesCache.length, 'roles');
  } catch (e) {
    console.error('Failed to load roles', e);
    rolesCache = [];
    window.rolesCache = [];
    rolesLoaded = true;
  }
}

window.toggleRoleStatus = async function(roleId) {
  try {
    const role = rolesCache.find(r => r.id == roleId);
    if (!role) {
      console.error('Role not found:', roleId);
      return false;
    }
    
    const action = role.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} the "${role.name}" role?`);
    if (!confirmed) return false;
    
    const response = await apiFetch(`/roles/${roleId}`, {
      method: 'PUT',
      body: { active: !role.active }
    });
    console.log('Toggle role status response:', response);
    
    // Clear cache and reload data
    await loadRoles();
    rerenderPage();
    return false;
    
  } catch (e) {
    console.error('Failed to toggle role status:', e);
    alert('Failed to update role status. Please try again.');
    return false;
  }
};

window.confirmDeleteRole = async function(roleId) {
  try {
    const role = rolesCache.find(r => r.id == roleId);
    if (!role) {
      console.error('Role not found:', roleId);
      return false;
    }
    
    if (role.userCount > 0) {
      alert(`Cannot delete "${role.name}" role because it has ${role.userCount} users assigned to it.`);
      return false;
    }
    
    const confirmed = confirm(`Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`);
    if (!confirmed) return false;
    
    await apiFetch(`/roles/${roleId}`, { method: 'DELETE' });
    console.log('Role deleted successfully');
    
    // Remove from cache and re-render
    await loadRoles();
    rerenderPage();
    return false;
    
  } catch (e) {
    console.error('Failed to delete role:', e);
    alert('Failed to delete role. Please try again.');
    return false;
  }
};

// Show users in role function
window.showRoleUsers = async function(roleId) {
  try {
    const role = rolesCache.find(r => r.id == roleId);
    if (!role) {
      console.error('Role not found:', roleId);
      return false;
    }
    
    console.log('Loading users for role:', role.name);
    const response = await apiFetch('/users');
    const users = response.users || [];
    
    const roleUsers = users.filter(user => {
      if (!user.roles || !Array.isArray(user.roles)) return false;
      return user.roles.some(userRole => 
        userRole.toLowerCase() === role.name.toLowerCase()
      );
    });
    
    console.log('Found users for role:', roleUsers);
    
    if (roleUsers.length === 0) {
      alert(`No users assigned to "${role.name}" role.`);
      return false;
    }
    
    const userNames = roleUsers.map(user => user.name).join('\n• ');
    alert(`Users in "${role.name}" role (${roleUsers.length} users):\n\n• ${userNames}`);
    return false;
    
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('Failed to load users for this role.');
    return false;
  }
};

// Role name editing functions
window.editRoleName = function(roleId) {
  const displayElement = document.getElementById(`role-name-${roleId}`);
  const inputElement = document.getElementById(`role-name-input-${roleId}`);
  
  if (displayElement && inputElement) {
    displayElement.style.display = 'none';
    inputElement.style.display = 'block';
    inputElement.focus();
    inputElement.select();
  }
};

window.saveRoleName = async function(roleId) {
  const displayElement = document.getElementById(`role-name-${roleId}`);
  const inputElement = document.getElementById(`role-name-input-${roleId}`);
  
  if (!displayElement || !inputElement) return;
  
  const newName = inputElement.value.trim().toLowerCase();
  const role = rolesCache.find(r => r.id === roleId);
  
  if (!role || !newName || newName === role.name.toLowerCase()) {
    // Revert if no change or invalid
    inputElement.value = role ? role.name : '';
    displayElement.style.display = 'block';
    inputElement.style.display = 'none';
    return;
  }
  
  try {
    await apiFetch(`/roles/${roleId}`, {
      method: 'PUT',
      body: { name: newName }
    });
    
    // Clear cache and reload data
    await loadRoles();
    rerenderPage();
    inputElement.style.display = 'none';
    
    // Show success message
    showSuccessMessage('Role name updated successfully!');
    
  } catch (error) {
    console.error('Failed to update role name:', error);
    alert('Failed to update role name. Please try again.');
    
    // Revert on error
    inputElement.value = role.name;
    displayElement.style.display = 'block';
    inputElement.style.display = 'none';
  }
};

window.handleRoleNameKeydown = function(event, roleId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveRoleName(roleId);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    const displayElement = document.getElementById(`role-name-${roleId}`);
    const inputElement = document.getElementById(`role-name-input-${roleId}`);
    const role = rolesCache.find(r => r.id === roleId);
    
    if (displayElement && inputElement && role) {
      inputElement.value = role.name;
      displayElement.style.display = 'block';
      inputElement.style.display = 'none';
    }
  }
};

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-weight: 500;
  `;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

function rerenderPage() {
  const content = document.querySelector('.content');
  if (content) {
    content.innerHTML = RolesPage();
  }
}

export function wireRoles() {
  console.log('wireRoles called, rolesLoaded:', rolesLoaded);
  // Reset loading state and load fresh data
  rolesLoaded = false;
  loadRoles().then(() => {
    rerenderPage();
  });
}
