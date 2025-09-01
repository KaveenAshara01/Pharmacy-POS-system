// payment.routes.js
import express from 'express';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Distributor } from '../models/Distributor.js';

const router = express.Router();

// Record a payment
router.post('/', async (req, res) => {
  try {
    const { distributorId, invoiceId, amount } = req.body;

    if (!distributorId || !invoiceId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get Distributor
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // Get Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create Payment record
    const payment = new Payment({
      distributor: distributor._id,
      distributorName: distributor.name,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber || null,
      amount
    });
    await payment.save();

    // Update Invoice
    invoice.paidAmount += amount;
    await invoice.save();

    return res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

// Fetch all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('distributor', 'name')
      .populate('invoice', 'invoiceNumber amount status');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
