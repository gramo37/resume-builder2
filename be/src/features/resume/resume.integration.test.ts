import { createServer, request as httpRequest } from 'http';
import type { AddressInfo } from 'net';
import { Client } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { RequestHandler } from 'express';
import { createApp } from '../../app';
import { env } from '../../config/env';
import {
  ResumeChangeRequest,
  ResumeTemplate,
  ResumeVersion,
  User,
  UserResumeProfile,
  sequelize,
} from '../../shared/database';
import { migrator } from '../../shared/database/migrator';
import { AppError } from '../../shared/helpers/appError';
import type { ResumeAiProvider } from './resumeAi.service';
import { resumeAiService } from './resumeAi.service';
import { resumeService } from './resume.service';
import type { ResumeDocument } from './schema/types';
import { templateService } from './template.service';

let sequence = 0;

const headlineProvider: ResumeAiProvider = {
  async applyInstruction({ resume, instruction }) {
    const content = structuredClone(resume);
    content.data.person.headline = instruction;
    return {
      content,
      assistantMessage: `Applied: ${instruction}`,
      changeSummary: 'Updated headline',
    };
  },
};

beforeAll(async () => {
  if (env.db.name !== 'applyant_test') {
    throw new Error(`Tests must use applyant_test, got ${env.db.name}`);
  }
  await ensureTestDatabase();
  await sequelize.authenticate();
  await migrator.up();
});

