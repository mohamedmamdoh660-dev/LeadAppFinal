export let tasks = [
  { id: 11, lead_id: 1, title: 'Call Ahmed',  type:'call',    status: 'open', due_at: new Date(Date.now()+86400000).toISOString(), outcome: null },
  { id: 12, lead_id: 2, title: 'Send offer',  type:'message', status: 'open', due_at: new Date(Date.now()+86400000).toISOString(), outcome: null },
  { id: 13, lead_id: 3, title: 'Follow up',   type:'follow_up', status: 'done', due_at: new Date(Date.now()-86400000).toISOString(), outcome: 'successful' },
];

export const roles = {
  admin: {
    canEdit: true,
    can_receive_assignments: false,
    permissions: {
      leads: { view: 'all', create: true, edit: 'all', delete: 'all', import: true, export: true },
      tasks: { view: true, create: true, edit: true, delete: true, import: true, export: true },
      users: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, manage: true },
      assignments: { view: 'all', assign: 'all' }
    }
  },
  manager: {
    canEdit: true,
    can_receive_assignments: true,
    permissions: {
      leads: { view: 'team', create: true, edit: 'team', delete: 'own', import: false, export: true },
      tasks: { view: true, create: true, edit: true, delete: true, import: false, export: true },
      users: { view: true, create: true, edit: true, delete: false },
      roles: { view: true, manage: false },
      assignments: { view: 'team', assign: 'team' }
    }
  },
  agent: {
    canEdit: false,
    can_receive_assignments: true,
    permissions: {
      leads: { view: 'own', create: false, edit: 'own', delete: 'none', import: false, export: false },
      tasks: { view: true, create: true, edit: true, delete: true, import: false, export: false },
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, manage: false },
      assignments: { view: 'own', assign: 'none' }
    }
  }
};

export const users = [
  { 
    id: 1, 
    name: 'Sarah Johnson', 
    email: 'sarah.johnson@medipol.com', 
    phone: '+1 555 0101', 
    roles: ['admin'], 
    active: true, 
    locale: 'en', 
    timezone: 'America/New_York', 
    last_login_at: new Date(Date.now() - 86400000).toISOString(),
    assignment_eligibility: null
  },
  { 
    id: 2, 
    name: 'Omar Hassan', 
    email: 'omar.hassan@medipol.com', 
    phone: '+90 555 0202', 
    roles: ['manager'], 
    active: true, 
    locale: 'tr', 
    timezone: 'Europe/Istanbul', 
    last_login_at: new Date(Date.now() - 3600000).toISOString(),
    assignment_eligibility: {
      countries: ['Turkish', 'Emirati'],
      degree_levels: ['Bachelor', 'Master'],
      priority: 2,
      max_open_leads: 15,
      max_per_day: 5
    }
  },
  { 
    id: 3, 
    name: 'Lena Kowalski', 
    email: 'lena.kowalski@medipol.com', 
    phone: '+48 555 0303', 
    roles: ['agent'], 
    active: false, 
    locale: 'en', 
    timezone: 'Europe/Warsaw', 
    last_login_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    assignment_eligibility: {
      countries: ['Egyptian', 'Jordanian'],
      degree_levels: ['Diploma', 'Bachelor'],
      priority: 3,
      max_open_leads: 10,
      max_per_day: 3
    }
  },
  { 
    id: 4, 
    name: 'John Smith', 
    email: 'john.smith@medipol.com', 
    phone: '+1 555 0404', 
    roles: ['agent'], 
    active: true, 
    locale: 'en', 
    timezone: 'America/Los_Angeles', 
    last_login_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    assignment_eligibility: {
      countries: ['Saudi', 'Qatari'],
      degree_levels: ['Bachelor', 'Master', 'PhD'],
      priority: 1,
      max_open_leads: 12,
      max_per_day: 4
    }
  },
  { 
    id: 5, 
    name: 'Fatma Al-Zahra', 
    email: 'fatma.alzahra@medipol.com', 
    phone: '+971 555 0505', 
    roles: ['manager'], 
    active: true, 
    locale: 'ar', 
    timezone: 'Asia/Dubai', 
    last_login_at: new Date(Date.now() - 1800000).toISOString(),
    assignment_eligibility: {
      countries: ['Emirati', 'Saudi', 'Egyptian'],
      degree_levels: ['Master', 'PhD'],
      priority: 1,
      max_open_leads: 20,
      max_per_day: 6
    }
  }
];

