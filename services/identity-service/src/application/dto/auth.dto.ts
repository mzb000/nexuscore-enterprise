import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'architect@nexuscore.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!@#' })
  @IsString()
  @Length(10, 64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-d\d@$!%*?&#]{10,}$/, {
    message: 'Password must contain uppercase, lowercase, numbers, and special characters.',
  })
  password!: string;

  @ApiProperty({ example: 'Tariq' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

export class LoginPkceDto {
  @ApiProperty({ example: 'architect@nexuscore.io' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!@#' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    description: 'Code Verifier for RFC 7636 PKCE validation (min 43, max 128 chars)',
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  })
  @IsString()
  @Length(43, 128)
  codeVerifier!: string;

  @ApiProperty({
    description: 'SHA-256 Base64URL-encoded challenge matching the code_verifier',
    example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  })
  @IsString()
  @IsNotEmpty()
  codeChallenge!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque or JWT refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  tokenType: string = 'Bearer';

  @ApiProperty()
  expiresIn: number = 900;
}
