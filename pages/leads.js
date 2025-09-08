import { t } from '../state.js';
import { apiFetch, $ } from '../shared.js';
import { navigate } from '../router.js';

export function renderLeadRow(l){
  const stageBadges = {
    'new': '🟢',
    'contacted': '🟡', 
    'qualified': '🔵',
    'proposal': '🟠',
    'negotiation': '🟣',
    'converted': '✅',
    'lost': '🔴',
    'rejected': '❌'
  };
  const badge = stageBadges[l.stage] || stageBadges[l.status] || '•';
  const displayStage = l.stage || l.status || 'new';
  const canEdit = true; // roles[me().roles[0]].canEdit;
  const assignee = ((window.usersData || []).find(u=>u.id===(l.assigneeId || l.assignee_id))||{}).name || 'Unassigned';
  return `<div class="row">
    <div><div class="k">${l.full_name}</div><small>${new Date(l.created_at).toLocaleDateString()}</small></div>
    <div class="hide-sm">${l.email || '—'}</div>
    <div class="hide-sm">${l.source || '—'}</div>
    <div>${badge} ${displayStage}</div>
    <div>${assignee}</div>
    <div style="display:flex; gap:6px; justify-content:flex-end;">
      <button class="btn ghost" data-open data-id="${l.id}">${t('labels.open')}</button>
      <button class="btn" data-edit data-id="${l.id}" ${canEdit?'' : 'disabled style="opacity:.5; cursor:not-allowed;"'}>${t('labels.edit')}</button>
    </div>
  </div>`;
}

export function LeadsPage(){
  const hashQ = location.hash.split('?')[1] || '';
  const q = new URLSearchParams(hashQ);
  const search = q.get('q') || '';
  const st = q.get('status') || '';
  const src = q.get('source') || '';
  const asg = q.get('assignee') || '';

  console.log('LeadsPage rendering with filters:', { search, st, src, asg });
  console.log('Current hash:', location.hash);
  console.log('Query string:', hashQ);

  const list = (window.leadsData || []);
  console.log('Total leads:', list.length);
  
  const filtered = list.filter(l => {
    const s = search.trim().toLowerCase();
    const matchQ = !s || (l.full_name.toLowerCase().includes(s) || (l.email||'').toLowerCase().includes(s));
    const matchSt = !st || l.stage === st || l.status === st; // Check both stage and status
    const matchSrc = !src || l.source === src;
    const matchAsg = !asg || String(l.assigneeId || l.assignee_id || '') === asg;
    
    const matches = matchQ && matchSt && matchSrc && matchAsg;
    if (st || src || asg || s) {
      console.log(`Lead ${l.full_name}: stage=${l.stage}, status=${l.status}, source=${l.source}, assignee=${l.assigneeId}, matches=${matches}`);
    }
    
    return matches;
  });
  
  console.log('Filtered leads:', filtered.length);

  return `
    <div class="panel">
      <div class="panel-header">
        <h3>${t('leads')}</h3>
        <div class="header-actions">
          <button class="btn primary" onclick="window.appNavigate('#/leads/add')" aria-label="Add new lead">
            <span>+ Add Lead</span>
          </button>
          <input id="fileCsv" type="file" accept=".csv" class="input" style="padding:6px" />
          <button id="btnImport" class="btn ghost">${t('import')}</button>
          <button id="btnExport" class="btn secondary">${t('export')}</button>
        </div>
      </div>
      <div class="toolbar-line">
        <input id="q" class="input" placeholder="${t('filters.search')}…" value="${search}" />
        <select id="fStatus" class="select">
          <option value="">${t('filters.all')}</option>
          <option value="new" ${st==='new'?'selected':''}>New</option>
          <option value="contacted" ${st==='contacted'?'selected':''}>Contacted</option>
          <option value="qualified" ${st==='qualified'?'selected':''}>Qualified</option>
          <option value="proposal" ${st==='proposal'?'selected':''}>Proposal Sent</option>
          <option value="negotiation" ${st==='negotiation'?'selected':''}>Negotiation</option>
          <option value="converted" ${st==='converted'?'selected':''}>Converted</option>
          <option value="lost" ${st==='lost'?'selected':''}>Lost</option>
          <option value="rejected" ${st==='rejected'?'selected':''}>Rejected</option>
        </select>
        <select id="fSource" class="select">
          <option value="">${t('filters.allSources')}</option>
          ${['facebook', 'instagram', 'web', 'import'].map(s=>`<option ${src===s?'selected':''} value="${s}">${s}</option>`).join('')}
        </select>
        <select id="fAssignee" class="select">
          <option value="">${t('filters.allAssignees')}</option>
          ${(window.usersData || []).map(u=>`<option ${asg===String(u.id)?'selected':''} value="${u.id}">${u.name}</option>`).join('')}
        </select>
        <button id="btnApply" class="btn ghost">Apply</button>
      </div>
      <div class="list">${filtered.map(l=>renderLeadRow(l)).join('') || '<div class="row small">Loading or no leads</div>'}</div>
    </div>
  `;
}

