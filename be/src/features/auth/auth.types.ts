export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ConfirmInput = {
  email: string;
  code: string;
};

export type RefreshInput = {
  email: string;
  refreshToken: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  password: string;
};

export type AuthUser = {
  id: number;
  cognitoSub: string;
  name: string;
  email: string;
};

export type CognitoAuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: CognitoAuthTokens;
};

export type RegisterResult = {
  user: AuthUser;
  confirmationRequired: boolean;
};
