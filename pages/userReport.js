// User Report Page - Individual user performance and statistics
import { t } from '../state.js';
import { apiFetch } from '../shared.js';

let currentUserId = null;
let users = [];
let leads = [];
let tasks = [];
const SOURCES = ['website', 'referral', 'social_media', 'advertisement', 'other'];

function getParams(){
  const hashQ = location.hash.split('?')[1] || '';
  const q = new URLSearchParams(hashQ);
  return {
    tq: q.get('tq') || '',
    tstatus: q.get('tstatus') || 'open', // all|open|done
    tdue: q.get('tdue') || 'all', // all|overdue|upcoming7
    ttype: q.get('ttype') || '',
    toutcome: q.get('toutcome') || '',
    lstatus: q.get('lstatus') || '', // '', new, in_progress, converted, rejected
    lsource: q.get('lsource') || '',
  };
}

function applyFiltersToHash(userId){
  const params = window.__ur_filters;
  const q = new URLSearchParams();
  if (params.tq) q.set('tq', params.tq);
  if (params.tstatus && params.tstatus!=='all') q.set('tstatus', params.tstatus);
  if (params.tdue && params.tdue!=='all') q.set('tdue', params.tdue);
  if (params.ttype) q.set('ttype', params.ttype);
  if (params.toutcome) q.set('toutcome', params.toutcome);
  if (params.lstatus) q.set('lstatus', params.lstatus);
  if (params.lsource) q.set('lsource', params.lsource);
  const qs = q.toString();
  const base = `#/users/report/${userId}`;
  history.replaceState(null, '', qs ? `${base}?${qs}` : base);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export async function UserReportPage(userId = null) {
  currentUserId = userId ? parseInt(userId) : null;
  
  try {
    // Load data from API
    const [usersResponse, leadsResponse, tasksResponse] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/leads'),
      apiFetch('/tasks')
    ]);
    
    users = usersResponse.users || [];
    leads = leadsResponse.items || [];
    tasks = tasksResponse.tasks || [];
    
    console.log('Loaded data for user report:', { users: users.length, leads: leads.length, tasks: tasks.length });
    
  } catch (error) {
    console.error('Error loading data for user report:', error);
    return `
      <div class="page-content">
        <div class="panel">
          <h3>Error loading data</h3>
          <p>Could not load user report data. Please try again.</p>
          <button class="btn" onclick="window.appNavigate('#/users')">Back to Users</button>
        </div>
      </div>
    `;
  }
  
  const user = users.find(u => u.id === currentUserId);
  
  if (!user) {
    return `
      <div class="page-content">
        <div class="panel">
          <h3>User not found</h3>
          <p>The requested user could not be found.</p>
          <button class="btn" onclick="window.appNavigate('#/users')">Back to Users</button>
        </div>
      </div>
    `;
  }

  // Filters state from URL
  const F = getParams();
  window.__ur_filters = F; // expose for wire

  // Prepare data
  const userLeads = leads.filter(lead => lead.assigneeId === currentUserId);
  const userTasksAll = tasks.filter(task => {
    const lead = leads.find(l => l.id === task.leadId);
    return lead && lead.assigneeId === currentUserId;
  });

  // Derived sets for clarity
  const now = new Date();
  const userLeadsFiltered = userLeads.filter(l => {
    const okStatus = !F.lstatus || l.status === F.lstatus;
    const okSrc = !F.lsource || (l.source||'') === F.lsource;
    const okQ = !F.tq || (l.full_name?.toLowerCase().includes(F.tq.toLowerCase()) || (l.email||'').toLowerCase().includes(F.tq.toLowerCase()));
    return okStatus && okSrc && okQ;
  });
  const userLeadsOpen = userLeadsFiltered.filter(l => !['converted','rejected','lost','closed'].includes(l.status));

  let userTasks = userTasksAll.filter(tk => {
    const lead = leads.find(l=>l.id===tk.leadId);
    const txt = [tk.title, lead?.full_name, lead?.email].join(' ').toLowerCase();
    const okQ = !F.tq || txt.includes(F.tq.toLowerCase());
    const okStatus = (F.tstatus==='all') || (tk.done ? 'done' : 'open') === F.tstatus;
    const okType = !F.ttype || tk.type === F.ttype;
    const okOutcome = !F.toutcome || (tk.outcome||'') === F.toutcome;
    let okDue = true;
    if (F.tdue==='overdue') okDue = !tk.done && tk.dueDate && new Date(tk.dueDate) < now;
    if (F.tdue==='upcoming7') okDue = !tk.done && tk.dueDate && new Date(tk.dueDate) >= now && new Date(tk.dueDate) <= new Date(now.getTime()+7*24*60*60*1000);
    return okQ && okStatus && okType && okOutcome && okDue;
  });

  const userTasksOpen = userTasks.filter(t => !t.done);
  const overdueTasks = userTasksOpen.filter(t => t.dueDate && new Date(t.dueDate) < now)
                                   .sort((a,b)=> new Date(a.dueDate)-new Date(b.dueDate));
  const upcomingTasks = userTasksOpen.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= new Date(now.getTime()+7*24*60*60*1000))
                                     .sort((a,b)=> new Date(a.dueDate)-new Date(b.dueDate));

  // Calculate statistics
  const stats = {
    totalLeads: userLeadsFiltered.length,
    newLeads: userLeadsFiltered.filter(l => l.status === 'new').length,
    inProgressLeads: userLeadsFiltered.filter(l => l.status === 'in_progress').length,
    convertedLeads: userLeadsFiltered.filter(l => l.status === 'converted').length,
    rejectedLeads: userLeadsFiltered.filter(l => l.status === 'rejected').length,
    openTasks: userTasksOpen.length,
    overdueTasks: overdueTasks.length,
    completedTasks: userTasks.filter(t => t.done).length,
    conversionRate: userLeadsFiltered.length > 0 ? ((userLeadsFiltered.filter(l => l.status === 'converted').length / userLeadsFiltered.length) * 100).toFixed(1) : 0
  };

  // Group leads by source (filtered)
  const leadsBySource = userLeadsFiltered.reduce((acc, lead) => {
    const source = lead.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  // For selects: derive lists
  const taskTypes = Array.from(new Set(userTasksAll.map(t=>t.type).filter(Boolean)));
  const taskOutcomes = Array.from(new Set(userTasksAll.map(t=>t.outcome).filter(Boolean)));
  const leadSources = Array.from(new Set([...(SOURCES||[]), ...userLeads.map(l=>l.source).filter(Boolean)]));

  return `
    <div class="user-edit-page">
      <!-- Header -->
      <div class="page-header-section">
        <div class="header-content">
          <div class="header-left">
            <button class="btn-back" onclick="window.appNavigate('#/users')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Users
            </button>
            <div class="header-title">
              <h1>${user.name} - User Report</h1>
              <p class="header-subtitle">Performance overview and statistics</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="panel">
        <h3>Filters</h3>
        <div class="toolbar-line wrap">
          <input id="ur_tq" class="input" placeholder="Search tasks/leads…" value="${F.tq}" />
          <select id="ur_tstatus" class="select">
            <option value="all" ${F.tstatus==='all'?'selected':''}>All Tasks</option>
            <option value="open" ${F.tstatus==='open'?'selected':''}>Open</option>
            <option value="done" ${F.tstatus==='done'?'selected':''}>Done</option>
          </select>
          <select id="ur_tdue" class="select">
            <option value="all" ${F.tdue==='all'?'selected':''}>All Due</option>
            <option value="overdue" ${F.tdue==='overdue'?'selected':''}>Overdue</option>
            <option value="upcoming7" ${F.tdue==='upcoming7'?'selected':''}>Upcoming 7d</option>
          </select>
          <select id="ur_ttype" class="select">
            <option value="" ${!F.ttype?'selected':''}>All Types</option>
            ${taskTypes.map(tt=>`<option value="${tt}" ${F.ttype===tt?'selected':''}>${tt}</option>`).join('')}
          </select>
          <select id="ur_toutcome" class="select">
            <option value="" ${!F.toutcome?'selected':''}>All Outcomes</option>
            ${taskOutcomes.map(o=>`<option value="${o}" ${F.toutcome===o?'selected':''}>${o}</option>`).join('')}
          </select>
          <select id="ur_lstatus" class="select">
            <option value="" ${!F.lstatus?'selected':''}>All Lead Status</option>
            ${['new','in_progress','converted','rejected'].map(s=>`<option value="${s}" ${F.lstatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <select id="ur_lsource" class="select">
            <option value="" ${!F.lsource?'selected':''}>All Sources</option>
            ${leadSources.map(s=>`<option value="${s}" ${F.lsource===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button id="ur_apply" class="btn">Apply</button>
          <button id="ur_clear" class="btn ghost">Clear</button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="page-content">
        <!-- Statistics Cards -->
        <div class="cards">
          <div class="card">
            <h4>Total Leads</h4>
            <div class="big">${stats.totalLeads}</div>
          </div>
          <div class="card">
            <h4>Open Leads</h4>
            <div class="big">${userLeadsOpen.length}</div>
          </div>
          <div class="card">
            <h4>Open Tasks</h4>
            <div class="big">${stats.openTasks}</div>
          </div>
          <div class="card ${stats.overdueTasks>0?'warn':''}">
            <h4>Overdue Tasks</h4>
            <div class="big">${stats.overdueTasks}</div>
          </div>
        </div>

        <div class="grid">
          <!-- Tasks Focus -->
          <div class="panel">
            <h3>Tasks Summary</h3>
            <div class="list">
              ${overdueTasks.length ? `<div class="row"><div class="k">Overdue (${overdueTasks.length})</div></div>` : ''}
              ${overdueTasks.map(tk => {
                const l = leads.find(l=>l.id===tk.leadId);
                return `
                  <div class="row small">
                    <div>
                      <strong>${tk.title}</strong><br>
                      <small>Lead: ${l?l.full_name:'Unknown'} • Due: ${new Date(tk.dueDate).toLocaleString()}</small>
                    </div>
                    <div style=\"display:flex; gap:6px;\">
                      <span class=\"tag warn\">overdue</span>
                      <button class=\"btn ok\" onclick=\"window.markTaskDone && window.markTaskDone(${tk.id})\">Mark done</button>
                      <button class=\"btn ghost\" onclick=\"window.appNavigate('#/leads/${tk.leadId}')\">Open Lead</button>
                    </div>
                  </div>`;
              }).join('')}
              ${upcomingTasks.length ? `<div class=\"row\"><div class=\"k\">Upcoming (7 days) (${upcomingTasks.length})</div></div>` : ''}
              ${upcomingTasks.map(tk => {
                const l = leads.find(l=>l.id===tk.leadId);
                return `
                  <div class="row small">
                    <div>
                      <strong>${tk.title}</strong><br>
                      <small>Lead: ${l?l.full_name:'Unknown'} • Due: ${new Date(tk.dueDate).toLocaleString()}</small>
                    </div>
                    <div style=\"display:flex; gap:6px;\">
                      <span class=\"tag\">open</span>
                      <button class=\"btn ok\" onclick=\"window.markTaskDone && window.markTaskDone(${tk.id})\">Mark done</button>
                      <button class=\"btn ghost\" onclick=\"window.appNavigate('#/leads/${tk.leadId}')\">Open Lead</button>
                    </div>
                  </div>`;
              }).join('')}
              ${userTasksOpen.length===0 ? '<div class="row small"><div>No open tasks</div></div>' : ''}
            </div>
          </div>

          <!-- Lead Distribution -->
          <div class="panel">
            <h3>Lead Distribution</h3>
            <div class="charts-grid">
              <div class="chart-block">
                <div class="chart-title">Leads by Status</div>
                <div class="chart-bars">
                  <div class="bar-row">
                    <div class="bar-label">New</div>
                    <div class="bar-track"><div class="bar-fill" style="width: ${stats.totalLeads > 0 ? (stats.newLeads / stats.totalLeads) * 100 : 0}%"></div></div>
                    <div class="bar-value">${stats.newLeads}</div>
                  </div>
                  <div class="bar-row">
                    <div class="bar-label">In Progress</div>
                    <div class="bar-track"><div class="bar-fill" style="width: ${stats.totalLeads > 0 ? (stats.inProgressLeads / stats.totalLeads) * 100 : 0}%"></div></div>
                    <div class="bar-value">${stats.inProgressLeads}</div>
                  </div>
                  <div class="bar-row">
                    <div class="bar-label">Converted</div>
                    <div class="bar-track"><div class="bar-fill" style="width: ${stats.totalLeads > 0 ? (stats.convertedLeads / stats.totalLeads) * 100 : 0}%"></div></div>
                    <div class="bar-value">${stats.convertedLeads}</div>
                  </div>
                  <div class="bar-row">
                    <div class="bar-label">Rejected</div>
                    <div class="bar-track"><div class="bar-fill" style="width: ${stats.totalLeads > 0 ? (stats.rejectedLeads / stats.totalLeads) * 100 : 0}%"></div></div>
                    <div class="bar-value">${stats.rejectedLeads}</div>
                  </div>
                </div>
              </div>
              
              <div class="chart-block">
                <div class="chart-title">Leads by Source</div>
                <div class="chart-bars">
                  ${Object.entries(leadsBySource).map(([source, count]) => `
                    <div class="bar-row">
                      <div class="bar-label">${source.charAt(0).toUpperCase() + source.slice(1)}</div>
                      <div class="bar-track"><div class="bar-fill" style="width: ${stats.totalLeads > 0 ? (count / stats.totalLeads) * 100 : 0}%"></div></div>
                      <div class="bar-value">${count}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Tables -->
        <div class="grid">
          <!-- Open Leads -->
          <div class="panel">
            <h3>Open Leads (${userLeadsOpen.length})</h3>
            <div class="list">
              ${userLeadsOpen.length ? userLeadsOpen.map(lead => `
                <div class="row report-grid">
                  <div class="cell">${lead.full_name}</div>
                  <div class="cell">${lead.email || '-'}</div>
                  <div class="cell">${lead.source || '-'}</div>
                  <div class="cell"><span class="tag">${lead.status}</span></div>
                  <div class="cell">${lead.nationality || '-'}</div>
                  <div class="cell">${lead.city || '-'}</div>
                  <div class="cell">${lead.gender || '-'}</div>
                  <div class="cell">
                    <button class="btn-icon" onclick="window.appNavigate('#/leadOpen/${lead.id}')">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              `).join('') : '<div class="row small"><div>No open leads</div></div>'}
            </div>
          </div>

          <!-- All User Tasks (compact) -->
          <div class="panel">
            <h3>All Tasks (${userTasks.length})</h3>
            <div class="list">
              ${userTasks.length ? userTasks.map(task => {
                const lead = leads.find(l => l.id === task.leadId);
                const due = task.dueDate ? new Date(task.dueDate).toLocaleString() : '-';
                return `
                  <div class="row small">
                    <div>
                      <strong>${task.title}</strong><br>
                      <small>Lead: ${lead ? lead.full_name : 'Unknown'} • Due: ${due}</small>
                    </div>
                    <div>
                      <span class="tag ${task.done?'ok':''}">${task.done ? 'done' : 'open'}</span>
                    </div>
                  </div>
                `;
              }).join('') : '<div class="row small"><div>No tasks</div></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function wireUserReport(userId = null) {
  // Wire filters
  const F = window.__ur_filters || {};
  const $ = (id)=>document.getElementById(id);
  const bind = (id, key)=>{ const el=$(id); if(el){ el.onchange=(e)=>{ window.__ur_filters[key]=e.target.value; }; } };
  bind('ur_tq','tq'); if($('ur_tq')) $('ur_tq').onkeyup=(e)=>{ if(e.key==='Enter'){ applyFiltersToHash(currentUserId); } };
  bind('ur_tstatus','tstatus');
  bind('ur_tdue','tdue');
  bind('ur_ttype','ttype');
  bind('ur_toutcome','toutcome');
  bind('ur_lstatus','lstatus');
  bind('ur_lsource','lsource');
  const applyBtn = document.getElementById('ur_apply');
  const clearBtn = document.getElementById('ur_clear');
  if (applyBtn) applyBtn.onclick = ()=> applyFiltersToHash(currentUserId);
  if (clearBtn) clearBtn.onclick = ()=>{ window.__ur_filters = { tq:'', tstatus:'open', tdue:'all', ttype:'', toutcome:'', lstatus:'', lsource:'' }; applyFiltersToHash(currentUserId); };
}