export function me(){ 
  if (!window.state?.currentUserId) {
    if (window.state) window.state.currentUserId = 1;
  }
  const user = users.find(u=>u.id===(window.state?.currentUserId || 1));
  // Ensure current user uses English locale
  if (user && user.locale !== 'en') {
    user.locale = 'en';
  }
  return user;
}

export const SOURCES = ['facebook','instagram','web','import'];
export const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian', 'Austrian',
  'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese',
  'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian', 'Burkinabe', 'Burmese', 'Burundian', 'Cambodian',
  'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese',
  'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'East Timorese',
  'Ecuadorean', 'Egyptian', 'Emirati', 'English', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino',
  'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan',
  'Guinea-Bissauan', 'Guinean', 'Guyanese', 'Haitian', 'Herzegovinian', 'Honduran', 'Hungarian', 'Icelander', 'Indian', 'Indonesian',
  'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani',
  'Kenyan', 'Kittian and Nevisian', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese', 'Liberian', 'Libyan', 'Liechtensteiner',
  'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivan', 'Malian', 'Maltese', 'Marshallese',
  'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monacan', 'Mongolian', 'Moroccan', 'Mosotho', 'Motswana',
  'Mozambican', 'Namibian', 'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian', 'Nigerien', 'North Korean', 'Northern Irish',
  'Norwegian', 'Omani', 'Pakistani', 'Palauan', 'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish',
  'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan', 'San Marinese', 'Sao Tomean',
  'Saudi', 'Scottish', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovakian', 'Slovenian', 'Solomon Islander',
  'Somali', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamer', 'Swazi', 'Swedish', 'Swiss',
  'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian or Tobagonian', 'Tunisian', 'Turkish',
  'Tuvaluan', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbekistani', 'Venezuelan', 'Vietnamese', 'Welsh', 'Yemenite', 'Zambian', 'Zimbabwean'
];

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia',
  'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];
export const DEGREES = ['Diploma','Bachelor','Master','PhD'];
export const TASK_TYPES = ['call','meeting','message','follow_up'];
export const TASK_OUTCOMES = ['successful','unsuccessful','rescheduled','no_answer','not_interested'];
export const GENDERS = ['Male','Female','Other'];

// Lead Lifecycle System
export const LEAD_STAGES = [
  { id: 'new', name: 'New', color: '#6b7280', next: 'contacted' },
  { id: 'contacted', name: 'Contacted', color: '#3b82f6', next: 'qualified' },
  { id: 'qualified', name: 'Qualified', color: '#8b5cf6', next: 'proposal' },
  { id: 'proposal', name: 'Proposal Sent', color: '#f59e0b', next: 'negotiation' },
  { id: 'negotiation', name: 'Negotiation', color: '#ef4444', next: 'converted' },
  { id: 'converted', name: 'Converted', color: '#10b981', next: null },
  { id: 'lost', name: 'Lost', color: '#6b7280', next: null },
  { id: 'rejected', name: 'Rejected', color: '#ef4444', next: null }
];

export const CONTACT_METHODS = [
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱' },
  { id: 'call', name: 'Phone Call', icon: '☎️' },
  { id: 'meeting', name: 'Meeting', icon: '🤝' },
  { id: 'sms', name: 'SMS', icon: '💬' }
];

