# Medipol Lead CRM Deployment Guide for University Server

## 📋 Overview
Lead Management System application for Medipol University to manage international students interested in enrollment.

## 🛠️ Technical Requirements

### Web Server
- **Node.js**: Version 16 or newer
- **Operating System**: Linux (Ubuntu/CentOS) or Windows Server
- **Memory**: 2GB RAM minimum
- **Storage**: 10GB free space

### Database
- **For Testing**: SQLite (included in application)
- **For Production**: PostgreSQL or MySQL

## 📦 Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Copy Application Files
```bash
# Create application directory
sudo mkdir -p /var/www/medipol-leadapp
sudo chown $USER:$USER /var/www/medipol-leadapp

# Copy files (after extracting)
cp -r leadapp/* /var/www/medipol-leadapp/
```

### 3. Backend Server Setup
```bash
cd /var/www/medipol-leadapp/server

# Install required packages
npm install

# Copy configuration file
cp .env.example .env

# Edit configuration (very important!)
nano .env
```

### 4. Database Setup
```bash
# Create database
npm run prisma:generate
npm run db:push

# Add initial data (admin and roles)
npm run seed
```

### 5. Run Application
```bash
# Temporary run for testing
npm start

# For permanent deployment (using PM2)
npm install -g pm2
pm2 start src/index.js --name medipol-leadapp
pm2 save
pm2 startup
```

### 6. Web Server Configuration (Nginx)
```nginx
# Configuration file: /etc/nginx/sites-available/medipol-leadapp
server {
    listen 80;
    server_name leadapp.medipol.edu.tr;  # Change to actual domain
    
    # Frontend
    location / {
        root /var/www/medipol-leadapp/front\ 2;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/medipol-leadapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ⚙️ Configuration File (.env)

Edit the file `/var/www/medipol-leadapp/server/.env`:

```bash
# Server port
PORT=4000

# Database
DATABASE_URL="file:./dev.db"

# For production with PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/medipol_leadapp"

# Security key (must change!)
JWT_SECRET="medipol_strong_secret_key_2025"

# CORS settings
CORS_ORIGIN="http://leadapp.medipol.edu.tr"
```

## 🔐 Default Accounts

### Admin Account
- **Email**: admin@leadapp.com
- **Password**: admin123

**⚠️ Very Important**: Change password immediately after deployment!

## 🧪 Testing Application

### 1. Test Backend Server
```bash
curl http://localhost:4000/health
# Should return: {"status": "ok"}
```

### 2. Test Frontend
Open browser and go to: `http://server-ip` or `http://leadapp.medipol.edu.tr`

### 3. Test Login
- Use default account to verify system works
- Try creating a new lead
- Verify dashboard statistics work

## 🔒 Security and Protection

### 1. Change Passwords
- Change admin password from dashboard
- Change `JWT_SECRET` in `.env` file

### 2. Enable HTTPS
```bash
# Install Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d leadapp.medipol.edu.tr
```

### 3. Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 Monitoring and Maintenance

### 1. Application Monitoring
```bash
# PM2 status
pm2 status
pm2 logs medipol-leadapp

# Resource usage
pm2 monit
```

### 2. Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/medipol-leadapp/server/prisma/dev.db /backup/leadapp_$DATE.db

# Add to crontab for daily execution
0 2 * * * /path/to/backup-script.sh
```

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify `DATABASE_URL` in `.env`
   - Ensure `npm run prisma:generate` was run

2. **API 404 Error**
   - Verify backend server runs on port 4000
   - Check Nginx configuration

3. **Login Issues**
   - Ensure `npm run seed` was run
   - Check `JWT_SECRET` in `.env`

## 📞 Technical Support

For assistance:
1. Check log files: `pm2 logs medipol-leadapp`
2. Verify service status: `pm2 status`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

**Created for Medipol University IT Team**  
**Date: September 2025**
