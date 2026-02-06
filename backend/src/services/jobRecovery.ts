import { prisma } from '../config/db';
import { emailQueue } from '../config/queue';

/**
 * On server startup, recover pending jobs from the database
 * and reschedule them in BullMQ to ensure persistence across restarts
 */
export class JobRecoveryService {
  static async recoverPendingJobs() {
    console.log('Recovering pending jobs from database...');

    try {
      // Find all scheduled email jobs that haven't been sent yet
      const pendingJobs = await prisma.emailJob.findMany({
        where: {
          status: { in: ['PENDING', 'SCHEDULED'] },
        },
        include: {
          email: true,
        },
      });

      console.log(`Found ${pendingJobs.length} pending jobs to recover`);

      let recoveredCount = 0;
      let skippedCount = 0;

      for (const job of pendingJobs) {
        // Skip if email campaign is cancelled/failed
        if (job.email.status === 'FAILED') {
          skippedCount++;
          continue;
        }

        // Check if job already exists in BullMQ
        let bullJob;
        if (job.bullJobId) {
          bullJob = await emailQueue.getJob(job.bullJobId);
        }

        // If job doesn't exist in BullMQ, reschedule it
        if (!bullJob) {
          // Calculate delay based on scheduled time
          const now = new Date();
          const scheduledTime = new Date(job.email.scheduledAt);
          
          // Find the index of this recipient in the recipients array
          const recipientIndex = job.email.recipients.indexOf(job.recipient);
          const specificScheduledAt = new Date(
            scheduledTime.getTime() + recipientIndex * job.email.delay * 1000
          );
          
          const delay = Math.max(0, specificScheduledAt.getTime() - now.getTime());

          // Only reschedule if the scheduled time hasn't passed too long ago (within 24 hours)
          // This prevents rescheduling very old jobs
          if (delay < 24 * 60 * 60 * 1000) {
            const bullJob = await emailQueue.add(
              'send-email',
              {
                jobId: job.id,
                emailId: job.email.id,
                recipient: job.recipient,
                subject: job.email.subject,
                body: job.email.body,
                userId: job.email.userId,
                senderEmail: job.email.senderEmail,
                hourlyLimit: job.email.hourlyLimit,
              },
              {
                delay: delay,
                jobId: job.id, // Use DB job ID for idempotency
              }
            );

            // Update the bullJobId in database
            await prisma.emailJob.update({
              where: { id: job.id },
              data: { bullJobId: bullJob.id },
            });

            recoveredCount++;
          } else {
            // Mark very old jobs as failed
            await prisma.emailJob.update({
              where: { id: job.id },
              data: {
                status: 'FAILED',
                error: 'Job expired - scheduled time too far in the past',
              },
            });
            skippedCount++;
          }
        } else {
          // Job already exists in BullMQ, just verify it's still valid
          recoveredCount++;
        }
      }

      console.log(`Job recovery complete: ${recoveredCount} recovered, ${skippedCount} skipped`);
    } catch (error) {
      console.error('Error during job recovery:', error);
      throw error;
    }
  }
}
