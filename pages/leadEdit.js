// Lead Edit Page - Full page form for adding/editing leads
import { t } from '../state.js';
import { apiFetch } from '../shared.js';
import { SOURCES, NATIONALITIES, COUNTRIES, DEGREES, GENDERS, autoAssignLead } from '../data/mock.js';

let currentLead = null;

export function LeadEditPage(leadId = null) {
  currentLead = leadId ? (window.leadsData || []).find(l => l.id === parseInt(leadId)) : null;
  const isEdit = !!currentLead;
  const pageTitle = isEdit ? 'Edit Lead' : 'Add New Lead';
  
  return `
    <div class="user-edit-page">
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
              <h1>${pageTitle}</h1>
              <p class="header-subtitle">${isEdit ? `Editing ${currentLead.full_name}` : 'Create a new lead manually'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="page-content">
        <form id="lead-edit-form" class="user-form">
          <!-- Personal Information Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Personal Information</h3>
              <p>Basic contact details and personal information</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="lead-name">Full Name *</label>
                  <input type="text" id="lead-name" name="full_name" required 
                         value="${isEdit ? currentLead.full_name : ''}"
                         placeholder="Enter full name">
                  <div class="error-message" id="name-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="lead-email">Email Address *</label>
                  <input type="email" id="lead-email" name="email" required 
                         value="${isEdit ? (currentLead.email || '') : ''}"
                         placeholder="student@example.com">
                  <div class="error-message" id="email-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="lead-phone">Phone Number</label>
                  <input type="tel" id="lead-phone" name="phone" 
                         value="${isEdit ? (currentLead.phone || '') : ''}"
                         placeholder="+1 234 567 8900">
                  <div class="help-text">Include country code</div>
                </div>
                
                <div class="form-group">
                  <label for="lead-nationality">Nationality</label>
                  <select id="lead-nationality" name="nationality">
                    <option value="">Select nationality</option>
                    ${NATIONALITIES.map(nat => `
                      <option value="${nat}" ${isEdit && currentLead.nationality === nat ? 'selected' : ''}>
                        ${nat}
                      </option>
                    `).join('')}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="lead-residence">Residence Country</label>
                  <select id="lead-residence" name="residence_country">
                    <option value="">Select country</option>
                    ${COUNTRIES.map(country => `
                      <option value="${country}" ${isEdit && currentLead.residence_country === country ? 'selected' : ''}>
                        ${country}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label for="lead-city">City</label>
                  <input type="text" id="lead-city" name="city" 
                         value="${isEdit ? (currentLead.city || '') : ''}"
                         placeholder="City name">
                </div>

                <div class="form-group">
                  <label for="lead-gender">Gender</label>
                  <select id="lead-gender" name="gender">
                    <option value="">Select gender</option>
                    ${GENDERS.map(g => `
                      <option value="${g}" ${isEdit && currentLead.gender === g ? 'selected' : ''}>${g}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Information Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Academic Information</h3>
              <p>Educational background and program interest</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="lead-program">Program of Interest</label>
                  <input type="text" id="lead-program" name="program" 
                         value="${isEdit ? (currentLead.program || '') : ''}"
                         placeholder="e.g., Medicine, Computer Science, Business">
                  <div class="help-text">The academic program they're interested in</div>
                </div>
                
                <div class="form-group">
                  <label for="lead-degree">Degree Level</label>
                  <select id="lead-degree" name="degree">
                    <option value="">Select degree level</option>
                    ${DEGREES.map(degree => `
                      <option value="${degree}" ${isEdit && currentLead.degree === degree ? 'selected' : ''}>
                        ${degree}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Lead Management Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Lead Management</h3>
              <p>Status, source, and assignment information</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="lead-status">Status</label>
                  <select id="lead-status" name="status">
                    <option value="new" ${isEdit && currentLead.status === 'new' ? 'selected' : (!isEdit ? 'selected' : '')}>New</option>
                    <option value="in_progress" ${isEdit && currentLead.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="converted" ${isEdit && currentLead.status === 'converted' ? 'selected' : ''}>Converted</option>
                    <option value="rejected" ${isEdit && currentLead.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="lead-source">Source</label>
                  <select id="lead-source" name="source">
                    <option value="">Select source</option>
                    ${SOURCES.map(source => `
                      <option value="${source}" ${isEdit && currentLead.source === source ? 'selected' : ''}>
                        ${source.charAt(0).toUpperCase() + source.slice(1)}
                      </option>
                    `).join('')}
                  </select>
                  <div class="help-text">How did this lead come to us?</div>
                </div>
                
                <div class="form-group">
                  <label for="lead-assignee">Assigned To</label>
                  <select id="lead-assignee" name="assignee_id">
                    <option value="">Auto-assign (recommended for new leads)</option>
                    ${(window.usersData || []).filter(u => u.active).map(user => `
                      <option value="${user.id}" ${isEdit && (currentLead.assigneeId === user.id || currentLead.assignee_id === user.id) ? 'selected' : ''}>
                        ${user.name} ${user.roles && user.roles.length > 0 ? `(${user.roles.join(', ')})` : ''}
                      </option>
                    `).join('')}
                  </select>
                  <div class="help-text">${isEdit ? 'Which team member will handle this lead' : 'Leave empty for automatic assignment based on eligibility and workload'}</div>
                  <div id="auto-assign-preview" class="help-text" style="color: #0066cc; font-weight: 500; margin-top: 8px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="window.appNavigate('#/leads')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function wireLeadEdit(leadId = null) {
  // Handle form submission
  document.getElementById('lead-edit-form').addEventListener('submit', handleLeadFormSubmit);
  
  // Add auto-assignment preview for new leads
  if (!currentLead) {
    const nationalitySelect = document.getElementById('lead-nationality');
    const degreeSelect = document.getElementById('lead-degree');
    const assigneeSelect = document.getElementById('lead-assignee');
    
    function updateAutoAssignPreview() {
      const nationality = nationalitySelect.value;
      const degree = degreeSelect.value;
      const assigneeValue = assigneeSelect.value;
      const previewDiv = document.getElementById('auto-assign-preview');
      
      if (!previewDiv) return;
      
      // Only show preview if auto-assign is selected and we have nationality/degree
      if (assigneeValue === '' && nationality && degree) {
        const mockLeadData = { nationality, degree };
        const suggestedUserId = autoAssignLead(mockLeadData);
        
        if (suggestedUserId) {
          const suggestedUser = (window.usersData || []).find(u => u.id === suggestedUserId);
          if (suggestedUser) {
            previewDiv.innerHTML = `✓ Will be auto-assigned to: <strong>${suggestedUser.name}</strong>`;
            previewDiv.style.display = 'block';
          } else {
            previewDiv.innerHTML = `⚠️ No eligible user found for auto-assignment`;
            previewDiv.style.display = 'block';
          }
        } else {
          previewDiv.innerHTML = `⚠️ No eligible user found for auto-assignment`;
          previewDiv.style.display = 'block';
        }
      } else {
        previewDiv.style.display = 'none';
      }
    }
    
    nationalitySelect.addEventListener('change', updateAutoAssignPreview);
    degreeSelect.addEventListener('change', updateAutoAssignPreview);
    assigneeSelect.addEventListener('change', updateAutoAssignPreview);
    
    // Initial preview update
    updateAutoAssignPreview();
  }
}

async function handleLeadFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const leadData = {
    full_name: formData.get('full_name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim() || null,
    nationality: formData.get('nationality') || null,
    residence_country: formData.get('residence_country') || null,
    city: formData.get('city')?.trim() || null,
    gender: formData.get('gender') || null,
    program: formData.get('program').trim() || null,
    degree: formData.get('degree') || null,
    status: formData.get('status'),
    source: formData.get('source') || 'manual',
    assigneeId: formData.get('assignee_id') ? parseInt(formData.get('assignee_id')) : null,
    assignee_id: formData.get('assignee_id') ? parseInt(formData.get('assignee_id')) : null
  };
  
  if (validateLeadForm(leadData)) {
    try {
      console.log('Saving lead data:', leadData);
      
      if (currentLead) {
        // Check if auto-assign was selected for existing lead
        if (leadData.assigneeId === null && leadData.assignee_id === null) {
          // Trigger re-assignment
          const autoAssignResponse = await apiFetch('/leads/auto-assign', {
            method: 'POST',
            body: { leadId: currentLead.id, nationality: leadData.nationality, degree: leadData.degree }
          });
          if (autoAssignResponse.assigneeId) {
            leadData.assigneeId = autoAssignResponse.assigneeId;
            leadData.assignee_id = autoAssignResponse.assigneeId;
          }
        }
        
        // Update existing lead
        const response = await apiFetch(`/leads/${currentLead.id}`, {
          method: 'PUT',
          body: leadData
        });
        console.log('Update response:', response);
      } else {
        // Create new lead
        const response = await apiFetch('/leads', {
          method: 'POST',
          body: leadData
        });
        console.log('Create response:', response);
      }
      
      // Clear any cached data
      window.serverLeadCache = {};
      
      // Reload data and navigate back
      await reloadAllData();
      console.log('Data reloaded, navigating back');
      window.appNavigate('#/leads');
    } catch (error) {
      console.error('Failed to save lead:', error);
      alert('Failed to save lead. Please try again.');
    }
  }
}

async function reloadAllData() {
  try {
    const [leadsRes, usersRes] = await Promise.all([
      apiFetch('/leads'),
      apiFetch('/users')
    ]);
    
    window.leadsData = leadsRes.items || leadsRes.leads || [];
    window.usersData = usersRes.users || [];
  } catch (error) {
    console.error('Failed to reload data:', error);
  }
}

function validateLeadForm(leadData) {
  clearFormErrors();
  let isValid = true;
  
  // Name validation
  if (!leadData.full_name) {
    showFieldError('name-error', 'Full name is required');
    isValid = false;
  }
  
  // Email validation
  if (!leadData.email) {
    showFieldError('email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(leadData.email)) {
    showFieldError('email-error', 'Please enter a valid email address');
    isValid = false;
  } else if (isDuplicateEmail(leadData.email)) {
    showFieldError('email-error', 'This email already exists in the system');
    isValid = false;
  }
  
  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isDuplicateEmail(email) {
  return (window.leadsData || []).some(lead => 
    lead.email && lead.email.toLowerCase() === email.toLowerCase() && 
    lead.id !== currentLead?.id
  );
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
