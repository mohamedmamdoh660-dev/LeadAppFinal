import { t } from '../state.js';
import { TASK_TYPES, LEAD_STAGES, CONTACT_METHODS, CONTACT_OUTCOMES, LOST_REASONS, me } from '../data/mock.js';
import { $, $$, fmtDate, toLocalDateTimeValue, apiFetch } from '../shared.js';
import { navigate } from '../router.js';

let currentLead = null;
window.serverLeadCache = window.serverLeadCache || {}; // id -> mapped lead with activities/tasks

export function LeadOpen(id){
  const cached = window.serverLeadCache[id];
  const l = cached || (window.leadsData || []).find(x=>x.id===id);
  currentLead = l;
  if(!l) return `<div class="panel">Lead #${id} ${t('notFound')}</div>`;
  
  const relatedTasks = cached ? (cached.tasks || []) : (window.tasksData || []).filter(tk=>(tk.lead_id || tk.leadId)===id);
  const activities = cached ? (cached.activities || []) : [];
  const currentStage = LEAD_STAGES.find(s => s.id === l.stage) || LEAD_STAGES[0];
  const assignee = (window.usersData || []).find(u => u.id === (l.assigneeId || l.assignee_id));
  const canAdvance = currentStage.next && !['converted', 'lost', 'rejected'].includes(l.stage);

  return `
    <div class="lead-open-page">
      <!-- Header -->
      <div class="page-header-section">
        <div class="header-content">
          <div class="header-left">
            <button class="btn-back" onclick="window.appNavigate('#/leads')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Leads
            </button>
            <div class="header-title">
              <h1>${l.full_name} <small style="color:var(--muted);">#${l.id}</small></h1>
              <p class="header-subtitle">${l.email || 'No email'} • Assigned to: ${assignee ? assignee.name : 'Unassigned'}</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn ghost" onclick="window.appNavigate('#/leads/${id}/edit')">Edit Lead</button>
            ${l.stage !== 'converted' ? `
              <button class="btn success" onclick="convertToStudent(${id})" style="background-color: #10b981; color: white; margin-left: 10px;">
                Convert To Student
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Stage Progress Bar -->
      <div class="panel">
        <h3>Lead Progress</h3>
        <div class="stage-progress">
          ${LEAD_STAGES.filter(s => !['lost', 'rejected'].includes(s.id)).map(stage => {
            const isActive = stage.id === l.stage;
            const isPassed = getStageIndex(l.stage) > getStageIndex(stage.id);
            const isLost = l.stage === 'lost' || l.stage === 'rejected';
            return `
              <div class="stage-item ${isActive ? 'active' : ''} ${isPassed ? 'completed' : ''} ${isLost ? 'disabled' : ''}">
                <div class="stage-circle" style="background-color: ${isActive || isPassed ? stage.color : '#e5e7eb'}">
                  ${isPassed ? '✓' : ''}
                </div>
                <div class="stage-label">${stage.name}</div>
              </div>
            `;
          }).join('')}
        </div>
        
        ${l.stage === 'lost' ? `
          <div class="alert alert-warning">
            <strong>Lead Lost:</strong> ${(function() {
              const reason = LOST_REASONS.find(r => r.id === l.lost_reason);
              return (reason && reason.name) || l.lost_reason || 'No reason specified';
            })()}
          </div>
        ` : ''}
        
        ${l.stage === 'rejected' ? `
          <div class="alert alert-error">
            <strong>Lead Rejected</strong>
          </div>
        ` : ''}
      </div>

      <!-- Lead Details -->
      <div class="grid">
        <div class="panel">
          <h3>Lead Information</h3>
          <div class="list">
            <div class="row small"><div><b>Email:</b> ${l.email||'—'}</div><div><b>Phone:</b> ${l.phone||'—'}</div></div>
            <div class="row small"><div><b>Nationality:</b> ${l.nationality||'—'}</div><div><b>Residence:</b> ${l.residence_country||'—'}</div></div>
            <div class="row small"><div><b>City:</b> ${l.city||'—'}</div><div><b>Gender:</b> ${l.gender||'—'}</div></div>
            <div class="row small"><div><b>Program:</b> ${l.program||'—'}</div><div><b>Degree:</b> ${l.degree||'—'}</div></div>
            <div class="row small"><div><b>Source:</b> ${l.source||'—'}</div><div><b>Assignee:</b> 
              <span id="assignee-display">${assignee ? assignee.name : 'Unassigned'}</span>
              <button class="btn-sm btn-ghost" onclick="showChangeAssigneeModal(${id})" title="Change Assignee" style="margin-left: 8px;">✏️</button>
            </div></div>
            <div class="row small">
              <div><b>Current Stage:</b> 
                <span class="tag" style="background-color: ${currentStage.color}20; color: ${currentStage.color}; border: 1px solid ${currentStage.color}40;">
                  ${currentStage.name}
                </span>
              </div>
              <div><b>Created:</b> ${new Date(l.created_at || l.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <!-- Contact Actions Panel -->
        ${canAdvance ? `
        <div class="panel">
          <h3>Contact Lead</h3>
          <form id="contactForm" class="contact-form">
            <div class="form-group">
              <label>Contact Method *</label>
              <select id="contactMethod" class="select" required>
                <option value="">Select method...</option>
                ${CONTACT_METHODS.map(method => `
                  <option value="${method.id}">${method.icon} ${method.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label>Outcome *</label>
              <select id="contactOutcome" class="select" required>
                <option value="">Select outcome...</option>
                ${CONTACT_OUTCOMES.map(outcome => `
                  <option value="${outcome.id}" style="color: ${outcome.color}">${outcome.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label>Notes *</label>
              <textarea id="contactNotes" class="input" rows="3" placeholder="Add details about this contact..." required></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn primary">Record Contact</button>
              <button type="button" class="btn ghost" onclick="showLostModal()">Mark as Lost</button>
            </div>
          </form>
        </div>
        ` : ''}

      </div>

      <!-- Activities Timeline & Tasks Section -->
      <div class="grid">
        <!-- Activities Timeline -->
        <div class="panel">
          <h3>Activity Timeline</h3>
          <div class="timeline">
            ${activities.length ? activities.map(activity => {
              const user = (window.usersData || []).find(u => u.id === (activity.user_id != null ? activity.user_id : activity.userId));
              const method = CONTACT_METHODS.find(m => m.id === (activity.contact_method != null ? activity.contact_method : activity.method));
              const outcome = CONTACT_OUTCOMES.find(o => o.id === activity.outcome);
              const stageFrom = LEAD_STAGES.find(s => s.id === (activity.stage_from != null ? activity.stage_from : activity.fromStage));
              const stageTo = LEAD_STAGES.find(s => s.id === (activity.stage_to != null ? activity.stage_to : activity.toStage));
              
              return `
                <div class="timeline-item">
                  <div class="timeline-marker" style="background-color: ${outcome ? outcome.color : '#6b7280'}"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <strong>
                        ${method ? `${method.icon} ${method.name}` : 'System Action'}
                        ${outcome ? ` - ${outcome.name}` : ''}
                      </strong>
                      <small>${new Date(activity.created_at || activity.createdAt).toLocaleString()}</small>
                    </div>
                    
                    ${((activity.stage_from != null ? activity.stage_from : activity.fromStage) !== (activity.stage_to != null ? activity.stage_to : activity.toStage)) ? `
                      <div class="stage-change">
                        Stage: ${(function() {
                          const from = activity.stage_from != null ? activity.stage_from : activity.fromStage;
                          const to = activity.stage_to != null ? activity.stage_to : activity.toStage;
                          const fromName = stageFrom ? stageFrom.name : from;
                          const toName = stageTo ? stageTo.name : to;
                          return `${fromName || 'Unknown'} → ${toName || 'Unknown'}`;
                        })()} 
                      </div>
                    ` : ''}
                    
                    ${activity.notes ? `
                      <div class="timeline-notes">${activity.notes}</div>
                    ` : ''}
                    
                    <div class="timeline-user">by ${user ? user.name : 'System'}</div>
                  </div>
                </div>
              `;
            }).join('') : '<div class="timeline-empty">No activities yet</div>'}
          </div>
        </div>

        <!-- Tasks Section -->
        <div class="panel">
          <div class="panel-header">
            <h3>Tasks</h3>
            <button class="btn primary btn-sm" onclick="showAddTaskModalForLead(${id})" title="Add New Task">+ Add Task</button>
          </div>
          <div class="tasks-list">
            ${relatedTasks.length ? relatedTasks.map(task => {
              const assignee = (window.usersData || []).find(u => u.id === task.assigneeId);
              return `
                <div class="task-row">
                  <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                      <span class="task-due">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                      <span class="task-assignee">Assignee: ${assignee ? assignee.name : 'Unassigned'}</span>
                      <span class="task-type">${task.type || 'General'}</span>
                    </div>
                  </div>
                  <div class="task-status">
                    ${task.done ? '<span class="status-done">✓ Done</span>' : '<span class="status-open">⏳ Open</span>'}
                  </div>
                  <div class="task-actions">
                    ${!task.done ? `<button class="btn-sm btn-success" onclick="markTaskDone(${task.id})" title="Mark as Done">✓</button>` : ''}
                    <button class="btn-sm btn-primary" onclick="window.appNavigate('#/tasks/${task.id}')" title="Open Task">📋</button>
                  </div>
                </div>
              `;
            }).join('') : '<div class="no-tasks">No tasks yet</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Lost Reason Modal -->
    <div id="lostModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Mark Lead as Lost</h3>
          <button class="modal-close" onclick="hideLostModal()">&times;</button>
        </div>
        <form id="lostForm">
          <div class="modal-body">
            <div class="form-group">
              <label>Reason for Loss *</label>
              <select id="lostReason" class="select" required>
                <option value="">Select reason...</option>
                ${LOST_REASONS.map(reason => `
                  <option value="${reason.id}">${reason.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Additional Notes *</label>
              <textarea id="lostNotes" class="input" rows="3" placeholder="Provide additional details..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn ghost" onclick="hideLostModal()">Cancel</button>
            <button type="submit" class="btn danger">Mark as Lost</button>
          </div>
        </form>
      </div>
    </div>
  
`;
}

// Global function for adding tasks to leads
window.showAddTaskModalForLead = function(leadId) {
  // Create modal HTML
  const modalHtml = `
    <div id="addTaskModal" class="modal" style="display: block;">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Add New Task</h3>
          <button class="btn-close" onclick="closeAddTaskModal()">&times;</button>
        </div>
        <form id="addTaskForm">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Task Title *</label>
                <input type="text" id="taskTitle" class="input" required placeholder="Enter task title...">
              </div>
              
              <div class="form-group">
                <label>Type *</label>
                <select id="taskType" class="select" required>
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
                <select id="taskAssignee" class="select">
                  <option value="">Use Lead Assignee (${((window.usersData || []).find(u => u.id === (window.serverLeadCache[leadId] || (window.leadsData || []).find(x=>x.id===parseInt(leadId)))?.assigneeId) || {}).name || 'Auto-assign'})</option>
                  ${(window.usersData || []).filter(u => u.active).map(user => `
                    <option value="${user.id}">${user.name} ${user.roles && user.roles.length > 0 ? `(${user.roles.join(', ')})` : ''}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label>Due Date *</label>
                <input type="datetime-local" id="taskDueDate" class="input" required min="${new Date().toISOString().slice(0, 16)}">
              </div>
              
              <div class="form-group full-width">
                <label>Description</label>
                <textarea id="taskDescription" class="input" rows="3" placeholder="Task description (optional)..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn ghost" onclick="closeAddTaskModal()">Cancel</button>
            <button type="submit" class="btn primary">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Handle form submission
  document.getElementById('addTaskForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      title: document.getElementById('taskTitle').value.trim(),
      type: document.getElementById('taskType').value,
      assigneeId: parseInt(document.getElementById('taskAssignee').value) || (window.serverLeadCache[leadId] || (window.leadsData || []).find(x=>x.id===parseInt(leadId)))?.assigneeId || 1,
      dueDate: document.getElementById('taskDueDate').value,
      description: document.getElementById('taskDescription').value.trim(),
      leadId: parseInt(leadId)
    };
    
    try {
      const response = await apiFetch(`/leads/${leadId}/tasks`, {
        method: 'POST',
        body: taskData
      });
      
      console.log('Task created:', response);
      closeAddTaskModal();
      
      // Reload lead data to show new task
      await loadLeadFromApi(leadId);
      // Refresh tasks data
      const tasksRes = await apiFetch('/tasks');
      window.tasksData = tasksRes.items || tasksRes.tasks || [];
      window.location.hash = `#/leads/${leadId}`;
      
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };
};

window.closeAddTaskModal = function() {
  const modal = document.getElementById('addTaskModal');
  if (modal) {
    modal.remove();
  }
};

// Change assignee modal
window.showChangeAssigneeModal = function(leadId) {
  const lead = window.serverLeadCache[leadId] || (window.leadsData || []).find(x=>x.id===leadId);
  const currentAssignee = (window.usersData || []).find(u => u.id === lead?.assigneeId);
  
  const modalHtml = `
    <div id="changeAssigneeModal" class="modal" style="display: block;">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Change Assignee</h3>
          <button class="btn-close" onclick="closeChangeAssigneeModal()">&times;</button>
        </div>
        <form id="changeAssigneeForm">
          <div class="modal-body">
            <div class="form-group">
              <label>Current Assignee</label>
              <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 16px;">
                ${currentAssignee ? currentAssignee.name : 'Unassigned'}
              </div>
              
              <label>New Assignee</label>
              <select id="newAssignee" class="select">
                <option value="">Auto-assign (recommended)</option>
                ${(window.usersData || []).filter(u => u.active).map(user => `
                  <option value="${user.id}" ${user.id === lead?.assigneeId ? 'selected' : ''}>
                    ${user.name} ${user.roles && user.roles.length > 0 ? `(${user.roles.join(', ')})` : ''}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn ghost" onclick="closeChangeAssigneeModal()">Cancel</button>
            <button type="submit" class="btn primary">Update Assignee</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  document.getElementById('changeAssigneeForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const newAssigneeId = document.getElementById('newAssignee').value;
    
    try {
      let assigneeId = null;
      
      if (newAssigneeId === '') {
        // Auto-assign
        const autoAssignResponse = await apiFetch('/leads/auto-assign', {
          method: 'POST',
          body: { leadId: leadId, nationality: lead.nationality, degree: lead.degree }
        });
        assigneeId = autoAssignResponse.assigneeId;
      } else {
        assigneeId = parseInt(newAssigneeId);
      }
      
      // Update lead assignee
      await apiFetch(`/leads/${leadId}`, {
        method: 'PUT',
        body: { assigneeId }
      });
      
      closeChangeAssigneeModal();
      await loadLeadFromApi(leadId);
      window.location.hash = `#/leads/${leadId}`;
      
    } catch (error) {
      console.error('Error updating assignee:', error);
      alert('Failed to update assignee. Please try again.');
    }
  };
};

window.closeChangeAssigneeModal = function() {
  const modal = document.getElementById('changeAssigneeModal');
  if (modal) {
    modal.remove();
  }
};

export function wireLeadOpen(id){
  const l = window.serverLeadCache[id] || (window.leadsData || []).find(x=>x.id===id);
  if(!l) return;
  // Load latest lead details from server (no re-render to avoid infinite loop)
  loadLeadFromApi(id);
  
  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.onsubmit = (e) => {
      e.preventDefault();
      const method = document.getElementById('contactMethod').value;
      const outcome = document.getElementById('contactOutcome').value;
      const notes = document.getElementById('contactNotes').value.trim();
      
      if (!method || !outcome || !notes) {
        alert('Please fill in all required fields');
        return;
      }
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('Current user from localStorage:', currentUser);
      console.log('All localStorage keys:', Object.keys(localStorage));
      
      // Try to get user from different possible storage locations
      let userId = currentUser.id;
      if (!userId) {
        // Check if user is stored under different key
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token exists:', !!authToken);
        
        // For now, use the admin user ID we know exists (ID: 9)
        userId = 9;
        console.log('Using fallback admin userId:', userId);
      }
      
      console.log('Sending activity with userId:', userId);
      apiFetch(`/leads/${id}/activities`, { method: 'POST', body: { method, outcome, notes, userId: userId }})
        .then(()=> loadLeadFromApi(id))
        .then(()=>{
          contactForm.reset();
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        })
        .catch(err=>{ console.error(err); alert('Failed to record contact'); });
    };
  }

  // Lost form submission
  const lostForm = document.getElementById('lostForm');
  if (lostForm) {
    lostForm.onsubmit = (e) => {
      e.preventDefault();
      const reason = document.getElementById('lostReason').value;
      const notes = document.getElementById('lostNotes').value.trim();
      
      if (!reason || !notes) {
        alert('Please fill in all required fields');
        return;
      }
      apiFetch(`/leads/${id}/lost`, { method: 'POST', body: { reason, notes, userId: me().id }})
        .then(()=> loadLeadFromApi(id))
        .then(()=>{ hideLostModal(); window.dispatchEvent(new HashChangeEvent("hashchange")); })
        .catch(err=>{ console.error(err); alert('Failed to mark as lost'); });
    };
  }

  // Quick task form
  const quickTaskForm = document.getElementById('quickTask');
  if (quickTaskForm) {
    const due = document.getElementById('qtDue');
    const now = new Date();
    due.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    quickTaskForm.onsubmit = (e)=>{
      e.preventDefault();
      const title = document.getElementById('qtTitle').value.trim();
      const type = document.getElementById('qtType').value;
      const dueVal = document.getElementById('qtDue').value;
      if(!title || !dueVal) return;
      apiFetch(`/leads/${id}/tasks`, { method: 'POST', body: { title, due_at: new Date(dueVal).toISOString(), type }})
        .then(()=> loadLeadFromApi(id))
        .then(()=>{
          quickTaskForm.reset();
          due.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        })
        .catch(err=>{ console.error(err); alert('Failed to create task'); });
    };
  }

  // Task functions - attach to window for onclick access
  window.markTaskDone = async function(taskId) {
    const outcome = prompt('Task outcome (optional):');
    try {
      await apiFetch(`/tasks/${taskId}`, { 
        method: 'PUT', 
        body: { done: true, outcome: outcome || null }
      });
      await loadLeadFromApi(id);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (err) {
      console.error(err);
      alert('Failed to mark task as done');
    }
  };

  window.editTask = function(taskId) {
    const task = (window.serverLeadCache[id]?.tasks || []).find(t => t.id === taskId);
    if (!task) return;
    
    const newTitle = prompt('Edit task title:', task.title);
    if (!newTitle || newTitle === task.title) return;
    
    apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: { title: newTitle }
    })
    .then(() => loadLeadFromApi(id))
    .then(() => window.dispatchEvent(new HashChangeEvent("hashchange")))
    .catch(err => {
      console.error(err);
      alert('Failed to update task');
    });
  };
}

function taskRow(tk){
  return `<div class="row">
    <div>
      <div class="k">${tk.title}</div>
      <small>Due: ${new Date(tk.due_at || tk.dueDate).toLocaleDateString()} • Type: ${tk.type || 'follow_up'}</small>
    </div>
    <div><span class="tag ${(tk.status === 'done' || tk.done) ? 'ok' : ''}">${tk.status || (tk.done?'done':'open')}</span></div>
    <div>
      ${(tk.status === 'open' || !tk.done) ? `
        <button class="btn ok" onclick="window.markTaskDone(${tk.id})">Mark as Done</button>
        <button class="btn ghost" onclick="window.editTask(${tk.id})">Edit</button>
      ` : ''}
    </div>
  </div>`;
}

function getStageIndex(stageId) {
  const stageOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted'];
  return stageOrder.indexOf(stageId);
}

// Modal functions - attach to window for onclick access
window.showLostModal = function() {
  document.getElementById('lostModal').style.display = 'flex';
};

window.hideLostModal = function() {
  document.getElementById('lostModal').style.display = 'none';
  document.getElementById('lostForm').reset();
};

// Convert to Student function
window.convertToStudent = async function(leadId) {
  console.log('=== CONVERT TO STUDENT STARTED ===');
  console.log('Lead ID:', leadId);
  console.log('Current lead data before conversion:', currentLead);
  
  if (!confirm('Are you sure you want to convert this lead to a student?')) {
    console.log('User cancelled conversion');
    return;
  }
  
  try {
    console.log('Step 1: Sending PUT request to update stage to converted');
    console.log('Request URL:', `/leads/${leadId}`);
    console.log('Request body:', { stage: 'converted' });
    
    // Update lead stage directly to converted
    const updateResponse = await apiFetch(`/leads/${leadId}`, {
      method: 'PUT',
      body: { stage: 'converted' }
    });
    
    console.log('Step 2: Backend response received:', updateResponse);
    console.log('Updated lead stage:', updateResponse?.lead?.stage);
    
    console.log('Step 3: Reloading lead data from API');
    await loadLeadFromApi(leadId);
    
    console.log('Step 4: Updated lead data after reload:', window.serverLeadCache[leadId]);
    console.log('Current lead stage after reload:', window.serverLeadCache[leadId]?.stage);
    
    // Update the current lead variable
    currentLead = window.serverLeadCache[leadId];
    console.log('Step 4.5: Updated currentLead variable:', currentLead);
    
    console.log('Step 5: Force page re-render with new data');
    // Force a complete page re-render by navigating to the same URL
    const currentHash = window.location.hash;
    console.log('Current hash:', currentHash);
    window.location.hash = '#/temp';
    setTimeout(() => {
      window.location.hash = currentHash;
      console.log('Page re-rendered with hash:', currentHash);
    }, 100);
    
    console.log('=== CONVERT TO STUDENT COMPLETED ===');
    alert('Lead successfully converted to student!');
  } catch (error) {
    console.error('=== CONVERT TO STUDENT FAILED ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    alert('Failed to convert lead. Please try again.');
  }
};

async function loadLeadFromApi(id){
  try {
    const data = await apiFetch(`/leads/${id}`);
    const x = data.lead;
    // Map to frontend shape
    const mapped = {
      id: x.id,
      full_name: x.full_name,
      email: x.email,
      phone: x.phone,
      program: x.program,
      degree: x.degree,
      nationality: x.nationality,
      residence_country: x.residence_country,
      city: x.city,
      gender: x.gender,
      status: x.status,
      source: x.source,
      assigneeId: x.assigneeId,
      assignee_id: x.assigneeId,
      created_at: x.createdAt,
      stage: x.stage,
      activities: (x.activities||[]).map(a=>({
        id: a.id,
        lead_id: a.leadId,
        user_id: a.userId,
        contact_method: a.method,
        outcome: a.outcome,
        notes: a.notes,
        stage_from: a.fromStage,
        stage_to: a.toStage,
        created_at: a.createdAt
      })),
      tasks: (x.tasks||[]).map(tk=>({
        id: tk.id,
        leadId: tk.leadId,
        lead_id: tk.leadId,
        assigneeId: tk.assigneeId,
        assignee_id: tk.assigneeId,
        title: tk.title,
        dueDate: tk.dueDate,
        due_at: tk.dueDate,
        done: tk.done,
        status: tk.done ? 'done' : 'open',
        outcome: tk.outcome,
        type: tk.type || 'follow_up'
      })),
    };
    window.serverLeadCache[id] = mapped;
    // Also keep window.leadsData list in sync (basic fields)
    if (Array.isArray(window.leadsData)){
      const idx = window.leadsData.findIndex(l=>l.id===id);
      if (idx>=0) window.leadsData[idx] = { ...window.leadsData[idx], ...mapped };
      else window.leadsData.push(mapped);
    } else {
      window.leadsData = [mapped];
    }
  } catch(e){ console.error(e); }
}