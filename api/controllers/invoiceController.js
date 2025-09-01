import { cloudinary } from '../config/cloudinary.js';
import { Invoice } from '../models/Invoice.js';
import mongoose from 'mongoose';

// CREATE invoice
export const createInvoice = async (req, res) => {
  try {
    // Log incoming request data
    console.log('createInvoice: Incoming request', {
      body: req.body,
      file: req.file,
      headers: req.headers,
    });

    const {
      distributor,
      amount,
      paidAmount = 0,
      products
    } = req.body;

    // Validate inputs
    if (!distributor || amount == null) {
      console.error('createInvoice: Validation failed', { distributor, amount });
      return res.status(400).json({ message: 'distributor and amount are required' });
    }

    // Validate distributor ObjectId
    if (!mongoose.Types.ObjectId.isValid(distributor)) {
      console.error('createInvoice: Invalid distributor ObjectId', { distributor });
      return res.status(400).json({ message: 'Invalid distributor ID' });
    }

    // Parse and validate products
    let parsedProducts = [];
    if (products) {
      try {
        parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
        if (!Array.isArray(parsedProducts)) {
          console.error('createInvoice: Products is not an array', { parsedProducts });
          return res.status(400).json({ message: 'Products must be an array' });
        }
        for (const product of parsedProducts) {
          if (!product.name || typeof product.quantity !== 'number' || typeof product.price !== 'number' || product.quantity < 1 || product.price < 0) {
            console.error('createInvoice: Invalid product data', { product });
            return res.status(400).json({ message: 'Invalid product data: name (string), quantity (number, min 1), and price (number, min 0) are required' });
          }
        }
      } catch (e) {
        console.error('createInvoice: Failed to parse products', { products, error: e.message });
        return res.status(400).json({ message: 'Invalid products format' });
      }
    }

    // Validate amount and paidAmount
    const parsedAmount = Number(amount);
    const parsedPaidAmount = Number(paidAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      console.error('createInvoice: Invalid amount', { amount });
      return res.status(400).json({ message: 'Amount must be a valid number >= 0' });
    }
    if (isNaN(parsedPaidAmount) || parsedPaidAmount < 0) {
      console.error('createInvoice: Invalid paidAmount', { paidAmount });
      return res.status(400).json({ message: 'Paid amount must be a valid number >= 0' });
    }

    let invoiceImage = undefined;
    if (req.file) {
      console.log('createInvoice: Processing uploaded file', {
        path: req.file.path,
        filename: req.file.filename,
      });
      invoiceImage = { url: req.file.path, publicId: req.file.filename };
    }

    console.log('createInvoice: Creating invoice with data', {
      distributor,
      amount: parsedAmount,
      paidAmount: parsedPaidAmount,
      products: parsedProducts,
      invoiceImage,
    });

    const invoice = await Invoice.create({
      distributor,
      amount: parsedAmount,
      paidAmount: parsedPaidAmount,
      products: parsedProducts,
      invoiceImage
    });

    console.log('createInvoice: Invoice created successfully', { invoiceId: invoice._id });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('createInvoice: Error', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
    });
    res.status(500).json({ message: 'Server error', error: err.message });
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

    // Parse and validate products
    let parsedProducts = invoice.products; // Preserve existing products by default
    if (products !== undefined) {
      try {
        parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
        if (!Array.isArray(parsedProducts)) {
          console.error('updateInvoice: Products is not an array', { parsedProducts });
          return res.status(400).json({ message: 'Products must be an array' });
        }
        for (const product of parsedProducts) {
          if (!product.name || typeof product.quantity !== 'number' || typeof product.price !== 'number' || product.quantity < 1 || product.price < 0) {
            console.error('updateInvoice: Invalid product data', { product });
            return res.status(400).json({ message: 'Invalid product data: name (string), quantity (number, min 1), and price (number, min 0) are required' });
          }
        }
      } catch (e) {
        console.error('updateInvoice: Failed to parse products', { products, error: e.message });
        return res.status(400).json({ message: 'Invalid products format' });
      }
    }

    // Update fields if provided
    if (distributor !== undefined) invoice.distributor = distributor;
    if (amount !== undefined) invoice.amount = Number(amount);
    if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount);
    invoice.products = parsedProducts;

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
    res.status(500).json({ message: 'Server error', error: err.message });
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

// TOTAL toPayAmount for a given distributor
export const getTotalToPayByDistributor = async (req, res) => {
  try {
    const { distributorId } = req.params;
    if (!distributorId) {
      return res.status(400).json({ message: 'Distributor ID is required' });
    }

    const invoices = await Invoice.find({ distributor: distributorId });
    if (!invoices.length) {
      return res.status(404).json({ message: 'No invoices found for this distributor' });
    }

    const totalToPay = invoices.reduce((sum, inv) => sum + (inv.toPayAmount || 0), 0);

    res.json({ distributorId, totalToPay });
  } catch (err) {
    console.error('getTotalToPayByDistributor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// TOTAL toPayAmount across all invoices
export const getTotalToPayAll = async (req, res) => {
  try {
    const invoices = await Invoice.find({});
    if (!invoices.length) {
      return res.status(404).json({ message: 'No invoices found' });
    }

    const totalToPay = invoices.reduce((sum, inv) => sum + (inv.toPayAmount || 0), 0);

    res.json({ totalToPay });
  } catch (err) {
    console.error('getTotalToPayAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};