export function wireLeads(){
  $('#btnApply').onclick = (e) => {
    e.preventDefault();
    console.log('Apply filters clicked');
    
    const params = new URLSearchParams();
    const qv = $('#q').value.trim(); if(qv) params.set('q', qv);
    const sv = $('#fStatus').value; if(sv) params.set('status', sv);
    const so = $('#fSource').value; if(so) params.set('source', so);
    const av = $('#fAssignee').value; if(av) params.set('assignee', av);
    const qs = params.toString();
    
    console.log('Filter params:', { qv, sv, so, av, qs });
    
    const newUrl = `#/leads${qs?'?'+qs:''}`;
    console.log('Navigating to:', newUrl);
    
    window.location.hash = newUrl;
    return false;
  };

  document.querySelectorAll('.row button[data-open]').forEach(btn=> btn.onclick = () => navigate(`#/leads/${btn.dataset.id}`));
  document.querySelectorAll('.row button[data-edit]').forEach(btn=> btn.onclick = () => navigate(`#/leads/${btn.dataset.id}/edit`));

  document.getElementById('btnExport').onclick = () => exportCSV();
  document.getElementById('btnImport').onclick = () => importCSV(document.getElementById('fileCsv').files[0]);
}

function exportCSV(){
  const cols = ['id','full_name','email','phone','program','degree','nationality','residence_country','status','source','assignee'];
  const mapRow = l => [l.id,l.full_name,l.email||'',l.phone||'',l.program||'',l.degree||'',l.nationality||'',l.residence_country||'',l.status||'',l.source||'',(window.usersData||[]).find(u=>u.id===l.assigneeId)?.name||''].map(v=>`"${String(v).replaceAll('"','\\"')}"`).join(',');
  const csv = [cols.join(','), ...((window.leadsData||[]).map(mapRow))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = `leads_${Date.now()}.csv`; a.click();
}

function importCSV(file){
  if(!file){ alert('Choose CSV first'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',').map(s=>s.replace(/^\"|\"$/g,''));
    const idx = (k) => header.indexOf(k);
    let okCount = 0; let failCount = 0;
    
    Promise.all(lines.map(async (line) => {
      const parts = line.match(/\"(?:[^\"]|\\")*\"|[^,]+/g).map(s=>s.replace(/^\"|\"$/g,'').replace(/\\"/g,'"'));
      const payload = {
        full_name: parts[idx('full_name')] || 'Unnamed',
        email: parts[idx('email')] || '',
        phone: parts[idx('phone')] || '',
        degree: parts[idx('degree')] || '',
        nationality: parts[idx('nationality')] || '',
        source: parts[idx('source')] || 'import'
      };
      try {
        await apiFetch('/leads', { method: 'POST', body: payload });
        okCount++;
      } catch(e){
        console.error(e);
        failCount++;
      }
    })).then(()=>{
      alert(`Imported ${okCount} lead(s).${failCount?` Failed: ${failCount}.`:''}`);
      // Trigger re-render after import
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  };
  reader.readAsText(file);
}

async function loadLeadsFromApi(){
  try {
    const [leadsRes, usersRes] = await Promise.all([
      apiFetch('/leads'),
      apiFetch('/users')
    ]);
    
    window.leadsData = leadsRes.items || leadsRes.leads || [];
    window.usersData = usersRes.users || [];
    
    // Trigger re-render
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } catch (error) {
    console.error('Failed to load leads data:', error);
  }
}
