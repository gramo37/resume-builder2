import { compare, getValueByPointer, type Operation } from 'fast-json-patch';
import { AppError } from '../../shared/helpers/appError';

export type ResumeChange =
  | { type: 'added'; path: string; value: unknown }
  | { type: 'removed'; path: string; value: unknown }
  | { type: 'modified'; path: string; oldValue: unknown; newValue: unknown };

export const resumeDiffService = {
  diff(from: unknown, to: unknown): ResumeChange[] {
    const operations = compare(asObject(from), asObject(to));
    return operations.map((operation) => toChange(operation, from));
  },
};

function asObject(value: unknown): Record<string, unknown> | unknown[] {
  if (value !== null && typeof value === 'object') {
    return value as Record<string, unknown> | unknown[];
  }
  throw new AppError(500, 'Resume content must be a JSON object');
}

function toChange(operation: Operation, from: unknown): ResumeChange {
  switch (operation.op) {
    case 'add':
      return { type: 'added', path: operation.path, value: operation.value };
    case 'remove':
      return { type: 'removed', path: operation.path, value: getValueByPointer(from, operation.path) };
    case 'replace':
      return {
        type: 'modified',
        path: operation.path,
        oldValue: getValueByPointer(from, operation.path),
        newValue: operation.value,
      };
    default:
      throw new AppError(500, `Unsupported diff operation: ${operation.op}`);
  }
}
