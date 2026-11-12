export class DomainException extends Error {
  constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('The supplied credentials are invalid.', 'INVALID_CREDENTIALS');
  }
}

export class AccountLockedException extends DomainException {
  constructor(until: Date | null) {
    super(`Account is temporarily locked. Try again after ${until ? until.toISOString() : 'review'}.`, 'ACCOUNT_LOCKED');
  }
}

export class TokenRevokedException extends DomainException {
  constructor() {
    super('The provided token has been revoked or reuse was detected.', 'TOKEN_REVOKED_REUSE_DETECTED');
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`A user with email "${email}" already exists.`, 'USER_ALREADY_EXISTS');
  }
}
