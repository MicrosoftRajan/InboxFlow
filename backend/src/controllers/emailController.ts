import { Response } from 'express';
import { AuthRequest } from '../utils/auth';
import { EmailSchedulerService } from '../services/emailScheduler';
import { z } from 'zod';

const scheduleSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1),
  senderEmail: z.string().email(),
  scheduledAt: z.string().datetime(),
  delay: z.number().min(0).default(0),
  hourlyLimit: z.number().min(1).default(200),
});

export class EmailController {
  static async schedule(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const data = scheduleSchema.parse(req.body);
      const result = await EmailSchedulerService.scheduleEmail({
        userId: req.user.id,
        ...data,
        scheduledAt: new Date(data.scheduledAt),
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Schedule error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getEmails(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const emails = await EmailSchedulerService.getAllEmails(req.user.id);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getScheduled(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const emails = await EmailSchedulerService.getScheduledEmails(req.user.id);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getSent(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { type } = req.query;
      
      // If type=jobs, return individual email jobs, otherwise return campaigns
      if (type === 'jobs') {
        const jobs = await EmailSchedulerService.getSentEmailJobs(req.user.id);
        return res.json(jobs);
      }
      
      const emails = await EmailSchedulerService.getSentEmails(req.user.id);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;
      const result = await EmailSchedulerService.cancelEmail(req.user.id, id);
      res.json(result);
    } catch (error) {
      console.error('Cancel error:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
