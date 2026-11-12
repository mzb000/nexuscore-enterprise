import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../domain/interfaces/user.repository.interface';
import { CryptoService } from '../services/crypto.service';
import { RegisterDto } from '../dto/auth.dto';
import { UserAlreadyExistsException } from '../../domain/exceptions/domain.exceptions';
import { UserRole, UserStatus } from '../../domain/entities/user.entity';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    private readonly crypto: CryptoService,
  ) {}

  public async execute(dto: RegisterDto): Promise<{ id: string; email: string }> {
    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new UserAlreadyExistsException(dto.email);
    }

    const passwordHash = await this.crypto.hashPassword(dto.password);

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
    });

    return { id: user.id, email: user.email };
  }
}
