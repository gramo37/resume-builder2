declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        username: string;
      };
      accessToken?: string;
    }
  }
}

export {};
