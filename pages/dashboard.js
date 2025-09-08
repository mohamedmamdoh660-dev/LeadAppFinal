import { t, getCurrentUser } from '../state.js';
import { apiFetch, hasPermission } from '../shared.js';

let dashboardData = {
  leads: [],
  users: [],
  tasks: [],
  activities: []
};

export function Dashboard(){
  dashboardData.leads = Array.isArray(window.leadsData) ? window.leadsData : [];
  dashboardData.users = Array.isArray(window.usersData) ? window.usersData : [];
  dashboardData.tasks = Array.isArray(window.tasksData) ? window.tasksData : [];

  const stats = calculateStats();
  const chartData = getChartData();
  
  return `
<div class="dashboard-page">
  <!-- Clean Header -->
  <div class="page-header">
    <div class="header-left">
      <h1>Dashboard</h1>
      <p class="header-subtitle">Lead Management Overview</p>
    </div>
    <div class="header-actions">
      ${hasPermission('leads', 'create') ? `
        <button class="btn primary" onclick="console.log('Add Lead clicked'); window.appNavigate('#/leads/add')">+ Add Lead</button>
      ` : ''}
      ${hasPermission('tasks', 'create') ? `
        <button class="btn secondary" onclick="showGlobalAddTaskModal()">New Task</button>
      ` : ''}
    </div>
  </div>

  <!-- KPI Cards Row -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">${stats.totalLeads}</div>
      <div class="stat-label">Total Leads</div>
      <div class="stat-change positive">+${stats.newToday} today</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.converted}</div>
      <div class="stat-label">Converted</div>
      <div class="stat-change">${stats.totalLeads > 0 ? ((stats.converted/stats.totalLeads)*100).toFixed(1) : 0}% rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.inProgress}</div>
      <div class="stat-label">In Progress</div>
      <div class="stat-change">${stats.openTasks} open tasks</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.openTasks}</div>
      <div class="stat-label">Open Tasks</div>
      <div class="stat-change ${stats.overdueTasks > 0 ? 'negative' : ''}">${stats.overdueTasks} overdue</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.completedTasks}</div>
      <div class="stat-label">Completed Tasks</div>
      <div class="stat-change positive">This period</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.thisWeek}</div>
      <div class="stat-label">This Week</div>
      <div class="stat-change">vs ${stats.lastWeek} last week</div>
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="dashboard-grid">
    <!-- Charts Section -->
    <div class="chart-section">
      <div class="panel">
        <div class="panel-header">
          <h3>Lead Sources</h3>
        </div>
        <div class="chart-wrapper">
          <div class="pie-chart-simple">
            ${renderSimplePieChart(chartData.sources)}
          </div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="panel">
        <div class="panel-header">
          <h3>Lead Stages</h3>
        </div>
        <div class="chart-wrapper">
          <div class="bar-chart-simple">
            ${renderSimpleBarChart(chartData.stages)}
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Section -->
    <div class="activity-section">
      <div class="panel">
        <div class="panel-header">
          <h3>Recent Activity</h3>
          <button class="btn-link" onclick="window.appNavigate('#/activities')">View All</button>
        </div>
        <div class="activity-list">
          ${renderCleanActivity()}
        </div>
      </div>
    </div>

    <!-- Tasks Section -->
    <div class="tasks-section">
      <div class="panel">
        <div class="panel-header">
          <h3>Urgent Tasks</h3>
          <button class="btn-link" onclick="window.appNavigate('#/tasks')">View All</button>
        </div>
        <div class="task-list">
          ${renderCleanTasks()}
        </div>
      </div>
    </div>
  </div>

  <!-- Performance Trends Full Width -->
  <div class="panel">
    <div class="panel-header">
      <h3>Performance Trends</h3>
      <select class="select">
        <option>Last 7 days</option>
        <option>Last 30 days</option>
      </select>
    </div>
    <div class="trend-chart">
      ${renderSimpleLineChart(chartData.trends)}
    </div>
  </div>
</div>
`;
}

// Note: Data is loaded once at app start via loadAllData() in shared.js.
// Avoid fetching again here to prevent hashchange render loops and inconsistent shapes.

function calculateStats() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('Admin');
  
  // Filter data based on user role
  let userLeads = dashboardData.leads;
  let userTasks = dashboardData.tasks;
  
  if (!isAdmin) {
    // Non-admin users see only their assigned leads and tasks
    userLeads = dashboardData.leads.filter(l => 
      l.assigneeId === currentUser?.id || l.assignee_id === currentUser?.id
    );
    userTasks = dashboardData.tasks.filter(t => 
      t.assigneeId === currentUser?.id || t.assignee_id === currentUser?.id
    );
  }
  
  const today = new Date().toDateString();
  const thisWeek = getThisWeekLeads(userLeads);
  const lastWeek = getLastWeekLeads(userLeads);
  
  return {
    totalLeads: userLeads.length,
    newToday: userLeads.filter(l => 
      new Date(l.createdAt || l.created_at).toDateString() === today
    ).length,
    inProgress: userLeads.filter(l => 
      !['converted', 'lost', 'rejected'].includes(l.stage)
    ).length,
    converted: userLeads.filter(l => l.stage === 'converted').length,
    openTasks: userTasks.filter(t => !t.done).length,
    completedTasks: userTasks.filter(t => t.done).length,
    overdueTasks: userTasks.filter(t => {
      const dueDate = new Date(t.dueDate || t.due_at);
      return !t.done && dueDate < new Date();
    }).length,
    thisWeek: thisWeek,
    lastWeek: lastWeek
  };
}

