import express from 'express';
import { Distributor } from '../models/Distributor.js';
import { Invoice } from '../models/Invoice.js'; // ✅ Import Invoice model

const router = express.Router();

// POST /distributors - create
router.post('/', async (req, res) => {
  try {
    const { name, email, contactNumber, address } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const distributor = await Distributor.create({ name, email, contactNumber, address });
    res.status(201).json(distributor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /distributors/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { name, email, contactNumber, address } = req.body;
    const distributor = await Distributor.findByIdAndUpdate(
      req.params.id,
      { name, email, contactNumber, address },
      { new: true }
    );
    if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
    res.json(distributor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /distributors - get all
router.get('/', async (req, res) => {
  try {
    const distributors = await Distributor.find();
    res.json(distributors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /distributors/:id - get by id
router.get('/:id', async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }
    res.json(distributor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /distributors/:id - delete with check
router.delete('/:id', async (req, res) => {
  try {
    const distributorId = req.params.id;

    // ✅ Check if distributor exists
    const distributor = await Distributor.findById(distributorId);
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    // ✅ Check if invoices exist for this distributor
    const invoiceCount = await Invoice.countDocuments({ distributor: distributorId });
    if (invoiceCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete distributor with existing invoices. Please delete related invoices first.',
        invoiceCount
      });
    }

    // ✅ Safe to delete
    await Distributor.findByIdAndDelete(distributorId);
    res.json({ message: 'Distributor deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
