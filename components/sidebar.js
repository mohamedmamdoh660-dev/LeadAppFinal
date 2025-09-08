import { t } from '../state.js';
import { hasPermission } from '../shared.js';

export function Sidebar() {
  const hash = location.hash || '#/dashboard';
  return `<aside>
    <nav class="nav">
      <a href="#/dashboard" class="nav-item ${hash.startsWith('#/dashboard')?'active':''}">${t('dashboard')}</a>
      ${hasPermission('leads', 'view') ? `
        <a href="#/leads" class="nav-item ${hash.startsWith('#/leads')?'active':''}">${t('leads')}</a>
      ` : ''}
      ${hasPermission('tasks', 'view') ? `
        <a href="#/tasks" class="nav-item ${hash.startsWith('#/tasks')?'active':''}">${t('tasks')}</a>
      ` : ''}
      <a href="#/reports" class="nav-item ${hash.startsWith('#/reports')?'active':''}">${t('reports')}</a>
      ${hasPermission('users', 'view') ? `
        <a href="#/users" class="nav-item ${hash.startsWith('#/users')?'active':''}">${t('users')}</a>
      ` : ''}
      ${hasPermission('roles', 'view') ? `
        <a href="#/roles" class="nav-item ${hash.startsWith('#/roles')?'active':''}">${t('roles')}</a>
      ` : ''}
      <a href="#/assign" class="nav-item ${hash.startsWith('#/assign')?'active':''}">${t('assign')}</a>
    </nav>
  </aside>`;
}

export function wireSidebar(){
  // This function is no longer needed as the logic is handled in the component.
}
