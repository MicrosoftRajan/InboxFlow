# Using Supabase as the Database

InboxFlow works with **Supabase** (PostgreSQL). You still need **Redis** for the job queue (locally or a hosted Redis).

---

## 1. Get your Supabase connection string

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Open **Settings** (gear) → **Database**.
3. Under **Connection string**, choose **URI**.
4. Copy the connection string. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   Or for direct connection (port **5432**):
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password (the one you set when creating the project).
   - If your password contains `@` or `#`, URL-encode it: `@` → `%40`, `#` → `%23`.
   - Example: password `mypass@123` → use `mypass%40123` in the URL.

---

## 2. Set DATABASE_URL in `.env`

In **`backend/.env`** (and optionally project root **`.env`**), set:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public"
```

- Use your real password and project ref from the Supabase dashboard.
- Keep `?schema=public` so Prisma uses the `public` schema.

**Example:**

```env
DATABASE_URL="postgresql://postgres:MySecretPass123@db.abcdefghijk.supabase.co:5432/postgres?schema=public"
```

---

## 3. Redis (still required)

Supabase does not provide Redis. You need Redis for BullMQ:

- **Local:** `brew install redis && brew services start redis` (Mac)  
  Then: `REDIS_URL="redis://localhost:6379"`
- **Hosted (e.g. Upstash):** Create a Redis instance and set `REDIS_URL` to the given URL.

In **`backend/.env`**:

```env
REDIS_URL="redis://localhost:6379"
```

---

## 4. Push schema to Supabase (one-time)

From the project root:

```bash
cp .env backend/.env   # if you keep DATABASE_URL in root .env
cd backend
npx prisma generate
npx prisma db push
```

Or from root:

```bash
npm run backend:db
```

This creates the `User`, `Email`, and `EmailJob` tables (and enums) in your Supabase project.

---

## 5. Run the app

1. **Backend:** `cd backend && npm run dev`
2. **Frontend:** `cd frontend && npm run dev`
3. Open **http://localhost:3000** (or the port Next.js shows).

---

## 6. Optional: View data in Supabase

In the Supabase dashboard: **Table Editor**. You should see `User`, `Email`, `EmailJob` after running the app and signing in / creating campaigns.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Connection refused / timeout** | Check Supabase project is not paused. Use the correct host (e.g. `db.xxx.supabase.co`) and port (5432 or 6543 for pooler). |
| **Authentication failed** | Verify the password in `DATABASE_URL`. If it contains `@` or `#`, use `%40` or `%23`. |
| **SSL required** | Supabase often expects SSL. Add `?schema=public&sslmode=require` to the URL, or in Prisma add `?sslmode=require` to `DATABASE_URL`. |
| **Prisma “schema not found”** | Ensure the URL includes `?schema=public`. |

If Supabase requires SSL, your **`backend/.env`** can look like:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public&sslmode=require"
```

Prisma uses this URL as-is, so the `sslmode=require` is applied to the connection.