export const CONTACT_OUTCOMES = [
  { id: 'successful', name: 'Successful', color: '#10b981', advances_stage: true },
  { id: 'no_response', name: 'No Response', color: '#6b7280', advances_stage: false },
  { id: 'not_interested', name: 'Not Interested', color: '#ef4444', advances_stage: false, leads_to: 'lost' },
  { id: 'reschedule', name: 'Reschedule', color: '#f59e0b', advances_stage: false },
  { id: 'need_info', name: 'Need More Info', color: '#3b82f6', advances_stage: false },
  { id: 'interested', name: 'Interested', color: '#10b981', advances_stage: true }
];

export const LOST_REASONS = [
  { id: 'not_interested', name: 'Not Interested' },
  { id: 'budget', name: 'Budget Constraints' },
  { id: 'competitor', name: 'Competitor Chosen' },
  { id: 'timing', name: 'Timing Issues' },
  { id: 'no_response', name: 'No Response After Multiple Attempts' },
  { id: 'requirements', name: 'Requirements Don\'t Match' },
  { id: 'other', name: 'Other' }
];

// Lead Activities - Track all interactions
export let leadActivities = [
  {
    id: 1,
    lead_id: 1,
    user_id: 1,
    stage_from: 'new',
    stage_to: 'contacted',
    contact_method: 'email',
    outcome: 'successful',
    notes: 'Sent initial program information and university brochure',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    lead_id: 2,
    user_id: 2,
    stage_from: 'contacted',
    stage_to: 'qualified',
    contact_method: 'call',
    outcome: 'interested',
    notes: 'Student showed strong interest in CS program, discussed admission requirements',
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 3,
    lead_id: 4,
    user_id: null,
    stage_from: null,
    stage_to: 'new',
    contact_method: null,
    outcome: null,
    notes: 'Lead created from import',
    created_at: new Date().toISOString()
  }
];

export let leads = [
  { id: 1, full_name: 'Ahmed Ali', email: 'ahmed@example.com', phone:'+20 100 111 2222', program:'Medicine', degree:'Bachelor', nationality: 'Egyptian', residence_country:'Egypt', city: 'Cairo', gender: 'Male', status: 'contacted', stage: 'contacted', source: 'facebook', assignee_id: 1, lost_reason: null, created_at: new Date().toISOString() },
  { id: 2, full_name: 'Mona Samir', email: 'mona@example.com', phone:'+90 555 111 3333', program:'CS', degree:'Master', nationality: 'Turkish', residence_country:'Turkey', city: 'Istanbul', gender: 'Female', status: 'qualified', stage: 'qualified', source: 'instagram', assignee_id: 2, lost_reason: null, created_at: new Date(Date.now()-86400000).toISOString() },
  { id: 3, full_name: 'John Doe', email: 'john@acme.com', phone:null, program:'Business', degree:'Bachelor', nationality: 'Russian', residence_country:'United Arab Emirates', city: 'Dubai', gender: 'Male', status: 'converted', stage: 'converted', source: 'web', assignee_id: 1, lost_reason: null, created_at: new Date(Date.now()-86400000*3).toISOString() },
  { id: 4, full_name: 'Lena Zaki', email: 'lena@z.com', phone:null, program:'Dentistry', degree:'Diploma', nationality: 'Jordanian', residence_country:'Jordan', city: 'Amman', gender: 'Female', status: 'new', stage: 'new', source: 'import', assignee_id: null, lost_reason: null, created_at: new Date().toISOString() },
  { id: 5, full_name: 'Othman', email: 'oth@acme.com', phone:null, program:'Law', degree:'Bachelor', nationality: 'Saudi', residence_country:'Saudi Arabia', city: 'Riyadh', gender: 'Male', status: 'lost', stage: 'lost', source: 'facebook', assignee_id: 2, lost_reason: 'not_interested', created_at: new Date(Date.now()-86400000*5).toISOString() }
];