function getThisWeekLeads(leads) {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  return leads.filter(l => 
    new Date(l.createdAt || l.created_at) >= weekStart
  ).length;
}

function getLastWeekLeads(leads) {
  const now = new Date();
  const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
  
  return leads.filter(l => {
    const date = new Date(l.createdAt || l.created_at);
    return date >= lastWeekStart && date <= lastWeekEnd;
  }).length;
}

function getChartData() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('Admin');
  
  // Filter data based on user role
  let userLeads = dashboardData.leads;
  if (!isAdmin) {
    userLeads = dashboardData.leads.filter(l => 
      l.assigneeId === currentUser?.id || l.assignee_id === currentUser?.id
    );
  }
  
  return {
    sources: getLeadsBySource(userLeads),
    stages: getLeadsByStatus(userLeads),
    trends: getTrendData(userLeads)
  };
}

function getTrendData(leads) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayLeads = leads.filter(l => 
      new Date(l.createdAt || l.created_at).toDateString() === date.toDateString()
    ).length;
    days.push({ date: date.toLocaleDateString(), leads: dayLeads });
  }
  return days;
}

function getLeadsBySource(leads) {
  if (!leads.length) return {};
  return leads.reduce((acc, lead) => {
    const source = lead.source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
}

function getLeadsByStatus(leads) {
  if (!leads.length) return {};
  return leads.reduce((acc, lead) => {
    const stage = lead.stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});
}

// Simplified Chart Functions
function renderSimplePieChart(data) {
  if (!data || Object.keys(data).length === 0) return '<div class="empty-chart">No data available</div>';
  
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  return Object.entries(data).slice(0, 4).map(([key, value], index) => {
    const percentage = ((value / total) * 100).toFixed(1);
    return `
      <div class="chart-item">
        <div class="chart-dot" style="background-color: ${colors[index]}"></div>
        <div class="chart-info">
          <span class="chart-label">${key}</span>
          <span class="chart-value">${value} (${percentage}%)</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderSimpleBarChart(data) {
  if (!data || Object.keys(data).length === 0) return '<div class="empty-chart">No data available</div>';
  
  const maxValue = Math.max(...Object.values(data));
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  return Object.entries(data).slice(0, 4).map(([key, value], index) => {
    const width = (value / maxValue) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label">${key}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${width}%; background-color: ${colors[index]}"></div>
        </div>
        <div class="bar-value">${value}</div>
      </div>
    `;
  }).join('');
}

function renderSimpleLineChart(trends) {
  if (!trends || trends.length === 0) return '<div class="empty-chart">No trend data available</div>';
  
  const maxLeads = Math.max(...trends.map(d => d.leads));
  if (maxLeads === 0) return '<div class="empty-chart">No activity this period</div>';
  
  return `
    <div class="line-chart-simple">
      ${trends.map((d, i) => {
        const height = (d.leads / maxLeads) * 60;
        return `
          <div class="chart-bar">
            <div class="bar" style="height: ${height}px; background-color: #3b82f6"></div>
            <div class="bar-label">${d.date.split('/')[1]}/${d.date.split('/')[0]}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCleanActivity() {
  if (dashboardData.activities.length === 0) {
    return '<div class="empty-state">No recent activity</div>';
  }
  
  return dashboardData.activities.slice(0, 5).map(activity => `
    <div class="activity-row">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-text">Lead activity recorded</div>
        <div class="activity-time">${new Date(activity.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  `).join('');
}

function renderCleanTasks() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('Admin');
  
  // Filter tasks based on user role
  let userTasks = dashboardData.tasks;
  if (!isAdmin) {
    userTasks = dashboardData.tasks.filter(t => 
      t.assigneeId === currentUser?.id || t.assignee_id === currentUser?.id
    );
  }
  
  const urgentTasks = userTasks
    .filter(t => !t.done)
    .sort((a, b) => new Date(a.dueDate || a.due_at) - new Date(b.dueDate || b.due_at))
    .slice(0, 5);
    
  if (urgentTasks.length === 0) {
    return '<div class="empty-state">No urgent tasks</div>';
  }
  
  return urgentTasks.map(task => {
    const dueDate = new Date(task.dueDate || task.due_at);
    const isOverdue = dueDate < new Date();
    const assignee = dashboardData.users.find(u => u.id === (task.assigneeId || task.assignee_id));
    
    return `
      <div class="task-row ${isOverdue ? 'overdue' : ''}">
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">${assignee ? assignee.name : 'Unassigned'} • ${dueDate.toLocaleDateString()}</div>
          <div class="task-type">${task.type || 'General'}</div>
        </div>
        <div class="task-actions">
          <button class="btn-sm primary" onclick="markTaskComplete(${task.id})">Complete</button>
          <button class="btn-sm" onclick="window.appNavigate('#/tasks/${task.id}')">View</button>
        </div>
      </div>
    `;
  }).join('');
}

export function wireDashboard(){
  // Wire up task completion functionality
  window.markTaskComplete = async function(taskId) {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: { done: true }
      });
      
      // Reload tasks data
      const tasksRes = await apiFetch('/tasks');
      window.tasksData = tasksRes.tasks || [];
      
      // Refresh dashboard
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      
      // Show success message
      if (window.showToast) {
        window.showToast('Task marked as complete!', 'success');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      if (window.showToast) {
        window.showToast('Failed to complete task', 'error');
      }
    }
  };
}