beforeEach(async () => {
  resumeAiService.setProvider(headlineProvider);
  await sequelize.query(`
    TRUNCATE TABLE
      resume_chat_messages,
      resume_conversations,
      resume_change_requests,
      resume_versions,
      resumes,
      user_resume_profiles,
      users
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  resumeAiService.resetProvider();
  await sequelize.close();
});

describe('resume versioning', () => {
  it('lists the seeded template and creates a resume from the account', async () => {
    const templates = await templateService.list();
    expect(templates.templates).toEqual([
      expect.objectContaining({ key: 'single-column', name: 'Single column' }),
    ]);

    const user = await createUser('Ada Lovelace', 'ada@example.com');
    const template = await seededTemplate();
    const created = await resumeService.createResume(user, { name: 'Ada resume', templateId: template.id });

    expect(created.name).toBe('Ada resume');
    expect(created.templateId).toBe(template.id);
    expect(created.currentVersion.source).toBe('SYSTEM');
    expect(created.currentVersion.status).toBe('APPROVED');
    expect(created.currentVersion.versionNumber).toBe(1);
    expect(created.currentVersion.parentVersionId).toBeNull();
    expect(created.currentVersion.content.document.id).toBe(String(created.id));
    expect(created.currentVersion.content.data.person.name).toBe('Ada Lovelace');
    expect(created.currentVersion.content.data.contact.email).toBe('ada@example.com');
    expect(created.currentVersion.content.data.experience).toBeUndefined();

    await expect(resumeService.createResume(user, { name: 'Missing', templateId: 999999 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('uses a stored profile instead of the account fallback', async () => {
    const user = await createUser('Ada Lovelace', 'ada@example.com');
    await UserResumeProfile.create({
      userId: user.id,
      data: {
        person: { id: 'person_001', name: 'Profile Name' },
        contact: { id: 'contact_001', email: 'profile@example.com' },
        summary: { id: 'summary_001', text: 'From profile' },
      },
    });

    const template = await seededTemplate();
    const created = await resumeService.createResume(user, { name: 'Profile resume', templateId: template.id });
    expect(created.currentVersion.content.data.person.name).toBe('Profile Name');
    expect(created.currentVersion.content.data.contact.email).toBe('profile@example.com');
    expect(created.currentVersion.content.data.summary?.text).toBe('From profile');
  });

  it('renames, lists, and soft-deletes a resume', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'First');
    const renamed = await resumeService.renameResume(user.id, created.id, { name: 'Renamed' });
    expect(renamed.name).toBe('Renamed');
    expect(renamed.currentVersion.content.document.name).toBe('First');

    const listed = await resumeService.listResumes(user.id);
    expect(listed.resumes.map((resume) => resume.id)).toEqual([created.id]);

    await resumeService.deleteResume(user.id, created.id);
    await expect(resumeService.getResume(user.id, created.id)).rejects.toBeInstanceOf(AppError);
    expect((await resumeService.listResumes(user.id)).resumes).toEqual([]);
  });

  it('saves an editor version and supersedes the previous current version', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const saved = await resumeService.saveEditorVersion(user.id, created.id, {
      content: withPersonName(created.currentVersion.content, 'Ada Edited'),
      changeSummary: 'Updated name',
    });

    expect(saved.versionNumber).toBe(2);
    expect(saved.status).toBe('APPROVED');
    expect(saved.source).toBe('EDITOR');
    expect(saved.parentVersionId).toBe(created.currentVersion.id);
    expect(saved.content.data.person.name).toBe('Ada Edited');

    const history = await resumeService.listVersions(user.id, created.id);
    expect(history.versions.map((version) => version.versionNumber)).toEqual([2, 1]);
    expect(history.versions[0]).not.toHaveProperty('content');
    expect(history.versions[1]?.status).toBe('SUPERSEDED');

    const current = await resumeService.getResume(user.id, created.id);
    expect(current.currentVersion.id).toBe(saved.id);
  });

  it('compares two versions', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const saved = await resumeService.saveEditorVersion(user.id, created.id, {
      content: withPersonName(created.currentVersion.content, 'Ada Edited'),
    });

    const comparison = await resumeService.compareVersions(
      user.id,
      created.id,
      created.currentVersion.id,
      saved.id,
    );

    expect(comparison.fromVersion).toBe(created.currentVersion.id);
    expect(comparison.toVersion).toBe(saved.id);
    expect(comparison.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'modified',
          path: '/data/person/name',
          oldValue: user.name,
          newValue: 'Ada Edited',
        }),
      ]),
    );
  });

  it('proposes an AI version, then approves it without creating another snapshot', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const proposal = await resumeService.chat(user, created.id, { message: 'Staff Engineer' });

    expect(proposal.status).toBe('PROPOSED');
    expect(proposal.diff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'added', path: '/data/person/headline', value: 'Staff Engineer' }),
      ]),
    );

    const before = await ResumeVersion.count({ where: { resumeId: created.id } });
    const approved = await resumeService.approveChangeRequest(user.id, created.id, proposal.changeRequestId);
    const after = await ResumeVersion.count({ where: { resumeId: created.id } });

    expect(after).toBe(before);
    expect(approved.versionId).toBe(proposal.versionId);
    const current = await resumeService.getResume(user.id, created.id);
    expect(current.currentVersion.id).toBe(proposal.versionId);
    expect(current.currentVersion.status).toBe('APPROVED');
    expect(current.currentVersion.content.data.person.headline).toBe('Staff Engineer');

    const original = await resumeService.getVersion(user.id, created.id, created.currentVersion.id);
    expect(original.status).toBe('SUPERSEDED');
    const request = await ResumeChangeRequest.findByPk(proposal.changeRequestId);
    expect(request?.status).toBe('APPROVED');
  });

  it('rejects an AI version without changing the current resume', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const proposal = await resumeService.chat(user, created.id, { message: 'Ignore this' });
    const rejected = await resumeService.rejectChangeRequest(user.id, created.id, proposal.changeRequestId);

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.currentVersionId).toBe(created.currentVersion.id);
    const current = await resumeService.getResume(user.id, created.id);
    expect(current.currentVersion.id).toBe(created.currentVersion.id);
    expect(current.currentVersion.content.data.person.headline).toBeUndefined();
  });

  it('refuses to approve a proposal after a newer editor save', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const proposal = await resumeService.chat(user, created.id, { message: 'Too late' });
    await resumeService.saveEditorVersion(user.id, created.id, {
      content: withPersonName(created.currentVersion.content, 'Saved first'),
    });

    await expect(
      resumeService.approveChangeRequest(user.id, created.id, proposal.changeRequestId),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('marks the change request failed when no AI provider is configured', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    resumeAiService.resetProvider();

    await expect(resumeService.chat(user, created.id, { message: 'Add experience' })).rejects.toMatchObject({
      statusCode: 501,
    });

    const request = await ResumeChangeRequest.findOne({ where: { resumeId: created.id } });
    expect(request?.status).toBe('FAILED');
    expect(await ResumeVersion.count({ where: { resumeId: created.id } })).toBe(1);

    const conversations = await resumeService.listConversations(user.id, created.id);
    const conversation = await resumeService.getConversation(user.id, created.id, conversations.conversations[0]!.id);
    expect(conversation.messages.map((message) => message.role)).toEqual(['USER', 'SYSTEM']);
  });

  it('restores an older version as a new snapshot', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    const originalContent = structuredClone(created.currentVersion.content);
    const second = await resumeService.saveEditorVersion(user.id, created.id, {
      content: withPersonName(originalContent, 'Second'),
    });
    const third = await resumeService.saveEditorVersion(user.id, created.id, {
      content: withPersonName(originalContent, 'Third'),
    });

    const restored = await resumeService.restoreVersion(user.id, created.id, created.currentVersion.id);
    expect(restored.versionNumber).toBe(4);
    expect(restored.source).toBe('SYSTEM');
    expect(restored.status).toBe('APPROVED');
    expect(restored.parentVersionId).toBe(third.id);
    expect(restored.content.data.person.name).toBe(user.name);

    const untouched = await resumeService.getVersion(user.id, created.id, created.currentVersion.id);
    expect(untouched.content).toEqual(originalContent);
    expect(untouched.status).toBe('SUPERSEDED');

    const previous = await resumeService.getVersion(user.id, created.id, third.id);
    expect(previous.status).toBe('SUPERSEDED');
    const current = await resumeService.getResume(user.id, created.id);
    expect(current.currentVersion.id).toBe(restored.id);
    expect(second.id).not.toBe(restored.id);
  });

  it('keeps only the latest 10 versions per resume', async () => {
    const user = await createUser();
    const first = await createFromTemplate(user, 'A');
    const second = await createFromTemplate(user, 'B');

    await saveTimes(user.id, first.id, first.currentVersion.content, 10);
    expect(await ResumeVersion.count({ where: { resumeId: first.id } })).toBe(10);
    const firstNumbers = await versionNumbers(first.id);
    expect(firstNumbers).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

    await saveTimes(user.id, first.id, first.currentVersion.content, 9);
    expect(await versionNumbers(first.id)).toEqual([20, 19, 18, 17, 16, 15, 14, 13, 12, 11]);
    expect(await versionNumbers(second.id)).toEqual([1]);
  });

  it('assigns distinct version numbers for concurrent saves', async () => {
    const user = await createUser();
    const created = await createFromTemplate(user, 'Draft');
    await Promise.all([
      resumeService.saveEditorVersion(user.id, created.id, {
        content: withPersonName(created.currentVersion.content, 'Left'),
      }),
      resumeService.saveEditorVersion(user.id, created.id, {
        content: withPersonName(created.currentVersion.content, 'Right'),
      }),
    ]);

    const numbers = await versionNumbers(created.id);
    expect(numbers).toHaveLength(3);
    expect(new Set(numbers).size).toBe(3);
  });

  it('hides another user resume, versions, change requests, and conversations', async () => {
    const owner = await createUser('Owner', 'owner@example.com');
    const intruder = await createUser('Intruder', 'intruder@example.com');
    const created = await createFromTemplate(owner, 'Private');
    const proposal = await resumeService.chat(owner, created.id, { message: 'Secret' });
    const conversations = await resumeService.listConversations(owner.id, created.id);

    await expect(resumeService.getResume(intruder.id, created.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(resumeService.listVersions(intruder.id, created.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      resumeService.getVersion(intruder.id, created.id, created.currentVersion.id),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      resumeService.approveChangeRequest(intruder.id, created.id, proposal.changeRequestId),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      resumeService.getConversation(intruder.id, created.id, conversations.conversations[0]!.id),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect((await resumeService.listResumes(intruder.id)).resumes).toEqual([]);
  });

  it('serves the resume list over HTTP for the authenticated user', async () => {
    const user = await createUser('Http User', 'http@example.com');
    const created = await createFromTemplate(user, 'Http resume');
    const app = createApp({
      authenticate: ((req, _res, next) => {
        const sub = req.header('x-test-sub');
        if (!sub) {
          next(new AppError(401, 'Unauthorized'));
          return;
        }
        req.user = { sub, username: sub };
        next();
      }) satisfies RequestHandler,
    });

    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    try {
      const listed = await getJson(port, '/api/resumes', user.cognitoSub);
      expect(listed.status).toBe(200);
      expect(listed.body).toEqual({
        success: true,
        data: {
          resumes: [
            expect.objectContaining({
              id: created.id,
              name: 'Http resume',
              templateId: created.templateId,
            }),
          ],
        },
      });

      const denied = await getJson(port, '/api/resumes', '');
      expect(denied.status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

async function createUser(name = 'Ada Lovelace', email?: string): Promise<User> {
  sequence += 1;
  return User.create({
    cognitoSub: `sub-${sequence}`,
    name,
    email: email ?? `user-${sequence}@example.com`,
  });
}

async function seededTemplate(): Promise<ResumeTemplate> {
  const template = await ResumeTemplate.findOne({ where: { key: 'single-column' } });
  if (!template) {
    throw new Error('Seeded template is missing');
  }
  return template;
}

async function createFromTemplate(user: User, name: string) {
  const template = await seededTemplate();
  return resumeService.createResume(user, { name, templateId: template.id });
}

function withPersonName(content: ResumeDocument, name: string): ResumeDocument {
  return {
    ...content,
    data: {
      ...content.data,
      person: { ...content.data.person, name },
    },
  };
}

async function saveTimes(userId: number, resumeId: number, content: ResumeDocument, times: number) {
  let current = content;
  for (let index = 0; index < times; index += 1) {
    const saved = await resumeService.saveEditorVersion(userId, resumeId, {
      content: withPersonName(current, `Version ${index + 2}`),
    });
    current = saved.content;
  }
}

async function versionNumbers(resumeId: number): Promise<number[]> {
  const versions = await ResumeVersion.findAll({
    where: { resumeId },
    attributes: ['versionNumber'],
    order: [['versionNumber', 'DESC']],
  });
  return versions.map((version) => version.versionNumber);
}

async function ensureTestDatabase(): Promise<void> {
  if (!/^[a-z0-9_]+$/.test(env.db.name)) {
    throw new Error(`Refusing to create database "${env.db.name}"`);
  }

  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });
  await client.connect();
  const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.db.name]);
  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE ${env.db.name}`);
  }
  await client.end();
}

function getJson(port: number, path: string, sub: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
        headers: sub ? { 'x-test-sub': sub } : {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            status: res.statusCode ?? 0,
            body: text ? JSON.parse(text) : null,
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}
