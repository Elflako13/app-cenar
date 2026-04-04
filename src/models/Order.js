const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  client:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commerce:        { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
  delivery:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  address:         { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  // snapshot de dirección para que persista aunque se elimine
  addressSnapshot: {
    label:     String,
    street:    String,
    sector:    String,
    city:      String,
    reference: String,
  },
  items:           [orderItemSchema],
  subtotal:        { type: Number, required: true },
  itbisPercentage: { type: Number, required: true },
  itbisAmount:     { type: Number, required: true },
  total:           { type: Number, required: true },
  status:          { type: String, enum: ['Pending', 'InProgress', 'Completed'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
