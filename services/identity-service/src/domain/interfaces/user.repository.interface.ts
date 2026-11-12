import { UserEntity, UserStatus } from '../entities/user.entity';

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'failedAttempts' | 'lockedUntil' | 'lastLoginAt'>): Promise<UserEntity>;
  updateLoginSuccess(id: string): Promise<void>;
  incrementFailedAttempts(id: string, lockUntil: Date | null): Promise<void>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
}
