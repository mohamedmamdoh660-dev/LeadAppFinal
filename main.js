import { render } from './router.js';
import { state, applyLang, applyTheme } from './state.js';
import { loadAllData } from './shared.js';

// expose state and mock data globally
window.state = state;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Set initial theme
  document.documentElement.setAttribute('data-theme', state.theme);
  
  // Load all data from API first, then render
  await loadAllData();
  
  // Start router after data is loaded
  render();
  
  // Listen for hash changes
  window.addEventListener('hashchange', render);
});

// After initial render, refresh notifications if navbar wired
setTimeout(()=>{ if (window.refreshNotifications) window.refreshNotifications(); }, 100);

// Periodically check due/overdue tasks and refresh notifications
if (!window.__notifInterval){
  window.__notifInterval = setInterval(()=>{
    try{
      if (window.checkDueTasks) window.checkDueTasks();
      if (window.refreshNotifications) window.refreshNotifications();
    }catch(e){ /* noop */ }
  }, 60000); // every 60s
}
