import { Router } from 'express';
import { resumeController } from './resume.controller';

export const resumeRoutes = Router();

resumeRoutes.post('/', resumeController.create);
resumeRoutes.get('/', resumeController.list);
resumeRoutes.get('/:resumeId', resumeController.get);
resumeRoutes.patch('/:resumeId', resumeController.update);
resumeRoutes.delete('/:resumeId', resumeController.remove);

resumeRoutes.post('/:resumeId/versions', resumeController.createVersion);
resumeRoutes.get('/:resumeId/versions', resumeController.listVersions);
resumeRoutes.get('/:resumeId/versions/:versionId/compare/:otherVersionId', resumeController.compareVersions);
resumeRoutes.get('/:resumeId/versions/:versionId', resumeController.getVersion);
resumeRoutes.post('/:resumeId/versions/:versionId/restore', resumeController.restoreVersion);

resumeRoutes.post('/:resumeId/chat', resumeController.chat);
resumeRoutes.post(
  '/:resumeId/change-requests/:changeRequestId/approve',
  resumeController.approveChangeRequest,
);
resumeRoutes.post(
  '/:resumeId/change-requests/:changeRequestId/reject',
  resumeController.rejectChangeRequest,
);

resumeRoutes.get('/:resumeId/conversations', resumeController.listConversations);
resumeRoutes.get('/:resumeId/conversations/:conversationId', resumeController.getConversation);
