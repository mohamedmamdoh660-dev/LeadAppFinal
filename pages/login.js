import { apiFetch } from '../shared.js';

export function renderLogin() {
  return `
    <div class="login-container">
      <div class="login-background">
        <div class="login-overlay"></div>
      </div>
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <img src="https://mio.medipol.edu.tr/sites/mio.medipol.edu.tr/themes/custom/mio/logo-en.svg" alt="Medipol University" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="logo-fallback" style="display: none;">🏛️</div>
            <h1>Medipol Lead CRM</h1>
          </div>
          <p class="login-subtitle">International Students Management System</p>
        </div>
        
        <form class="login-form" id="loginForm">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              placeholder="Enter your email"
              autocomplete="email"
            >
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              placeholder="Enter your password"
              autocomplete="current-password"
            >
          </div>
          
          <div class="form-options">
            <label class="checkbox-wrapper">
              <input type="checkbox" id="rememberMe" name="rememberMe">
              <span class="checkmark"></span>
              Remember me
            </label>
            <a href="#" class="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" class="btn btn-primary btn-login" id="loginBtn">
            <span class="btn-text">Sign In</span>
            <span class="btn-loading" style="display: none;">Signing in...</span>
          </button>
          
        </form>
        
        <div class="login-footer">
          <div class="university-info">
            <p class="university-name">İstanbul Medipol University</p>
            <p class="university-contact">Contact: 444 85 44 | <a href="mailto:info@medipol.edu.tr">info@medipol.edu.tr</a></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initLogin() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnLoading = loginBtn.querySelector('.btn-loading');
  
  // Get form data
  const formData = new FormData(e.target);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();
  const rememberMe = formData.get('rememberMe') === 'on';
  
  // Validate form
  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  // Show loading state
  loginBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
        rememberMe
      }
    });
    
    if (response.success) {
      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      // Store user info
      if (response.user) {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      
      showToast('Login successful!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 1000);
    } else {
      showToast(response.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again.', 'error');
  } finally {
    // Reset button state
    loginBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}


function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}
