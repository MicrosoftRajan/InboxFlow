import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { EmailController } from '../controllers/emailController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await AuthService.verifyGoogleToken(token);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
});

router.post('/emails/schedule', authMiddleware, EmailController.schedule);
router.get('/emails', authMiddleware, EmailController.getEmails);
router.get('/emails/scheduled', authMiddleware, EmailController.getScheduled);
router.get('/emails/sent', authMiddleware, EmailController.getSent);
router.delete('/emails/:id', authMiddleware, EmailController.cancel);

export default router;