// Lead Activity Management Functions
export function addLeadActivity(leadId, userId, contactMethod, outcome, notes, stageFrom = null, stageTo = null) {
  const activity = {
    id: Math.max(0, ...leadActivities.map(a => a.id)) + 1,
    lead_id: leadId,
    user_id: userId,
    stage_from: stageFrom,
    stage_to: stageTo,
    contact_method: contactMethod,
    outcome: outcome,
    notes: notes || '',
    created_at: new Date().toISOString()
  };
  leadActivities.push(activity);
  return activity;
}

export function getLeadActivities(leadId) {
  return leadActivities.filter(a => a.lead_id === leadId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function advanceLeadStage(leadId, outcome, contactMethod, notes, userId) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return null;
  
  const currentStage = LEAD_STAGES.find(s => s.id === lead.stage);
  const outcomeData = CONTACT_OUTCOMES.find(o => o.id === outcome);
  
  let newStage = lead.stage;
  let newStatus = lead.status;
  
  // Determine next stage based on outcome
  if (outcomeData?.leads_to) {
    newStage = outcomeData.leads_to;
    newStatus = outcomeData.leads_to;
  } else if (outcomeData?.advances_stage && currentStage?.next) {
    newStage = currentStage.next;
    newStatus = currentStage.next === 'converted' ? 'converted' : 'in_progress';
  }
  
  // Update lead
  const oldStage = lead.stage;
  lead.stage = newStage;
  lead.status = newStatus;
  
  // Add activity record
  const activity = addLeadActivity(leadId, userId, contactMethod, outcome, notes, oldStage, newStage);
  
  // Add notification if stage changed
  if (oldStage !== newStage) {
    const stageData = LEAD_STAGES.find(s => s.id === newStage);
    addNotification(
      'stage_change',
      'Lead Stage Updated',
      `Lead "${lead.full_name}" moved to ${stageData?.name || newStage}`,
      lead.assignee_id
    );
  }
  
  return { lead, activity };
}

export function setLeadLost(leadId, reason, notes, userId) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return null;
  
  const oldStage = lead.stage;
  lead.stage = 'lost';
  lead.status = 'lost';
  lead.lost_reason = reason;
  
  // Add activity record
  const activity = addLeadActivity(leadId, userId, null, 'not_interested', notes || `Lost: ${reason}`, oldStage, 'lost');
  
  // Add notification
  addNotification(
    'lead_lost',
    'Lead Lost',
    `Lead "${lead.full_name}" marked as lost: ${LOST_REASONS.find(r => r.id === reason)?.name || reason}`,
    lead.assignee_id
  );
  
  return { lead, activity };
}

// Centralized auto-assignment logic for new leads
export function autoAssignLead(leadData) {
  const eligibleUsers = users.filter(user => {
    if (!user.active || !user.assignment_eligibility) return false;
    const userRoles = user.roles || [];
    const canReceiveAssignments = userRoles.some(roleName => {
      const roleData = roles[roleName];
      return roleData && roleData.can_receive_assignments;
    });
    if (!canReceiveAssignments) return false;
    if (leadData.nationality && user.assignment_eligibility.countries) {
      if (!user.assignment_eligibility.countries.includes(leadData.nationality)) {
        return false;
      }
    }
    if (leadData.degree && user.assignment_eligibility.degree_levels) {
      if (!user.assignment_eligibility.degree_levels.includes(leadData.degree)) {
        return false;
      }
    }
    return true;
  });
  if (eligibleUsers.length === 0) return null;
  const userWorkloads = eligibleUsers.map(user => {
    const currentLeads = leads.filter(lead => lead.assignee_id === user.id && ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(lead.stage));
    const todayLeads = leads.filter(lead => lead.assignee_id === user.id && new Date(lead.created_at).toDateString() === new Date().toDateString());
    return {
      user,
      currentLeads: currentLeads.length,
      todayLeads: todayLeads.length,
      maxOpenLeads: user.assignment_eligibility.max_open_leads || 999,
      maxPerDay: user.assignment_eligibility.max_per_day || 999,
      priority: user.assignment_eligibility.priority || 999
    };
  });
  const availableUsers = userWorkloads.filter(w => w.currentLeads < w.maxOpenLeads && w.todayLeads < w.maxPerDay);
  if (availableUsers.length === 0) return null;
  availableUsers.sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : a.currentLeads - b.currentLeads));
  return availableUsers[0].user.id;
}

