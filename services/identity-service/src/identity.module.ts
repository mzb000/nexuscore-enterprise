import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/database/prisma.service';
import { RedisService } from './infrastructure/redis/redis.service';
import { CryptoService } from './application/services/crypto.service';
import { USER_REPOSITORY_TOKEN } from './domain/interfaces/user.repository.interface';
import { TOKEN_REPOSITORY_TOKEN } from './domain/interfaces/token.repository.interface';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { PrismaTokenRepository } from './infrastructure/database/prisma-token.repository';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginPkceUseCase } from './application/use-cases/login-pkce.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    RedisService,
    CryptoService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    {
      provide: TOKEN_REPOSITORY_TOKEN,
      useClass: PrismaTokenRepository,
    },
    RegisterUseCase,
    LoginPkceUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  exports: [CryptoService, RedisService, JwtAuthGuard],
})
export class IdentityModule {}
