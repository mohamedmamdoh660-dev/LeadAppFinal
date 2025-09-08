# University Server Deployment Guide

## Pre-deployment Checklist

### ✅ Required Files
- [x] Backend server code (`server/` directory)
- [x] Frontend files (HTML, CSS, JS)
- [x] Database schema (`server/prisma/schema.prisma`)
- [x] Package.json files
- [x] Environment configuration

### ⚠️ Missing Components for Production

1. **Authentication System**
   - No login/logout functionality implemented
   - JWT tokens configured but no auth middleware
   - User sessions not managed

2. **Production Database**
   - Currently using SQLite (development only)
   - Recommend PostgreSQL for production
   - No database backup strategy

3. **Security Configurations**
   - Default JWT secret needs changing
   - CORS settings need production URLs
   - No rate limiting implemented
   - Missing input sanitization

4. **Production Optimizations**
   - No static file compression
   - No caching headers
   - No error logging system
   - No monitoring/health checks

## Deployment Steps

### 1. Server Setup
```bash
# Install Node.js (v16+)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application directory
sudo mkdir -p /var/www/leadapp
sudo chown $USER:$USER /var/www/leadapp
```

### 2. Backend Deployment
```bash
cd /var/www/leadapp
# Copy server files
cp -r /path/to/leadapp/server ./
cd server

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
# Edit .env with production values:
# PORT=4000
# DATABASE_URL="postgresql://user:pass@localhost:5432/leadapp"
# JWT_SECRET="strong-random-secret-key"
# CORS_ORIGIN="https://yourdomain.com"

# Setup database
npm run prisma:generate
npm run prisma:deploy
npm run seed

# Test server
npm start
```

### 3. Frontend Deployment
```bash
# Copy frontend files to web server
sudo cp -r /path/to/leadapp/front/* /var/www/html/leadapp/

# Configure web server (Apache/Nginx)
# Point document root to /var/www/html/leadapp
```

### 4. Process Management
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
cd /var/www/leadapp/server
pm2 start src/index.js --name leadapp

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Web Server Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/html/leadapp;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Critical Issues to Address

### 🚨 High Priority
1. **Implement Authentication**
   - Login/logout pages
   - Session management
   - Protected routes

2. **Database Migration**
   - Move from SQLite to PostgreSQL
   - Set up database backups
   - Configure connection pooling

3. **Security Hardening**
   - Change default secrets
   - Add input validation
   - Implement rate limiting
   - Enable HTTPS

### 🔧 Medium Priority
1. **Error Handling**
   - Centralized error logging
   - User-friendly error pages
   - API error responses

2. **Performance**
   - Static file caching
   - Database query optimization
   - Frontend minification

### 📋 Low Priority
1. **Monitoring**
   - Health check endpoints
   - Performance metrics
   - Log aggregation

## Testing Before Go-Live

1. **Functionality Tests**
   - All CRUD operations work
   - Role permissions function correctly
   - Data persistence verified

2. **Security Tests**
   - SQL injection prevention
   - XSS protection
   - Authentication bypass attempts

3. **Performance Tests**
   - Load testing with expected user count
   - Database performance under load
   - Frontend responsiveness

## Post-Deployment

1. **Monitoring Setup**
   - Server resource monitoring
   - Application error tracking
   - Database performance monitoring

2. **Backup Strategy**
   - Daily database backups
   - Application file backups
   - Recovery procedures documented

3. **Maintenance Plan**
   - Regular security updates
   - Database maintenance
   - Log rotation
