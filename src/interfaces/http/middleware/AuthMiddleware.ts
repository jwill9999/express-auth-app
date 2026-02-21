import { Request, Response, NextFunction, RequestHandler } from 'express';
import type { TokenProvider } from '../../../application/auth/ports/TokenProvider.js';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function createAuthMiddleware(tokenProvider: TokenProvider): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    try {
      const authHeader = authReq.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const token = authHeader.slice(7);
      if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const decoded = tokenProvider.verify(token);
      if (!decoded) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      authReq.user = decoded;
      next();
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
}
