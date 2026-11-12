export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
  CUSTOMER = 'CUSTOMER',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  LOCKED = 'LOCKED',
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly isEmailVerified: boolean,
    public readonly failedAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public isAccountLocked(): boolean {
    if (this.status === UserStatus.LOCKED) return true;
    if (this.lockedUntil && this.lockedUntil > new Date()) return true;
    return false;
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
