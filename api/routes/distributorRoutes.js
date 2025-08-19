import express from 'express';
import { Distributor } from '../models/Distributor.js';

const router = express.Router();


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


export default router;