import { prisma } from '../config/db';
import { emailQueue } from '../config/queue';

export class EmailSchedulerService {
  static async scheduleEmail(data: {
    userId: string;
    subject: string;
    body: string;
    recipients: string[];
    senderEmail: string;
    scheduledAt: Date;
    delay: number; // delay in seconds between emails
    hourlyLimit: number;
  }) {
    const { userId, subject, body, recipients, senderEmail, scheduledAt, delay, hourlyLimit } = data;

    // 1. Create Email Record
    const email = await prisma.email.create({
      data: {
        userId,
        subject,
        body,
        recipients,
        senderEmail,
        scheduledAt,
        delay,
        hourlyLimit,
        status: 'SCHEDULED',
      },
    });

    // 2. Create individual EmailJob records and schedule them in BullMQ
    const jobs = await Promise.all(
      recipients.map(async (recipient, index) => {
        // Calculate the specific scheduled time for this recipient based on index and delay
        // scheduledAt is the start time.
        const specificScheduledAt = new Date(scheduledAt.getTime() + index * delay * 1000);
        const now = new Date();
        const bullDelay = Math.max(0, specificScheduledAt.getTime() - now.getTime());

        const emailJob = await prisma.emailJob.create({
          data: {
            emailId: email.id,
            recipient,
            status: 'SCHEDULED',
          },
        });

        const bullJob = await emailQueue.add(
          'send-email',
          {
            jobId: emailJob.id,
            emailId: email.id,
            recipient,
            subject,
            body,
            userId,
            senderEmail,
            hourlyLimit,
          },
          {
            delay: bullDelay,
            jobId: emailJob.id, // Use our DB job ID as BullMQ job ID for idempotency
          }
        );

        await prisma.emailJob.update({
          where: { id: emailJob.id },
          data: { bullJobId: bullJob.id },
        });

        return emailJob;
      })
    );

    return { email, jobsCount: jobs.length };
  }

  static async getScheduledEmails(userId: string) {
    return prisma.email.findMany({
      where: { userId, status: 'SCHEDULED' },
      orderBy: { scheduledAt: 'asc' },
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });
  }

  static async getSentEmails(userId: string) {
    return prisma.email.findMany({
      where: { 
        userId, 
        status: { in: ['COMPLETED', 'SENDING', 'FAILED'] } 
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { jobs: { where: { status: 'SENT' } } }
        }
      }
    });
  }

  static async getSentEmailJobs(userId: string) {
    return prisma.emailJob.findMany({
      where: {
        email: { userId },
        status: { in: ['SENT', 'FAILED'] }
      },
      include: {
        email: {
          select: {
            id: true,
            subject: true,
            senderEmail: true,
          }
        }
      },
      orderBy: { sentAt: 'desc' },
    });
  }
  
  static async getAllEmails(userId: string) {
    return prisma.email.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { jobs: true }
            }
        }
    })
  }

  static async cancelEmail(userId: string, emailId: string) {
    const email = await prisma.email.findUnique({
      where: { id: emailId, userId },
      include: { jobs: true },
    });

    if (!email) {
      throw new Error('Email campaign not found');
    }

    if (email.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed campaign');
    }

    // 1. Remove pending/scheduled jobs from BullMQ
    for (const job of email.jobs) {
      if (job.status === 'SCHEDULED' || job.status === 'PENDING') {
        const bullJob = await emailQueue.getJob(job.id);
        if (bullJob) {
          await bullJob.remove();
        }
      }
    }

    // 2. Update status in DB
    await prisma.emailJob.updateMany({
      where: { 
        emailId, 
        status: { in: ['SCHEDULED', 'PENDING'] } 
      },
      data: { status: 'FAILED', error: 'Cancelled by user' },
    });

    return prisma.email.update({
      where: { id: emailId },
      data: { status: 'FAILED' },
    });
  }
}
