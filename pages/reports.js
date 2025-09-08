import { t } from '../state.js';
import { SOURCES, NATIONALITIES, GENDERS } from '../data/mock.js';
import { $ } from '../shared.js';

function renderCharts(filteredLeads) {
  const charts = $('#reports-charts');
  const sourceGroups = {};
  filteredLeads.forEach(lead => {
    const source = lead.source || 'unknown';
    sourceGroups[source] = (sourceGroups[source] || 0) + 1;
  });
  const maxSourceCount = Math.max(...Object.values(sourceGroups));
  const sourceData = Object.entries(sourceGroups).map(([source, count]) => ({
    label: source.charAt(0).toUpperCase() + source.slice(1),
    count,
    percentage: maxSourceCount > 0 ? (count / maxSourceCount) * 100 : 0
  }));

  const statusGroups = {};
  filteredLeads.forEach(lead => {
    const status = lead.status || 'unknown';
    statusGroups[status] = (statusGroups[status] || 0) + 1;
  });
  const maxStatusCount = Math.max(...Object.values(statusGroups));
  const statusData = Object.entries(statusGroups).map(([status, count]) => ({
    label: status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    count,
    percentage: maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0
  }));

  const genderGroups = {};
  filteredLeads.forEach(lead => {
    const gender = lead.gender || 'Not specified';
    genderGroups[gender] = (genderGroups[gender] || 0) + 1;
  });
  const maxGenderCount = Math.max(...Object.values(genderGroups));
  const genderData = Object.entries(genderGroups).map(([gender, count]) => ({
    label: gender,
    count,
    percentage: maxGenderCount > 0 ? (count / maxGenderCount) * 100 : 0
  }));

  const degreeGroups = {};
  filteredLeads.forEach(lead => {
    const degree = lead.degree || 'Not specified';
    degreeGroups[degree] = (degreeGroups[degree] || 0) + 1;
  });
  const maxDegreeCount = Math.max(...Object.values(degreeGroups));
  const degreeData = Object.entries(degreeGroups).map(([degree, count]) => ({
    label: degree,
    count,
    percentage: maxDegreeCount > 0 ? (count / maxDegreeCount) * 100 : 0
  }));

  charts.innerHTML = `
    <div class="charts-grid">
      <div class="chart-block">
        <div class="chart-title">${t('charts.bySource')}</div>
        <div class="chart-bars">
          ${sourceData.map(item => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill" style="width: ${item.percentage}%"></div></div>
              <div class="bar-value">${item.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chart-block">
        <div class="chart-title">${t('charts.byStatus')}</div>
        <div class="chart-bars">
          ${statusData.map(item => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill" style="width: ${item.percentage}%"></div></div>
              <div class="bar-value">${item.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chart-block">
        <div class="chart-title">${t('charts.byGender')}</div>
        <div class="chart-bars">
          ${genderData.map(item => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill" style="width: ${item.percentage}%"></div></div>
              <div class="bar-value">${item.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chart-block">
        <div class="chart-title">${t('charts.byDegree')}</div>
        <div class="chart-bars">
          ${degreeData.map(item => `
            <div class="bar-row">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track"><div class="bar-fill" style="width: ${item.percentage}%"></div></div>
              <div class="bar-value">${item.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderLeads(filteredLeads) {
  const container = $('#reports-results');
  if (filteredLeads.length === 0) {
    container.innerHTML = `<p>${t('noResults')}</p>`;
    return;
  }

  container.innerHTML = `
    <div class="list-header report-grid">
      <div class="cell">${t('name')}</div>
      <div class="cell">${t('source')}</div>
      <div class="cell">${t('nationality')}</div>
      <div class="cell">${t('city')}</div>
      <div class="cell">${t('gender')}</div>
      <div class="cell">${t('assignee')}</div>
      <div class="cell">${t('status')}</div>
      <div class="cell">${t('createdAt')}</div>
    </div>
    ${filteredLeads.map(lead => {
      const users = window.usersData || [];
      const assignee = users.find(u => u.id === lead.assignee_id);
      return `
        <div class="list-item report-grid">
          <div class="cell">${lead.full_name || lead.name || ''}</div>
          <div class="cell">${lead.source}</div>
          <div class="cell">${lead.nationality}</div>
          <div class="cell">${lead.city || ''}</div>
          <div class="cell">${lead.gender || ''}</div>
          <div class="cell">${assignee ? assignee.name : t('unassigned')}</div>
          <div class="cell"><span class="tag ${lead.status}">${t(lead.status)}</span></div>
          <div class="cell">${new Date(lead.created_at).toLocaleDateString()}</div>
        </div>
      `;
    }).join('')}
  `;
}

export function ReportsPage() {
  const sourceOptions = SOURCES.map(s => `<option value="${s}">${s}</option>`).join('');
  const nationalityOptions = NATIONALITIES.map(n => `<option value="${n}">${n}</option>`).join('');
  const users = window.usersData || [];
  const leads = window.leadsData || [];
  const assigneeOptions = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  const statusOptions = ['new', 'in_progress', 'converted', 'rejected'].map(s => `<option value="${s}">${t(s)}</option>`).join('');
  const genderOptions = GENDERS.map(g => `<option value="${g}">${g}</option>`).join('');
  const cityOptions = Array.from(new Set(leads.map(l => l.city).filter(Boolean))).map(c => `<option value="${c}">${c}</option>`).join('');

  return `
    <div class="panel">
      <div class="panel-header">
        <h3>${t('reports')}</h3>
      </div>
      <div id="reports-charts" class="mb-3"></div>
      <div class="toolbar-line filters">
        <div class="filter-group">
          <label for="source-filter">${t('source')}</label>
          <select id="source-filter" class="select"><option value="">${t('allSources')}</option>${sourceOptions}</select>
        </div>
        <div class="filter-group">
          <label for="nationality-filter">${t('nationality')}</label>
          <select id="nationality-filter" class="select"><option value="">${t('allNationalities')}</option>${nationalityOptions}</select>
        </div>
        <div class="filter-group">
          <label for="city-filter">${t('city')}</label>
          <select id="city-filter" class="select"><option value="">${t('allCities')}</option>${cityOptions}</select>
        </div>
        <div class="filter-group">
          <label for="gender-filter">${t('gender')}</label>
          <select id="gender-filter" class="select"><option value="">${t('allGenders')}</option>${genderOptions}</select>
        </div>
        <div class="filter-group">
          <label for="assignee-filter">${t('assignee')}</label>
          <select id="assignee-filter" class="select"><option value="">${t('allAssignees')}</option>${assigneeOptions}</select>
        </div>
        <div class="filter-group">
          <label for="status-filter">${t('status')}</label>
          <select id="status-filter" class="select"><option value="">${t('allStatuses')}</option>${statusOptions}</select>
        </div>
        <div class="filter-group">
          <label for="start-date-filter">${t('fromDate')}</label>
          <input type="date" id="start-date-filter" class="input">
        </div>
        <div class="filter-group">
          <label for="end-date-filter">${t('toDate')}</label>
          <input type="date" id="end-date-filter" class="input">
        </div>
        <div class="filter-group buttons">
          <button id="filter-btn" class="btn">${t('filter')}</button>
          <button id="clear-filter-btn" class="btn ghost">${t('clear')}</button>
        </div>
      </div>
      <div class="list" id="reports-results">
        <!-- Report results will be rendered here -->
      </div>
    </div>
  `;
}

export function wireReports() {
  const filterBtn = $('#filter-btn');
  const clearBtn = $('#clear-filter-btn');

  const applyFilters = () => {
    const source = $('#source-filter').value;
    const nationality = $('#nationality-filter').value;
    const city = $('#city-filter').value;
    const gender = $('#gender-filter').value;
    const assigneeId = $('#assignee-filter').value;
    const status = $('#status-filter').value;
    const startDate = $('#start-date-filter').value;
    const endDate = $('#end-date-filter').value;

    const leads = window.leadsData || [];
    const filteredLeads = leads.filter(lead => {
      if (source && lead.source !== source) return false;
      if (nationality && lead.nationality !== nationality) return false;
      if (city && (lead.city || '') !== city) return false;
      if (gender && (lead.gender || '') !== gender) return false;
      if (assigneeId && lead.assignee_id !== parseInt(assigneeId)) return false;
      if (status && lead.status !== status) return false;
      if (startDate && new Date(lead.created_at) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(lead.created_at) > end) return false;
      }
      return true;
    });

    renderCharts(filteredLeads);
    renderLeads(filteredLeads);
  };

  const clearFilters = () => {
    $('#source-filter').value = '';
    $('#nationality-filter').value = '';
    $('#city-filter').value = '';
    $('#gender-filter').value = '';
    $('#assignee-filter').value = '';
    $('#status-filter').value = '';
    $('#start-date-filter').value = '';
    $('#end-date-filter').value = '';
    applyFilters();
  };

  filterBtn.onclick = applyFilters;
  clearBtn.onclick = clearFilters;

  // Initial render
  applyFilters();
}
