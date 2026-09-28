import type { Transaction } from 'sequelize';
import { UserResumeProfile, type User } from '../../shared/database';
import type { Binding, ResumeData, ResumeDocument, ResumeTemplate } from './schema/types';
import { validateResume, validateResumeData } from './schema/validateResume';
import { AppError } from '../../shared/helpers/appError';

const SUMMARY_PLACEHOLDER = 'Add your summary';

export async function resolveResumeData(
  user: User,
  template: ResumeTemplate,
  transaction?: Transaction,
): Promise<ResumeData> {
  const profile = await UserResumeProfile.findOne({ where: { userId: user.id }, transaction });
  if (profile) {
    const parsed = validateResumeData(profile.data);
    if (parsed.ok) {
      return parsed.data;
    }
  }

  return starterResumeData(template, user);
}

export function composeResumeDocument(input: {
  resumeId: number;
  name: string;
  template: ResumeTemplate;
  data: ResumeData;
}): ResumeDocument {
  const result = validateResume({
    schema_version: '2.0',
    document: { id: String(input.resumeId), name: input.name },
    template: input.template,
    data: input.data,
  });

  if (!result.ok) {
    throw new AppError(400, result.error);
  }

  return result.resume;
}

export function asResumeTemplate(value: object): ResumeTemplate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(500, 'Template content is invalid');
  }
  return value as ResumeTemplate;
}

export function storedResumeDocument(content: object): ResumeDocument {
  const result = validateResume(content);
  if (!result.ok) {
    throw new AppError(500, 'Stored resume JSON is invalid');
  }
  return result.resume;
}

function starterResumeData(template: ResumeTemplate, user: { name: string; email: string }): ResumeData {
  const data: ResumeData = {
    person: {
      id: boundEntityId(template, 'person') ?? 'person',
      name: user.name.trim(),
    },
    contact: {
      id: boundEntityId(template, 'contact') ?? 'contact',
      email: user.email,
    },
  };

  const summaryId = boundEntityId(template, 'summary');
  if (summaryId) {
    data.summary = { id: summaryId, text: SUMMARY_PLACEHOLDER };
  }

  return data;
}

function boundEntityId(template: ResumeTemplate, entity: string): string | undefined {
  for (const binding of collectBindings(template)) {
    if (binding.source === 'data' && 'entity' in binding && binding.entity === entity) {
      return binding.id;
    }
  }
  return undefined;
}

function collectBindings(template: ResumeTemplate): Binding[] {
  const bindings: Binding[] = [];
  for (const component of Object.values(template.components ?? {})) {
    if (component.binding) {
      bindings.push(component.binding);
    }
    for (const child of component.children ?? []) {
      if (child.binding) {
        bindings.push(child.binding);
      }
    }
  }
  return bindings;
}
