import { t } from '../state.js';
import { apiFetch } from '../shared.js';

let currentRole = null;

export function RoleEditPage(roleId = null) {
  currentRole = null; // will be fetched in wireRoleEdit if roleId provided
  const isEdit = !!currentRole;
  const pageTitle = isEdit ? 'Edit Role' : 'Add New Role';
  
  return `
    <div class="user-edit-page">
      <!-- Header -->
      <div class="page-header-section">
        <div class="header-content">
          <div class="header-left">
            <button class="btn-back" onclick="window.appNavigate('#/roles')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Roles
            </button>
            <div class="header-title">
              <h1>${pageTitle}</h1>
              <p class="header-subtitle">${isEdit ? `Editing ${currentRole.name} role` : 'Create a new role with permissions'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="page-content">
        <form id="role-edit-form" class="user-form">
          <!-- Basic Information Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Basic Information</h3>
              <p>Essential role details and settings</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="role-name">Role Name *</label>
                  <input type="text" id="role-name" name="name" required 
                         value="${isEdit ? currentRole?.name || '' : ''}"
                         placeholder="Enter role name">
                  <div class="help-text">Use lowercase letters and hyphens only</div>
                  <div class="error-message" id="name-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="role-description">Description</label>
                  <textarea id="role-description" name="description" rows="3"
                            placeholder="Describe the role's purpose and responsibilities">${isEdit ? (currentRole?.description || '') : ''}</textarea>
                  <div class="help-text">Optional description to help users understand this role</div>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-container">
                    <input type="checkbox" id="role-active" name="active" 
                           ${isEdit ? (currentRole?.active ? 'checked' : '') : 'checked'}>
                    <span class="checkmark"></span>
                    <span class="checkbox-label">Active Role</span>
                  </label>
                  <div class="help-text">Active roles can be assigned to users</div>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-container">
                    <input type="checkbox" id="can-receive-assignments" name="can_receive_assignments"
                           ${isEdit ? (currentRole?.can_receive_assignments ? 'checked' : '') : ''}>
                    <span class="checkmark"></span>
                    <span class="checkbox-label">Can Receive Lead Assignments</span>
                  </label>
                  <div class="help-text">Users with this role can be automatically assigned leads</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Permissions Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Permissions</h3>
              <p>Configure what users with this role can access and do</p>
            </div>
            <div class="card-content">
              <div class="permissions-container">
                ${renderPermissionGroups(currentRole)}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="window.appNavigate('#/roles')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderPermissionGroups(role) {
  const permissionGroups = [
    {
      name: 'leads',
      label: 'Leads Management',
      icon: '📋',
      description: 'Control access to lead data and operations',
      permissions: [
        { key: 'view', label: 'View Leads', type: 'scope', options: ['none', 'own', 'team', 'all'] },
        { key: 'create', label: 'Create Leads', type: 'boolean' },
        { key: 'edit', label: 'Edit Leads', type: 'scope', options: ['none', 'own', 'team', 'all'] },
        { key: 'delete', label: 'Delete Leads', type: 'scope', options: ['none', 'own', 'team', 'all'] },
        { key: 'import', label: 'Import Leads', type: 'boolean' },
        { key: 'export', label: 'Export Leads', type: 'boolean' }
      ]
    },
    {
      name: 'tasks',
      label: 'Task Management',
      icon: '✅',
      description: 'Manage tasks and follow-ups',
      permissions: [
        { key: 'view', label: 'View Tasks', type: 'boolean' },
        { key: 'create', label: 'Create Tasks', type: 'boolean' },
        { key: 'edit', label: 'Edit Tasks', type: 'boolean' },
        { key: 'delete', label: 'Delete Tasks', type: 'boolean' }
      ]
    },
    {
      name: 'users',
      label: 'User Management',
      icon: '👥',
      description: 'Manage user accounts and settings',
      permissions: [
        { key: 'view', label: 'View Users', type: 'boolean' },
        { key: 'create', label: 'Create Users', type: 'boolean' },
        { key: 'edit', label: 'Edit Users', type: 'boolean' },
        { key: 'delete', label: 'Delete Users', type: 'boolean' }
      ]
    },
    {
      name: 'roles',
      label: 'Role Management',
      icon: '🔐',
      description: 'Configure roles and permissions',
      permissions: [
        { key: 'view', label: 'View Roles', type: 'boolean' },
        { key: 'manage', label: 'Manage Roles', type: 'boolean' }
      ]
    }
  ];

  return permissionGroups.map(group => `
    <div class="permission-group-card">
      <div class="permission-group-header">
        <div class="group-icon">${group.icon}</div>
        <div class="group-info">
          <h4>${group.label}</h4>
          <p class="group-description">${group.description}</p>
        </div>
      </div>
      <div class="permission-items">
        ${group.permissions.map(perm => renderPermissionControl(group.name, perm, role)).join('')}
      </div>
    </div>
  `).join('');
}

function renderPermissionControl(resource, permission, role) {
  const value = role?.permissions?.[resource]?.[permission.key] ?? 
                (permission.type === 'boolean' ? false : 'none');
  const id = `perm-${resource}-${permission.key}`;

  if (permission.type === 'boolean') {
    return `
      <div class="permission-row">
        <div class="permission-info">
          <label for="${id}" class="permission-label">${permission.label}</label>
        </div>
        <div class="permission-control">
          <label class="checkbox-container">
            <input type="checkbox" id="${id}" 
                   name="permissions.${resource}.${permission.key}" 
                   ${value ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
        </div>
      </div>
    `;
  } else if (permission.type === 'scope') {
    const scopeLabels = {
      none: 'None',
      own: 'Own Only',
      team: 'Team',
      all: 'All'
    };

    return `
      <div class="permission-row">
        <div class="permission-info">
          <label for="${id}" class="permission-label">${permission.label}</label>
        </div>
        <div class="permission-control">
          <select id="${id}" name="permissions.${resource}.${permission.key}" class="form-select">
            ${permission.options.map(opt => `
              <option value="${opt}" ${value === opt ? 'selected' : ''}>
                ${scopeLabels[opt] || opt}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  }
  return '';
}

export function wireRoleEdit(roleId = null) {
  // Load role when editing
  if (roleId) {
    apiFetch(`/roles/${roleId}`)
      .then(res => {
        currentRole = res.role;
        // populate form fields with fetched data
        const nameEl = document.getElementById('role-name');
        const descEl = document.getElementById('role-description');
        const activeEl = document.getElementById('role-active');
        const recvEl = document.getElementById('can-receive-assignments');
        if (nameEl) { nameEl.value = currentRole.name; }
        if (descEl) descEl.value = currentRole.description || '';
        if (activeEl) activeEl.checked = !!currentRole.active;
        if (recvEl) recvEl.checked = !!currentRole.can_receive_assignments;
        // populate permissions controls
        applyPermissionsToForm(currentRole.permissions || {});
      })
      .catch(() => {
        alert('Failed to load role');
        window.appNavigate('#/roles');
      });
  }
  // Handle form submission
  document.getElementById('role-edit-form').addEventListener('submit', (e)=>handleRoleFormSubmit(e, roleId));
}

function handleRoleFormSubmit(event, roleId) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const roleData = {
    name: formData.get('name')?.toLowerCase().replace(/\s+/g, '-') || '',
    description: formData.get('description') || '',
    active: formData.has('active'),
    can_receive_assignments: formData.has('can_receive_assignments'),
    permissions: {}
  };
  
  // Collect permissions
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('permissions.')) {
      const [_, resource, permission] = key.split('.');
      if (!roleData.permissions[resource]) {
        roleData.permissions[resource] = {};
      }
      roleData.permissions[resource][permission] = value === 'on' ? true : value;
    }
  }
  
  if (!validateRoleForm(roleData)) return;

  // Submit to backend
  const isEdit = !!roleId;
  console.log('Submitting role data:', roleData);
  
  const submit = isEdit
    ? apiFetch(`/roles/${roleId}`, { method: 'PUT', body: {
        name: roleData.name,
        description: roleData.description,
        active: roleData.active,
        can_receive_assignments: roleData.can_receive_assignments,
        permissions: roleData.permissions
      } })
    : apiFetch('/roles', { method: 'POST', body: roleData });

  submit
    .then((response) => {
      console.log('Role update response:', response);
      window.appNavigate('#/roles');
    })
    .catch(async (e) => {
      console.error('Role update error:', e);
      alert('Failed to save role. Please try again.');
    });
}

function validateRoleForm(roleData) {
  clearFormErrors();
  let isValid = true;
  
  // Name validation
  if (!roleData.name) {
    showFieldError('name-error', 'Role name is required');
    isValid = false;
  } else if (!/^[a-z0-9-]+$/.test(roleData.name)) {
    showFieldError('name-error', 'Role name must contain only lowercase letters, numbers, and hyphens');
    isValid = false;
  } else if (isDuplicateRoleName(roleData.name)) {
    showFieldError('name-error', 'This role name already exists');
    isValid = false;
  }
  
  return isValid;
}

function isDuplicateRoleName(name) {
  // Backend enforces uniqueness; skip client-side duplicate checks
  return false;
}

function showFieldError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function clearFormErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function applyPermissionsToForm(perms){
  try{
    Object.entries(perms).forEach(([resource, resourcePerms])=>{
      Object.entries(resourcePerms).forEach(([key, val])=>{
        const id = `perm-${resource}-${key}`;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox'){
          el.checked = !!val;
        } else if (el.tagName === 'SELECT'){
          el.value = val || 'none';
        }
      });
    });
  }catch(e){ /* noop */ }
}
