import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis';
import { getTransporter } from '../config/mail';
import { prisma } from '../config/db';
import { emailQueue } from '../config/queue';
import nodemailer from 'nodemailer';

export interface EmailJobData {
  jobId: string;
  emailId: string;
  recipient: string;
  subject: string;
  body: string;
  userId: string;
  senderEmail: string;
  hourlyLimit: number;
}

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
const MIN_DELAY_BETWEEN_EMAILS = parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS || '2', 10) * 1000; // Convert to milliseconds

const worker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { jobId, emailId, recipient, subject, body, userId, senderEmail, hourlyLimit } = job.data;

    console.log(`Processing job ${job.id} for recipient ${recipient}`);

    // 1. Verify job is still valid (not cancelled) - check early
    const currentJob = await prisma.emailJob.findUnique({
      where: { id: jobId },
      include: { email: true }
    });

    if (!currentJob || currentJob.status === 'FAILED' || currentJob.email.status === 'FAILED') {
      console.log(`Job ${jobId} is cancelled or invalid. Skipping.`);
      return;
    }

    // 2. Check Rate Limit BEFORE processing (per sender)
    const now = new Date();
    const currentHourWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
    const rateLimitKey = `rate-limit:${senderEmail}:${currentHourWindow}`;

    // Use Redis transaction to check and increment atomically
    const count = await redisConnection.incr(rateLimitKey);
    if (count === 1) {
      await redisConnection.expire(rateLimitKey, 3600);
    }

    if (count > hourlyLimit) {
      console.log(`Rate limit exceeded for sender ${senderEmail} (${count}/${hourlyLimit}). Rescheduling job.`);
      
      // Calculate delay to the start of the next hour
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 5);
      const delay = nextHour.getTime() - now.getTime();
      
      // Decrement the counter since we're not processing this job
      await redisConnection.decr(rateLimitKey);
      
      // Reschedule with a unique jobId that maintains idempotency
      const retryJobId = `${jobId}-retry-${Math.floor(nextHour.getTime() / 1000)}`;
      
      // Check if this retry job already exists
      const existingRetryJob = await emailQueue.getJob(retryJobId);
      if (!existingRetryJob) {
        const newBullJob = await emailQueue.add(job.name, job.data, {
          delay: delay,
          jobId: retryJobId
        });
        // Update the database job's bullJobId to track the rescheduled job
        await prisma.emailJob.update({
          where: { id: jobId },
          data: { bullJobId: newBullJob.id },
        });
      }
      
      return; 
    }

    // 3. Enforce minimum delay between emails (per sender) using Redis
    const lastSendKey = `last-send:${senderEmail}`;
    const lastSendTimeStr = await redisConnection.get(lastSendKey);
    const lastSendTime = lastSendTimeStr ? parseInt(lastSendTimeStr, 10) : 0;
    const timeSinceLastSend = Date.now() - lastSendTime;
    
    if (timeSinceLastSend < MIN_DELAY_BETWEEN_EMAILS) {
      const delayNeeded = MIN_DELAY_BETWEEN_EMAILS - timeSinceLastSend;
      console.log(`Minimum delay not met for sender ${senderEmail}. Delaying by ${delayNeeded}ms`);
      
      // Decrement the counter since we're not processing this job now
      await redisConnection.decr(rateLimitKey);
      
      // Reschedule with delay
      const delayedJobId = `${jobId}-delay-${Date.now()}`;
      const existingDelayedJob = await emailQueue.getJob(delayedJobId);
      if (!existingDelayedJob) {
        const newBullJob = await emailQueue.add(job.name, job.data, {
          delay: delayNeeded,
          jobId: delayedJobId
        });
        // Update the database job's bullJobId to track the rescheduled job
        await prisma.emailJob.update({
          where: { id: jobId },
          data: { bullJobId: newBullJob.id },
        });
      }
      
      return;
    }

    // 4. Update last send time for this sender in Redis
    await redisConnection.set(lastSendKey, Date.now().toString(), 'EX', 3600); // Expire after 1 hour

    // 5. Send Email
    try {
      const transporter = await getTransporter(senderEmail);
      
      // Support basic placeholders
      const personalizedBody = body.replace(/{{email}}/g, recipient);
      
      const info = await transporter.sendMail({
        from: `"InboxFlow" <${senderEmail}>`,
        to: recipient,
        subject: subject,
        text: personalizedBody,
        html: personalizedBody.replace(/\n/g, '<br>'),
      });

      console.log(`Email sent to ${recipient} from ${senderEmail}: ${nodemailer.getTestMessageUrl(info)}`);

      // 6. Update Database
      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Check if all jobs for this email are done
      const pendingJobs = await prisma.emailJob.count({
        where: { emailId, status: { in: ['PENDING', 'SCHEDULED'] } },
      });

      if (pendingJobs === 0) {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'COMPLETED',
            sentAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);
      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
        },
      });
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: CONCURRENCY,
  }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`);
  if (err.message === 'RATE_LIMIT_EXCEEDED') {
    // If it's rate limit, we might want to handle it differently 
    // but BullMQ will retry based on backoff strategy.
  }
});

export default worker;
