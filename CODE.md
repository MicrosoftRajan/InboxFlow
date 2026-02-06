# Step-by-Step: Code Guide (InboxFlow)

How the code is structured and where to change things when you code.

---

## 1. Project layout

```
inboxflow/
├── backend/          # Express API + BullMQ worker
│   ├── prisma/       # Database schema
│   └── src/
│       ├── config/   # DB, Redis, queue, mail
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── workers/
├── frontend/         # Next.js app
│   └── src/
│       ├── app/      # Pages (login, dashboard)
│       ├── components/
│       ├── hooks/
│       └── lib/
└── .env              # Backend env (DB, Redis, Google, etc.)
```

---

## 2. Backend: request flow (step by step)

When the frontend calls an API, this is the path the code takes:

| Step | File | What it does |
|------|------|--------------|
| 1 | `backend/src/index.ts` | Starts Express, loads env, mounts `/api`, starts worker after listen |
| 2 | `backend/src/routes/api.ts` | Defines routes (e.g. `POST /api/auth/google`, `POST /api/emails/schedule`) |
| 3 | `backend/src/utils/auth.ts` | `authMiddleware` runs on protected routes, checks JWT |
| 4 | `backend/src/controllers/emailController.ts` | Handles request body, validation (Zod), calls service |
| 5 | `backend/src/services/emailScheduler.ts` | Business logic: create Email + EmailJobs in DB, add jobs to BullMQ |
| 6 | `backend/src/config/queue.ts` | BullMQ queue instance |
| 7 | `backend/src/workers/emailWorker.ts` | Picks up jobs, rate limit check, sends email, updates DB |

**Where to change:**

- Add a new API route → `routes/api.ts` + controller method in `emailController.ts`.
- Change scheduling/DB logic → `services/emailScheduler.ts`.
- Change rate limit / delay / sending → `workers/emailWorker.ts`.
- Change DB shape → `backend/prisma/schema.prisma`, then `npx prisma db push` or migrate.

---

## 3. Backend: main files (step by step)

### 3.1 Entry and config

- **`backend/src/index.ts`**  
  Loads env, creates Express app, runs job recovery (non-blocking), starts server, then loads the worker.

- **`backend/src/config/db.ts`**  
  Prisma client (singleton).

- **`backend/src/config/redis.ts`**  
  Redis connection for BullMQ.

- **`backend/src/config/queue.ts`**  
  BullMQ queue (`email-queue`).

- **`backend/src/config/mail.ts`**  
  Nodemailer transporter (Ethereal for dev).

### 3.2 Auth

- **`backend/src/routes/api.ts`**  
  `POST /api/auth/google` → `AuthService.verifyGoogleToken`, returns user + JWT.

- **`backend/src/services/auth.ts`**  
  Verifies Google ID token, creates/updates user in DB, returns JWT.

- **`backend/src/utils/auth.ts`**  
  `authMiddleware`: reads `Authorization: Bearer <token>`, verifies JWT, sets `req.user`.

### 3.3 Emails (API)

- **`backend/src/controllers/emailController.ts`**  
  - `schedule`: validate body (Zod), call `EmailSchedulerService.scheduleEmail`.  
  - `getEmails`, `getScheduled`, `getSent`: call scheduler service, return JSON.  
  - `cancel`: call `EmailSchedulerService.cancelEmail`.

- **`backend/src/services/emailScheduler.ts`**  
  - `scheduleEmail`: create `Email` + one `EmailJob` per recipient, add delayed jobs to BullMQ.  
  - `getScheduledEmails`, `getSentEmails`, `getSentEmailJobs`, `getAllEmails`, `cancelEmail`.

### 3.4 Emails (worker)

- **`backend/src/workers/emailWorker.ts`**  
  - Process job: check not cancelled, check per-sender rate limit (Redis), check min delay (Redis), send via Nodemailer, update `EmailJob` and `Email` status.

### 3.5 Startup

- **`backend/src/services/jobRecovery.ts`**  
  On startup: load pending jobs from DB, re-add them to BullMQ with correct delay (so restarts don’t lose jobs).

### 3.6 Database

- **`backend/prisma/schema.prisma`**  
  Models: `User`, `Email`, `EmailJob`; enums `EmailStatus`, `JobStatus`.  
  After editing: `npx prisma generate` and `npx prisma db push` (or migrate).

---

## 4. Frontend: page flow (step by step)

| Step | File | What it does |
|------|------|--------------|
| 1 | `frontend/src/app/layout.tsx` | Root layout, fonts, wraps app in `AppProviders` |
| 2 | `frontend/src/AppProviders.tsx` | Google OAuth provider + Toaster |
| 3 | `frontend/src/app/page.tsx` | Login page: Google button, on success call `/api/auth/google`, then redirect to `/dashboard` |
| 4 | `frontend/src/hooks/useAuth.ts` | Reads user/token from localStorage, `login()` / `logout()`, redirects |
| 5 | `frontend/src/app/dashboard/page.tsx` | Dashboard: tabs (Scheduled / Sent), table, “Compose” button, fetch from `/api/emails/scheduled` and `/api/emails/sent?type=jobs` |
| 6 | `frontend/src/components/emails/ComposeModal.tsx` | Form: subject, body, sender, file upload (CSV emails), start time, delay, hourly limit; submit → `POST /api/emails/schedule` |
| 7 | `frontend/src/lib/api.ts` | Axios instance: `baseURL` from env, adds `Authorization: Bearer <token>` from localStorage |

**Where to change:**

