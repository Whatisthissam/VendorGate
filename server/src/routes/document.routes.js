import { Router } from 'express';
import { verifyDocument } from '../controllers/document.controller.js';
import { store } from '../data/store.js';

const router = Router();

// PUT /api/documents/:id/verify
router.put('/:id/verify', (req, res, next) => {
  const docId = req.params.id;
  // Locate which vendor owns this document
  const vendors = store.getVendors();
  let foundVendor = null;
  for (const v of vendors) {
    if (v.documents.some(d => d.id === docId || d.documentTypeId === docId)) {
      foundVendor = v;
      break;
    }
  }

  if (!foundVendor) {
    return res.status(404).json({
      success: false,
      message: `Document with ID '${docId}' not found.`,
    });
  }

  req.params.vendorId = foundVendor.id;
  req.params.documentId = docId;
  return verifyDocument(req, res, next);
});

export default router;
