// routes/invoiceRoutes.js (ESM)
import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController.js';
import { uploadInvoiceImage } from '../middleware/upload.js';

const router = express.Router();

// Create with optional image
router.post('/', uploadInvoiceImage, createInvoice);

// List / Filter
router.get('/', getInvoices);

// Get one
router.get('/:id', getInvoice);

// Update with optional new image (replaces old + cleans up)
router.put('/:id', uploadInvoiceImage, updateInvoice);

// Delete (also cleans up image)
router.delete('/:id', deleteInvoice);

export default router;
