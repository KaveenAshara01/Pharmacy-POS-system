// controllers/invoiceController.js (ESM)
import { cloudinary } from '../config/cloudinary.js';
import { Invoice } from '../models/Invoice.js';

// CREATE invoice (image optional - handled by multer/cloudinary)
// CREATE invoice
export const createInvoice = async (req, res) => {
  try {
    const {
      distributor,
      amount,
      paidAmount = 0,
      products = []
    } = req.body;

    if (!distributor || amount == null) {
      return res.status(400).json({ message: 'distributor and amount are required' });
    }

    let invoiceImage = undefined;
    if (req.file) {
      invoiceImage = { url: req.file.path, publicId: req.file.filename };
    }

    const invoice = await Invoice.create({
      distributor,
      amount,
      paidAmount,
      products,
      invoiceImage
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('createInvoice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const {
      distributor,
      amount,
      paidAmount,
      products
    } = req.body;

    if (distributor !== undefined) invoice.distributor = distributor;
    if (amount !== undefined) invoice.amount = Number(amount);
    if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount);
    if (products !== undefined) invoice.products = products;

    if (req.file) {
      const old = invoice.invoiceImage;
      invoice.invoiceImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
      if (old?.publicId) {
        try {
          await cloudinary.uploader.destroy(old.publicId);
        } catch (e) {
          console.warn('Failed to delete old Cloudinary image:', e?.message || e);
        }
      }
    }

    await invoice.save();
    res.json(invoice);
  } catch (err) {
    console.error('updateInvoice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// READ all (optional filter by distributor)
export const getInvoices = async (req, res) => {
  try {
    const { distributor } = req.query;
    const q = distributor ? { distributor } : {};
    const invoices = await Invoice.find(q).populate('distributor');
    res.json(invoices);
  } catch (err) {
    console.error('getInvoices error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ one
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('distributor');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error('getInvoice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE (also cleanup Cloudinary image if present)
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (invoice.invoiceImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(invoice.invoiceImage.publicId);
      } catch (e) {
        console.warn('Failed to delete Cloudinary image on invoice delete:', e?.message || e);
      }
    }

    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET all invoices for a given distributor (by distributorId in URL)
export const getInvoicesByDistributor = async (req, res) => {
  try {
    const { distributorId } = req.params;

    if (!distributorId) {
      return res.status(400).json({ message: 'Distributor ID is required' });
    }

    const invoices = await Invoice.find({ distributor: distributorId })
      .populate('distributor');

    if (!invoices.length) {
      return res.status(404).json({ message: 'No invoices found for this distributor' });
    }

    res.json(invoices);
  } catch (err) {
    console.error('getInvoicesByDistributor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
