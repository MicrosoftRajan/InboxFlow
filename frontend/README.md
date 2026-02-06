# InboxFlow - Email Scheduler Service

A production-grade email scheduler service that allows users to schedule email campaigns at scale with rate limiting and concurrency control.

##  Features

- **Google OAuth Integration**: Secure login using Google accounts.
- **Robust Scheduling**: Uses BullMQ and Redis for persistent, delayed job execution.
- **Rate Limiting**: Configurable hourly limits per user, ensuring compliance with email provider restrictions.
- **Throttling**: Configurable delay between individual emails in a campaign.
- **Persistence**: Survives server restarts; jobs are stored in PostgreSQL and Redis.
- **Dashboard**: A clean, modern UI to compose campaigns and track scheduled/sent emails.
- **CSV Support**: Upload a list of recipients via CSV or text files.

## 🛠 Tech Stack

### Backend
- **TypeScript** & **Express.js**
- **BullMQ** (Redis) for job queuing
- **Prisma** (PostgreSQL) for relational data
- **Nodemailer** with **Ethereal Email** for SMTP

### Frontend
- **Next.js** (App Router)
- **Tailwind CSS**
- **Lucide React** for iconography
- **React OAuth Google** for authentication

##  Configuration

### Backend Environment Variables (`backend/.env`)
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `JWT_SECRET`: Secret key for JWT signing.
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `PORT`: Backend server port (default: 3001).
- `FRONTEND_URL`: URL of the frontend application.
- `WORKER_CONCURRENCY`: Number of concurrent jobs a worker can process (default: 5).

### Frontend Environment Variables (`frontend/.env.local`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `NEXT_PUBLIC_API_URL`: Backend API URL.

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL and Redis)

### Setup
1. **Database & Redis**:
   ```bash
   docker-compose up -d
   ```

2. **Backend**:
   ```bash
   # From root
   npm install
   npx prisma migrate dev
   # Start backend (usually in another terminal)
   npm run dev
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📈 Rate Limiting & Concurrency

- **Worker Concurrency**: Set via `WORKER_CONCURRENCY` env var. Each worker handles multiple jobs in parallel safely.
- **Minimum Delay**: Users can specify a delay (in seconds) between each email during campaign composition.
- **Hourly Limit**: Enforced using Redis counters (`rate-limit:{userId}:{hourWindow}`). When a limit is reached, jobs are automatically rescheduled to the next available hour window.

## 🛡 Persistence & Idempotency

- All email requests are first persisted in PostgreSQL.
- BullMQ jobs use the database record ID as their unique `jobId` to prevent duplicate processing.
- If the server restarts, BullMQ resumes pending delayed jobs from Redis automatically.
