import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ITokenRepository } from '../../domain/interfaces/token.repository.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';

@Injectable()
export class PrismaTokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async create(data: Omit<RefreshTokenEntity, 'id' | 'createdAt'>): Promise<RefreshTokenEntity> {
    const record = await this.prisma.refreshToken.create({
      data: {
        tokenFamily: data.tokenFamily,
        hashedToken: data.hashedToken,
        isRevoked: data.isRevoked,
        expiresAt: data.expiresAt,
        userId: data.userId,
      },
    });
    return this.mapToDomain(record);
  }

  public async findByHash(hashedToken: string): Promise<RefreshTokenEntity | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { hashedToken },
    });
    return record ? this.mapToDomain(record) : null;
  }

  public async revokeByFamily(tokenFamily: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenFamily },
      data: { isRevoked: true },
    });
  }

  public async revokeById(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  public async deleteExpired(): Promise<number> {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return deleted.count;
  }

  private mapToDomain(r: any): RefreshTokenEntity {
    return new RefreshTokenEntity(
      r.id,
      r.tokenFamily,
      r.hashedToken,
      r.isRevoked,
      r.expiresAt,
      r.createdAt,
      r.userId,
    );
  }
}
