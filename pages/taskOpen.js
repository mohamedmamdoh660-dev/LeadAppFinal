import { t } from '../state.js';
import { TASK_OUTCOMES } from '../data/mock.js';
import { $, apiFetch } from '../shared.js';
import { navigate } from '../router.js';

let currentTask = null;

export function TaskOpen(id) {
  const task = (window.tasksData || []).find(t => t.id === parseInt(id));
  const lead = (window.leadsData || []).find(l => l.id === task?.leadId || task?.lead_id);
  const assignee = (window.usersData || []).find(u => u.id === task?.assigneeId || task?.assignee_id);
  
  currentTask = task;
  
  if (!task) {
    return `<div class="panel">
      <h3>Task Not Found</h3>
      <p>The requested task could not be found.</p>
      <button class="btn" onclick="window.appNavigate('#/tasks')">Back to Tasks</button>
    </div>`;
  }

  const isDone = task.status === 'done' || task.done;
  const dueDate = task.due_at || task.dueDate;
  
  return `
    <div class="panel">
      <div class="panel-header">
        <h3>Task Details</h3>
        <div style="display: flex; gap: 8px;">
          ${!isDone ? `<button class="btn primary" onclick="markTaskDone(${task.id})">Mark as Done</button>` : ''}
          <button class="btn ghost" onclick="window.appNavigate('#/tasks')">Back to Tasks</button>
        </div>
      </div>
      
      <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 20px;">
        <div class="panel">
          <h4>Task Information</h4>
          <div class="list">
            <div class="row small">
              <div><b>Title:</b> ${task.title}</div>
              <div><b>Status:</b> 
                <span class="tag ${isDone ? 'ok' : 'pending'}">${isDone ? 'Done' : 'Open'}</span>
              </div>
            </div>
            <div class="row small">
              <div><b>Type:</b> ${task.type || 'follow_up'}</div>
              <div><b>Due Date:</b> ${dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</div>
            </div>
            <div class="row small">
              <div><b>Assignee:</b> ${assignee ? assignee.name : 'Unassigned'}</div>
              <div><b>Outcome:</b> ${task.outcome ? `<span class="tag">${task.outcome}</span>` : '—'}</div>
            </div>
            <div class="row small">
              <div><b>Created:</b> ${new Date(task.createdAt || task.created_at).toLocaleDateString()}</div>
              <div><b>Updated:</b> ${new Date(task.updatedAt || task.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        
        <div class="panel">
          <h4>Related Lead</h4>
          ${lead ? `
            <div class="list">
              <div class="row small">
                <div><b>Name:</b> ${lead.full_name}</div>
              </div>
              <div class="row small">
                <div><b>Email:</b> ${lead.email || '—'}</div>
              </div>
              <div class="row small">
                <div><b>Phone:</b> ${lead.phone || '—'}</div>
              </div>
              <div class="row small">
                <div><b>Stage:</b> ${lead.stage || '—'}</div>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <button class="btn ghost" onclick="window.appNavigate('#/leads/${lead.id}')">View Lead</button>
            </div>
          ` : '<p>No related lead found</p>'}
        </div>
      </div>
      
      ${!isDone ? `
        <div class="panel">
          <h4>Update Task</h4>
          <form id="updateTaskForm">
            <div class="form-group">
              <label>Outcome</label>
              <select id="taskOutcome" class="select">
                <option value="">Select outcome...</option>
                ${TASK_OUTCOMES.map(outcome => `
                  <option value="${outcome}" ${task.outcome === outcome ? 'selected' : ''}>${outcome}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn primary">Update & Mark Done</button>
            </div>
          </form>
        </div>
      ` : ''}
    </div>
  `;
}

export function wireTaskOpen() {
  const updateForm = document.getElementById('updateTaskForm');
  if (updateForm) {
    updateForm.onsubmit = async (e) => {
      e.preventDefault();
      await handleUpdateTask();
    };
  }
  
  // Global function for marking task done
  window.markTaskDone = async function(id) {
    const outcome = document.getElementById('taskOutcome')?.value || null;
    
    try {
      await apiFetch(`/tasks/${id}`, {
        method: 'PUT',
        body: {
          done: true,
          outcome: outcome
        }
      });
      
      // Update local data
      if (currentTask) {
        currentTask.status = 'done';
        currentTask.done = true;
        currentTask.outcome = outcome;
      }
      
      // Refresh the page
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } catch (error) {
      console.error('Failed to mark task as done:', error);
      alert('Failed to update task. Please try again.');
    }
  };
}

async function handleUpdateTask() {
  if (!currentTask) return;
  
  const outcome = document.getElementById('taskOutcome').value;
  
  try {
    await apiFetch(`/tasks/${currentTask.id}`, {
      method: 'PUT',
      body: {
        done: true,
        outcome: outcome || null
      }
    });
    
    // Update local data
    currentTask.status = 'done';
    currentTask.done = true;
    currentTask.outcome = outcome;
    
    // Refresh the page
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } catch (error) {
    console.error('Failed to update task:', error);
    alert('Failed to update task. Please try again.');
  }
}
