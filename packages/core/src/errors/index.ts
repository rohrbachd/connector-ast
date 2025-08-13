export class ConnectorError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}

export class NotFoundError extends ConnectorError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends ConnectorError {
  constructor(message = 'Validation failed') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class UnauthorizedError extends ConnectorError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends ConnectorError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}