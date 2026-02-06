# InboxFlow Deployment Guide

Step-by-step instructions to deploy the frontend on Vercel and the backend on Railway.

---

## Part 1: Deploy Backend on Railway (do this first)

You need the backend URL before configuring the frontend.

### Step 1.1: Sign up and create project

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project**.
3. Select **Deploy from GitHub repo**.
4. Choose your `inboxflow` repository (or connect it if needed).
5. When asked what to deploy, click **Add variables first** or **Configure** — we'll add the service next.

### Step 1.2: Add Redis

1. In your Railway project, click **+ New**.
2. Select **Database** → **Add Redis**.
3. Wait for Redis to provision. Railway will create a `REDIS_URL` variable.

### Step 1.3: Deploy the backend service

1. Click **+ New** → **GitHub Repo**.
2. Select the same `inboxflow` repo.
3. Railway creates a service. Click on it to open settings.
4. Go to **Settings** tab:
   - **Root Directory**: Set to `backend`
   - **Build Command**:  
     `npm install && npx prisma generate && npm run build`
   - **Start Command**:  
     `npx prisma migrate deploy && node dist/index.js`
   - **Watch Paths**: `backend/**` (optional, for faster rebuilds)

### Step 1.4: Add environment variables

1. Go to **Variables** tab in the backend service.
2. Click **+ New Variable** or **Add Variable**.
3. Add these (use **Raw Editor** to paste multiple at once):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string from Supabase Dashboard → Settings → Database |
| `REDIS_URL` | Click **Add Reference** → select your Redis service → choose `REDIS_URL` |
| `PORT` | `3001` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `JWT_SECRET` | A long random string (e.g. from `openssl rand -hex 32`) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Part 2 with your real Vercel URL) |
| `WORKER_CONCURRENCY` | `5` |
| `MIN_DELAY_BETWEEN_EMAILS` | `2` |

4. Click **Deploy** or wait for auto-deploy.

### Step 1.5: Get your backend URL

1. Go to **Settings** → **Networking** (or **Domains**).
2. Click **Generate Domain**.
3. Copy the URL, e.g. `https://inboxflow-backend-production-xxxx.up.railway.app`

**Save this URL** — you need it for the frontend and Google OAuth.

### Step 1.6: Update Google OAuth (required for login to work)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   - `https://YOUR-RAILWAY-URL/api/auth/google/callback`
   - Example: `https://inboxflow-backend-production-xxxx.up.railway.app/api/auth/google/callback`
4. Under **Authorized JavaScript origins**, add:
   - `https://YOUR-VERCEL-URL` (add after Part 2)
   - `https://YOUR-RAILWAY-URL`
5. Save.

---

## Part 2: Deploy Frontend on Vercel

### Step 2.1: Sign up and import project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project**.
3. Import your `inboxflow` repository.
4. If prompted, authorize Vercel to access your GitHub repos.

### Step 2.2: Configure the project

1. **Framework Preset**: Next.js (should auto-detect).
2. **Root Directory**: Click **Edit** and set to `frontend`.
3. **Build Command**: `npm run build` (default).
4. **Output Directory**: leave default (`.next`).
5. **Install Command**: `npm install` (default).

### Step 2.3: Add environment variables

Before deploying, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL/api` (from Step 1.5, no trailing slash) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

Example:  
`NEXT_PUBLIC_API_URL` = `https://inboxflow-backend-production-xxxx.up.railway.app/api`

### Step 2.4: Deploy

1. Click **Deploy**.
2. Wait for the build to finish.
3. Copy your Vercel URL, e.g. `https://inboxflow-xxxx.vercel.app`

### Step 2.5: Update backend CORS and Google OAuth

1. **Railway** → Backend service → **Variables**:
   - Set `FRONTEND_URL` to your Vercel URL: `https://inboxflow-xxxx.vercel.app`
2. **Google Cloud Console** → OAuth Client:
   - Add `https://inboxflow-xxxx.vercel.app` to **Authorized JavaScript origins**.
3. Redeploy the backend on Railway if needed (Variables usually trigger a redeploy).

---

## Part 3: Verify everything works

1. **Frontend**: Open your Vercel URL. You should see the login page.
2. **Google Login**: Click Sign in with Google. It should redirect and log you in.
3. **Dashboard**: After login, you should see the dashboard and be able to compose emails.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Ensure `FRONTEND_URL` in Railway exactly matches your Vercel URL (no trailing slash). |
| 401 on API calls | Check that `NEXT_PUBLIC_API_URL` ends with `/api`. |
| Google login fails | Add both Vercel and Railway URLs to Google OAuth (origins and redirect URI). |
| Redis connection failed | Ensure Redis service is running and `REDIS_URL` is set in Railway. |
| Prisma / DB errors | Run `npx prisma migrate deploy` locally against production DB, or ensure it runs in Start Command. |

---

## Summary of URLs to configure

- **Supabase**: Use the same `DATABASE_URL` as locally (or a new Supabase project).
- **Railway**: Backend URL → use in `NEXT_PUBLIC_API_URL` and `FRONTEND_URL`.
- **Vercel**: Frontend URL → use in `FRONTEND_URL` and Google OAuth.
- **Google OAuth**: Add both Vercel (origin) and Railway callback (redirect URI).
