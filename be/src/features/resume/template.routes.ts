import { Router } from 'express';
import { templateController } from './resume.controller';

export const templateRoutes = Router();

templateRoutes.get('/', templateController.list);
