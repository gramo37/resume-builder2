import { AppError } from '../../shared/helpers/appError';
import { comparePassword, hashPassword } from '../../shared/helpers/hash';
import { signToken } from '../../shared/helpers/jwt';
import { User } from './auth.model';
import type { AuthResult, AuthUser, LoginInput, RegisterInput } from './auth.types';

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
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

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    if (!input?.name?.trim()) {
      throw new AppError(400, 'Name is required');
    }
    if (!input?.password || input.password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters');
    }

    const email = normalizeEmail(input.email);
    const existing = await User.findOne({ where: { email } });

    if (existing) {
      throw new AppError(409, 'Email is already registered');
    }

    const user = await User.create({
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
    });

    return {
      user: toAuthUser(user),
      token: signToken({ id: user.id, email: user.email }),
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    if (!input?.password) {
      throw new AppError(400, 'Password is required');
    }

    const email = normalizeEmail(input.email);
    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(input.password, user.password))) {
      throw new AppError(401, 'Invalid email or password');
    }

    return {
      user: toAuthUser(user),
      token: signToken({ id: user.id, email: user.email }),
    };
  },

  async getProfile(userId: number): Promise<AuthUser> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return toAuthUser(user);
  },
};
