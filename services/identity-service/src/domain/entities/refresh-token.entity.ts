export class RefreshTokenEntity {
  constructor(
    public readonly id: string,
    public readonly tokenFamily: string,
    public readonly hashedToken: string,
    public readonly isRevoked: boolean,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly userId: string,
  ) {}

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
