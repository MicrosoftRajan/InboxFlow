# Run InboxFlow — Step by Step

Do these in order from the **project root** (`inboxflow` folder).

---

## Step 1: Start Redis

Redis is required for the email queue.

**Mac (Homebrew):**
```bash
brew services start redis
```

**Check it’s running:**
```bash
redis-cli ping
```
You should see: `PONG`

---

## Step 2: Ensure `.env` is set

- **`backend/.env`** must have:
  - `DATABASE_URL` (Supabase connection string)
  - `REDIS_URL="redis://localhost:6379"`
  - `PORT=3005` (backend port; if in use, try 3006)
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

- **`frontend/.env.local`** must have:
  - `NEXT_PUBLIC_API_URL="http://localhost:3005/api"` (must match backend PORT)
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID="..."`

---

## Step 3: Install dependencies (one-time)

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Step 4: Push database schema (one-time)

```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

---

## Step 5: Start the backend

Open a terminal. From project root:

```bash
cd backend
npm run dev
```

Leave it running. You should see: **Server is running on port 3005**.

---

## Step 6: Start the frontend

Open a **second** terminal. From project root:

```bash
cd frontend
npm run dev
```

Leave it running. You should see: **Local: http://localhost:3000**.

---

## Step 7: Open the app

In your browser go to: **http://localhost:3000**

Sign in with Google and use the dashboard.

---

## If a port is already in use

**Backend (3005):**
```bash
lsof -i :3005   # see process ID (PID)
kill PID        # stop it
```

**Frontend (3000):**
```bash
lsof -i :3000
kill PID
```

Then run Step 5 or 6 again.

---

## Quick checklist

| Step | Command / action | Done? |
|------|------------------|--------|
| 1 | `brew services start redis` | ☐ |
| 2 | Check `backend/.env` and `frontend/.env.local` | ☐ |
| 3 | `npm install` in backend and frontend | ☐ |
| 4 | `cd backend && npx prisma generate && npx prisma db push` | ☐ |
| 5 | Terminal 1: `cd backend && npm run dev` | ☐ |
| 6 | Terminal 2: `cd frontend && npm run dev` | ☐ |
| 7 | Open http://localhost:3000 | ☐ |
