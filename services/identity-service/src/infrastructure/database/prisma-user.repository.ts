import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository } from '../../domain/interfaces/user.repository.interface';
import { UserEntity, UserRole, UserStatus } from '../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.mapToDomain(record) : null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.mapToDomain(record) : null;
  }

  public async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'failedAttempts' | 'lockedUntil' | 'lastLoginAt'>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        status: data.status as any,
        isEmailVerified: data.isEmailVerified,
      },
    });
    return this.mapToDomain(created);
  }

  public async updateLoginSuccess(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  public async incrementFailedAttempts(id: string, lockUntil: Date | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
        lockedUntil: lockUntil,
        status: lockUntil ? 'LOCKED' : undefined,
      },
    });
  }

  public async updateStatus(id: string, status: UserStatus): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
  }

  private mapToDomain(r: any): UserEntity {
    return new UserEntity(
      r.id,
      r.email,
      r.passwordHash,
      r.firstName,
      r.lastName,
      r.role as UserRole,
      r.status as UserStatus,
      r.isEmailVerified,
      r.failedAttempts,
      r.lockedUntil,
      r.lastLoginAt,
      r.createdAt,
      r.updatedAt,
    );
  }
}
