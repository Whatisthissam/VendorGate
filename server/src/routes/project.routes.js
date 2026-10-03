import { Router } from 'express';
import { getProjectOverview } from '../controllers/project.controller.js';

const router = Router();

router.get('/overview', getProjectOverview);

export default router;
