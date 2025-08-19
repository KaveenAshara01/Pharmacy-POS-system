// middleware/upload.js (ESM)
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pharmacy-pos/invoices',
    resource_type: 'image',       
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    
  }
});

export const uploadInvoiceImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single('invoiceImage'); // <-- frontend must use this field name