- Login / auth UI → `app/page.tsx`, `AppProviders.tsx`, `useAuth.ts`.
- Dashboard layout, tabs, table → `app/dashboard/page.tsx`.
- Compose form, validation, API payload → `components/emails/ComposeModal.tsx`.
- API base URL / auth header → `lib/api.ts`.
- New pages → new files under `app/` (Next.js App Router).

---

## 5. Frontend: main files (step by step)

### 5.1 App shell and auth

- **`frontend/src/app/layout.tsx`**  
  Root HTML, body, `AppProviders`, global styles.

- **`frontend/src/AppProviders.tsx`**  
  `GoogleOAuthProvider` with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `Toaster`.

- **`frontend/src/app/page.tsx`**  
  Login page; `GoogleLogin` → get credential → `POST /api/auth/google` → `login(user, token)` → redirect to `/dashboard`.

- **`frontend/src/hooks/useAuth.ts`**  
  `user`, `loading`, `login`, `logout`; reads/writes `localStorage` for user and token; redirects on logout.

### 5.2 Dashboard and emails

- **`frontend/src/app/dashboard/page.tsx`**  
  Header (user, logout), “Compose New Email”, tabs (Scheduled / Sent), table (subject, recipients/job info, time, status), cancel button; uses `api.get('/emails/scheduled')` and `api.get('/emails/sent?type=jobs')`.

- **`frontend/src/components/emails/ComposeModal.tsx`**  
  Modal: subject, body, sender email (default from user), file upload (parse emails from CSV/text), start time, delay, hourly limit; submit → `api.post('/emails/schedule', { ... })`.

### 5.3 API client

- **`frontend/src/lib/api.ts`**  
  Axios with `baseURL: process.env.NEXT_PUBLIC_API_URL`, request interceptor adding `Authorization: Bearer ${localStorage.getItem('token')}`.

---

## 6. Common coding tasks (step by step)

### Add a new API endpoint

1. In **`backend/src/controllers/emailController.ts`**: add a method (e.g. `getStats`).
2. In **`backend/src/routes/api.ts`**: add route (e.g. `router.get('/emails/stats', authMiddleware, EmailController.getStats)`.
3. In **`backend/src/services/emailScheduler.ts`**: add any new DB/logic the controller needs.

### Add a new field to an email (e.g. “replyTo”)

1. In **`backend/prisma/schema.prisma`**: add `replyTo String?` to `Email` (or as needed).
2. Run: `cd backend && npx prisma generate && npx prisma db push`.
3. In **`backend/src/services/emailScheduler.ts`**: include `replyTo` in `create` and in job data if the worker needs it.
4. In **`backend/src/controllers/emailController.ts`**: add to Zod schema and pass to service.
5. In **`frontend/src/components/emails/ComposeModal.tsx`**: add input and include in `api.post` body.

### Change rate limit or delay

- **Per campaign (hourly limit):** user sets it in Compose modal; stored on `Email` and passed to worker. No code change for “where it’s stored”; change UI in `ComposeModal.tsx` if you want different defaults/validation.
- **Global min delay between emails:** **`backend/.env`** (or root `.env`): `MIN_DELAY_BETWEEN_EMAILS=2` (seconds). Worker reads it in **`backend/src/workers/emailWorker.ts`**.
- **Worker concurrency:** **`backend/.env`**: `WORKER_CONCURRENCY=5`. Same file: `CONCURRENCY` is read from env.

### Add a new page (e.g. “Settings”)

1. Create **`frontend/src/app/settings/page.tsx`** (or under `app/dashboard/settings/page.tsx` if it should be under dashboard).
2. Add a link in the header or sidebar in **`frontend/src/app/dashboard/page.tsx`** (or layout).
3. Use `useAuth()` and `api` as in the dashboard; protect the page by redirecting if `!user`.

### Change how “Sent” emails are shown

- Backend: **`backend/src/services/emailScheduler.ts`** → `getSentEmailJobs` (and controller **`getSent`** with `type=jobs`).
- Frontend: **`frontend/src/app/dashboard/page.tsx`** → the table that maps over `emails` when `activeTab === 'sent'` (columns: recipient, subject, sent time, status).

---

## 7. Data flow summary

```
User clicks "Sign in with Google"
  → Frontend: Google OAuth → credential
  → POST /api/auth/google { token }
  → Backend: verify token, create/update User, return JWT + user
  → Frontend: store user + token, redirect to /dashboard

User clicks "Compose" and submits
  → Frontend: ComposeModal → POST /api/emails/schedule { subject, body, recipients, senderEmail, scheduledAt, delay, hourlyLimit }
  → Backend: create Email + EmailJobs in DB, add delayed jobs to BullMQ
  → Response: { email, jobsCount }

Worker (runs when job delay elapses)
  → Pick job from BullMQ
  → Check rate limit (Redis), min delay (Redis), send email (Ethereal), update EmailJob + Email in DB
```

---

## 8. Quick file reference

| What you want to do | Main file(s) to edit |
|---------------------|----------------------|
| New API route | `backend/src/routes/api.ts`, `emailController.ts`, optionally a service |
| Change DB schema | `backend/prisma/schema.prisma`, then Prisma generate + push |
| Change scheduling / cancel logic | `backend/src/services/emailScheduler.ts` |
| Change sending / rate limit / delay | `backend/src/workers/emailWorker.ts` |
| Login page / Google button | `frontend/src/app/page.tsx`, `AppProviders.tsx` |
| Dashboard / tabs / table | `frontend/src/app/dashboard/page.tsx` |
| Compose form / schedule payload | `frontend/src/components/emails/ComposeModal.tsx` |
| API URL / auth header | `frontend/src/lib/api.ts`, `frontend/.env.local` |
| Auth state / redirect | `frontend/src/hooks/useAuth.ts` |

Use this as your step-by-step map when coding.
