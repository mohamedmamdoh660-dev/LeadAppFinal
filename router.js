import { Dashboard, wireDashboard } from './pages/dashboard.js';
import { LeadsPage, wireLeads } from './pages/leads.js';
import { LeadOpen, wireLeadOpen } from './pages/leadOpen.js';
import { LeadEditPage, wireLeadEdit } from './pages/leadEdit.js';
import { TasksPage, wireTasks } from './pages/tasks.js';
import { TaskOpen, wireTaskOpen } from './pages/taskOpen.js';
import { UsersPage, wireUsers } from './pages/users.js';
import { UserEditPage, wireUserEdit } from './pages/userEdit.js';
import { RolesPage, wireRoles } from './pages/roles.js';
import { RoleEditPage, wireRoleEdit } from './pages/roleEdit.js';
import { ReportsPage, wireReports } from './pages/reports.js';
import { UserReportPage, wireUserReport } from './pages/userReport.js';
import { AssignPage } from './pages/assignee.js';
import { renderProfile, wireProfile } from './pages/profile.js';
import { renderLogin, initLogin } from './pages/login.js';
import { Navbar, wireNavbar } from './components/navbar.js';
import { Sidebar } from './components/sidebar.js';
import { applyLang, applyTheme } from './state.js';

export function navigate(hash){ location.hash = hash; }

export function render(){
  applyLang(); applyTheme();
  const root = document.getElementById('app');
  const hash = location.hash || '#/dashboard';
  
  // Check if user is on login page
  if (hash === '#/login') {
    root.innerHTML = renderLogin();
    initLogin();
    return;
  }
  
  // Check authentication for other pages
  const isAuthenticated = checkAuthentication();
  if (!isAuthenticated && hash !== '#/login') {
    location.hash = '#/login';
    return;
  }
  
  // Handle specific routes
  if (hash.startsWith('#/leads/')) {
    handleLeadRoutes(hash);
    return;
  } else if (hash.startsWith('#/tasks/')) {
    handleTaskRoutes(hash);
    return;
  } else if (hash.startsWith('#/users/')) {
    handleUserRoutes(hash);
    return;
  } else if (hash.startsWith('#/roles/')) {
    handleRoleRoutes(hash);
    return;
  } else if (hash.startsWith('#/reports/')) {
    handleReportRoutes(hash);
    return;
  }
  
  // Render main app layout with content
  const content = getMainPageContent(hash);
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  // Initialize page-specific functionality
  initMainPage(hash);
  wireNavbar();
}

function checkAuthentication() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  return token && user;
}

function handleLeadRoutes(hash) {
  const root = document.getElementById('app');
  const [, , action, id] = hash.split('/');
  
  let content = '';
  let initFunc = null;
  
  if (action === 'new' || action === 'add') {
    content = LeadEditPage();
    initFunc = wireLeadEdit;
  } else if (action && !isNaN(parseInt(action))) {
    const leadId = parseInt(action);
    if (id === 'edit') {
      content = LeadEditPage(leadId);
      initFunc = () => wireLeadEdit(leadId);
    } else {
      content = LeadOpen(leadId);
      initFunc = () => wireLeadOpen(leadId);
    }
  } else {
    content = LeadsPage();
    initFunc = wireLeads;
  }
  
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  if (initFunc) initFunc();
  wireNavbar();
}

function handleTaskRoutes(hash) {
  const root = document.getElementById('app');
  const [, , action, id] = hash.split('/');
  
  let content = '';
  let initFunc = null;
  
  if (action && !isNaN(parseInt(action))) {
    const taskId = parseInt(action);
    content = TaskOpen(taskId);
    initFunc = () => wireTaskOpen(taskId);
  } else {
    content = TasksPage();
    initFunc = wireTasks;
  }
  
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  if (initFunc) initFunc();
  wireNavbar();
}

function handleUserRoutes(hash) {
  const root = document.getElementById('app');
  const [, , action, id] = hash.split('/');
  
  let content = '';
  let initFunc = null;
  
  if (action === 'new' || action === 'add') {
    content = UserEditPage();
    initFunc = wireUserEdit;
  } else if (action === 'report' && id) {
    // Handle user report route: #/users/report/{userId}
    const userId = parseInt(id);
    content = `<div class="loading">Loading user report...</div>`;
    initFunc = async () => {
      const reportContent = await UserReportPage(userId);
      document.querySelector('main.content').innerHTML = reportContent;
      wireUserReport(userId);
    };
  } else if (action && !isNaN(parseInt(action))) {
    const userId = parseInt(action);
    if (id === 'edit') {
      content = UserEditPage(userId);
      initFunc = () => wireUserEdit(userId);
    }
  } else {
    content = UsersPage();
    initFunc = wireUsers;
  }
  
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  if (initFunc) initFunc();
  wireNavbar();
}

function handleRoleRoutes(hash) {
  const root = document.getElementById('app');
  const [, , action, id] = hash.split('/');
  
  let content = '';
  let initFunc = null;
  
  if (action === 'new' || action === 'add') {
    content = RoleEditPage();
    initFunc = wireRoleEdit;
  } else if (action && !isNaN(parseInt(action))) {
    const roleId = parseInt(action);
    if (id === 'edit') {
      content = RoleEditPage(roleId);
      initFunc = () => wireRoleEdit(roleId);
    }
  } else {
    content = RolesPage();
    initFunc = wireRoles;
  }
  
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  if (initFunc) initFunc();
  wireNavbar();
}

function handleReportRoutes(hash) {
  const root = document.getElementById('app');
  const [, , action] = hash.split('/');
  
  let content = '';
  let initFunc = null;
  
  if (action === 'user') {
    content = UserReportPage();
    initFunc = wireUserReport;
  } else {
    content = ReportsPage();
    initFunc = wireReports;
  }
  
  root.innerHTML = `<div class="app">
    ${Navbar()}
    <div class="layout">
      ${Sidebar()}
      <main class="content">${content}</main>
    </div>
  </div>`;
  
  if (initFunc) initFunc();
  wireNavbar();
}

function getMainPageContent(hash) {
  // Handle leads with query parameters
  if (hash.startsWith('#/leads')) {
    return LeadsPage();
  }
  
  switch (hash) {
    case '#/dashboard':
      return Dashboard();
    case '#/leads':
      return LeadsPage();
    case '#/tasks':
      return TasksPage();
    case '#/users':
      return UsersPage();
    case '#/roles':
      return RolesPage();
    case '#/reports':
      return ReportsPage();
    case '#/assign':
      return AssignPage();
    case '#/profile':
      return renderProfile();
    default:
      return Dashboard();
  }
}

function initMainPage(hash) {
  // Handle leads with query parameters
  if (hash.startsWith('#/leads')) {
    wireLeads();
    return;
  }
  
  switch (hash) {
    case '#/dashboard':
      wireDashboard();
      break;
    case '#/leads':
      wireLeads();
      break;
    case '#/tasks':
      wireTasks();
      break;
    case '#/users':
      wireUsers();
      break;
    case '#/roles':
      wireRoles();
      break;
    case '#/reports':
      wireReports();
      break;
    case '#/assign':
      // No init function for assign page
      break;
    case '#/profile':
      wireProfile();
      break;
    default:
      wireDashboard();
      break;
  }
}

window.appNavigate = navigate;

// Debug function to test navigation
window.testNavigation = function() {
  console.log('Testing navigation...');
  console.log('window.appNavigate exists:', typeof window.appNavigate);
  console.log('Current hash:', location.hash);
  window.appNavigate('#/leads/add');
};
