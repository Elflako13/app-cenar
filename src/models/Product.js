const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  image:       { type: String },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  commerce:    { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
