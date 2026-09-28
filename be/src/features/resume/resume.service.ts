import type { Transaction } from 'sequelize';
import {
  Resume,
  ResumeChangeRequest,
  ResumeChatMessage,
  ResumeConversation,
  ResumeTemplate,
  ResumeVersion,
  sequelize,
  type User,
} from '../../shared/database';
import { AppError } from '../../shared/helpers/appError';
import { resumeAiService } from './resumeAi.service';
import { resumeChangeRequestService } from './resumeChangeRequest.service';
import { resumeConversationService } from './resumeConversation.service';
import {
  asResumeTemplate,
  composeResumeDocument,
  resolveResumeData,
  storedResumeDocument,
} from './resumeData';
import { resumeDiffService } from './resumeDiff.service';
import {
  optionalChangeSummary,
  optionalConversationId,
  requireChatMessage,
  requireResumeContent,
  requireResumeName,
  requireTemplateId,
} from './resume.validation';
import { resumeVersionService } from './resumeVersion.service';

export const resumeService = {
  async createResume(user: User, body: { name?: unknown; templateId?: unknown }) {
    const name = requireResumeName(body?.name);
    const templateId = requireTemplateId(body?.templateId);

    return sequelize.transaction(async (transaction) => {
      const template = await ResumeTemplate.findByPk(templateId, { transaction });
      if (!template) {
        throw new AppError(404, 'Template not found');
      }

      const resume = await Resume.create(
        {
          userId: user.id,
          templateId: template.id,
          name,
          currentVersionId: null,
        },
        { transaction },
      );

      const data = await resolveResumeData(user, asResumeTemplate(template.template), transaction);
      const content = composeResumeDocument({
        resumeId: resume.id,
        name,
        template: asResumeTemplate(template.template),
        data,
      });

      await resumeVersionService.createVersion({
        resumeId: resume.id,
        content,
        source: 'SYSTEM',
        status: 'APPROVED',
        changeSummary: 'Created from template',
        transaction,
      });

      return loadResume(user.id, resume.id, transaction);
    });
  },

  async listResumes(userId: number) {
    const resumes = await Resume.findAll({
      where: { userId },
      attributes: ['id', 'name', 'templateId', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
    });

    return {
      resumes: resumes.map((resume) => ({
        id: resume.id,
        name: resume.name,
        templateId: resume.templateId,
        updatedAt: resume.updatedAt,
      })),
    };
  },

  async getResume(userId: number, resumeId: number) {
    return loadResume(userId, resumeId);
  },

  async renameResume(userId: number, resumeId: number, body: { name?: unknown }) {
    const name = requireResumeName(body?.name);
    const resume = await ownedResume(userId, resumeId);
    resume.name = name;
    await resume.save();
    return loadResume(userId, resume.id);
  },

  async deleteResume(userId: number, resumeId: number) {
    const resume = await ownedResume(userId, resumeId);
    await resume.destroy();
    return { deleted: true };
  },

  async saveEditorVersion(userId: number, resumeId: number, body: { content?: unknown; changeSummary?: unknown }) {
    await ownedResume(userId, resumeId);
    const content = requireResumeContent(body?.content);
    const version = await resumeVersionService.createVersion({
      resumeId,
      content,
      source: 'EDITOR',
      status: 'APPROVED',
      changeSummary: optionalChangeSummary(body?.changeSummary) ?? 'Updated resume',
    });

    return toVersionDetail(version);
  },

  async listVersions(userId: number, resumeId: number) {
    await ownedResume(userId, resumeId);
    const versions = await ResumeVersion.findAll({
      where: { resumeId },
      attributes: ['id', 'versionNumber', 'status', 'source', 'changeSummary', 'createdAt'],
      order: [['versionNumber', 'DESC']],
    });

    return { versions: versions.map(toVersionMeta) };
  },

  async getVersion(userId: number, resumeId: number, versionId: number) {
    await ownedResume(userId, resumeId);
    const version = await versionForResume(resumeId, versionId);
    return toVersionDetail(version);
  },

  async compareVersions(userId: number, resumeId: number, versionId: number, otherVersionId: number) {
    await ownedResume(userId, resumeId);
    const fromVersion = await versionForResume(resumeId, versionId);
    const toVersion = await versionForResume(resumeId, otherVersionId);

    return {
      fromVersion: fromVersion.id,
      toVersion: toVersion.id,
      changes: resumeDiffService.diff(fromVersion.content, toVersion.content),
    };
  },

  async restoreVersion(userId: number, resumeId: number, versionId: number) {
    await ownedResume(userId, resumeId);
    const source = await versionForResume(resumeId, versionId);
    const content = storedResumeDocument(source.content);
    const version = await resumeVersionService.createVersion({
      resumeId,
      content,
      source: 'SYSTEM',
      status: 'APPROVED',
      changeSummary: `Restored version ${source.versionNumber}`,
    });

    return toVersionDetail(version);
  },

  async chat(user: User, resumeId: number, body: { message?: unknown; conversationId?: unknown }) {
    const message = requireChatMessage(body?.message);
    const conversationId = optionalConversationId(body?.conversationId);
    const pending = await openChangeRequest(user.id, resumeId, message, conversationId);

    try {
      const generated = await resumeAiService.applyInstruction({
        resume: pending.baseContent,
        instruction: message,
      });
      const content = requireResumeContent(generated.content);
      const diff = resumeDiffService.diff(pending.baseContent, content);
      const proposed = await resumeVersionService.createVersion({
        resumeId,
        content,
        source: 'AI',
        status: 'PROPOSED',
        changeSummary: optionalChangeSummary(generated.changeSummary) ?? 'AI suggestion',
      });

      const assistant = await sequelize.transaction(async (transaction) => {
        const request = await ResumeChangeRequest.findOne({
          where: { id: pending.changeRequestId, resumeId, status: 'PROCESSING' },
          transaction,
        });
        if (!request) {
          throw new AppError(409, 'Change request is no longer processing');
        }

        request.proposedVersionId = proposed.id;
        request.status = 'PROPOSED';
        request.completedAt = new Date();
        await request.save({ transaction });

        const conversation = await ResumeConversation.findByPk(pending.conversationId, { transaction });
        if (!conversation || conversation.resumeId !== resumeId) {
          throw new AppError(404, 'Conversation not found');
        }

        return resumeConversationService.addMessage(
          {
            conversation,
            role: 'ASSISTANT',
            content: generated.assistantMessage,
            changeRequestId: request.id,
          },
          transaction,
        );
      });

      return {
        messageId: assistant.id,
        changeRequestId: pending.changeRequestId,
        versionId: proposed.id,
        status: 'PROPOSED' as const,
        diff,
      };
    } catch (error) {
      await failChangeRequest(pending.changeRequestId, pending.conversationId, error);
      throw error;
    }
  },

  approveChangeRequest: resumeChangeRequestService.approve,
  rejectChangeRequest: resumeChangeRequestService.reject,

  async listConversations(userId: number, resumeId: number) {
    await ownedResume(userId, resumeId);
    const conversations = await ResumeConversation.findAll({
      where: { resumeId },
      attributes: ['id', 'resumeId', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
    });

    return {
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        resumeId: conversation.resumeId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      })),
    };
  },

  async getConversation(userId: number, resumeId: number, conversationId: number) {
    await ownedResume(userId, resumeId);
    const conversation = await ResumeConversation.findOne({
      where: { id: conversationId, resumeId },
      include: [{ model: ResumeChatMessage, as: 'messages' }],
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    const messages = [...(conversation.messages ?? [])].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );

    return {
      id: conversation.id,
      resumeId: conversation.resumeId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        changeRequestId: message.changeRequestId,
        createdAt: message.createdAt,
      })),
    };
  },
};

