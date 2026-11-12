import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { ITokenRepository, TOKEN_REPOSITORY_TOKEN } from '../../domain/interfaces/token.repository.interface';
import { CryptoService } from '../services/crypto.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { LoginPkceDto, AuthResponseDto } from '../dto/auth.dto';
import { AccountLockedException, InvalidCredentialsException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class LoginPkceUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN) private readonly tokenRepo: ITokenRepository,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
  ) {}

  public async execute(dto: LoginPkceDto): Promise<AuthResponseDto> {
    // 1. Verify PKCE Challenge (RFC 7636 S256)
    const isPkceValid = this.crypto.verifyPkce(dto.codeVerifier, dto.codeChallenge);
    if (!isPkceValid) {
      throw new UnauthorizedException('PKCE verification failed: Code verifier does not match challenge.');
    }

    // 2. Fetch User & Account Safety Checks
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (user.isAccountLocked()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    // 3. Verify Password
    const isMatch = await this.crypto.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.failedAttempts + 1;
      const lockDuration = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.userRepo.incrementFailedAttempts(user.id, lockDuration);
      throw new InvalidCredentialsException();
    }

    await this.userRepo.updateLoginSuccess(user.id);

    // 4. Issue RS256 Access Token + Rotated Refresh Token
    const jti = randomUUID();
    const accessToken = await this.crypto.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
    });

    const rawRefreshToken = this.crypto.generateSecureRandomToken();
    const tokenFamily = randomUUID();
    const hashedRefresh = this.crypto.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.tokenRepo.create({
      tokenFamily,
      hashedToken: hashedRefresh,
      isRevoked: false,
      expiresAt,
      userId: user.id,
    });

    // 5. Store session in Redis
    await this.redis.set(`session:${user.id}:${tokenFamily}`, jti, 7 * 24 * 3600);

    return {
      accessToken,
      refreshToken: `${tokenFamily}.${rawRefreshToken}`,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
