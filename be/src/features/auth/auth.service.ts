import {
  AdminInitiateAuthCommand,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from '../../config/env';
import { AppError } from '../../shared/helpers/appError';
import {
  authParameters,
  cognitoClient,
  cognitoSecretHash,
  mapCognitoError,
  toCognitoTokens,
} from '../../shared/aws/cognito';
import { User } from './auth.model';
import type {
  AuthResult,
  AuthUser,
  ConfirmInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshInput,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
} from './auth.types';

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    cognitoSub: user.cognitoSub,
    name: user.name,
    email: user.email,
  };
}

function normalizeEmail(email: string | undefined): string {
  const value = email?.trim().toLowerCase() ?? '';
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new AppError(400, 'A valid email is required');
  }
  return value;
}

function requirePassword(password: string | undefined): string {
  if (!password || password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters');
  }
  return password;
}

function attributeMap(attributes: { Name?: string; Value?: string }[] | undefined): Record<string, string> {
  return Object.fromEntries(
    (attributes ?? [])
      .filter((attribute): attribute is { Name: string; Value: string } => Boolean(attribute.Name && attribute.Value))
      .map((attribute) => [attribute.Name, attribute.Value]),
  );
}

async function upsertLocalUser(input: {
  cognitoSub: string;
  email: string;
  name: string;
}): Promise<User> {
  const existingBySub = await User.findOne({ where: { cognitoSub: input.cognitoSub } });
  if (existingBySub) {
    if (existingBySub.name !== input.name || existingBySub.email !== input.email) {
      await existingBySub.update({ name: input.name, email: input.email });
    }
    return existingBySub;
  }

  const existingByEmail = await User.findOne({ where: { email: input.email } });
  if (existingByEmail) {
    await existingByEmail.update({ cognitoSub: input.cognitoSub, name: input.name });
    return existingByEmail;
  }

  return User.create(input);
}

export const authService = {
  async register(input: RegisterInput): Promise<RegisterResult> {
    if (!input?.name?.trim()) {
      throw new AppError(400, 'Name is required');
    }

    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    const password = requirePassword(input.password);

    try {
      const result = await cognitoClient.send(
        new SignUpCommand({
          ClientId: env.cognito.clientId,
          Username: email,
          Password: password,
          SecretHash: cognitoSecretHash(email),
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
          ],
        }),
      );

      if (!result.UserSub) {
        throw new AppError(502, 'Authentication service did not return a user id');
      }

      const user = await upsertLocalUser({
        cognitoSub: result.UserSub,
        email,
        name,
      });

      return {
        user: toAuthUser(user),
        confirmationRequired: !result.UserConfirmed,
      };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async confirm(input: ConfirmInput): Promise<{ confirmed: true }> {
    const email = normalizeEmail(input.email);
    if (!input?.code?.trim()) {
      throw new AppError(400, 'Confirmation code is required');
    }

    try {
      await cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: env.cognito.clientId,
          Username: email,
          ConfirmationCode: input.code.trim(),
          SecretHash: cognitoSecretHash(email),
        }),
      );

      return { confirmed: true };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async resendCode(input: ForgotPasswordInput): Promise<{ sent: true }> {
    const email = normalizeEmail(input.email);

    try {
      await cognitoClient.send(
        new ResendConfirmationCodeCommand({
          ClientId: env.cognito.clientId,
          Username: email,
          SecretHash: cognitoSecretHash(email),
        }),
      );

      return { sent: true };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    if (!input?.password) {
      throw new AppError(400, 'Password is required');
    }

    try {
      const result = await cognitoClient.send(
        new AdminInitiateAuthCommand({
          UserPoolId: env.cognito.userPoolId,
          ClientId: env.cognito.clientId,
          AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
          AuthParameters: authParameters(email, {
            USERNAME: email,
            PASSWORD: input.password,
          }),
        }),
      );

      const tokens = toCognitoTokens(result.AuthenticationResult);
      const cognitoUser = await cognitoClient.send(
        new GetUserCommand({ AccessToken: tokens.accessToken }),
      );
      const attributes = attributeMap(cognitoUser.UserAttributes);
      if (!attributes.sub) {
        throw new AppError(502, 'Authentication service did not return a user id');
      }

      const user = await upsertLocalUser({
        cognitoSub: attributes.sub,
        email: attributes.email ?? email,
        name: attributes.name ?? email,
      });

      return { user: toAuthUser(user), tokens };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async refresh(input: RefreshInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    if (!input?.refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    try {
      const result = await cognitoClient.send(
        new InitiateAuthCommand({
          ClientId: env.cognito.clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: authParameters(email, {
            REFRESH_TOKEN: input.refreshToken,
          }),
        }),
      );

      const tokens = toCognitoTokens({
        ...result.AuthenticationResult,
        RefreshToken: result.AuthenticationResult?.RefreshToken ?? input.refreshToken,
      });

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      return { user: toAuthUser(user), tokens };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ sent: true }> {
    const email = normalizeEmail(input.email);

    try {
      await cognitoClient.send(
        new ForgotPasswordCommand({
          ClientId: env.cognito.clientId,
          Username: email,
          SecretHash: cognitoSecretHash(email),
        }),
      );

      return { sent: true };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async resetPassword(input: ResetPasswordInput): Promise<{ reset: true }> {
    const email = normalizeEmail(input.email);
    const password = requirePassword(input.password);
    if (!input?.code?.trim()) {
      throw new AppError(400, 'Reset code is required');
    }

    try {
      await cognitoClient.send(
        new ConfirmForgotPasswordCommand({
          ClientId: env.cognito.clientId,
          Username: email,
          ConfirmationCode: input.code.trim(),
          Password: password,
          SecretHash: cognitoSecretHash(email),
        }),
      );

      return { reset: true };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async logout(accessToken: string): Promise<{ signedOut: true }> {
    try {
      await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
      return { signedOut: true };
    } catch (error) {
      mapCognitoError(error);
    }
  },

  async getProfile(cognitoSub: string, accessToken: string): Promise<AuthUser> {
    let user = await User.findOne({ where: { cognitoSub } });

    if (!user) {
      try {
        const cognitoUser = await cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
        const attributes = attributeMap(cognitoUser.UserAttributes);

        if (!attributes.sub || !attributes.email) {
          throw new AppError(404, 'User not found');
        }

        user = await upsertLocalUser({
          cognitoSub: attributes.sub,
          email: attributes.email,
          name: attributes.name ?? attributes.email,
        });
      } catch (error) {
        mapCognitoError(error);
      }
    }

    return toAuthUser(user);
  },
};
