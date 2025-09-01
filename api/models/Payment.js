
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
      required: true
    },
    distributorName: { type: String, required: true }, // Extracted from Distributor
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true
    },
    invoiceNumber: { type: String, required: true }, // Extracted from Invoice
    amount: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