async function openChangeRequest(
  userId: number,
  resumeId: number,
  message: string,
  conversationId: number | undefined,
) {
  return sequelize.transaction(async (transaction) => {
    const resume = await Resume.findOne({
      where: { id: resumeId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!resume) {
      throw new AppError(404, 'Resume not found');
    }
    if (!resume.currentVersionId) {
      throw new AppError(409, 'Resume has no current version');
    }

    const base = await ResumeVersion.findOne({
      where: { id: resume.currentVersionId, resumeId: resume.id },
      transaction,
    });
    if (!base) {
      throw new AppError(409, 'Resume has no current version');
    }

    const conversation = await resumeConversationService.resolve(resume.id, conversationId, transaction);
    const request = await ResumeChangeRequest.create(
      {
        resumeId: resume.id,
        baseVersionId: base.id,
        proposedVersionId: null,
        instruction: message,
        status: 'PROCESSING',
        completedAt: null,
      },
      { transaction },
    );

    await resumeConversationService.addMessage(
      {
        conversation,
        role: 'USER',
        content: message,
        changeRequestId: request.id,
      },
      transaction,
    );

    return {
      changeRequestId: request.id,
      conversationId: conversation.id,
      baseContent: storedResumeDocument(base.content),
    };
  });
}

async function failChangeRequest(changeRequestId: number, conversationId: number, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : 'The resume change failed';

  await sequelize.transaction(async (transaction) => {
    const request = await ResumeChangeRequest.findByPk(changeRequestId, { transaction });
    if (!request || request.status !== 'PROCESSING') {
      return;
    }

    request.status = 'FAILED';
    request.completedAt = new Date();
    await request.save({ transaction });

    const conversation = await ResumeConversation.findByPk(conversationId, { transaction });
    if (!conversation) {
      return;
    }

    await resumeConversationService.addMessage(
      {
        conversation,
        role: 'SYSTEM',
        content: message,
        changeRequestId: request.id,
      },
      transaction,
    );
  });
}

async function ownedResume(userId: number, resumeId: number, transaction?: Transaction): Promise<Resume> {
  const resume = await Resume.findOne({ where: { id: resumeId, userId }, transaction });
  if (!resume) {
    throw new AppError(404, 'Resume not found');
  }
  return resume;
}

async function loadResume(userId: number, resumeId: number, transaction?: Transaction) {
  const resume = await Resume.findOne({
    where: { id: resumeId, userId },
    include: [{ model: ResumeVersion, as: 'currentVersion' }],
    transaction,
  });

  if (!resume || !resume.currentVersion) {
    throw new AppError(404, 'Resume not found');
  }

  const currentVersion = resume.currentVersion;
  return {
    id: resume.id,
    name: resume.name,
    templateId: resume.templateId,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    currentVersion: toVersionDetail(currentVersion),
  };
}

async function versionForResume(resumeId: number, versionId: number): Promise<ResumeVersion> {
  const version = await ResumeVersion.findOne({ where: { id: versionId, resumeId } });
  if (!version) {
    throw new AppError(404, 'Version not found');
  }
  return version;
}

function toVersionMeta(version: ResumeVersion) {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    status: version.status,
    source: version.source,
    changeSummary: version.changeSummary,
    createdAt: version.createdAt,
  };
}

function toVersionDetail(version: ResumeVersion) {
  return {
    ...toVersionMeta(version),
    parentVersionId: version.parentVersionId,
    content: storedResumeDocument(version.content),
  };
}
