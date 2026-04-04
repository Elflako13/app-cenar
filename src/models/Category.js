const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  commerce:    { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
