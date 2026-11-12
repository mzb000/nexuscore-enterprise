import { Injectable, Inject } from '@nestjs/common';
import { ITokenRepository, TOKEN_REPOSITORY_TOKEN } from '../../domain/interfaces/token.repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_REPOSITORY_TOKEN) private readonly tokenRepo: ITokenRepository,
    private readonly redis: RedisService,
  ) {}

  public async execute(compositeToken: string, jti?: string): Promise<void> {
    const [tokenFamily] = compositeToken.split('.');
    if (tokenFamily) {
      await this.tokenRepo.revokeByFamily(tokenFamily);
    }

    if (jti) {
      // Blacklist JTI in Redis for the remainder of its 15-minute access token lifespan
      await this.redis.blacklistJti(jti, 900);
    }
  }
}
