import { AppError } from '../../shared/helpers/appError';
import type { ResumeDocument } from './schema/types';
import { validateResume } from './schema/validateResume';

export function requireResumeName(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'Name is required');
  }

  const name = value.trim();
  if (name.length > 160) {
    throw new AppError(400, 'Name must be 160 characters or fewer');
  }

  return name;
}

export function requireTemplateId(value: unknown): number {
  return requirePositiveInt(value, 'templateId');
}

export function optionalConversationId(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  return requirePositiveInt(value, 'conversationId');
}

export function requireChatMessage(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'Message is required');
  }
  return value.trim();
}

export function optionalChangeSummary(value: unknown): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new AppError(400, 'changeSummary must be a string');
  }
  const summary = value.trim();
  if (summary.length > 500) {
    throw new AppError(400, 'changeSummary must be 500 characters or fewer');
  }
  return summary;
}

export function requireResumeContent(value: unknown): ResumeDocument {
  const result = validateResume(value);
  if (!result.ok) {
    throw new AppError(400, result.error);
  }
  return result.resume;
}

export function requireRouteId(value: string | string[] | undefined, label: string): number {
  const raw = Array.isArray(value) ? value[0] : value;
  return requirePositiveInt(raw, label);
}

function requirePositiveInt(value: unknown, label: string): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new AppError(400, `${label} must be a positive integer`);
  }
  return numeric;
}
