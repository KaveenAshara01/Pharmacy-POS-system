// models/Invoice.js (ESM)
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Distributor',
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    toPayAmount: { type: Number, default: 0, min: 0 }, // auto-calculated
    products: { type: [productSchema], default: [] },
    invoiceImage: { type: invoiceImageSchema, required: false },
    toPayDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['done', 'topay'], default: 'topay' }
  },
  { timestamps: true }
);

// Helper to recalc derived fields
function recalc(invoice) {
  const amount = Number(invoice.amount ?? 0);
  const paid = Math.max(0, Number(invoice.paidAmount ?? 0));
  const remaining = Math.max(0, amount - paid);
  invoice.paidAmount = paid;
  invoice.toPayAmount = remaining;
  invoice.status = remaining <= 0 ? 'done' : 'topay';
}

// Recalculate on save (create & save-based updates)
invoiceSchema.pre('save', function (next) {
  recalc(this);
  next();
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
