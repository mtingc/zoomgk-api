export enum EResponseCode {
  SUCCESS = 'SUCCESS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  UPDATED = 'UPDATED',
  UPDATED_FAILED = 'UPDATED_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ERROR = 'ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}