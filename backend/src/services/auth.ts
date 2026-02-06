import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/db';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  static async verifyGoogleToken(token: string) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      let user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          },
        });
      } else {
        // Update user info if it changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: payload.name,
            picture: payload.picture,
          },
        });
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return { user, token: jwtToken };
    } catch (error) {
      console.error('Google verification error:', error);
      throw new Error('Authentication failed');
    }
  }
}
