import { Router } from 'express';
import { getDashboardStats, getReportMetrics } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/reports', getReportMetrics);

export default router;
