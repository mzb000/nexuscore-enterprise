import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private privateKey!: crypto.KeyObject;
  private publicKey!: crypto.KeyObject;
  private readonly saltRounds = 12;

  constructor(private readonly config: ConfigService) {
    this.initKeys();
  }

  private initKeys(): void {
    const rawPriv = this.config.get<string>('JWT_PRIVATE_KEY');
    const rawPub = this.config.get<string>('JWT_PUBLIC_KEY');

    if (rawPriv && rawPub && !rawPriv.includes('[GENERATE_WITH_OPENSSL')) {
      this.privateKey = crypto.createPrivateKey(rawPriv.replace(/\\n/g, '\n'));
      this.publicKey = crypto.createPublicKey(rawPub.replace(/\\n/g, '\n'));
      this.logger.log('Loaded RSA keys from environment configuration.');
    } else {
      this.logger.warn('Generating ephemeral 2048-bit RSA keypair for local development/testing.');
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });
      this.privateKey = privateKey;
      this.publicKey = publicKey;
    }
  }

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
    const calculatedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedChallenge),
      Buffer.from(codeChallenge),
    );
  }

  public async signAccessToken(payload: { sub: string; email: string; role: string; jti: string }): Promise<string> {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer('nexuscore-identity')
      .setAudience('nexuscore-api')
      .setExpirationTime(this.config.get<string>('JWT_ACCESS_EXPIRY', '900s'))
      .sign(this.privateKey);
  }

  public async verifyAccessToken(token: string): Promise<jose.JWTPayload> {
    const { payload } = await jose.jwtVerify(token, this.publicKey, {
      issuer: 'nexuscore-identity',
      audience: 'nexuscore-api',
      algorithms: ['RS256'],
    });
    return payload;
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public generateSecureRandomToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}
