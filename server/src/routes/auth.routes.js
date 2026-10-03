import { Router } from 'express';
import { getDemoUsers, loginDemoUser, getCurrentUser, resetDemoData } from '../controllers/auth.controller.js';

const router = Router();

router.get('/demo-users', getDemoUsers);
router.post('/login', loginDemoUser);
router.get('/me', getCurrentUser);
router.post('/reset', resetDemoData);

export default router;
