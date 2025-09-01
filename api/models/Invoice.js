// import mongoose from 'mongoose';

// const productSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     quantity: { type: Number, required: true, min: 1 },
//     price: { type: Number, required: true, min: 0 }
//   },
//   { _id: false }
// );

// const invoiceImageSchema = new mongoose.Schema(
//   {
//     url: { type: String, required: true },
//     publicId: { type: String, required: true }
//   },
//   { _id: false }
// );

// const invoiceSchema = new mongoose.Schema(
//   {
//     distributor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Distributor',
//       required: true
//     },
//     amount: { type: Number, required: true, min: 0 },
//     paidAmount: { type: Number, default: 0, min: 0 },
//     toPayAmount: { type: Number, default: 0, min: 0 }, // auto-calculated
//     products: { type: [productSchema], default: [] },
//     invoiceImage: { type: invoiceImageSchema, required: false },

//     status: { type: String, enum: ['done', 'topay'], default: 'topay' }
//   },
//   { timestamps: true } 
// );

// // Helper to recalc derived fields
// function recalc(invoice) {
//   const amount = Number(invoice.amount ?? 0);
//   const paid = Math.max(0, Number(invoice.paidAmount ?? 0));
//   const remaining = Math.max(0, amount - paid);
//   invoice.paidAmount = paid;
//   invoice.toPayAmount = remaining;
//   invoice.status = remaining <= 0 ? 'done' : 'topay';
// }

// // Recalculate on save (create & save-based updates)
// invoiceSchema.pre('save', function (next) {
//   recalc(this);
//   next();
// });

// // Virtual field: days overdue
// invoiceSchema.virtual('daysOverdue').get(function () {
//   const now = new Date();
//   const created = this.createdAt;
//   const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24)); // in days
//   return diff;
// });

// // Ensure virtuals are included in JSON responses
// invoiceSchema.set('toJSON', { virtuals: true });
// invoiceSchema.set('toObject', { virtuals: true });

// export const Invoice = mongoose.model('Invoice', invoiceSchema);



// invoice.model.js
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
    invoiceNumber: { type: String, required: true, unique: true }, // NEW FIELD 
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    toPayAmount: { type: Number, default: 0, min: 0 }, // auto-calculated
    products: { type: [productSchema], default: [] },
    invoiceImage: { type: invoiceImageSchema, required: false },

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

// Recalculate on save
invoiceSchema.pre('save', function (next) {
  recalc(this);
  next();
});

invoiceSchema.virtual('daysOverdue').get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diff;
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
