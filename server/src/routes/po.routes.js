import { Router } from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  sendPOToVendor,
  acknowledgePurchaseOrder,
} from '../controllers/po.controller.js';

const router = Router();

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseOrder);
router.post('/:id/submit', submitPurchaseOrder);

router.post('/:id/approve', approvePurchaseOrder);
router.post('/:id/reject', rejectPurchaseOrder);
router.post('/:id/send-to-vendor', sendPOToVendor);
router.post('/:id/acknowledge', acknowledgePurchaseOrder);

export default router;
