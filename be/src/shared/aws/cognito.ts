import { createHmac } from 'crypto';
import {
  CognitoIdentityProviderClient,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../../config/env';
import { AppError } from '../helpers/appError';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: env.cognito.region,
});

export const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: env.cognito.userPoolId,
  tokenUse: 'access',
  clientId: env.cognito.clientId,
});

export function cognitoSecretHash(username: string): string | undefined {
  if (!env.cognito.clientSecret) {
    return undefined;
  }

  return createHmac('sha256', env.cognito.clientSecret)
    .update(username + env.cognito.clientId)
    .digest('base64');
}

export function authParameters(
  username: string,
  extra: Record<string, string>,
): Record<string, string> {
  const secret = cognitoSecretHash(username);
  return secret ? { ...extra, SECRET_HASH: secret } : extra;
}

export type CognitoTokens = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
};

export function toCognitoTokens(result?: AuthenticationResultType): CognitoTokens {
  if (!result?.AccessToken || !result.IdToken) {
    throw new AppError(502, 'Authentication service did not return tokens');
  }

  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresIn: result.ExpiresIn ?? 3600,
    tokenType: result.TokenType ?? 'Bearer',
  };
}

const COGNITO_ERRORS: Record<string, { status: number; message: string }> = {
  UsernameExistsException: { status: 409, message: 'Email is already registered' },
  UserNotConfirmedException: { status: 403, message: 'Email is not confirmed' },
  NotAuthorizedException: { status: 401, message: 'Invalid email or password' },
  UserNotFoundException: { status: 401, message: 'Invalid email or password' },
  CodeMismatchException: { status: 400, message: 'Invalid confirmation code' },
  ExpiredCodeException: { status: 400, message: 'Confirmation code has expired' },
  InvalidPasswordException: { status: 400, message: 'Password does not meet Cognito requirements' },
  InvalidParameterException: { status: 400, message: 'Invalid authentication request' },
  LimitExceededException: { status: 429, message: 'Too many attempts. Try again later' },
  TooManyRequestsException: { status: 429, message: 'Too many attempts. Try again later' },
  TooManyFailedAttemptsException: { status: 429, message: 'Too many failed attempts. Try again later' },
  CodeDeliveryFailureException: { status: 502, message: 'Could not send confirmation code' },
  PasswordResetRequiredException: { status: 403, message: 'Password reset is required' },
};

export function mapCognitoError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  const name = error instanceof Error ? error.name : '';
  const mapped = COGNITO_ERRORS[name];

  if (mapped) {
    throw new AppError(mapped.status, mapped.message);
  }

  throw new AppError(
    502,
    'Authentication service error',
    env.isDev && error instanceof Error ? error.message : undefined,
  );
}
