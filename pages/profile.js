import { apiFetch } from '../shared.js';

let currentUser = null;

export function renderProfile() {
  return `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your account settings and preferences</p>
      </div>

      <div class="profile-content">
        <!-- Avatar Section -->
        <div class="profile-section">
          <h2 class="section-title">Profile Picture</h2>
          <div class="avatar-section">
            <div class="avatar-container">
              <div class="avatar-preview" id="avatar-preview">
                <img id="avatar-image" src="" alt="Profile Picture" style="display: none;">
                <div class="avatar-placeholder" id="avatar-placeholder">
                  <i class="icon-user"></i>
                </div>
              </div>
              <div class="avatar-actions">
                <input type="file" id="avatar-input" accept="image/jpeg,image/jpg,image/png,image/webp" style="display: none;">
                <button type="button" class="btn btn-secondary" onclick="selectAvatar()">
                  <i class="icon-upload"></i> Upload Photo
                </button>
                <button type="button" class="btn btn-outline" onclick="removeAvatar()" id="remove-avatar-btn" style="display: none;">
                  <i class="icon-trash"></i> Remove
                </button>
              </div>
              <small class="help-text">JPG, PNG or WebP. Max size 2MB.</small>
            </div>
          </div>
        </div>

        <!-- Basic Info Section -->
        <div class="profile-section">
          <h2 class="section-title">Basic Information</h2>
          <form id="profile-form" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label for="profile-name">Full Name</label>
                <input type="text" id="profile-name" name="name" required>
              </div>
              <div class="form-group">
                <label for="profile-email">Email Address</label>
                <input type="email" id="profile-email" name="email" required>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="save-profile-btn">
                <span class="btn-text">Save Changes</span>
                <span class="btn-loading" style="display: none;">
                  <i class="icon-loading"></i> Saving...
                </span>
              </button>
            </div>
          </form>
        </div>

        <!-- Password Section -->
        <div class="profile-section">
          <h2 class="section-title">Change Password</h2>
          <form id="password-form" class="profile-form">
            <div class="form-group">
              <label for="current-password">Current Password</label>
              <input type="password" id="current-password" name="currentPassword" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input type="password" id="new-password" name="newPassword" required minlength="6">
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" name="confirmPassword" required minlength="6">
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="save-password-btn">
                <span class="btn-text">Update Password</span>
                <span class="btn-loading" style="display: none;">
                  <i class="icon-loading"></i> Updating...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function wireProfile() {
  loadUserProfile();
  
  // Wire form submissions
  document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);
  document.getElementById('password-form').addEventListener('submit', handlePasswordSubmit);
  
  // Wire avatar upload
  document.getElementById('avatar-input').addEventListener('change', handleAvatarUpload);
}

// Load current user profile
async function loadUserProfile() {
  try {
    const response = await apiFetch('/users/me');
    currentUser = response.user;
    
    // Populate form fields
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    
    // Update avatar display
    updateAvatarDisplay(currentUser.avatarUrl);
    
  } catch (error) {
    console.error('Failed to load user profile:', error);
    showToast('Failed to load profile data', 'error');
  }
}

// Update avatar display
function updateAvatarDisplay(avatarUrl) {
  const avatarImage = document.getElementById('avatar-image');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  const removeBtn = document.getElementById('remove-avatar-btn');
  
  if (avatarUrl) {
    avatarImage.src = `http://localhost:4000${avatarUrl}`;
    avatarImage.style.display = 'block';
    avatarPlaceholder.style.display = 'none';
    removeBtn.style.display = 'inline-flex';
  } else {
    avatarImage.style.display = 'none';
    avatarPlaceholder.style.display = 'flex';
    removeBtn.style.display = 'none';
  }
}

// Avatar functions
window.selectAvatar = function() {
  document.getElementById('avatar-input').click();
}

window.removeAvatar = async function() {
  if (!confirm('Are you sure you want to remove your profile picture?')) {
    return;
  }
  
  try {
    await apiFetch('/users/me/avatar', { method: 'DELETE' });
    updateAvatarDisplay(null);
    showToast('Profile picture removed successfully', 'success');
  } catch (error) {
    console.error('Failed to remove avatar:', error);
    showToast('Failed to remove profile picture', 'error');
  }
}

// Handle avatar upload
async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('File size must be less than 2MB', 'error');
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Only JPG, PNG, and WebP images are allowed', 'error');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('http://localhost:4000/users/me/avatar', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    updateAvatarDisplay(result.avatarUrl);
    showToast('Profile picture updated successfully', 'success');
    
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    showToast('Failed to upload profile picture', 'error');
  }
  
  // Clear the input
  event.target.value = '';
}

// Handle profile form submission
async function handleProfileSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const data = {
    name: formData.get('name'),
    email: formData.get('email')
  };
  
  // Show loading state
  const saveBtn = document.getElementById('save-profile-btn');
  const btnText = saveBtn.querySelector('.btn-text');
  const btnLoading = saveBtn.querySelector('.btn-loading');
  
  saveBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  
  try {
    const response = await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    currentUser = response.user;
    showToast('Profile updated successfully', 'success');
    
  } catch (error) {
    console.error('Failed to update profile:', error);
    showToast(error.message || 'Failed to update profile', 'error');
  } finally {
    // Reset loading state
    saveBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// Handle password form submission
async function handlePasswordSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  
  // Validate password confirmation
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }
  
  // Show loading state
  const saveBtn = document.getElementById('save-password-btn');
  const btnText = saveBtn.querySelector('.btn-text');
  const btnLoading = saveBtn.querySelector('.btn-loading');
  
  saveBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  
  try {
    await apiFetch('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    showToast('Password updated successfully', 'success');
    
    // Clear form
    event.target.reset();
    
  } catch (error) {
    console.error('Failed to update password:', error);
    showToast(error.message || 'Failed to update password', 'error');
  } finally {
    // Reset loading state
    saveBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// Simple toast notification function
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to page
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
