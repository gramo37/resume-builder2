export type AuthUser = {
  id: number
  cognitoSub: string
  name: string
  email: string
}

export type CognitoAuthTokens = {
  accessToken: string
  idToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

export type AuthResult = {
  user: AuthUser
  tokens: CognitoAuthTokens
}

export type LoginInput = {
  email: string
  password: string
}

export type RefreshInput = {
  email: string
  refreshToken: string
}
