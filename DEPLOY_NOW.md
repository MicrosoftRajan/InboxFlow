# Deploy InboxFlow Now (Render)

## Before you start – have these ready

- [ ] **Supabase** – Database URL (Settings → Database → Connection string URI)
- [ ] **Google Cloud** – OAuth Client ID and Client Secret (APIs & Services → Credentials)

---

## Step 1: Push your code

```bash
cd /Users/rajanvimla/Desktop/inboxflow
git add .
git status
git commit -m "Ready for deploy"   # if there are changes
git push origin main
```

---

## Step 2: Create the Blueprint on Render

1. Open **https://dashboard.render.com**
2. Sign in (GitHub recommended)
3. Click **New +** → **Blueprint**
4. Connect repository: **MicrosoftRajan/InboxFlow** (or your fork)
5. **Branch:** `main`
6. **Blueprint Path:** `render.yaml`
7. Click **Apply**

---

## Step 3: Enter environment variables when prompted

Render will ask for these. Use the values below.

### Backend (inboxflow-backend)

| Variable | What to enter |
|----------|----------------|
| DATABASE_URL | Your Supabase connection string (starts with `postgresql://`) |
| GOOGLE_CLIENT_ID | From Google Cloud Console |
| GOOGLE_CLIENT_SECRET | From Google Cloud Console |
| JWT_SECRET | Run `openssl rand -hex 32` in terminal, or use a long random string |
| FRONTEND_URL | Use `https://inboxflow-frontend.onrender.com` for now (you’ll get the real URL after deploy) |

### Frontend (inboxflow-frontend)

| Variable | What to enter |
|----------|----------------|
| NEXT_PUBLIC_API_URL | Use `https://inboxflow-backend.onrender.com/api` for now |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Same as GOOGLE_CLIENT_ID above |

*(Replace `inboxflow-backend` / `inboxflow-frontend` with the actual URLs Render shows after deploy if they’re different.)*

---

## Step 4: Wait for deploy

- Redis → Backend → Frontend will build and deploy (about 5–10 minutes).
- Open each service and copy its **live URL** once it’s green.

---

## Step 5: Fix URLs (one-time)

1. **Backend** → Environment → set **FRONTEND_URL** = your frontend’s real URL (e.g. `https://inboxflow-frontend-xxxx.onrender.com`)
2. **Frontend** → Environment → set **NEXT_PUBLIC_API_URL** = `https://YOUR-BACKEND-URL/api`
3. Save → both services will redeploy.

---

## Step 6: Google OAuth

1. Go to **https://console.cloud.google.com** → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. **Authorized JavaScript origins:** add  
   `https://YOUR-FRONTEND-URL.onrender.com`
4. **Authorized redirect URIs:** add  
   `https://YOUR-BACKEND-URL.onrender.com/api/auth/google/callback`
5. Save

---

## Step 7: Test

1. Open your frontend URL
2. Click “Sign in with Google”
3. You should land on the dashboard and be able to compose emails

Done.
