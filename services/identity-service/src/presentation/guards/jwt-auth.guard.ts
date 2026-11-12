import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CryptoService } from '../../application/services/crypto.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.crypto.verifyAccessToken(token);

      // Check if access token was explicitly revoked
      if (payload.jti && (await this.redis.isJtiBlacklisted(payload.jti as string))) {
        throw new UnauthorizedException('Token has been revoked.');
      }

      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
