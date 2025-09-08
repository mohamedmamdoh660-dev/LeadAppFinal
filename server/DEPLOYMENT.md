# LeadApp Backend Deployment Guide (University)

This document explains how to deploy the LeadApp backend (Express + Prisma + PostgreSQL) on a university server.

## 1) Requirements
- Docker and Docker Compose installed
- A PostgreSQL instance (either via Docker or managed DB)
- A domain or IP with HTTPS (recommended via reverse proxy like Nginx/Caddy)

## 2) Environment variables
Copy `.env.production.example` to `.env` and set:
- PORT: HTTP port for the API (default 4000)
- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Strong random string
- CORS_ORIGIN: Comma-separated list of allowed frontend origins

## 3) Database schema
There are two ways to create the DB schema:
- Recommended: Migrations
  - Run: `npm run prisma:deploy` (requires existing migration files)
- Alternative: Push schema directly (no migrations)
  - Run: `npm run db:push`

Seed optional sample data: `npm run seed`

## 4) Run with Docker Compose
From the `server/` directory:
```
docker compose up --build -d
```
This brings up:
- Postgres (db) on 5432
- API (server) on 4000

You can edit `docker-compose.yml` to point DATABASE_URL to an external DB.

## 5) Health check
```
GET http://<HOST>:4000/health
```
Response: `{ "status": "ok" }`

## 6) API quick test
Create lead (server-side auto-assign applied):
```
POST http://<HOST>:4000/leads
Content-Type: application/json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+20123456789",
  "nationality": "Egypt",
  "degree": "Bachelor",
  "source": "Website"
}
```
List leads:
```
GET http://<HOST>:4000/leads?limit=20&offset=0
```
Get lead by ID:
```
GET http://<HOST>:4000/leads/1
```

## 7) HTTPS & Reverse Proxy (example with Nginx)
- Point your domain to the server
- Issue TLS certificate (Let’s Encrypt)
- Proxy traffic to `http://localhost:4000`
- Ensure CORS_ORIGIN includes your frontend domain

## 8) Operations
- Logs: `docker compose logs -f server`
- Restart: `docker compose restart server`
- Update image: pull source, `docker compose up --build -d`

## 9) Next steps
- Add Authentication (JWT) endpoints and role enforcement
- Add activities/tasks/notifications endpoints
- Connect the frontend to these API endpoints