// Notifications system
export let notifications = [];

export function addNotification(type, title, message, userId = null) {
  const notification = {
    id: Date.now() + Math.random(),
    type, // 'task_due', 'new_assignment', 'task_overdue', 'info'
    title,
    message,
    userId,
    created_at: new Date().toISOString(),
    read: false
  };
  notifications.push(notification);
  return notification;
}

export function getNotifications(userId = null) {
  return notifications.filter(n => !userId || n.userId === userId || n.userId === null);
}

export function markNotificationRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}

export function checkDueTasks() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  tasks.forEach(task => {
    if (task.status === 'open') {
      const dueDate = new Date(task.due_at);
      const lead = leads.find(l => l.id === task.lead_id);
      
      // Task is due today
      if (dueDate.toDateString() === now.toDateString()) {
        addNotification(
          'task_due',
          'Task Due Today',
          `Task "${task.title}" for ${lead ? lead.full_name : 'Unknown Lead'} is due today`,
          lead ? lead.assignee_id : null
        );
      }
      
      // Task is overdue
      if (dueDate < now) {
        addNotification(
          'task_overdue',
          'Overdue Task',
          `Task "${task.title}" for ${lead ? lead.full_name : 'Unknown Lead'} is overdue`,
          lead ? lead.assignee_id : null
        );
      }
    }
  });
}

export const roleService = {
  // Get all roles
  getAllRoles: () => {
    return Object.entries(roles).map(([id, role]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: role.description || `${id} role`,
      active: role.active !== false, // default to true if not set
      can_receive_assignments: role.can_receive_assignments || false,
      permissions: role.permissions,
      userCount: users.filter(u => u.roles?.includes(id) || u.role === id).length
    }));
  },

  // Get role by ID
  getRole: (id) => {
    const role = roles[id];
    if (!role) return null;
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: role.description || `${id} role`,
      active: role.active !== false,
      can_receive_assignments: role.can_receive_assignments || false,
      permissions: role.permissions,
      userCount: users.filter(u => u.roles?.includes(id) || u.role === id).length
    };
  },

  // Create or update role
  saveRole: (id, data) => {
    if (!roles[id]) {
      // New role
      roles[id] = {
        canEdit: true,
        can_receive_assignments: data.can_receive_assignments,
        permissions: data.permissions,
        active: data.active !== false,
        description: data.description
      };
      return id;
    } else {
      // Update existing role
      roles[id] = {
        ...roles[id],
        can_receive_assignments: data.can_receive_assignments,
        permissions: data.permissions,
        active: data.active !== false,
        description: data.description
      };
      return id;
    }
  },

  // Delete role
  deleteRole: (id) => {
    if (!roles[id]) return false;
    
    // Check if this is the last role with manage permissions
    const manageRoles = Object.entries(roles).filter(([_, role]) => 
      role.permissions?.roles?.manage
    );
    
    if (manageRoles.length === 1 && manageRoles[0][0] === id) {
      return { success: false, message: 'Cannot delete the last role with Manage Roles permission' };
    }
    
    // Check if any users have this role
    const usersWithRole = users.filter(u => 
      u.roles?.includes(id) || u.role === id
    );
    
    if (usersWithRole.length > 0) {
      return { 
        success: false, 
        message: `Cannot delete role: ${usersWithRole.length} user(s) have this role` 
      };
    }
    
    delete roles[id];
    return { success: true };
  },

  // Toggle role active status
  toggleRoleStatus: (id) => {
    if (!roles[id]) return false;
    roles[id].active = !(roles[id].active !== false);
    return true;
  }
};
