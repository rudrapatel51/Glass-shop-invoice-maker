import mongoose from 'mongoose'

const InvoiceSchema = new mongoose.Schema({
  customerDetails: {
    name: String,
    date: String,
    mobile: String
  },
  products: [{
    particular: String,
    x: String,
    y: String,
    quantity: String,
    sqFt: Number,
    rate: String,
    gTotal: Number,
    runFt: Number,
    rRate: String,
    rfTotal: Number,
    total: Number
  }],
  totals: {
    gTotal: Number,
    rfTotal: Number,
    total: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);
export default Invoice;