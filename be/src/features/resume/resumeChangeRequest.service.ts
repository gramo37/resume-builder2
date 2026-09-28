import type { Transaction } from 'sequelize';
import { Resume, ResumeChangeRequest, ResumeVersion, sequelize } from '../../shared/database';
import { AppError } from '../../shared/helpers/appError';

export const resumeChangeRequestService = {
  async approve(userId: number, resumeId: number, changeRequestId: number) {
    return sequelize.transaction(async (transaction) => {
      const resume = await lockOwnedResume(userId, resumeId, transaction);
      const request = await ownedChangeRequest(resume.id, changeRequestId, transaction);

      if (request.status !== 'PROPOSED' || request.proposedVersionId == null) {
        throw new AppError(409, 'Change request is not awaiting approval');
      }

      if (request.baseVersionId !== resume.currentVersionId) {
        throw new AppError(409, 'Change request is out of date');
      }

      const proposed = await ResumeVersion.findOne({
        where: { id: request.proposedVersionId, resumeId: resume.id },
        transaction,
      });

      if (!proposed || proposed.status !== 'PROPOSED') {
        throw new AppError(409, 'Proposed version is no longer valid');
      }

      if (resume.currentVersionId) {
        await ResumeVersion.update(
          { status: 'SUPERSEDED' },
          { where: { id: resume.currentVersionId }, transaction },
        );
      }

      proposed.status = 'APPROVED';
      await proposed.save({ transaction });

      request.status = 'APPROVED';
      request.completedAt = new Date();
      await request.save({ transaction });

      resume.currentVersionId = proposed.id;
      await resume.save({ transaction });

      return {
        changeRequestId: request.id,
        versionId: proposed.id,
        status: proposed.status,
      };
    });
  },

  async reject(userId: number, resumeId: number, changeRequestId: number) {
    return sequelize.transaction(async (transaction) => {
      const resume = await lockOwnedResume(userId, resumeId, transaction);
      const request = await ownedChangeRequest(resume.id, changeRequestId, transaction);

      if (request.status !== 'PROPOSED' || request.proposedVersionId == null) {
        throw new AppError(409, 'Change request is not awaiting approval');
      }

      const proposed = await ResumeVersion.findOne({
        where: { id: request.proposedVersionId, resumeId: resume.id },
        transaction,
      });

      if (!proposed || proposed.status !== 'PROPOSED') {
        throw new AppError(409, 'Proposed version is no longer valid');
      }

      proposed.status = 'REJECTED';
      await proposed.save({ transaction });

      request.status = 'REJECTED';
      request.completedAt = new Date();
      await request.save({ transaction });

      return {
        changeRequestId: request.id,
        versionId: proposed.id,
        status: proposed.status,
        currentVersionId: resume.currentVersionId,
      };
    });
  },
};

async function lockOwnedResume(userId: number, resumeId: number, transaction: Transaction): Promise<Resume> {
  const resume = await Resume.findOne({
    where: { id: resumeId, userId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!resume) {
    throw new AppError(404, 'Resume not found');
  }

  return resume;
}

async function ownedChangeRequest(
  resumeId: number,
  changeRequestId: number,
  transaction: Transaction,
): Promise<ResumeChangeRequest> {
  const request = await ResumeChangeRequest.findOne({
    where: { id: changeRequestId, resumeId },
    transaction,
  });

  if (!request) {
    throw new AppError(404, 'Change request not found');
  }

  return request;
}
