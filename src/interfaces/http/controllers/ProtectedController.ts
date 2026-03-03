import { Router, Request, Response, RequestHandler } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export class ProtectedController {
  private readonly router: Router;

  constructor(private readonly authMiddleware: RequestHandler) {
    this.router = Router();
    this.setupRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/data:
     *   get:
     *     summary: Get dummy protected data
     *     tags: [Protected Routes]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Successfully retrieved protected data
     *       401:
     *         description: Unauthorized
     */
    this.router.get('/data', this.authMiddleware, this.getData.bind(this));

    /**
     * @swagger
     * /api/profile:
     *   get:
     *     summary: Get user profile
     *     tags: [Protected Routes]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Successfully retrieved profile
     *       401:
     *         description: Unauthorized
     */
    this.router.get('/profile', this.authMiddleware, this.getProfile.bind(this));
  }

  private getData(req: Request, res: Response): void {
    const authReq = req as AuthRequest;
    const { user } = authReq;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    res.json({
      success: true,
      message: 'Protected data accessed successfully',
      user: { id: user.id, email: user.email },
      data: {
        items: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, name: 'Item 2', value: 200 },
          { id: 3, name: 'Item 3', value: 300 },
        ],
        statistics: {
          totalItems: 3,
          totalValue: 600,
          averageValue: 200,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getProfile(req: Request, res: Response): void {
    const authReq = req as AuthRequest;
    const { user } = authReq;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    res.json({
      success: true,
      message: 'Profile accessed successfully',
      profile: {
        id: user.id,
        email: user.email,
        lastAccessed: new Date().toISOString(),
      },
    });
  }
}
