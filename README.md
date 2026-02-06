# InboxFlow - Email Scheduler Service

A production-grade email scheduler service built with TypeScript, Express.js, BullMQ, Redis, and PostgreSQL. This system allows users to schedule and send emails at scale with rate limiting, concurrency control, and persistence across server restarts.

## 🏗️ Architecture Overview

### Core Components

1. **Backend API (Express.js + TypeScript)**
   - RESTful API for scheduling emails
   - Google OAuth authentication
   - Job scheduling and management

2. **Job Queue (BullMQ + Redis)**
   - Persistent job queue using Redis
   - Delayed job execution (no cron jobs)
   - Automatic job recovery on server restart

3. **Database (PostgreSQL + Prisma)**
   - Stores email campaigns and individual jobs
   - Tracks job status and execution history
   - Ensures data persistence

4. **Email Worker**
   - Processes email jobs with configurable concurrency
   - Enforces rate limiting per sender
   - Implements minimum delay between emails

5. **Frontend (Next.js + React + TypeScript)**
   - Google OAuth login
   - Dashboard for viewing scheduled/sent emails
   - Compose modal for creating campaigns

## 📋 Features

### Backend Features

- ✅ **Persistent Scheduling**: Uses BullMQ delayed jobs (no cron)
- ✅ **Job Recovery**: Automatically recovers pending jobs on server restart
- ✅ **Rate Limiting**: Per-sender hourly email limits (configurable)
- ✅ **Minimum Delay**: Configurable delay between individual email sends
- ✅ **Worker Concurrency**: Configurable concurrent job processing
- ✅ **Multiple Senders**: Support for different sender emails per campaign
- ✅ **Idempotency**: Prevents duplicate job execution
- ✅ **Ethereal Email**: Fake SMTP for testing

### Frontend Features

- ✅ **Google OAuth Login**: Real Google authentication
- ✅ **Dashboard**: View scheduled and sent emails
- ✅ **Compose Campaign**: Create email campaigns with CSV upload
- ✅ **Individual Job Tracking**: View individual sent email jobs
- ✅ **Loading States**: Proper loading indicators
- ✅ **Empty States**: User-friendly empty states

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- **PostgreSQL** and **Redis** — either via Docker (see below) or installed locally (e.g. Homebrew on macOS)
- Google OAuth credentials (for authentication)

### Option A: Run with Docker (recommended)

