import type { Request, Response } from 'express';
import { asyncHandler, requireLocalUser } from '../../shared/helpers';
import { resumeService } from './resume.service';
import { requireRouteId } from './resume.validation';
import { templateService } from './template.service';

export const templateController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const result = await templateService.list();
    res.status(200).json({ success: true, data: result });
  }),
};

export const resumeController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.createResume(user, req.body);
    res.status(201).json({ success: true, data: result });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.listResumes(user.id);
    res.status(200).json({ success: true, data: result });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.getResume(user.id, requireRouteId(req.params.resumeId, 'resumeId'));
    res.status(200).json({ success: true, data: result });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.renameResume(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      req.body,
    );
    res.status(200).json({ success: true, data: result });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.deleteResume(user.id, requireRouteId(req.params.resumeId, 'resumeId'));
    res.status(200).json({ success: true, data: result });
  }),

  createVersion: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.saveEditorVersion(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      req.body,
    );
    res.status(201).json({ success: true, data: result });
  }),

  listVersions: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.listVersions(user.id, requireRouteId(req.params.resumeId, 'resumeId'));
    res.status(200).json({ success: true, data: result });
  }),

  getVersion: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.getVersion(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.versionId, 'versionId'),
    );
    res.status(200).json({ success: true, data: result });
  }),

  compareVersions: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.compareVersions(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.versionId, 'versionId'),
      requireRouteId(req.params.otherVersionId, 'otherVersionId'),
    );
    res.status(200).json({ success: true, data: result });
  }),

  restoreVersion: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.restoreVersion(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.versionId, 'versionId'),
    );
    res.status(201).json({ success: true, data: result });
  }),

  chat: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.chat(user, requireRouteId(req.params.resumeId, 'resumeId'), req.body);
    res.status(201).json({ success: true, data: result });
  }),

  approveChangeRequest: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.approveChangeRequest(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.changeRequestId, 'changeRequestId'),
    );
    res.status(200).json({ success: true, data: result });
  }),

  rejectChangeRequest: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.rejectChangeRequest(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.changeRequestId, 'changeRequestId'),
    );
    res.status(200).json({ success: true, data: result });
  }),

  listConversations: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.listConversations(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
    );
    res.status(200).json({ success: true, data: result });
  }),

  getConversation: asyncHandler(async (req: Request, res: Response) => {
    const user = await requireLocalUser(req);
    const result = await resumeService.getConversation(
      user.id,
      requireRouteId(req.params.resumeId, 'resumeId'),
      requireRouteId(req.params.conversationId, 'conversationId'),
    );
    res.status(200).json({ success: true, data: result });
  }),
};
