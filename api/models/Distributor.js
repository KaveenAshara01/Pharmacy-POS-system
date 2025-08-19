
import mongoose from 'mongoose';

const distributorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    contactNumber: { type: String },
    address: { type: String }
  },
  { timestamps: true }
);

export const Distributor = mongoose.model('Distributor', distributorSchema);
