import { Op, UniqueConstraintError, type Transaction } from 'sequelize';
import {
  Resume,
  ResumeChangeRequest,
  ResumeVersion,
  sequelize,
} from '../../shared/database';
import { AppError } from '../../shared/helpers/appError';
import { MAX_RETAINED_VERSIONS, type VersionSource, type VersionStatus } from './resume.constants';
import type { ResumeDocument } from './schema/types';

export interface CreateVersionInput {
  resumeId: number;
  content: ResumeDocument;
  source: VersionSource;
  status: VersionStatus;
  changeSummary: string | null;
  transaction?: Transaction;
}

export const resumeVersionService = {
  async createVersion(input: CreateVersionInput): Promise<ResumeVersion> {
    if (input.transaction) {
      return insertVersion(input, input.transaction);
    }

    return sequelize.transaction((transaction) => insertVersion(input, transaction));
  },
};

async function insertVersion(input: CreateVersionInput, transaction: Transaction): Promise<ResumeVersion> {
  const resume = await Resume.findByPk(input.resumeId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!resume) {
    throw new AppError(404, 'Resume not found');
  }

  const parentVersionId = resume.currentVersionId;
  const maxVersion = await ResumeVersion.max('versionNumber', {
    where: { resumeId: resume.id },
    transaction,
  });
  const versionNumber = (typeof maxVersion === 'number' ? maxVersion : 0) + 1;

  let version: ResumeVersion;
  try {
    version = await ResumeVersion.create(
      {
        resumeId: resume.id,
        versionNumber,
        parentVersionId,
        status: input.status,
        source: input.source,
        content: input.content,
        changeSummary: input.changeSummary,
      },
      { transaction },
    );
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new AppError(409, 'A version with this number already exists');
    }
    throw error;
  }

  if (input.status === 'APPROVED') {
    if (parentVersionId) {
      await ResumeVersion.update(
        { status: 'SUPERSEDED' },
        { where: { id: parentVersionId }, transaction },
      );
    }

    resume.currentVersionId = version.id;
    await resume.save({ transaction });
  }

  await enforceRetention(resume, transaction);
  return version;
}

async function enforceRetention(resume: Resume, transaction: Transaction): Promise<void> {
  const versions = await ResumeVersion.findAll({
    where: { resumeId: resume.id },
    attributes: ['id', 'versionNumber'],
    order: [['versionNumber', 'DESC']],
    transaction,
  });

  const keep = new Set(versions.slice(0, MAX_RETAINED_VERSIONS).map((version) => version.id));
  if (resume.currentVersionId) {
    keep.add(resume.currentVersionId);
  }

  const openRequests = await ResumeChangeRequest.findAll({
    where: {
      resumeId: resume.id,
      status: { [Op.in]: ['PROCESSING', 'PROPOSED'] },
    },
    transaction,
  });

  for (const request of openRequests) {
    if (request.baseVersionId) {
      keep.add(request.baseVersionId);
    }
    if (request.proposedVersionId) {
      keep.add(request.proposedVersionId);
    }
  }

  const deleteIds = versions.map((version) => version.id).filter((id) => !keep.has(id));
  if (deleteIds.length === 0) {
    return;
  }

  await ResumeVersion.destroy({ where: { id: deleteIds }, transaction });
}
