import { t } from '../state.js';
import { apiFetch } from '../shared.js';

// Constants for form data
const COUNTRIES = [
  'Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Palestine', 'Morocco', 'Algeria',
  'Tunisia', 'Libya', 'Sudan', 'Yemen'
];

const DEGREES = [
  'High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Diploma', 'Certificate'
];

let currentUser = null;
let availableRoles = [];

export function UserEditPage(userId = null) {
  const isEdit = !!userId;
  const pageTitle = isEdit ? 'Edit User' : 'Add New User';
  
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
              <h1>${pageTitle}</h1>
              <p class="header-subtitle" id="header-subtitle">${isEdit ? 'Loading user data...' : 'Create a new user account'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="page-content">
        <form id="user-edit-form" class="user-form">
          <!-- Basic Information Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Basic Information</h3>
              <p>Essential user details and contact information</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="user-name">Full Name *</label>
                  <input type="text" id="user-name" name="name" required 
                         value=""
                         placeholder="Enter full name">
                  <div class="error-message" id="name-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="user-email">Email Address *</label>
                  <input type="email" id="user-email" name="email" required 
                         value=""
                         placeholder="user@example.com">
                  <div class="error-message" id="email-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="user-phone">Phone Number</label>
                  <input type="tel" id="user-phone" name="phone" 
                         value=""
                         placeholder="+1 234 567 8900">
                  <div class="help-text">Optional contact number</div>
                </div>
                
                <div class="form-group" id="password-field" style="display: none;">
                  <label for="user-password">Password *</label>
                  <input type="password" id="user-password" name="password" 
                         placeholder="Enter password">
                  <div class="help-text">Required for new users</div>
                  <div class="error-message" id="password-error"></div>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-container">
                    <input type="checkbox" id="user-active" name="active" checked>
                    <span class="checkmark"></span>
                    <span class="checkbox-label">Active User</span>
                  </label>
                  <div class="help-text">Active users can log in and access the system</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Roles & Permissions Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Roles & Permissions</h3>
              <p>Assign roles to determine user access levels</p>
            </div>
            <div class="card-content">
              <div class="form-group">
                <label for="user-roles">User Roles *</label>
                <div class="roles-selection" id="roles-container">
                  <!-- Roles will be loaded dynamically -->
                </div>
                <div class="error-message" id="roles-error"></div>
              </div>
            </div>
          </div>

          <!-- Localization Card -->
          <div class="form-card">
            <div class="card-header">
              <h3>Localization Settings</h3>
              <p>Language and regional preferences</p>
            </div>
            <div class="card-content">
              <div class="form-grid">
                <div class="form-group">
                  <label for="user-locale">Language</label>
                  <select id="user-locale" name="locale">
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="tr">Turkish</option>
                    <option value="ru">Russian</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="user-timezone">Timezone</label>
                  <select id="user-timezone" name="timezone">
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Istanbul">Europe/Istanbul</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/Warsaw">Europe/Warsaw</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Assignment Eligibility Card -->
          <div class="form-card" id="assignment-card" style="display: none;">
            <div class="card-header">
              <h3>Lead Assignment Settings</h3>
              <p>Configure which leads this user can handle</p>
            </div>
            <div class="card-content">
              
              <!-- Countries Section -->
              <div class="assignment-section">
                <h4>Eligible Countries</h4>
                <p class="section-desc">Select countries this user can handle leads from</p>
                
                <!-- Search Box -->
                <div class="country-search-wrapper">
                  <input type="text" id="country-search" class="search-input" 
                         placeholder="Search countries..." 
                         oninput="filterCountries(this.value)">
                </div>
                
                <!-- Regional Groups -->
                <div class="country-regions">
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('middle-east')">
                        <span class="toggle-icon">▼</span> Middle East & Gulf
                      </button>
                    </h5>
                    <div class="region-content" id="middle-east-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('middle-east')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('middle-east')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Palestine', 'Israel', 'Turkey', 'Iran'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('north-africa')">
                        <span class="toggle-icon">▶</span> North Africa
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="north-africa-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('north-africa')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('north-africa')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan', 'Yemen', 'Ethiopia', 'Somalia', 'Djibouti', 'Eritrea'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('europe')">
                        <span class="toggle-icon">▶</span> Europe
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="europe-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('europe')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('europe')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Portugal', 'Ireland', 'Croatia', 'Slovenia', 'Slovakia', 'Lithuania', 'Latvia', 'Estonia', 'Luxembourg', 'Malta', 'Cyprus', 'Iceland', 'Albania', 'Bosnia and Herzegovina', 'Serbia', 'Montenegro', 'North Macedonia', 'Moldova', 'Ukraine', 'Belarus', 'Russia'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('north-america')">
                        <span class="toggle-icon">▶</span> North America
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="north-america-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('north-america')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('north-america')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['United States', 'Canada', 'Mexico', 'Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Bahamas', 'Barbados', 'Trinidad and Tobago', 'Grenada', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Antigua and Barbuda', 'Dominica', 'Saint Kitts and Nevis'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('south-america')">
                        <span class="toggle-icon">▶</span> South America
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="south-america-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('south-america')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('south-america')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'French Guiana'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('asia-pacific')">
                        <span class="toggle-icon">▶</span> Asia Pacific
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="asia-pacific-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('asia-pacific')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('asia-pacific')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['China', 'Japan', 'South Korea', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Afghanistan', 'Myanmar', 'Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Brunei', 'East Timor', 'Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Tonga', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'Marshall Islands', 'Micronesia'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('central-asia')">
                        <span class="toggle-icon">▶</span> Central Asia
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="central-asia-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('central-asia')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('central-asia')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kyrgyzstan', 'Mongolia', 'Georgia', 'Armenia', 'Azerbaijan'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="region-group">
                    <h5 class="region-title">
                      <button type="button" class="region-toggle" onclick="toggleRegion('sub-saharan-africa')">
                        <span class="toggle-icon">▶</span> Sub-Saharan Africa
                      </button>
                    </h5>
                    <div class="region-content collapsed" id="sub-saharan-africa-countries">
                      <div class="region-actions">
                        <button type="button" class="btn-link-small" onclick="selectAllRegion('sub-saharan-africa')">Select All</button>
                        <button type="button" class="btn-link-small" onclick="clearAllRegion('sub-saharan-africa')">Clear All</button>
                      </div>
                      <div class="checkbox-grid-compact">
                        ${['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Tanzania', 'Uganda', 'Mozambique', 'Madagascar', 'Cameroon', 'Ivory Coast', 'Niger', 'Burkina Faso', 'Mali', 'Malawi', 'Zambia', 'Senegal', 'Chad', 'Guinea', 'Rwanda', 'Benin', 'Burundi', 'Tunisia', 'South Sudan', 'Togo', 'Sierra Leone', 'Liberia', 'Central African Republic', 'Mauritania', 'Eritrea', 'Gambia', 'Botswana', 'Namibia', 'Gabon', 'Lesotho', 'Guinea-Bissau', 'Equatorial Guinea', 'Mauritius', 'Eswatini', 'Djibouti', 'Comoros', 'Cape Verde', 'São Tomé and Príncipe', 'Seychelles'].map(country => `
                          <label class="checkbox-item-compact">
                            <input type="checkbox" name="countries" value="${country}">
                            <span class="checkbox-label">${country}</span>
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="selection-actions">
                  <button type="button" class="btn-link" onclick="selectAllCountries()">Select All</button>
                  <button type="button" class="btn-link" onclick="clearAllCountries()">Clear All</button>
                  <span class="selected-count" id="countries-count">0 selected</span>
                </div>
              </div>

              <!-- Degree Levels Section -->
              <div class="assignment-section">
                <h4>Academic Specialization</h4>
                <p class="section-desc">Academic levels this user specializes in</p>
                <div class="checkbox-grid" id="degrees-grid">
                  ${DEGREES.map(degree => `
                    <label class="checkbox-item">
                      <input type="checkbox" name="degree_levels" value="${degree}">
                      <span class="checkbox-custom"></span>
                      <span class="checkbox-label">${degree}</span>
                    </label>
                  `).join('')}
                </div>
                <div class="selection-actions">
                  <button type="button" class="btn-link" onclick="selectAllDegrees()">Select All</button>
                  <button type="button" class="btn-link" onclick="clearAllDegrees()">Clear All</button>
                </div>
              </div>

              <!-- Limits Section -->
              <div class="assignment-section">
                <h4>Assignment Limits</h4>
                <div class="limits-grid">
                  <div class="limit-item">
                    <label for="user-priority">Priority Level</label>
                    <select id="user-priority" name="priority" class="select-modern">
                      <option value="1">🔥 High Priority (1)</option>
                      <option value="2" selected>⚡ Medium Priority (2)</option>
                      <option value="3">📋 Low Priority (3)</option>
                    </select>
                    <small>Higher priority users receive leads first</small>
                  </div>
                  
                  <div class="limit-item">
                    <label for="user-max-leads">Max Open Leads</label>
                    <div class="number-input-wrapper">
                      <input type="number" id="user-max-leads" name="max_open_leads" 
                             min="1" max="50" value="10" class="number-input">
                      <div class="input-suffix">leads</div>
                    </div>
                    <small>Maximum concurrent open leads</small>
                  </div>
                  
                  <div class="limit-item">
                    <label for="user-max-per-day">Daily Limit</label>
                    <div class="number-input-wrapper">
                      <input type="number" id="user-max-per-day" name="max_per_day" 
                             min="1" max="20" value="5" class="number-input">
                      <div class="input-suffix">per day</div>
                    </div>
                    <small>Maximum new leads assigned daily</small>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="window.appNavigate('#/users')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function wireUserEdit(userId = null) {
  currentUser = userId ? (window.usersData || []).find(u => u.id === parseInt(userId)) : null;
  
  // Show password field for both creating and editing
  const passwordField = document.getElementById('password-field');
  if (passwordField) {
    passwordField.style.display = 'block';
    const passwordInput = document.getElementById('user-password');
    if (passwordInput) {
      passwordInput.required = !currentUser; // Required only for new users
    }
  }
  
  // Load roles and setup role selection
  loadRolesAndUserData(currentUser ? currentUser.id : null);
  
  // Handle form submission
  document.getElementById('user-edit-form').addEventListener('submit', handleFormSubmit);
}

// Load roles and user data from backend API
async function loadRolesAndUserData(userId) {
  try {
    console.log('Loading roles and user data from backend...');
    
    // Load roles from backend
    const rolesResponse = await apiFetch('/roles');
    availableRoles = rolesResponse.items || [];
    console.log('Loaded roles:', availableRoles);
    
    // Load user data if editing
    if (userId) {
      const userResponse = await apiFetch(`/users/${userId}`);
      currentUser = userResponse.user;
      console.log('Loaded user:', currentUser);
      
      // Update header subtitle with user name
      const subtitle = document.getElementById('header-subtitle');
      if (subtitle && currentUser) {
        subtitle.textContent = `Editing ${currentUser.name}`;
      }
      
      // Update form fields with user data
      populateFormFields();
    }
    
    // Render roles in the form
    renderRolesSelection();
    
    // Set up event handlers after roles are loaded
    setupRoleHandlers();
    
  } catch (error) {
    console.error('Failed to load data:', error);
    alert('Failed to load user data from database. Please refresh the page.');
    
    // Initialize with empty data instead of fallback
    availableRoles = [];
    currentUser = null;
    renderRolesSelection();
    setupRoleHandlers();
  }
}

// Populate form fields with user data
function populateFormFields() {
  if (!currentUser) return;
  
  console.log('Populating form with user data:', currentUser);
  
  // Update header subtitle
  const subtitle = document.getElementById('header-subtitle');
  if (subtitle) {
    subtitle.textContent = `Editing ${currentUser.name}`;
  }
  
  // Populate basic fields
  const nameInput = document.getElementById('user-name');
  const emailInput = document.getElementById('user-email');
  const phoneInput = document.getElementById('user-phone');
  const countrySelect = document.getElementById('user-country');
  const degreeSelect = document.getElementById('user-degree');
  const activeInput = document.getElementById('user-active');
  const localeSelect = document.getElementById('user-locale');
  const timezoneSelect = document.getElementById('user-timezone');
  
  if (nameInput) nameInput.value = currentUser.name || '';
  if (emailInput) emailInput.value = currentUser.email || '';
  if (phoneInput) phoneInput.value = currentUser.phone || '';
  if (countrySelect) countrySelect.value = currentUser.country || '';
  if (degreeSelect) degreeSelect.value = currentUser.degree || '';
  if (activeInput) activeInput.checked = currentUser.active !== false;
  if (localeSelect) localeSelect.value = currentUser.locale || 'en';
  if (timezoneSelect) timezoneSelect.value = currentUser.timezone || 'Europe/Istanbul';
  
  // Populate assignment eligibility if exists
  if (currentUser.assignmentEligibility) {
    let eligibility = currentUser.assignmentEligibility;
    
    // Parse if it's a string
    if (typeof eligibility === 'string') {
      try {
        eligibility = JSON.parse(eligibility);
      } catch (e) {
        eligibility = {};
      }
    }
    
    // Populate countries checkboxes
    if (eligibility.countries) {
      const countryCheckboxes = document.querySelectorAll('input[name="countries"]');
      countryCheckboxes.forEach(checkbox => {
        checkbox.checked = eligibility.countries.includes(checkbox.value);
      });
    }
    
    // Populate degree levels checkboxes
    if (eligibility.degree_levels) {
      const degreeCheckboxes = document.querySelectorAll('input[name="degree_levels"]');
      degreeCheckboxes.forEach(checkbox => {
        checkbox.checked = eligibility.degree_levels.includes(checkbox.value);
      });
    }
    
    const prioritySelect = document.getElementById('user-priority');
    const maxLeadsInput = document.getElementById('user-max-leads');
    const maxPerDayInput = document.getElementById('user-max-per-day');
    
    if (prioritySelect) prioritySelect.value = eligibility.priority || 2;
    if (maxLeadsInput) maxLeadsInput.value = eligibility.max_open_leads || 10;
    if (maxPerDayInput) maxPerDayInput.value = eligibility.max_per_day || 5;
  }
}

function renderRolesSelection() {
  const container = document.getElementById('roles-container');
  if (!container) return;
  
  container.innerHTML = availableRoles.filter(role => role.active).map(role => {
    const isChecked = currentUser && currentUser.roles && 
      (currentUser.roles.includes(role.name) || 
       currentUser.roles.includes(role.name.toLowerCase()) ||
       currentUser.roles.some(userRole => userRole.toLowerCase() === role.name.toLowerCase()));
    
    console.log(`Role ${role.name}: checked = ${isChecked}, user roles:`, currentUser?.roles);
    
    return `
      <label class="role-option">
        <input type="checkbox" name="roles" value="${role.name.toLowerCase()}" 
               ${isChecked ? 'checked' : ''}>
        <span class="role-name">${role.name}</span>
        <span class="role-description">${role.description || 'No description'}</span>
      </label>
    `;
  }).join('');
}

function setupRoleHandlers() {
  const roleCheckboxes = document.querySelectorAll('input[name="roles"]');
  const assignmentCard = document.getElementById('assignment-card');
  
  function updateAssignmentVisibility() {
    const selectedRoles = Array.from(roleCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    const canReceiveAssignments = selectedRoles.some(roleName => {
      const role = availableRoles.find(r => r.name.toLowerCase() === roleName);
      return role && role.can_receive_assignments;
    });
    
    assignmentCard.style.display = canReceiveAssignments ? 'block' : 'none';
  }
  
  roleCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateAssignmentVisibility);
  });
  
  // Initial check
  updateAssignmentVisibility();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  
  // Collect selected roles
  const roleCheckboxes = document.querySelectorAll('input[name="roles"]:checked');
  const selectedRoles = Array.from(roleCheckboxes).map(cb => cb.value);
  
  // Collect assignment eligibility data
  const countryCheckboxes = document.querySelectorAll('input[name="countries"]:checked');
  const selectedCountries = Array.from(countryCheckboxes).map(cb => cb.value);
  
  const degreeCheckboxes = document.querySelectorAll('input[name="degree_levels"]:checked');
  const selectedDegrees = Array.from(degreeCheckboxes).map(cb => cb.value);
  
  const assignmentEligibility = {
    countries: selectedCountries,
    degree_levels: selectedDegrees,
    priority: parseInt(document.getElementById('user-priority').value) || 2,
    max_open_leads: parseInt(document.getElementById('user-max-leads').value) || 10,
    max_per_day: parseInt(document.getElementById('user-max-per-day').value) || 5
  };
  
  const userData = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim(),
    phone: formData.get('phone') ? formData.get('phone').trim() : null,
    country: formData.get('country') || null,
    degree: formData.get('degree') || null,
    locale: formData.get('locale') || null,
    timezone: formData.get('timezone') || null,
    active: formData.has('active'),
    roles: selectedRoles,
    assignmentEligibility: JSON.stringify(assignmentEligibility)
  };
  
  // Add password if provided (for both new and existing users)
  const passwordValue = formData.get('password');
  if (passwordValue && passwordValue.trim() !== '') {
    userData.password = passwordValue.trim();
  }
  
  console.log('Submitting user data:', userData);
  
  if (!validateForm(userData)) return;
  
  try {
    let response;
    if (currentUser) {
      // Update existing user
      console.log('Updating user:', currentUser.id);
      response = await apiFetch(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: userData
      });
    } else {
      // Create new user
      console.log('Creating new user');
      response = await apiFetch('/users', {
        method: 'POST',
        body: userData
      });
    }
    
    console.log('User save response:', response);
    
    // Show success message
    alert(`User ${currentUser ? 'updated' : 'created'} successfully!`);
    
    // Navigate back to users page
    window.appNavigate('#/users');
    
  } catch (error) {
    console.error('Failed to save user:', error);
    
    // Show specific error message if available
    const errorMessage = error.message || 'Failed to save user. Please try again.';
    alert(errorMessage);
  }
}

function validateForm(userData) {
  clearFormErrors();
  let isValid = true;
  
  // Name validation
  if (!userData.name) {
    showFieldError('name-error', 'Name is required');
    isValid = false;
  }
  
  // Email validation
  if (!userData.email) {
    showFieldError('email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(userData.email)) {
    showFieldError('email-error', 'Please enter a valid email address');
    isValid = false;
  } else if (isDuplicateEmail(userData.email)) {
    showFieldError('email-error', 'This email is already in use');
    isValid = false;
  }
  
  // Roles validation
  if (!userData.roles || userData.roles.length === 0) {
    showFieldError('roles-error', 'At least one role is required');
    isValid = false;
  }
  
  return isValid;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isDuplicateEmail(email) {
  // For now, skip duplicate check since we're using backend validation
  // Backend will handle unique email constraint
  return false;
}

// Load user data from backend
async function loadUserData(userId) {
  try {
    const response = await apiFetch(`/users/${userId}`);
    currentUser = response.user;
  } catch (error) {
    console.error('Failed to load user:', error);
    // Fallback to mock data
    currentUser = users.find(u => u.id === userId);
  }
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

// Helper functions for select all/clear all functionality
window.selectAllCountries = function() {
  const checkboxes = document.querySelectorAll('input[name="countries"]');
  checkboxes.forEach(cb => cb.checked = true);
};

window.clearAllCountries = function() {
  const checkboxes = document.querySelectorAll('input[name="countries"]');
  checkboxes.forEach(cb => cb.checked = false);
};

window.selectAllDegrees = function() {
  const checkboxes = document.querySelectorAll('input[name="degree_levels"]');
  checkboxes.forEach(cb => cb.checked = true);
};

window.clearAllDegrees = function() {
  const checkboxes = document.querySelectorAll('input[name="degree_levels"]');
  checkboxes.forEach(cb => cb.checked = false);
};

// Region toggle functionality
window.toggleRegion = function(regionId) {
  const content = document.getElementById(`${regionId}-countries`);
  const toggle = document.querySelector(`[onclick="toggleRegion('${regionId}')"] .toggle-icon`);
  
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    toggle.textContent = '▼';
  } else {
    content.classList.add('collapsed');
    toggle.textContent = '▶';
  }
};

// Country search functionality
window.filterCountries = function(searchTerm) {
  const term = searchTerm.toLowerCase();
  const allCountryItems = document.querySelectorAll('.checkbox-item-compact');
  
  allCountryItems.forEach(item => {
    const label = item.querySelector('.checkbox-label').textContent.toLowerCase();
    const shouldShow = label.includes(term);
    item.style.display = shouldShow ? 'flex' : 'none';
  });
  
  // Show/hide regions based on visible countries
  document.querySelectorAll('.region-group').forEach(region => {
    const visibleCountries = region.querySelectorAll('.checkbox-item-compact[style*="flex"], .checkbox-item-compact:not([style])');
    const hasVisibleCountries = Array.from(visibleCountries).some(item => 
      !item.style.display || item.style.display === 'flex'
    );
    region.style.display = hasVisibleCountries ? 'block' : 'none';
  });
};

// Update country count
function updateCountryCount() {
  const selectedCountries = document.querySelectorAll('input[name="countries"]:checked');
  const countElement = document.getElementById('countries-count');
  if (countElement) {
    countElement.textContent = `${selectedCountries.length} selected`;
  }
}

// Regional select all and clear all functions
window.selectAllRegion = function(regionId) {
  const regionElement = document.getElementById(`${regionId}-countries`);
  if (regionElement) {
    const checkboxes = regionElement.querySelectorAll('input[name="countries"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    updateCountryCount();
  }
}

window.clearAllRegion = function(regionId) {
  const regionElement = document.getElementById(`${regionId}-countries`);
  if (regionElement) {
    const checkboxes = regionElement.querySelectorAll('input[name="countries"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    updateCountryCount();
  }
}

// Add event listeners for country checkboxes
document.addEventListener('change', function(e) {
  if (e.target.name === 'countries') {
    updateCountryCount();
  }
});
