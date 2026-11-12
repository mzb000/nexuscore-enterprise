import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export const TOKEN_REPOSITORY_TOKEN = Symbol('ITokenRepository');

export interface ITokenRepository {
  create(token: Omit<RefreshTokenEntity, 'id' | 'createdAt'>): Promise<RefreshTokenEntity>;
  findByHash(hashedToken: string): Promise<RefreshTokenEntity | null>;
  revokeByFamily(tokenFamily: string): Promise<void>;
  revokeById(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
