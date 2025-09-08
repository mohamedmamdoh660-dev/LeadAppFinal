import { t, getCurrentUser } from '../state.js';
import { TASK_TYPES, TASK_OUTCOMES } from '../data/mock.js';
import { $, $$, apiFetch } from '../shared.js';
import { navigate } from '../router.js';

export function TasksPage(){
  const hashQ = location.hash.split('?')[1] || '';
  const q = new URLSearchParams(hashQ);
  const search = q.get('q') || '';
  const st = q.get('status') || '';
  const tp = q.get('type') || '';
  const userFilter = q.get('user') || 'my'; // 'my' or 'all'

  const tasks = window.tasksData || [];
  const currentUser = getCurrentUser();
  
  const filtered = tasks.filter(tk=>{
    const s = search.trim().toLowerCase();
    const matchQ = !s || tk.title.toLowerCase().includes(s);
    
    // Status filter logic - convert between 'done'/'open' and boolean 'done' field
    let matchSt = true;
    if (st === 'done') {
      matchSt = tk.done === true;
    } else if (st === 'open') {
      matchSt = tk.done !== true;
    }
    
    const matchTp = !tp || tk.type === tp;
    
    // User filter logic
    let matchUser = true;
    if (userFilter === 'my' && currentUser) {
      matchUser = tk.assigneeId === currentUser.id;
    }
    
    return matchQ && matchSt && matchTp && matchUser;
  });

  const rows = filtered.map(tk=>{
    const leadId = tk.leadId || tk.lead_id;
    const l = (window.leadsData || []).find(l=>l.id===leadId) || { full_name: '—' };
    return `<div class="row">
      <div>
        <div class="k">${tk.title}</div>
        <small>${t('labels.due')}: ${new Date(tk.due_at).toLocaleDateString()}</small>
      </div>
      <div>${tk.type||'—'}</div>
      <div>${tk.done ? '<span class="status-done">✓ Done</span>' : '<span class="status-open">⏳ Open</span>'}</div>
      <div class="hide-sm">${l.full_name}</div>
      <div class="hide-sm">${tk.outcome ? `<span class="tag">${tk.outcome}</span>` : '<span class="muted">—</span>'}</div>
      <div class="task-actions">
        ${!tk.done?`<button class="btn-sm btn-success" onclick="window.markTaskDone(${tk.id})" title="Mark as Done">✓</button>`:''}
        <button class="btn-sm btn-primary" onclick="window.appNavigate('#/tasks/${tk.id}')" title="Open Task">📋</button>
        <button class="btn-sm btn-ghost" onclick="window.appNavigate('#/leads/${leadId}')" title="View Lead">👤</button>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="panel">
      <h3 style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span>${t('tasks')}</span>
        <span style="display:flex; gap:8px;">
          <button id="btnAddTask" class="btn primary">+ Add Task</button>
          <input id="fileTasks" type="file" accept=".csv" class="input" style="padding:6px" />
          <button id="btnImportTasks" class="btn ghost">${t('import')}</button>
          <button id="btnExportTasks" class="btn">${t('export')}</button>
        </span>
      </h3>
      <div class="toolbar-line">
        <input id="tq" class="input" placeholder="Search…" value="${search}" style="">
        <select id="tUser" class="select">
          <option value="my" ${userFilter==='my'?'selected':''}>My Tasks</option>
          <option value="all" ${userFilter==='all'?'selected':''}>All Tasks</option>
        </select>
        <select id="tStatus" class="select">
          <option value="">All statuses</option>
          <option value="open" ${st==='open'?'selected':''}>open</option>
          <option value="done" ${st==='done'?'selected':''}>done</option>
        </select>
        <select id="tType" class="select">
          <option value="">All types</option>
          ${TASK_TYPES.map(t=>`<option value="${t}" ${tp===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <button id="tApply" class="btn ghost">Apply</button>
      </div>
      <div class="list">${rows}</div>
    </div>
    
    <!-- Add Task Modal -->
    <div id="addTaskModal" class="modal" style="display: none;">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>Add New Task</h3>
          <button class="btn ghost" onclick="closeAddTaskModal()">&times;</button>
        </div>
        <form id="addTaskForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Lead *</label>
              <select id="taskLeadId" class="select" required>
                <option value="">Select lead...</option>
                ${(window.leadsData || []).map(lead => `
                  <option value="${lead.id}">${lead.full_name} - ${lead.email}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label>Task Title *</label>
              <input id="taskTitle" class="input" type="text" required placeholder="Enter task title...">
            </div>
            
            <div class="form-group">
              <label>Type *</label>
              <select id="taskType" class="select" required>
                <option value="">Select type...</option>
                ${TASK_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label>Assignee *</label>
              <select id="taskAssigneeId" class="select" required>
                <option value="">Select assignee...</option>
                ${(window.usersData || []).map(user => `
                  <option value="${user.id}" ${user.id === 1 ? 'selected' : ''}>${user.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label>Due Date *</label>
              <input id="taskDueDate" class="input" type="datetime-local" required>
            </div>
            
            <div class="form-group full-width">
              <label>Description</label>
              <textarea id="taskDescription" class="input" rows="3" placeholder="Task description (optional)..."></textarea>
            </div>
            
            <div class="form-group">
              <label>Priority *</label>
              <select id="taskPriority" class="select" required>
                <option value="">Select priority...</option>
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Estimated Hours</label>
              <input id="taskEstimatedHours" class="input" type="number" min="0.5" step="0.5" placeholder="Hours">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn ghost" onclick="closeAddTaskModal()">Cancel</button>
            <button type="submit" class="btn primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function wireTasks(){
  document.getElementById('tStatus').value = new URLSearchParams(location.hash.split('?')[1]||'').get('status') || '';
  document.getElementById('tType').value = new URLSearchParams(location.hash.split('?')[1]||'').get('type') || '';

  document.getElementById('tApply').onclick = () => {
    const params = new URLSearchParams();
    const qv = document.getElementById('tq').value.trim(); if(qv) params.set('q', qv);
    const uv = document.getElementById('tUser').value; if(uv !== 'my') params.set('user', uv);
    const sv = document.getElementById('tStatus').value; if(sv) params.set('status', sv);
    const tv = document.getElementById('tType').value; if(tv) params.set('type', tv);
    const qs = params.toString();
    history.replaceState(null, '', `#/tasks${qs?'?'+qs:''}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  document.getElementById('btnAddTask').onclick = () => openAddTaskModal();
  document.getElementById('btnExportTasks').onclick = () => exportTasksCSV();
  document.getElementById('btnImportTasks').onclick = () => importTasksCSV(document.getElementById('fileTasks').files[0]);
  
  // Add Task Form Handler
  const addTaskForm = document.getElementById('addTaskForm');
  if (addTaskForm) {
    addTaskForm.onsubmit = async (e) => {
      e.preventDefault();
      await handleAddTask();
    };
  }

  // Global handler to mark task done and set outcome
  window.markTaskDone = async function(id){
    const tk = (window.tasksData || []).find(x=>x.id===id);
    if(!tk) {
      console.error('Task not found:', id);
      return;
    }
    
    // Ask user for outcome (simple prompt with listed options)
    const opts = ['','\n- '+TASK_OUTCOMES.join('\n- ')].join('');
    let outcome = prompt(`Enter outcome (optional). Available outcomes:${opts}\nLeave empty to skip:`, tk.outcome||'');
    if (outcome!==null){ outcome = outcome.trim(); if(outcome==='' ) outcome = null; }
    
    try {
      console.log('Marking task as done:', id, 'with outcome:', outcome);
      
      // Update task in database
      const response = await apiFetch(`/tasks/${id}`, {
        method: 'PUT',
        body: {
          done: true,
          outcome: outcome
        }
      });
      
      console.log('Task update response:', response);
      
      // Reload tasks data from server
      const tasksRes = await apiFetch('/tasks');
      window.tasksData = tasksRes.tasks || [];
      
      // Refresh the page
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (error) {
      console.error('Failed to mark task as done:', error);
      alert('Failed to mark task as done. Please try again.');
    }
  };
}

// Add Task Modal Functions
window.openAddTaskModal = function() {
  document.getElementById('addTaskModal').style.display = 'flex';
};

window.closeAddTaskModal = function() {
  document.getElementById('addTaskModal').style.display = 'none';
  document.getElementById('addTaskForm').reset();
};

async function handleAddTask() {
  const leadId = document.getElementById('taskLeadId').value;
  const title = document.getElementById('taskTitle').value.trim();
  const type = document.getElementById('taskType').value;
  const assigneeId = document.getElementById('taskAssigneeId').value;
  const dueDate = document.getElementById('taskDueDate').value;
  
  if (!leadId || !title) {
    alert('Please fill in required fields');
    return;
  }
  
  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: {
        leadId: parseInt(leadId),
        title: title,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      }
    });
    
    // Reload tasks data
    const tasksRes = await apiFetch('/tasks');
    window.tasksData = tasksRes.tasks || [];
    
    // Close modal and refresh page
    window.closeAddTaskModal();
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task. Please try again.');
  }
}

function exportTasksCSV(){
  const cols = ['id','lead_id','lead_name','title','type','status','due_at','outcome'];
  const mapRow = tk => [tk.id, tk.lead_id, (window.leads.find(l=>l.id===tk.lead_id)||{}).full_name||'', tk.title||'', tk.type||'', tk.status||'', tk.due_at||'', tk.outcome||''].map(v=>`"${String(v).replaceAll('"','\\"')}"`).join(',');
  const csv = [cols.join(','), ...window.tasks.map(mapRow)].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = `tasks_${Date.now()}.csv`; a.click();
}
function importTasksCSV(file){
  if(!file){ alert('Choose CSV first'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',').map(s=>s.replace(/^\"|\"$/g,''));
    const idx = (k) => header.indexOf(k);
    lines.forEach(line => {
      const parts = line.match(/\"(?:[^\"]|\\")*\"|[^,]+/g).map(s=>s.replace(/^\"|\"$/g,'').replace(/\\"/g,'"'));
      const leadId = Number(parts[idx('lead_id')]);
      if(!window.leads.find(l=>l.id===leadId)) return;
      window.tasks.push({
        id: Math.max(0, ...window.tasks.map(x=>x.id))+1,
        lead_id: leadId,
        title: parts[idx('title')] || 'Untitled',
        type: parts[idx('type')] || 'call',
        status: parts[idx('status')] || 'open',
        due_at: parts[idx('due_at')] || new Date().toISOString(),
        outcome: idx('outcome')>-1 ? (parts[idx('outcome')]||null) : null,
      });
    });
    alert('Imported ' + lines.length + ' task(s).');
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  reader.readAsText(file);
}
