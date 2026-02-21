export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class UserAlreadyExistsError extends Error {
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SessionNotFoundError extends Error {
  constructor() {
    super('Refresh session not found');
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Refresh session has expired');
    this.name = 'SessionExpiredError';
  }
}

export class TokenReuseDetectedError extends Error {
  constructor() {
    super('Refresh token reuse detected — all sessions in this family have been revoked');
    this.name = 'TokenReuseDetectedError';
  }
}

export class SessionRevokedError extends Error {
  constructor() {
    super('Refresh session has been revoked');
    this.name = 'SessionRevokedError';
  }
}
