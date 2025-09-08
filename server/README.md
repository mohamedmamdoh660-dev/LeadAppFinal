# LeadApp Backend (Express + Prisma + PostgreSQL)

## Setup (local)
1. Copy `.env.example` to `.env` and adjust values.
2. Install deps:
   - npm install
3. Generate Prisma client:
   - npx prisma generate
4. Run migrations (creates DB schema):
   - npx prisma migrate dev --name init
5. Seed sample data:
   - npm run seed
6. Start dev server:
   - npm run dev

Health check: GET http://localhost:4000/health

Create lead (auto-assign on server):
POST http://localhost:4000/leads
Body:
```
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+20123456789",
  "nationality": "Egypt",
  "degree": "Bachelor",
  "source": "Website"
}
```

## Docker (server + Postgres)
From the `server/` dir:
```
docker compose up --build
```

This exposes:
- API: http://localhost:4000
- DB: 5432 (mapped)

## Notes
- Prisma schema is in `prisma/schema.prisma`.
- Auto-assignment logic lives in `src/services/assignment.js` and is called in `POST /leads`.
- Next steps: add Auth, roles enforcement, activities/tasks/notifications endpoints.
