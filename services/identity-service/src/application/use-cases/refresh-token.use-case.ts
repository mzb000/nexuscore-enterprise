import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ITokenRepository, TOKEN_REPOSITORY_TOKEN } from '../../domain/interfaces/token.repository.interface';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { CryptoService } from '../services/crypto.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AuthResponseDto } from '../dto/auth.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_REPOSITORY_TOKEN) private readonly tokenRepo: ITokenRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
  ) {}

  public async execute(compositeToken: string): Promise<AuthResponseDto> {
    const [tokenFamily, rawToken] = compositeToken.split('.');
    if (!tokenFamily || !rawToken) {
      throw new UnauthorizedException('Malformed refresh token format.');
    }

    const hashedToken = this.crypto.hashToken(rawToken);
    const tokenRecord = await this.tokenRepo.findByHash(hashedToken);

    // Reuse Detection: If token is already revoked or missing, compromise is suspected
    if (!tokenRecord || tokenRecord.isRevoked) {
      // Cascade revocation of the entire family
      await this.tokenRepo.revokeByFamily(tokenFamily);
      await this.redis.del(`session:${tokenRecord?.userId}:${tokenFamily}`);
      throw new UnauthorizedException('Token reuse detected. All sessions in this family have been terminated.');
    }

    if (tokenRecord.isExpired()) {
      throw new UnauthorizedException('Refresh token expired. Please login again.');
    }

    // Invalidate the current refresh token (one-time use)
    await this.tokenRepo.revokeById(tokenRecord.id);

    // Fetch User
    const user = await this.userRepo.findById(tokenRecord.userId);
    if (!user || user.isAccountLocked()) {
      throw new UnauthorizedException('User account inactive or locked.');
    }

    // Issue New RS256 Access Token
    const newJti = randomUUID();
    const newAccessToken = await this.crypto.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: newJti,
    });

    // Issue New Rotated Refresh Token in same family
    const nextRawToken = this.crypto.generateSecureRandomToken();
    const nextHashed = this.crypto.hashToken(nextRawToken);
    const nextExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.tokenRepo.create({
      tokenFamily,
      hashedToken: nextHashed,
      isRevoked: false,
      expiresAt: nextExpires,
      userId: user.id,
    });

    // Update active session in Redis
    await this.redis.set(`session:${user.id}:${tokenFamily}`, newJti, 7 * 24 * 3600);

    return {
      accessToken: newAccessToken,
      refreshToken: `${tokenFamily}.${nextRawToken}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
