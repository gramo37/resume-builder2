declare global {
  namespace Express {
    interface Request {
      user?: any;
      accessToken?: string;
    }
  }
}

export {};