If you have [Docker](https://docs.docker.com/get-docker/) installed:

```bash
docker compose up -d
```

Then continue with **Step 2** below.

### Option B: Run without Docker (macOS with Homebrew)

If you don't have Docker, install and run PostgreSQL and Redis locally:

```bash
# Install PostgreSQL and Redis
brew install postgresql@15 redis

# Start PostgreSQL (run in background)
brew services start postgresql@15

# Start Redis (run in background)
brew services start redis
```

Create the database and user (match your `.env`):

```bash
# Create user and database (default postgres user)
createdb inboxflow
# If your .env has user:password, create that user in PostgreSQL first, or use:
# DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/inboxflow?schema=public"
```

Update your **`.env`** if needed. For a default Homebrew PostgreSQL install (no password):

```env
DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/inboxflow?schema=public"
REDIS_URL="redis://localhost:6379"
```

Replace `YOUR_MAC_USERNAME` with your Mac username (e.g. `rajanvimla`). Then continue with **Step 2** below.

### Quick Run (from project root)

**Step 2 — Push database schema** (run once; ensure `.env` is in project root or copy to `backend/.env`):

```bash
npm run backend:db
```

**Step 3 — Start backend** (one terminal):

```bash
npm run dev:backend
```

**Step 4 — Start frontend** (another terminal):

```bash
npm run dev:frontend
```

Then open **http://localhost:3000** (frontend) and **http://localhost:3001** (API).

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

#### Backend (.env in root or backend directory)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inboxflow?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Authentication
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
JWT_SECRET="your_jwt_secret_key"

# Worker Configuration
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS=2  # Minimum delay in seconds between emails
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id"
```

### 3. Start Infrastructure (Docker)

```bash
# Start PostgreSQL and Redis
docker-compose up -d
```

### 4. Set Up Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

The backend will:
- Start the Express server on port 3001
- Start the BullMQ worker
- Recover any pending jobs from the database

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📖 How It Works

### Scheduling Flow

1. **User creates campaign** via frontend with:
   - Subject, body, recipients (CSV upload)
   - Sender email
   - Start time
   - Delay between emails
   - Hourly limit

2. **Backend creates records**:
   - Email campaign record in PostgreSQL
   - Individual EmailJob records for each recipient
   - BullMQ delayed jobs scheduled for each recipient

3. **Worker processes jobs**:
   - Checks rate limit BEFORE processing (per sender)
   - Enforces minimum delay between emails
   - Sends email via Ethereal SMTP
   - Updates job status in database

### Rate Limiting Implementation

Rate limiting is enforced **per sender email** using Redis counters:

- **Key Format**: `rate-limit:{senderEmail}:{hourWindow}`
- **Check Timing**: BEFORE job execution (prevents wasted processing)
- **When Limit Exceeded**: Job is rescheduled to next hour window
- **Redis Atomicity**: Uses `INCR` and `DECR` for thread-safe counting

### Minimum Delay Implementation

Minimum delay between emails is enforced at the worker level:

- **Per Sender**: Tracks last send time per sender email
- **Configurable**: Set via `MIN_DELAY_BETWEEN_EMAILS` env var (default: 2 seconds)
- **Enforcement**: If delay not met, job is rescheduled with appropriate delay

### Persistence on Restart

1. **On Server Start**: `JobRecoveryService` runs automatically
2. **Finds Pending Jobs**: Queries database for jobs with status `PENDING` or `SCHEDULED`
3. **Reschedules in BullMQ**: Creates BullMQ jobs for any missing jobs
4. **Maintains Timing**: Calculates correct delay based on original scheduled time

### Idempotency

- **Job IDs**: Each BullMQ job uses the database `EmailJob.id` as its jobId
- **Prevents Duplicates**: BullMQ ensures only one job with a given ID exists
- **Retry Jobs**: When rescheduling due to rate limits, uses unique retry jobIds

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WORKER_CONCURRENCY` | Number of concurrent jobs per worker | `5` |
| `MIN_DELAY_BETWEEN_EMAILS` | Minimum seconds between emails | `2` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |

### Rate Limiting

Rate limits are configured **per campaign** via the `hourlyLimit` parameter. The system supports:

- **Global limits**: Set a default hourly limit
- **Per-sender limits**: Each sender email has its own hourly counter
- **Per-campaign limits**: Each campaign can specify its own hourly limit

## 📊 Database Schema

### Email (Campaign)
- `id`: UUID
- `subject`: Email subject
- `body`: Email body (supports `{{email}}` placeholder)
- `senderEmail`: Sender email address
- `recipients`: Array of recipient emails
- `scheduledAt`: When the campaign should start
- `delay`: Delay in seconds between emails
- `hourlyLimit`: Maximum emails per hour for this campaign
- `status`: SCHEDULED | SENDING | COMPLETED | FAILED

### EmailJob (Individual Email)
- `id`: UUID (used as BullMQ jobId)
- `emailId`: Reference to Email campaign
- `recipient`: Individual recipient email
- `status`: PENDING | SCHEDULED | SENT | FAILED
- `bullJobId`: BullMQ job ID
- `sentAt`: When email was sent
- `error`: Error message if failed

## 🧪 Testing

### Testing Email Sending

The system uses **Ethereal Email** (fake SMTP) for testing:

1. Emails are sent to Ethereal test accounts
2. View sent emails at: `https://ethereal.email`
3. Or use `nodemailer.getTestMessageUrl(info)` in logs

### Testing Rate Limiting

1. Create a campaign with `hourlyLimit: 5`
2. Schedule 10 emails for the same time
3. First 5 will send immediately
4. Remaining 5 will be rescheduled to next hour

### Testing Persistence

1. Schedule some emails
2. Stop the server (`Ctrl+C`)
3. Restart the server
4. Pending emails will be automatically recovered and rescheduled

## 📝 API Endpoints

### Authentication
- `POST /api/auth/google` - Authenticate with Google token

### Email Management
- `POST /api/emails/schedule` - Schedule a new email campaign
- `GET /api/emails` - Get all emails for user
- `GET /api/emails/scheduled` - Get scheduled emails
- `GET /api/emails/sent?type=jobs` - Get sent email jobs
- `DELETE /api/emails/:id` - Cancel a campaign

## 🐛 Troubleshooting

### Jobs Not Sending

1. Check Redis is running: `docker ps`
2. Check worker logs for errors
3. Verify database connection
4. Check rate limits aren't blocking jobs

### Rate Limit Issues

- Check Redis counters: `redis-cli KEYS "rate-limit:*"`
- Verify hourly limit configuration
- Check sender email is correct

### Database Issues

- Run migrations: `npm run prisma:migrate`
- Check connection string in `.env`
- Verify PostgreSQL is running: `docker ps`

## 🚢 Production Considerations

1. **Use Real SMTP**: Replace Ethereal with production SMTP (SendGrid, AWS SES, etc.)
2. **Multiple Workers**: Run multiple worker instances for scalability
3. **Monitoring**: Add monitoring (e.g., BullMQ dashboard, Prometheus)
4. **Error Handling**: Enhance error handling and retry logic
5. **Security**: Use environment variables for secrets, enable HTTPS
6. **Database Indexing**: Add indexes on frequently queried fields
7. **Redis Persistence**: Configure Redis persistence for production

## 📄 License

This project is part of a hiring assignment for ReachInbox.

## 👤 Author

Built as part of the ReachInbox Software Development Intern Assignment.
