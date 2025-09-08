# LeadApp - Lead Management System

A comprehensive lead management application built for MediPol University.

## Features

- **Lead Management**: Track and manage student leads through various stages
- **Task Management**: Create and assign follow-up tasks
- **User Management**: Manage system users and their roles
- **Role-based Permissions**: Granular permission system for different user types
- **Reports**: Generate user and system reports
- **Dashboard**: Overview of key metrics and activities

## Technology Stack

### Frontend
- Vanilla JavaScript (ES6+)
- Modular component architecture
- CSS3 with modern styling
- Responsive design

### Backend
- Node.js with Express.js
- Prisma ORM
- SQLite database
- JWT authentication
- RESTful API

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python 3 (for frontend serving)

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm start
```

### Frontend Setup
```bash
# In root directory
npm install
npm start
```

## Deployment

### For University Server

1. **Backend Deployment**:
   - Ensure Node.js is installed on server
   - Copy `server/` directory to server
   - Install dependencies: `npm install --production`
   - Set up environment variables
   - Run database migrations: `npm run prisma:deploy`
   - Start application: `npm run start:prod`

2. **Frontend Deployment**:
   - Copy all frontend files to web server directory
   - Ensure `index.html` is accessible
   - Configure web server to serve static files
   - Update API endpoints in `shared.js` if needed

3. **Database**:
   - SQLite database file will be created automatically
   - For production, consider migrating to PostgreSQL
   - Ensure proper backup procedures

### Environment Variables

Create `.env` file in server directory:
```
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-strong-secret-key"
CORS_ORIGIN="http://localhost:3000"
```

## API Endpoints

- `GET /health` - Health check
- `GET /leads` - List leads
- `POST /leads` - Create lead
- `GET /users` - List users
- `GET /roles` - List roles
- `GET /tasks` - List tasks

## Security Considerations

- Change default JWT secret
- Use HTTPS in production
- Implement rate limiting
- Regular security updates
- Proper input validation

## Support

For technical support, contact the development team or refer to the documentation.


## 📄 Documentation

### Handover Instructions
- [English](handover-instructions-en.md)
- [العربية](handover-instructions-ar.md)
- [Türkçe](handover-instructions-tr.md)

### Deployment Guide
- [English](deployment-guide-en.md)
- [العربية](deployment-guide-ar.md)
- [Türkçe](deployment-guide-tr.md)

---

## 📢 Notes
Please refer to the **Deployment Guide** in your preferred language before starting the setup.  
For an overview of the project responsibilities and components, check the **Handover Instructions**.
