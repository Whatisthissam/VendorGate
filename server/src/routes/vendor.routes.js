import { Router } from 'express';
import { getVendors, getVendorById, createVendor, updateVendor } from '../controllers/vendor.controller.js';
import { getVendorDocuments, verifyDocument, uploadDocument } from '../controllers/document.controller.js';

const router = Router();

router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendor);

// Nested document endpoints for clarity
router.get('/:id/documents', getVendorDocuments);
router.put('/:vendorId/documents/:documentId/verify', verifyDocument);
router.post('/:vendorId/documents/:documentId/upload', uploadDocument);

export default router;
