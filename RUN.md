# Step-by-Step: How to Run InboxFlow

Follow these steps in order.

---

## Step 1: Database — choose one option

### Option A: Use Supabase (recommended if you don’t have Docker)

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. In **Settings → Database**, copy the **Connection string (URI)**.
3. In **`backend/.env`** set:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public&sslmode=require"
   ```
   If your password contains `@`, replace it with `%40` in the URL.
4. See **SUPABASE.md** for full Supabase setup.

You still need **Redis** (see Step 1B). Then go to **Step 2**.

### Option B: Local PostgreSQL and Redis (Homebrew)

```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

Then in `.env`:  
`DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/inboxflow?schema=public"`

### Option C: Docker

```bash
docker compose up -d
```

Then in `.env`:  
`DATABASE_URL="postgresql://user:password@localhost:5432/inboxflow?schema=public"`

**Redis:** For Option A you must run Redis locally (`brew services start redis`) or use a hosted Redis. For B and C, Redis is included.

---

## Step 2: Create the database (one-time)

**If you use Supabase:** Skip this step. Go to Step 3 and run `npx prisma db push` in the backend.

**If you use Homebrew:**

```bash
createdb inboxflow
```

**If you use Docker:** The database is created automatically. Skip this step.

---

## Step 3: Set up environment variables

1. Open the file **`.env`** in the project root (same folder as `docker-compose.yml`).

2. **If you use Homebrew** for PostgreSQL, set:

   ```
   DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/inboxflow?schema=public"
   ```

   Replace `YOUR_MAC_USERNAME` with your Mac username (e.g. `rajanvimla`).  
   No password is needed for the default Homebrew setup.

3. **If you use Docker**, keep:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/inboxflow?schema=public"
   ```

4. For Google Login, set your real values (get them from [Google Cloud Console](https://console.cloud.google.com/)):

   ```
   GOOGLE_CLIENT_ID="your_actual_client_id"
   GOOGLE_CLIENT_SECRET="your_actual_client_secret"
   ```

5. In **`frontend/.env.local`** (create the file if it doesn’t exist):

   ```
   NEXT_PUBLIC_API_URL="http://localhost:3001/api"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_actual_google_client_id"
   ```

---

## Step 4: Install dependencies (one-time)

From the **project root** (the `inboxflow` folder):

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## Step 5: Apply database schema (one-time)

From the **project root**:

```bash
cp .env backend/.env
cd backend
npx prisma generate
npx prisma db push
cd ..
```

Or from root:

```bash
npm run backend:db
```

(If `backend/.env` doesn’t exist, copy from root: `cp .env backend/.env` before running.)

---

## Step 6: Start the backend

Open a terminal. From the **project root**:

```bash
cd backend
npm run dev
```

Leave this terminal open. You should see: **Server is running on port 3001**.

---

## Step 7: Start the frontend

Open a **second** terminal. From the **project root**:

```bash
cd frontend
npm run dev
```

Leave this terminal open. You should see something like: **Local: http://localhost:3000**.

---

## Step 8: Open the app

In your browser go to:

- **Frontend (app):** http://localhost:3000  
- **API health check:** http://localhost:3001/health  

Sign in with Google (after setting up `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

---

## Quick reference

| Step | Command | Where |
|------|---------|--------|
| 1 | Install & start Postgres + Redis (or Docker) | Any terminal |
| 2 | `createdb inboxflow` | Any terminal (skip if using Docker) |
| 3 | Edit `.env` and `frontend/.env.local` | In editor |
| 4 | `npm install` in `backend` and `frontend` | Project root |
| 5 | `npm run backend:db` or `npx prisma db push` in backend | Project root / backend |
| 6 | `cd backend && npm run dev` | Terminal 1 |
| 7 | `cd frontend && npm run dev` | Terminal 2 |
| 8 | Open http://localhost:3000 | Browser |

---

## If something goes wrong

- **“Database connection refused”** → PostgreSQL is not running. Run `brew services start postgresql@15` (or start Docker).
- **“Redis connection refused”** → Redis is not running. Run `brew services start redis` (or start Docker).
- **“Port 3000/3001 already in use”** → Another app is using the port. Stop it or change `PORT` in `.env` (e.g. `3002` for backend).
- **“User was denied access on database”** → `DATABASE_URL` user/password or database name doesn’t match your Postgres setup. Fix `.env` and try Step 5 again.
