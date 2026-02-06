import nodemailer from 'nodemailer';

// Cache transporters per sender email (for Ethereal, we'll use one account but different "from" addresses)
const transporterCache = new Map<string, nodemailer.Transporter>();

export const createTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Get or create a transporter for a sender email
// For Ethereal Email, we use one account but can specify different "from" addresses
export const getTransporter = async (senderEmail: string): Promise<nodemailer.Transporter> => {
  // Use a single transporter for Ethereal (it supports any "from" address)
  // In production with real SMTP, you'd create one per sender
  if (!transporterCache.has('default')) {
    const transporter = await createTestTransporter();
    transporterCache.set('default', transporter);
  }
  return transporterCache.get('default')!;
};
