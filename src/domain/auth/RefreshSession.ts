export class RefreshSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenFamily: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revoked: boolean = false,
  ) {}

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }
}