// Global Add Task Modal Function
window.showGlobalAddTaskModal = function() {
  // Create the modal HTML if it doesn't exist
  if (!document.getElementById('globalAddTaskModal')) {
    const modalHtml = `
      <div id="globalAddTaskModal" class="modal" style="display: none;">
        <div class="modal-content large-modal">
          <div class="modal-header">
            <h3>Add New Task</h3>
            <button class="btn ghost" onclick="closeGlobalAddTaskModal()">&times;</button>
          </div>
          <form id="globalAddTaskForm">
            <div class="form-grid">
              <div class="form-group">
                <label>Lead *</label>
                <select id="globalTaskLeadId" class="select" required>
                  <option value="">Select lead...</option>
                  ${(window.leadsData || []).map(lead => `
                    <option value="${lead.id}">${lead.full_name} - ${lead.email}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label>Task Title *</label>
                <input id="globalTaskTitle" class="input" type="text" required placeholder="Enter task title...">
              </div>
              
              <div class="form-group">
                <label>Type *</label>
                <select id="globalTaskType" class="select" required>
                  <option value="">Select type...</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="meeting">Meeting</option>
                  <option value="document">Document Review</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Assignee *</label>
                <select id="globalTaskAssigneeId" class="select" required>
                  <option value="">Select assignee...</option>
                  ${(window.usersData || []).map(user => `
                    <option value="${user.id}">${user.name}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label>Due Date *</label>
                <input id="globalTaskDueDate" class="input" type="datetime-local" required>
              </div>
              
              <div class="form-group full-width">
                <label>Description</label>
                <textarea id="globalTaskDescription" class="input" rows="3" placeholder="Task description (optional)..."></textarea>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn ghost" onclick="closeGlobalAddTaskModal()">Cancel</button>
              <button type="submit" class="btn primary">Create Task</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    document.getElementById('globalTaskDueDate').value = tomorrow.toISOString().slice(0, 16);
    
    // Handle form submission
    document.getElementById('globalAddTaskForm').onsubmit = async (e) => {
      e.preventDefault();
      
      const leadId = document.getElementById('globalTaskLeadId').value;
      const title = document.getElementById('globalTaskTitle').value.trim();
      const type = document.getElementById('globalTaskType').value;
      const assigneeId = document.getElementById('globalTaskAssigneeId').value;
      const dueDate = document.getElementById('globalTaskDueDate').value;
      const description = document.getElementById('globalTaskDescription').value.trim();
      
      if (!leadId || !title || !type || !assigneeId || !dueDate) {
        alert('Please fill in all required fields');
        return;
      }
      
      try {
        console.log('Creating task with data:', {
          leadId: parseInt(leadId),
          title: title,
          type: type,
          assigneeId: parseInt(assigneeId),
          dueDate: new Date(dueDate).toISOString(),
          description: description || null
        });
        
        const result = await apiFetch('/tasks', {
          method: 'POST',
          body: {
            leadId: parseInt(leadId),
            title: title,
            type: type,
            assigneeId: parseInt(assigneeId),
            dueDate: new Date(dueDate).toISOString()
          }
        });
        
        console.log('Task creation result:', result);
        
        // Reload tasks data
        const tasksRes = await apiFetch('/tasks');
        window.tasksData = tasksRes.tasks || [];
        
        // Close modal and show success
        closeGlobalAddTaskModal();
        alert('Task created successfully!');
        
        // Refresh dashboard if we're still on it
        if (location.hash === '#/dashboard' || location.hash === '') {
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
        
      } catch (error) {
        console.error('Failed to create task:', error);
        alert('Failed to create task. Please try again.');
      }
    };
  }
  
  // Show the modal
  document.getElementById('globalAddTaskModal').style.display = 'flex';
};

window.closeGlobalAddTaskModal = function() {
  const modal = document.getElementById('globalAddTaskModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('globalAddTaskForm').reset();
    
    // Reset due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    document.getElementById('globalTaskDueDate').value = tomorrow.toISOString().slice(0, 16);
  }
};
