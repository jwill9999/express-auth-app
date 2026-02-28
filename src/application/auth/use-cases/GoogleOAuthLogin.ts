import type { TokenProvider } from '../ports/TokenProvider.js';
import type { CreateRefreshSession } from './CreateRefreshSession.js';

export interface GoogleOAuthUser {
  id: string;
  email: string;
  name?: string;
}

export class GoogleOAuthLogin {
  constructor(
    private tokenProvider: TokenProvider,
    private createRefreshSession?: CreateRefreshSession,
  ) {}

  async execute(user: GoogleOAuthUser): Promise<{
    token: string;
    refreshToken?: string;
    user: { id: string; email: string; name?: string };
  }> {
    const token = this.tokenProvider.generate(user.id, user.email);

    let refreshToken: string | undefined;
    if (this.createRefreshSession) {
      refreshToken = await this.createRefreshSession.execute(user.id);
    }

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
